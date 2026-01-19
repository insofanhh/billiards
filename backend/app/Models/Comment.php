<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

class Comment extends Model
{
    use BelongsToTenant;

    protected $fillable = ['store_id', 'post_id', 'user_id', 'content'];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
