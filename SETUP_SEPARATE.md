# Hướng dẫn chạy Frontend và Backend riêng biệt

Tài liệu này hướng dẫn cách cấu hình để chạy Frontend và Backend như 2 project độc lập.

## 📋 Yêu cầu

- Backend: PHP 8.2+, Composer, Node.js
- Frontend: Node.js 18+, npm hoặc yarn

## 🚀 Cấu hình Backend

### 1. Cài đặt dependencies

```bash
cd backend
composer install
npm install
```

### 2. Cấu hình `.env`

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Chỉnh sửa các biến sau trong `backend/.env`:

```env
APP_URL=http://localhost:8000

# Thêm domain/port của frontend vào đây
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Thêm domain của frontend (không có http://)
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:8000

# Cấu hình Reverb WebSocket
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

### 3. Tạo Reverb credentials

```bash
php artisan reverb:install
```

Lệnh này sẽ tạo `REVERB_APP_ID`, `REVERB_APP_KEY`, và `REVERB_APP_SECRET` trong file `.env`.

### 4. Chạy Backend

```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Queue worker (nếu sử dụng queue)
php artisan queue:work

# Terminal 3: Reverb WebSocket server
php artisan reverb:start
```

Backend sẽ chạy tại: `http://localhost:8000`

## 🎨 Cấu hình Frontend

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Cấu hình `.env`

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Chỉnh sửa các biến sau trong `frontend/.env`:

```env
# URL của backend API
VITE_API_URL=http://localhost:8000/api

# Cấu hình Reverb WebSocket (lấy từ backend/.env)
VITE_REVERB_APP_KEY=your_reverb_app_key_from_backend
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

**Lưu ý:** `VITE_REVERB_APP_KEY` phải khớp với `REVERB_APP_KEY` trong `backend/.env`

### 3. Chạy Frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## ✅ Kiểm tra

1. Mở trình duyệt và truy cập: `http://localhost:5173`
2. Kiểm tra Console (F12) xem có lỗi CORS không
3. Thử đăng nhập/đăng ký để kiểm tra authentication
4. Kiểm tra WebSocket connection trong Network tab

## 🔧 Xử lý lỗi thường gặp

### Lỗi CORS

**Triệu chứng:** Console hiển thị `Access-Control-Allow-Origin` error

**Giải pháp:**
- Kiểm tra `CORS_ALLOWED_ORIGINS` trong `backend/.env` có chứa URL của frontend
- Đảm bảo format đúng: `http://localhost:5173` (không có dấu `/` ở cuối)
- Restart Laravel server sau khi thay đổi `.env`

### Lỗi Authentication

**Triệu chứng:** 401 Unauthorized khi gọi API

**Giải pháp:**
- Kiểm tra `SANCTUM_STATEFUL_DOMAINS` trong `backend/.env`
- Đảm bảo domain không có `http://` hoặc `https://`
- Kiểm tra token có được lưu trong `localStorage` không

### WebSocket không kết nối

**Triệu chứng:** Không nhận được real-time updates

**Giải pháp:**
- Kiểm tra Reverb server đang chạy: `php artisan reverb:start`
- Kiểm tra `VITE_REVERB_*` trong `frontend/.env` khớp với `REVERB_*` trong `backend/.env`
- Kiểm tra port 8080 không bị chặn bởi firewall

## 🌐 Production

### Cấu hình Backend (.env)

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com

# Thêm domain frontend
CORS_ALLOWED_ORIGINS=https://example.com,https://www.example.com
SANCTUM_STATEFUL_DOMAINS=example.com,www.example.com

# Reverb với HTTPS
REVERB_HOST=api.example.com
REVERB_PORT=443
REVERB_SCHEME=https
```

### Cấu hình Frontend (.env)

```env
# Nếu backend và frontend khác domain
VITE_API_URL=https://api.example.com/api

# Reverb với HTTPS
VITE_REVERB_HOST=api.example.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=your_production_key
```

### Build Frontend

```bash
cd frontend
npm run build
```

Files build sẽ nằm trong `frontend/dist/`

## 📝 Lưu ý

1. **Vite Proxy:** Proxy trong `vite.config.ts` chỉ hoạt động trong dev mode. Production build không sử dụng proxy.

2. **Environment Variables:** Các biến `VITE_*` phải được rebuild sau khi thay đổi (chạy lại `npm run dev` hoặc `npm run build`).

3. **CORS Credentials:** Backend đã cấu hình `Access-Control-Allow-Credentials: true` để hỗ trợ cookies nếu cần.

4. **Sanctum Stateful:** Middleware `EnsureFrontendRequestsAreStateful` chỉ hoạt động với các domain trong `SANCTUM_STATEFUL_DOMAINS`.

