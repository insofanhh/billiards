<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\Service;
use App\Models\ServiceInventory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /**
     * Increase stock and recalculate Weighted Average Cost (MAC).
     *
     * Logic:
     * NewCost = ((CurrentQty * CurrentAvgCost) + (ImportQty * ImportPrice)) / (CurrentQty + ImportQty)
     *
     * @param Service $service
     * @param int $quantity
     * @param float $importPrice
     * @param Model $reference The source of this increase (e.g., PurchaseOrderItem, User [Adjustment])
     * @param string $type Transaction type ('import', 'adjustment', 'return')
     * @param string|null $note
     * @return ServiceInventory
     */
    public function increaseStock(
        Service $service,
        int $quantity,
        float $importPrice,
        Model $reference,
        string $type = 'import',
        ?string $note = null
    ): ServiceInventory {
        if ($quantity <= 0) {
            throw ValidationException::withMessages(['quantity' => 'Quantity must be positive to increase stock.']);
        }

        return DB::transaction(function () use ($service, $quantity, $importPrice, $reference, $type, $note) {
            $inventory = ServiceInventory::firstOrCreate(
                ['service_id' => $service->id],
                ['quantity' => 0, 'average_cost' => 0, 'store_id' => $service->store_id]
            );

            $currentQty = $inventory->quantity; // This might be negative if we allow overselling, but typically >= 0
            $currentAvgCost = $inventory->average_cost;

            // Calculate Total Value
            // If current quantity is negative (oversold), we assume the "cost" of those missing items was the old average cost.
            // But mathematically for MAC, we usually treat negative stock as "debt" of items at current cost.
            // Formula:
            // TotalValue = (CurrentQty * CurrentCos) + (NewQty * NewCost)
            // But here "NewQty" is the addition.
            
            // Handle negative stock edge case:
            // If stock is -5, and we buy 10 @ 100.
            // Do we cover the -5 at old cost? Or just straight formula?
            // Straight formula: ((-5 * OldCost) + (10 * 100)) / 5. This works if we trust OldCost.
            
            $currentTotalValue = $currentQty * $currentAvgCost;
            $importTotalValue = $quantity * $importPrice;
            
            $newQty = $currentQty + $quantity;
            
            if ($newQty <= 0) {
                 // Even after import, we are still negative or zero.
                 // Cost logic is tricky here. If zero, cost is undefined (div by zero).
                 // If negative, we keep old cost? or update?
                 // Let's safe guard: If NewQty <= 0, we can't really calculate a meaningful "Average Cost" of on-hand items because we have none.
                 // We will keep the `average_cost` as is (or update to import price if we want to reset expectation).
                 // Standard practice: If inventory is zero/negative, next positive sets the cost.
                 
                 // However, "Weighted Average" implies blending.
                 // Let's stick to the formula but avoid div by zero.
                 $newAvgCost = $currentAvgCost; // Fallback
            } else {
                $newAvgCost = ($currentTotalValue + $importTotalValue) / $newQty;
            }

            // Update Inventory
            $inventory->average_cost = $newAvgCost;
            $inventory->quantity = $newQty;
            $inventory->last_restock_date = now();
            $inventory->save();

            // Log Transaction
            InventoryTransaction::create([
                'service_id' => $service->id,
                'user_id' => auth()->id(), // May be null for system actions
                'type' => $type,
                'quantity_change' => $quantity,
                'new_quantity_snapshot' => $newQty,
                'unit_cost' => $importPrice, // The cost of THIS batch
                'reference_type' => $reference->getMorphClass(),
                'reference_id' => $reference->getKey(),
                'note' => $note,
            ]);

            return $inventory;
        });
    }

    /**
     * Decrease stock (Sale / Usage).
     *
     * Validates sufficient stock and logs transaction.
     * Does NOT update average cost.
     *
     * @param Service $service
     * @param int $quantity
     * @param Model $reference The source of decrease (e.g., OrderItem)
     * @param string|null $note
     * @return ServiceInventory
     */
    public function decreaseStock(
        Service $service,
        int $quantity,
        Model $reference,
        string $type = 'sale',
        string $note = null
    ): ServiceInventory {
        if ($quantity <= 0) {
             throw ValidationException::withMessages(['quantity' => 'Quantity must be positive to decrease stock.']);
        }

        return DB::transaction(function () use ($service, $quantity, $reference, $type, $note) {
            // Lock for consistency
            $inventory = ServiceInventory::where('service_id', $service->id)
                ->lockForUpdate()
                ->first();

            if (!$inventory) {
                 // Create if not exists (init 0), so we can throw error "Not enough" properly
                 // Or just fail.
                 $inventory = ServiceInventory::create([
                     'service_id' => $service->id,
                     'store_id' => $service->store_id, // Ensure store_id is set
                     'quantity' => 0,
                     'average_cost' => 0
                 ]);
            }

            if ($inventory->quantity < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => "Insufficient stock for service '{$service->name}'. Current: {$inventory->quantity}, Required: {$quantity}."
                ]);
            }

            $inventory->decrement('quantity', $quantity);
            // $inventory->refresh(); // Decrement doesn't update model instance automatically in older Laravel, but let's refresh to be safe or just calc.
            $newQty = $inventory->quantity - $quantity; // Wait, decrement happens in DB.
            $inventory->refresh();

            // Log Transaction
            InventoryTransaction::create([
                'service_id' => $service->id,
                'user_id' => auth()->id(),
                'type' => $type,
                'quantity_change' => -$quantity,
                'new_quantity_snapshot' => $inventory->quantity,
                'unit_cost' => $inventory->average_cost, // Cost at the time of sale (COGS)
                'reference_type' => $reference->getMorphClass(),
                'reference_id' => $reference->getKey(),
                'note' => $note,
            ]);

            return $inventory;
        });
    }
}
