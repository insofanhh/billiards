<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckExpiredStores extends Command
{
    // php artisan stores:check-expired
    protected $signature = 'stores:check-expired';
    protected $description = 'Check for expired stores, deactivate them, and create pending renewal transactions';

    public function handle()
    {
        // 1. Find stores that are expired AND (Active OR No Pending Transaction)
        // We want to process stores that are:
        // - Expired AND Active (Needs deactivation + Bill)
        // - Expired AND Inactive AND No Pending Transaction (Needs Bill)
        
        $expiredStores = \App\Models\Store::where('expires_at', '<', now())
            ->where(function($query) {
                $query->where('is_active', true)
                      ->orWhereDoesntHave('platformTransactions', function($q) {
                          $q->where('status', 'pending');
                      });
            })
            ->get();

        $this->info("Found " . $expiredStores->count() . " stores to process.");

        foreach ($expiredStores as $store) {
            $this->info("Processing store: {$store->name} ({$store->slug})");
            
            // Deactivate store if active
            if ($store->is_active) {
                $store->update(['is_active' => false]);
                $this->info(" -> Deactivated.");
            }

            // Create pending transaction if not exists
            $pendingTxn = \App\Models\PlatformTransaction::where('store_id', $store->id)
                ->where('status', 'pending')
                ->first();

            if (!$pendingTxn) {
                $months = 1;
                $amount = 100000 * $months;
                $code = "GH" . strtoupper($store->slug) . rand(1000, 9999);

                \App\Models\PlatformTransaction::create([
                    'store_id' => $store->id,
                    'amount' => $amount,
                    'months' => $months,
                    'status' => 'pending',
                    'transaction_code' => $code,
                    'content' => $code, // Transfer content matches code
                    'description' => "Auto-generated renewal for {$months} month(s)",
                ]);
                $this->info("Created pending transaction for {$store->slug}");
            }
        }

        $this->info('Expired stores check completed.');
    }
}
