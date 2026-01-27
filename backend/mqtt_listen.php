<?php

require 'vendor/autoload.php';

use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;

$server   = 'broker.emqx.io';
$port     = 1883;
$clientId = 'laravel-subscriber-test-' . time();

$mqtt = new MqttClient($server, $port, $clientId);

$connectionSettings = (new ConnectionSettings)
    ->setKeepAliveInterval(60);

echo "Connecting to Broker: $server...\n";

try {
    $mqtt->connect($connectionSettings, true);
    echo "Connected!\n";
    echo "Subscribing to topic: billiards/#\n";
    echo "Waiting for messages... (Press Ctrl+C to stop)\n";

    $mqtt->subscribe('billiards/#', function ($topic, $message) {
        echo sprintf("[%s] Received on topic [%s]: %s\n", date('H:i:s'), $topic, $message);
    }, 0);

    $mqtt->loop(true);

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
