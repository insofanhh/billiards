<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use DateTime;

class CreateApiToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-api-token {user_id : The ID of the user} {name : The name of the token}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a long-lived API token for a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user_id');
        $name = $this->argument('name');

        $user = User::find($userId);

        if (!$user) {
            $this->error("User with ID {$userId} not found.");
            return 1;
        }

        // Create token that expires in 2037 (Safe for MySQL TIMESTAMP)
        // Note: MySQL TIMESTAMP max is Jan 2038.
        $expiresAt = \Illuminate\Support\Carbon::create(2037, 12, 31, 23, 59, 59);
        
        $token = $user->createToken($name, ['*'], $expiresAt);

        $this->info("Token created successfully for user: {$user->name} ({$user->email})");
        $this->info("Token Name: {$name}");
        $this->info("Expires At: {$expiresAt}");
        $this->newLine();
        $this->line($token->plainTextToken);
        $this->newLine();
        $this->comment("Use this token in the Authorization header: Bearer <token>");

        return 0;
    }
}
