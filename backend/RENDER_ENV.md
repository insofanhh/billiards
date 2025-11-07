# Biến môi trường cho Render.com

## Biến môi trường bắt buộc

### 1. Cấu hình ứng dụng
```
APP_NAME=Billiards
APP_ENV=production
APP_KEY=base64:... (chạy: php artisan key:generate --show)
APP_DEBUG=false
APP_URL=https://<tên-app>.onrender.com
```

### 2. Cấu hình Database (nếu dùng MySQL/PostgreSQL)
```
DB_CONNECTION=mysql
DB_HOST=<Render DB hostname>
DB_PORT=3306
DB_DATABASE=<Render DB name>
DB_USERNAME=<Render DB user>
DB_PASSWORD=<Render DB password>
```

### 3. Cấu hình Session & Cache
```
SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### 4. Cấu hình Logging
```
LOG_CHANNEL=stack
LOG_LEVEL=error
```

## Biến môi trường tùy chọn

### Mail (nếu cần gửi email)
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=<your-username>
MAIL_PASSWORD=<your-password>
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Redis (nếu dùng Redis)
```
REDIS_CLIENT=phpredis
REDIS_HOST=<Render Redis host>
REDIS_PASSWORD=<Render Redis password>
REDIS_PORT=6379
```

### Broadcasting (nếu dùng Reverb/WebSocket)
```
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=<your-app-id>
REVERB_APP_KEY=<your-app-key>
REVERB_APP_SECRET=<your-app-secret>
REVERB_HOST=<your-reverb-host>
REVERB_PORT=443
REVERB_SCHEME=https
```

## Cách thêm trên Render.com

1. Vào Dashboard → Chọn service của bạn
2. Vào tab **Environment**
3. Click **Add Environment Variable**
4. Thêm từng biến theo danh sách trên

## Lưu ý

- **APP_KEY**: Chạy `php artisan key:generate --show` trên local để lấy key, hoặc để Render tự generate trong Build Command
- **APP_URL**: Thay `<tên-app>` bằng tên service thực tế trên Render
- Database credentials: Lấy từ Render Database dashboard
- Không commit file `.env` vào git

