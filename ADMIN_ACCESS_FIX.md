# Hướng dẫn khắc phục lỗi 403 FORBIDDEN khi truy cập Admin Panel

## Vấn đề
Khi truy cập `/admin` trên production, bạn gặp lỗi **403 FORBIDDEN** dù đã chạy `php artisan shield:super-admin`.

## Nguyên nhân

1. **Route fallback đang chặn `/admin`**: Route fallback trong `routes/web.php` đã được sửa
2. **Permissions chưa được tạo**: Filament Shield permissions chưa được generate
3. **Role chưa được assign đúng**: User chưa có role `super_admin`
4. **Cache chưa được clear**: Laravel cache có thể đang lưu cấu hình cũ

## Giải pháp

### Bước 1: Clear cache và rebuild

```bash
cd /var/www/billiards/backend
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
php artisan permission:cache-reset

php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Bước 2: Đảm bảo migrations đã chạy

```bash
php artisan migrate --force
```

### Bước 3: Tạo permissions cho Filament Shield

```bash
php artisan shield:generate --all
```

### Bước 4: Assign super_admin role cho user

Có 2 cách:

#### Cách 1: Sử dụng Shield command (Khuyến nghị)

```bash
php artisan shield:super-admin
```

Command này sẽ hỏi email của user, sau đó assign role `super_admin`.

#### Cách 2: Sử dụng Tinker (Thủ công)

```bash
php artisan tinker
```

Trong tinker, chạy:

```php
$user = App\Models\User::where('email', 'your-email@example.com')->first();
$user->assignRole('super_admin');
exit
```

### Bước 5: Kiểm tra user có role đúng không

```bash
php artisan tinker
```

```php
$user = App\Models\User::where('email', 'your-email@example.com')->first();
$user->roles; // Xem các roles của user
$user->hasRole('super_admin'); // Phải trả về true
exit
```

### Bước 6: Kiểm tra permissions

```bash
php artisan tinker
```

```php
use Spatie\Permission\Models\Role;
$superAdmin = Role::findByName('super_admin');
$superAdmin->permissions; // Xem các permissions của role
exit
```

## Script tự động

Đã tạo script `backend/fix-admin-access.sh` để tự động khắc phục:

```bash
cd /var/www/billiards/backend
chmod +x fix-admin-access.sh
./fix-admin-access.sh
```

## Kiểm tra sau khi fix

1. **Clear browser cache** hoặc dùng Incognito mode
2. Truy cập: `https://billiardscms.io.vn/admin`
3. Đăng nhập với user đã được assign role `super_admin`
4. Nếu vẫn lỗi, kiểm tra:
   - Web server logs (Nginx/Apache)
   - Laravel logs: `storage/logs/laravel.log`
   - PHP error logs

## Các lỗi thường gặp

### Lỗi: "Role super_admin does not exist"

**Giải pháp:**
```bash
php artisan shield:generate --all
php artisan db:seed --class=Spatie\\Permission\\Database\\Seeders\\DatabaseSeeder
```

### Lỗi: "User không có quyền truy cập"

**Giải pháp:**
```bash
php artisan shield:super-admin
# Hoặc
php artisan tinker
$user = App\Models\User::where('email', 'your-email@example.com')->first();
$user->assignRole('super_admin');
exit
```

### Lỗi: "403 FORBIDDEN" ngay cả khi đã assign role

**Giải pháp:**
1. Clear tất cả cache:
   ```bash
   php artisan optimize:clear
   php artisan permission:cache-reset
   ```
2. Rebuild cache:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
3. Kiểm tra `.env` có `APP_URL` đúng không
4. Kiểm tra web server config (Nginx/Apache) không block `/admin`

## Cấu hình Filament Shield

File cấu hình: `backend/config/filament-shield.php`

Đảm bảo:
- `super_admin.enabled` = `true`
- `super_admin.name` = `super_admin`
- `super_admin.define_via_gate` = `false`

## Lưu ý

- Sau khi assign role, cần clear cache: `php artisan permission:cache-reset`
- Đảm bảo database đã được migrate đầy đủ
- Kiểm tra file `.env` có cấu hình đúng không
- Web server (Nginx/Apache) phải route `/admin` đến Laravel `index.php`

## Liên hệ

Nếu vẫn gặp vấn đề, kiểm tra:
- Laravel logs: `storage/logs/laravel.log`
- Web server logs
- Browser console (F12)

