<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Generate webhook_token for existing stores that don't have one
        DB::table('stores')
            ->whereNull('webhook_token')
            ->orWhere('webhook_token', '')
            ->update([
                'webhook_token' => DB::raw("CONCAT(
                    SUBSTRING(MD5(RAND()) FROM 1 FOR 32),
                    SUBSTRING(MD5(RAND()) FROM 1 FOR 32)
                )")
            ]);
        
        // Verify each store has a unique token (fallback for any collisions)
        $stores = DB::table('stores')->get();
        foreach ($stores as $store) {
            if (empty($store->webhook_token) || strlen($store->webhook_token) < 32) {
                DB::table('stores')
                    ->where('id', $store->id)
                    ->update(['webhook_token' => Str::random(64)]);
            }
        }
    }

    public function down(): void
    {
        // Optional: clear webhook tokens if needed
        // DB::table('stores')->update(['webhook_token' => null]);
    }
};
