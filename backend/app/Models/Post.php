<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'summary',
        'content',
        'thumbnail',
        'status',
        'is_feature_post',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_feature_post' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
