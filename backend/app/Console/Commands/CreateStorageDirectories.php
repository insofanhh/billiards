<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CreateStorageDirectories extends Command
{
    protected $signature = 'storage:create-directories';

    protected $description = 'Tạo các thư mục storage cần thiết';

    public function handle()
    {
        $directories = [
            'services',
        ];

        $this->info('Đang tạo các thư mục storage...');

        foreach ($directories as $directory) {
            $path = storage_path('app/public/' . $directory);
            
            if (!file_exists($path)) {
                Storage::disk('public')->makeDirectory($directory);
                $this->info("✓ Đã tạo thư mục: {$directory}");
            } else {
                $this->line("⊘ Thư mục đã tồn tại: {$directory}");
            }
        }

        $this->info('Hoàn tất!');
        
        return Command::SUCCESS;
    }
}
