<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Laravel CORS Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration file determines how CORS (Cross-Origin Resource Sharing)
    | headers are handled by your Laravel app.
    |
    */

    'paths' => ['api/*', 'broadcasting/*', 'sanctum/csrf-cookie', 'admin/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://billiardscms.io.vn',
        'https://www.billiardscms.io.vn',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
