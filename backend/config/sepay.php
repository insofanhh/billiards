<?php

return [
    'webhook_token' => env('SEPAY_WEBHOOK_TOKEN'),
    'pattern' => env('SEPAY_MATCH_PATTERN', 'SE'),
    'bank_account' => env('SEPAY_BANK_ACCOUNT'),
    'bank_provider' => env('SEPAY_BANK_PROVIDER'),
];
