<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CleanupTemporaryUsers extends Command
{
    protected $signature = 'users:cleanup-temporary';
    protected $description = 'Delete expired temporary users and their tokens';

    public function handle(): int
    {
        $expiredUsers = User::where('is_temporary', true)
            ->whereNotNull('temporary_expires_at')
            ->where('temporary_expires_at', '<', Carbon::now('Asia/Ho_Chi_Minh'))
            ->get();

        $count = 0;
        foreach ($expiredUsers as $user) {
            // delete tokens
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }
            $user->delete();
            $count++;
        }

        $this->info("Deleted {$count} expired temporary users.");
        return Command::SUCCESS;
    }
}



