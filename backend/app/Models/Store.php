<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'owner_id',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
