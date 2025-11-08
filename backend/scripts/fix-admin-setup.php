<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Spatie\Permission\Models\Role;
use App\Models\User;

echo "=== Thiết lập Admin Panel ===\n\n";

// Tạo super_admin role
echo "1. Tạo super_admin role...\n";
try {
    $role = Role::firstOrCreate(
        ['name' => 'super_admin', 'guard_name' => 'web'],
        ['name' => 'super_admin', 'guard_name' => 'web']
    );
    echo "   ✅ Role super_admin: " . ($role->wasRecentlyCreated ? "đã được tạo mới" : "đã tồn tại") . "\n";
} catch (Exception $e) {
    echo "   ❌ Không thể tạo role: " . $e->getMessage() . "\n";
}

// Liệt kê roles
echo "\n2. Roles hiện có:\n";
$roles = Role::all(['name']);
if ($roles->count() > 0) {
    foreach ($roles as $role) {
        echo "   - {$role->name}\n";
    }
} else {
    echo "   ⚠️  Chưa có role nào trong database!\n";
}

// Liệt kê users với roles
echo "\n3. Users trong database:\n";
$users = User::all(['id', 'name', 'email']);
if ($users->count() > 0) {
    foreach ($users as $user) {
        $userRoles = $user->roles->pluck('name')->toArray();
        $rolesStr = !empty($userRoles) ? ' [' . implode(', ', $userRoles) . ']' : ' [no roles]';
        echo "   - ID: {$user->id}, Email: {$user->email}, Name: {$user->name}{$rolesStr}\n";
    }
} else {
    echo "   ⚠️  Không có user nào trong database!\n";
}

echo "\n=== Hoàn tất ===\n";
echo "Để assign super_admin role cho user, chạy:\n";
echo "  php artisan shield:super-admin\n";
echo "Hoặc:\n";
echo "  php artisan tinker\n";
echo "  \$user = App\\Models\\User::where('email', 'your-email@example.com')->first();\n";
echo "  \$user->assignRole('super_admin');\n";

