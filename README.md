# Hệ thống Quản lý Bida

Dự án quản lý bida được xây dựng với Laravel 12 (Backend) và React 19 (Frontend).

## Yêu cầu hệ thống

### Backend
- PHP >= 8.2
- Composer >= 2.0
- Node.js >= 18.0
- NPM >= 9.0
- SQLite (mặc định) hoặc MySQL/MariaDB

### Frontend
- Node.js >= 18.0
- NPM >= 9.0

## Cài đặt

### 1. Clone dự án

```bash
git clone <repository-url>
cd billiards
```

### 2. Cài đặt Backend

Di chuyển vào thư mục backend:

```bash
cd backend
```

#### Cài đặt dependencies PHP

```bash
composer install
```

#### Cấu hình môi trường

Sao chép file `.env.example` thành `.env`:

```bash
copy .env.example .env
```

Hoặc trên Linux/Mac:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` và cấu hình các thông tin cần thiết:

- `APP_NAME`: Tên ứng dụng
- `APP_URL`: URL của ứng dụng (mặc định: `http://localhost`)
- `DB_CONNECTION`: Loại database (mặc định: `sqlite`)
- Nếu sử dụng MySQL, cấu hình: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`

#### Tạo Application Key

```bash
php artisan key:generate
```

#### Tạo database SQLite (nếu sử dụng SQLite)

```bash
touch database/database.sqlite
```

Hoặc trên Windows PowerShell:

```bash
New-Item -ItemType File -Path database/database.sqlite
```

#### Chạy migrations

```bash
php artisan migrate
```

#### Chạy seeders (tùy chọn)

```bash
php artisan db:seed
```

#### Cài đặt dependencies Node.js cho backend

```bash
npm install
```

#### Build assets cho backend

```bash
npm run build
```

### 3. Cài đặt Frontend

Di chuyển vào thư mục frontend:

```bash
cd frontend
```

#### Cài đặt dependencies

```bash
npm install
```

#### Cấu hình môi trường (nếu cần)

Tạo file `.env` trong thư mục `frontend` nếu cần thiết:

```bash
cd frontend
copy .env.example .env
```

## Chạy dự án

### Cách 1: Sử dụng script tự động (Khuyến nghị)

Từ thư mục `backend`, chạy lệnh sau để khởi động tất cả các service:

```bash
composer run dev
```

Script này sẽ tự động khởi động:
- Laravel server (port 8000)
- Queue worker
- Reverb WebSocket server
- Vite dev server cho frontend (port 5173)

### Cách 2: Chạy thủ công từng service

#### Terminal 1: Laravel Server

```bash
cd backend
php artisan serve
```

#### Terminal 2: Queue Worker

```bash
cd backend
php artisan queue:listen --tries=1
```

#### Terminal 3: Reverb WebSocket Server

```bash
cd backend
php artisan reverb:start
```

#### Terminal 4: Frontend Dev Server

```bash
cd frontend
npm run dev
```

### Truy cập ứng dụng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Filament Admin Panel**: http://localhost:8000/admin (nếu đã cấu hình)

## Build cho Production

### Backend

```bash
cd backend
composer install --optimize-autoloader --no-dev
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Frontend

```bash
cd frontend
npm run build
```

File build sẽ được tạo trong thư mục `frontend/dist`.

## Deploy lên Production

### ⚠️ Lưu ý quan trọng về Domain

Trong production, bạn có 2 lựa chọn về domain:

#### **Cách 1: Cùng domain (Khuyến nghị)**
- Frontend và Backend cùng domain: `https://example.com`
- Frontend được build và serve từ Laravel public directory
- Backend API: `https://example.com/api`
- **Ưu điểm**: Không cần cấu hình CORS phức tạp, dễ bảo mật hơn

#### **Cách 2: Khác domain/Subdomain**
- Frontend: `https://example.com`
- Backend API: `https://api.example.com` hoặc `https://backend.example.com`
- **Ưu điểm**: Tách biệt rõ ràng, dễ scale riêng biệt

### Chuẩn bị Deploy

#### 1. Cấu hình Backend (.env)

```bash
cd backend
cp .env.example .env
```

Chỉnh sửa file `.env` với các giá trị production:

```env
APP_NAME="Hệ thống Quản lý Bida"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://example.com

# Nếu frontend và backend cùng domain:
CORS_ALLOWED_ORIGINS=https://example.com
SANCTUM_STATEFUL_DOMAINS=example.com

# Nếu frontend và backend khác domain:
# CORS_ALLOWED_ORIGINS=https://example.com,https://www.example.com
# SANCTUM_STATEFUL_DOMAINS=example.com,www.example.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=billiards_prod
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

# Reverb WebSocket (nếu sử dụng)
REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST=example.com
REVERB_PORT=443
REVERB_SCHEME=https

# Mail (cấu hình SMTP thật)
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

#### 2. Cấu hình Frontend (.env)

Nếu deploy riêng biệt, tạo file `.env` trong thư mục `frontend`:

```bash
cd frontend
cp .env.example .env
```

Chỉnh sửa file `.env`:

```env
# Nếu backend và frontend cùng domain:
VITE_API_URL=/api

# Nếu backend và frontend khác domain:
# VITE_API_URL=https://api.example.com/api

VITE_REVERB_APP_KEY=your_reverb_app_key
VITE_REVERB_HOST=example.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

### Cách 1: Deploy cùng domain

#### Bước 1: Build Frontend

```bash
cd frontend
npm install
npm run build
```

#### Bước 2: Copy build files vào Backend

```bash
# Copy tất cả files từ frontend/dist vào backend/public
# Giữ lại các file/folder Laravel cần thiết: index.php, .htaccess, etc.
cp -r frontend/dist/* ../backend/public/
# Hoặc trên Windows:
# xcopy /E /I frontend\dist\* backend\public\
```

#### Bước 3: Cấu hình Laravel để serve frontend

Tạo route fallback trong `backend/routes/web.php`:

```php
Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '^(?!api|admin|broadcasting).*$');
```

#### Bước 4: Build và optimize Backend

```bash
cd backend
composer install --optimize-autoloader --no-dev
npm run build
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
```

#### Bước 5: Cấu hình Web Server (Nginx/Apache)

**Nginx example:**

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;
    root /var/www/billiards/backend/public;
    index index.php;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Cách 2: Deploy khác domain

#### Backend (api.example.com)

```bash
cd backend
composer install --optimize-autoloader --no-dev
npm run build
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Cấu hình Nginx cho API:

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;
    root /var/www/billiards/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

#### Frontend (example.com)

```bash
cd frontend
npm install
npm run build
```

Serve từ Nginx hoặc CDN (Vercel, Netlify, Cloudflare Pages):

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    root /var/www/billiards/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Các lệnh cần chạy sau khi deploy

```bash
# Set permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Queue worker (chạy bằng supervisor hoặc systemd)
php artisan queue:work --tries=3

# Reverb WebSocket (chạy bằng supervisor)
php artisan reverb:start --host=0.0.0.0 --port=8080
```

### Checklist trước khi deploy

- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] Đã cấu hình database production
- [ ] Đã cấu hình `CORS_ALLOWED_ORIGINS` đúng domain frontend
- [ ] Đã cấu hình `SANCTUM_STATEFUL_DOMAINS` đúng domain frontend
- [ ] Đã cấu hình `APP_URL` đúng domain backend
- [ ] Đã cấu hình SSL/HTTPS
- [ ] Đã cấu hình mail server
- [ ] Đã generate `APP_KEY`
- [ ] Đã chạy migrations
- [ ] Đã build frontend với đúng `VITE_API_URL`
- [ ] Đã cache config, route, view
- [ ] Đã setup queue worker
- [ ] Đã setup Reverb WebSocket (nếu dùng)
- [ ] Đã test API endpoints
- [ ] Đã test authentication flow

## Cấu trúc dự án

```
billiards/
├── backend/                 # Laravel Backend
│   ├── app/                # Application code
│   │   ├── Http/           # Controllers, Middleware, Resources
│   │   ├── Models/         # Eloquent Models
│   │   ├── Events/         # Event classes
│   │   └── Filament/       # Filament Admin Panel
│   ├── config/             # Configuration files
│   ├── database/           # Migrations, Seeders, Factories
│   ├── routes/             # Route definitions
│   └── public/             # Public assets (Laravel)
├── frontend/               # React Frontend
│   ├── src/                # Source code
│   │   ├── api/            # API clients
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── store/          # State management
│   └── public/             # Public assets
└── README.md
```

## Công nghệ sử dụng

### Backend
- **Laravel 12**: PHP Framework
- **Filament 4.0**: Admin Panel
- **Laravel Reverb**: WebSocket Server
- **Laravel Sanctum**: API Authentication
- **Spatie Laravel Permission**: Role & Permission
- **SQLite/MySQL**: Database

### Frontend
- **React 19**: UI Framework
- **TypeScript**: Type Safety
- **Vite**: Build Tool
- **Tailwind CSS**: Styling
- **React Router**: Routing
- **Zustand**: State Management
- **React Query**: Data Fetching
- **Laravel Echo**: WebSocket Client
- **React Hook Form**: Form Handling
- **Zod**: Schema Validation

## Scripts có sẵn

### Backend (composer.json)

- `composer run setup`: Cài đặt tự động toàn bộ dự án
- `composer run dev`: Khởi động tất cả services cho development
- `composer run test`: Chạy tests

### Frontend (package.json)

- `npm run dev`: Khởi động dev server
- `npm run build`: Build cho production
- `npm run lint`: Kiểm tra code style

## Troubleshooting

### Lỗi permission trên Linux/Mac

```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### Lỗi database SQLite

Đảm bảo file `database/database.sqlite` đã được tạo và có quyền ghi.

### Lỗi port đã được sử dụng

Thay đổi port trong file `.env` hoặc dừng process đang sử dụng port đó.

### Lỗi cài đặt dependencies

Xóa thư mục `node_modules` và `package-lock.json`, sau đó chạy lại:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Tài liệu tham khảo

- [Laravel Documentation](https://laravel.com/docs)
- [Filament Documentation](https://filamentphp.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## License

MIT License

