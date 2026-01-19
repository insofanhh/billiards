<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

class Category extends Model
{
    use BelongsToTenant;

    protected $fillable = ['store_id', 'name', 'slug', 'description'];

    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}
