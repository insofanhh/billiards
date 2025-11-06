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
cd backend/frontend
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
cd backend/frontend
npm run build
```

File build sẽ được tạo trong thư mục `backend/frontend/dist`.

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
│   ├── frontend/           # React Frontend
│   │   ├── src/            # Source code
│   │   │   ├── api/        # API clients
│   │   │   ├── components/ # React components
│   │   │   ├── pages/      # Page components
│   │   │   └── store/      # State management
│   │   └── public/         # Public assets
│   └── public/             # Public assets (Laravel)
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

