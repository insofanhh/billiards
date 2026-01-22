# Multi-Tenant Payment Implementation Documentation

## Tổng quan

Đã triển khai thành công hệ thống thanh toán multi-tenant cho SePay, cho phép mỗi store có:
- Tài khoản ngân hàng riêng
- SePay API Key riêng
- Webhook URL riêng

## Thay đổi Backend

### 1. Database Migration

**File**: `backend/database/migrations/2026_01_22_135738_add_payment_fields_to_stores_table.php`

Đã thêm các cột vào bảng `stores`:
- `bank_account`: Số tài khoản ngân hàng
- `bank_name`: Tên ngân hàng (viết tắt)
- `bank_account_name`: Tên chủ tài khoản (optional)
- `sepay_api_key`: API Key từ SePay (encrypted)
- `webhook_token`: Token unique cho webhook URL

### 2. Store Model

**File**: `backend/app/Models/Store.php`

**Thêm:**
- Fields mới vào `$fillable`
- `sepay_api_key` được cast thành `encrypted` (Laravel auto encrypt/decrypt)
- `sepay_api_key` được thêm vào `$hidden`
- Auto-generate `webhook_token` khi tạo store mới
- Method `hasPaymentConfigured()`: Kiểm tra store đã cấu hình payment chưa
- Method `getWebhookUrl()`: Trả về webhook URL unique cho store

### 3. Webhook Controller

**File**: `backend/app/Http/Controllers/Api/SePayWebhookController.php`

**Cập nhật:**
- Hỗ trợ webhook URL có store identifier: `/api/webhook/sepay/{storeSlug}/{webhookToken}`
- Verify webhook token để xác định store
- Sử dụng `sepay_api_key` từ store thay vì env
- Scope transaction query theo `store_id`
- **Backward compatible**: Vẫn hỗ trợ webhook URL cũ `/api/webhook/sepay` với global `SEPAY_API_KEY` từ .env

### 4. API Controller mới

**File**: `backend/app/Http/Controllers/Api/StorePaymentController.php`

**Endpoints:**

```php
// Public - Lấy thông tin bank để tạo QR code
GET /api/public/stores/{slug}/payment-info

// Authenticated - Admin endpoints
GET /api/store/webhook-url           // Lấy webhook URL của store
GET /api/store/payment-settings      // Xem payment settings
PUT /api/store/payment-settings      // Cập nhật payment settings
```

### 5. Routes

**File**: `backend/routes/api.php`

**Thêm:**
- Webhook route mới với store params (ưu tiên)
- Giữ nguyên legacy webhook route
- Payment settings endpoints (authenticated)

## Thay đổi Frontend

### 1. Stores API

**File**: `frontend/src/api/stores.ts`

**Thêm:**
- Interface `StorePaymentInfo`
- Method `getPaymentInfo(slug)`: Fetch payment info của store

### 2. PaymentQRCode Component

**File**: `frontend/src/components/PaymentQRCode.tsx`

**Cập nhật:**
- Fetch payment info từ API theo `storeSlug`
- Hiển thị bank info động từ store settings
- Fallback về hardcoded values nếu không có store slug hoặc payment chưa config
- Hiển thị tên chủ tài khoản nếu có

## Luồng hoạt động

### 1. Onboarding Store mới

```
1. Admin tạo store mới
   → webhook_token tự động generate

2. Admin cấu hình payment settings qua API:
   PUT /api/store/payment-settings
   {
     "bank_account": "12345678",
     "bank_name": "TPBank",
     "bank_account_name": "CÔNG TY ABC",
     "sepay_api_key": "YOUR_SEPAY_API_KEY"
   }

3. Admin lấy webhook URL:
   GET /api/store/webhook-url
   → Copy URL vào SePay dashboard
```

### 2. Customer thanh toán

```
1. Client tạo order
2. Client chọn phương thức "Chuyển khoản"
3. Frontend fetch payment info:
   GET /api/public/stores/{slug}/payment-info

4. Hiển thị QR code với:
   - Bank account từ store
   - Bank name từ store
   - Nội dung CK: TKPBMS {transaction_reference}

5. Customer quét QR và chuyển khoản
```

### 3. Webhook xử lý

```
1. SePay gọi webhook:
   POST /api/webhook/sepay/{storeSlug}/{webhookToken}
   Headers:
     Authorization: {store's sepay_api_key}

2. Backend verify:
   - Webhook token → xác định store
   - Authorization header → verify sepay_api_key

3. Tìm transaction theo:
   - Reference code
   - Store ID

4. Xác nhận thanh toán thành công
5. Broadcast event → Frontend update real-time
```

## Bảo mật

✅ **SePay API Key được encrypt** trong database (Laravel `encrypted` cast)
✅ **Webhook Token unique** cho mỗi store
✅ **2-layer authentication**:
   - URL verification (webhook_token)
   - Header verification (sepay_api_key)
✅ **Scope isolation**: Transactions được scope theo store_id

## Backward Compatibility

✅ **Webhook URL cũ vẫn hoạt động**:
- Route: `POST /api/webhook/sepay`
- Dùng global `SEPAY_API_KEY` từ .env
- Không require store identification

✅ **Fallback cho payment info**:
- Nếu store chưa config payment → fallback hardcoded values
- Nếu không có storeSlug → dùng default values

## Testing Checklist

### Backend
- [x] Migration chạy thành công
- [x] Store model có đủ fields và methods
- [x] Webhook controller verify đúng logic
- [x] API endpoints hoạt động
- [x] No linter errors

### Frontend
- [x] PaymentQRCode fetch store payment info
- [x] Fallback khi không có config
- [x] QR code generate với thông tin đúng

### Tích hợp
- [ ] Test webhook với SePay thật
- [ ] Test thanh toán end-to-end
- [ ] Test multi-tenant isolation
- [ ] Test backward compatibility

## Migration từ Single-tenant

Nếu đang dùng hệ thống cũ:

1. Chạy migration: `php artisan migrate`
2. Với store hiện tại, cập nhật payment settings qua API
3. Update webhook URL trên SePay dashboard
4. Test với transaction mới
5. Legacy webhook URL vẫn hoạt động cho đến khi migrate xong

## Notes

- Mỗi store cần đăng ký tài khoản SePay riêng
- Admin cần copy webhook URL mới vào SePay dashboard
- Frontend tự động phát hiện và sử dụng store's payment info
- Không ảnh hưởng các chức năng khác của hệ thống
