<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Setting extends Model
{
    protected $fillable = [
        'image_banner',
    ];

    protected $casts = [
        'image_banner' => 'array',
    ];

    /**
     * @return array<int, string>
     */
    public function getImageBannerUrlsAttribute(): array
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return collect($this->image_banner ?? [])
            ->filter(fn ($path) => filled($path))
            ->map(fn ($path) => $disk->url($path))
            ->values()
            ->all();
    }
}
