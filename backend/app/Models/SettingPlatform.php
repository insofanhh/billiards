<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SettingPlatform extends Model
{
    use HasFactory;

    protected $fillable = [
        'seo_title',
        'seo_description',
        'seo_keywords',
        'support_messenger',
        'support_hotline',
        'support_youtube',
        'support_telegram',
        'learn_more_url',
        'trial_days',
        'bank_name',
        'bank_account',
        'bank_account_name',
        'sepay_api_key',
        'sepay_webhook_token',
    ];
}
