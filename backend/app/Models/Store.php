<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Store extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'store_type',
        'owner_id',
        'bank_account_no',
        'bank_name',
        'bank_account_name',
        'sepay_api_key',
        'webhook_token',
        'is_active',
    ];

    protected $hidden = [
        'sepay_api_key',
    ];

    protected $casts = [
        'sepay_api_key' => 'encrypted',
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($store) {
            if (!$store->webhook_token) {
                $store->webhook_token = Str::random(64);
            }
        });
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function hasPaymentConfigured(): bool
    {
        return filled($this->bank_account_no) 
            && filled($this->bank_name) 
            && filled($this->sepay_api_key);
    }

    public function getWebhookUrl(): string
    {
        return url("/api/webhook/sepay/{$this->slug}/{$this->webhook_token}");
    }
}
