<?php

namespace App\Services;

use App\Models\TableBilliard;
use PhpMqtt\Client\Facades\MQTT;
use Illuminate\Support\Facades\Log;

class IotService
{
    /**
     * Send ON signal to IoT device via MQTT
     */
    public function turnOnTable(TableBilliard $table)
    {
        // Topic convention: billiards/store_{id}/tables/{code}
        // Example: billiards/store_1/tables/T01
        $topic = "billiards/store_{$table->store_id}/tables/{$table->code}";
        
        $payload = json_encode([
            'action' => 'ON',
            'table_code' => $table->code,
            'timestamp' => now()->toIso8601String(),
        ]);

        try {
            // Using default connection configured in mqtt-client.php
            MQTT::publish($topic, $payload);
            Log::info("IoT: Signal ON sent to $topic");
        } catch (\Exception $e) {
            Log::error("IoT Error (ON): " . $e->getMessage());
        }
    }

    /**
     * Send OFF signal to IoT device via MQTT
     */
    public function turnOffTable(TableBilliard $table)
    {
        $topic = "billiards/store_{$table->store_id}/tables/{$table->code}";

        $payload = json_encode([
            'action' => 'OFF',
            'table_code' => $table->code,
            'timestamp' => now()->toIso8601String(),
        ]);

        try {
            MQTT::publish($topic, $payload);
            Log::info("IoT: Signal OFF sent to $topic");
        } catch (\Exception $e) {
            Log::error("IoT Error (OFF): " . $e->getMessage());
        }
    }
}
