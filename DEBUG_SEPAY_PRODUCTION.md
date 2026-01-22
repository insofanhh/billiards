# Debug SePay Production Issue - RESOLVED

## 🐛 Vấn đề

**Hiện tượng**: 
- ✅ Test qua Postman → Transaction chuyển trạng thái thành công
- ❌ Chuyển khoản thực tế → Không thấy thay đổi trạng thái

## 🔍 Nguyên nhân (Root Cause)

### Phát hiện từ Log
```
"expected":"Apikey K8O32IEZAGV56cui"
"received_auth":"K8O32IEZAGV56cui"     ← Không có prefix "Apikey"
```

### Phân tích
1. **Postman Test**: Bạn gửi header `Authorization: Apikey K8O32IEZAGV56cui` → ✅ Match
2. **SePay Production**: SePay gửi header `Authorization: K8O32IEZAGV56cui` → ❌ Không match

### Logic cũ (SAI)
```php
// Chỉ match 3 trường hợp:
if ($incomingApiKey === 'Apikey ' . $sepayApiKey) {  // ❌ Không match với SePay
    $isValidApiKey = true;
} elseif ($incomingDirectKey === $sepayApiKey) {     // ❌ SePay không gửi header này
    $isValidApiKey = true;
} elseif (str_replace('Apikey ', '', $incomingApiKey) === $sepayApiKey) {  // ❌ Vì không có "Apikey " để replace
    $isValidApiKey = true;
}
```

**Kết quả**: SePay webhook luôn trả về `401 Unauthorized` → Không cập nhật được transaction.

---

## ✅ Giải pháp

### Logic mới (ĐÚNG)
```php
// Format 1: Authorization: Apikey YOUR_KEY (Postman format)
if ($incomingApiKey && str_contains(strtolower($incomingApiKey), 'apikey')) {
    $extractedKey = trim(str_ireplace('Apikey', '', $incomingApiKey));
    if ($extractedKey === $sepayApiKey) {
        $isValidApiKey = true;
    }
}

// Format 2: Authorization: YOUR_KEY (SePay production format - KEY)
if (!$isValidApiKey && $incomingApiKey === $sepayApiKey) {
    $isValidApiKey = true;  // ✅ Bây giờ match với SePay
}

// Format 3: SEPAY_API_KEY: YOUR_KEY (Custom header)
if (!$isValidApiKey && $incomingDirectKey === $sepayApiKey) {
    $isValidApiKey = true;
}
```

### Các format được hỗ trợ
| Format | Header | Value | Use Case |
|--------|--------|-------|----------|
| 1 | `Authorization` | `Apikey K8O32IEZAGV56cui` | Postman test |
| 2 | `Authorization` | `K8O32IEZAGV56cui` | **SePay Production** ✅ |
| 3 | `SEPAY_API_KEY` | `K8O32IEZAGV56cui` | Custom test |

---

## 🧪 Cách Test Lại

### 1. Test với Postman (Giống SePay production)

#### Request
```
POST https://yourdomain.com/api/webhook/sepay
```

#### Headers (CHÚ Ý: KHÔNG có prefix "Apikey")
```
Authorization: K8O32IEZAGV56cui
Content-Type: application/json
```

#### Body
```json
{
  "gateway": "TPBank",
  "transactionDate": "2024-12-09 13:42:38",
  "accountNumber": "83689318888",
  "transferType": "in",
  "transferAmount": 11933,
  "content": "TKPBMS TXN-XXXXXXXXXX",
  "referenceCode": "FT24344539533641",
  "description": "Chuyen tien"
}
```

⚠️ **Thay đổi**: 
- `transferAmount`: Số tiền đơn hàng thực tế
- `content`: Mã TXN từ QR code (`TXN-XXXXXXXXXX`)

#### Response mong đợi
```json
{
  "success": true,
  "message": "Transaction success"
}
```

### 2. Kiểm tra Log

```bash
cd backend
tail -f storage/logs/laravel.log
```

**Log thành công sẽ có:**
```
[2024-12-09 XX:XX:XX] local.INFO: SePay Webhook Auth Check
[2024-12-09 XX:XX:XX] local.INFO: SePay Webhook: Authentication successful
[2024-12-09 XX:XX:XX] local.INFO: SePay Webhook: Transaction TXN-XXX success. Amount: XXX
```

**Log lỗi sẽ có:**
```
[2024-12-09 XX:XX:XX] local.WARNING: SePay Webhook: Unauthorized attempt
```

### 3. Verify Database

```sql
-- Kiểm tra transaction đã update chưa
SELECT * FROM transactions 
WHERE reference = 'TXN-XXXXXXXXXX' 
ORDER BY updated_at DESC;

-- Kết quả mong đợi:
-- status: 'success'
-- updated_at: timestamp gần đây

-- Kiểm tra order đã completed chưa
SELECT o.*, t.status as transaction_status 
FROM orders o
JOIN transactions t ON t.order_id = o.id
WHERE t.reference = 'TXN-XXXXXXXXXX';

-- Kết quả mong đợi:
-- order.status: 'completed'
-- transaction_status: 'success'
```

---

## 🚀 Deploy Fix lên Production

### Bước 1: Clear cache
```bash
cd backend
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

### Bước 2: Deploy code mới
```bash
# Push lên git
git add backend/app/Http/Controllers/Api/SePayWebhookController.php
git commit -m "fix: Support SePay production Authorization header format"
git push origin main

# Deploy lên server (tùy hệ thống)
```

### Bước 3: Test ngay lập tức
```bash
# 1. Tạo đơn hàng test với số tiền nhỏ (1,000đ)
# 2. Chuyển khoản thực tế
# 3. Kiểm tra log ngay
tail -f backend/storage/logs/laravel.log

# 4. Kiểm tra DB
mysql -u root -p billiards
SELECT * FROM transactions ORDER BY id DESC LIMIT 5;
```

---

## 📊 So sánh Trước và Sau

### ❌ TRƯỚC (Lỗi)
```
Client chuyển khoản
    ↓
SePay nhận tiền
    ↓
SePay gọi webhook với header: Authorization: K8O32IEZAGV56cui
    ↓
Backend check: "K8O32IEZAGV56cui" !== "Apikey K8O32IEZAGV56cui"
    ↓
❌ Return 401 Unauthorized
    ↓
Transaction vẫn pending (không update)
```

### ✅ SAU (Fix)
```
Client chuyển khoản
    ↓
SePay nhận tiền
    ↓
SePay gọi webhook với header: Authorization: K8O32IEZAGV56cui
    ↓
Backend check: "K8O32IEZAGV56cui" === "K8O32IEZAGV56cui"
    ↓
✅ Authentication successful
    ↓
Update transaction.status = 'success'
    ↓
Update order.status = 'completed'
    ↓
Broadcast event qua WebSocket
    ↓
Client nhận được bill ngay lập tức
```

---

## 🔧 Troubleshooting

### Vấn đề 1: Vẫn 401 sau khi deploy
**Nguyên nhân**: Cache chưa clear
**Giải pháp**:
```bash
php artisan config:clear
php artisan route:clear
php artisan optimize:clear
```

### Vấn đề 2: Log không thấy webhook call
**Nguyên nhân**: 
- SePay webhook URL chưa config đúng
- Firewall/Security group block request

**Giải pháp**:
1. Check SePay dashboard → Webhook settings
2. URL phải là: `https://yourdomain.com/api/webhook/sepay`
3. Check server logs: `tail -f /var/log/nginx/access.log`

### Vấn đề 3: Authentication successful nhưng không update DB
**Nguyên nhân**: 
- Reference code không match
- Amount không đủ

**Giải pháp**:
1. Check log có dòng: `"No transaction code found in content"`
2. Verify content format: `TKPBMS TXN-XXXXXXXXXX`
3. Check amount: `transferAmount >= transaction.amount`

---

## 📝 Checklist Deploy Production

### Pre-Deploy
- [x] Fix authentication logic
- [x] Test với Postman (không prefix "Apikey")
- [x] Verify log output
- [x] Review code changes

### Deploy
- [ ] Backup database
- [ ] Clear all caches
- [ ] Deploy code mới
- [ ] Restart services (PHP-FPM, Queue, etc.)

### Post-Deploy
- [ ] Test với đơn hàng nhỏ (1,000đ)
- [ ] Monitor log trong 30 phút
- [ ] Verify transaction status update
- [ ] Check WebSocket broadcast
- [ ] Confirm client UI update

### Rollback Plan (Nếu cần)
```bash
# Revert commit
git revert HEAD
git push origin main

# Clear cache
php artisan optimize:clear

# Restore database backup (nếu cần)
```

---

## 📞 Debug Commands

### Check webhook route
```bash
php artisan route:list --path=webhook
```

### Check recent logs
```bash
tail -50 storage/logs/laravel.log | grep "SePay"
```

### Check failed webhooks
```sql
SELECT * FROM transactions 
WHERE status = 'pending' 
AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY created_at DESC;
```

### Test webhook manually
```bash
curl -X POST https://yourdomain.com/api/webhook/sepay \
  -H "Authorization: K8O32IEZAGV56cui" \
  -H "Content-Type: application/json" \
  -d '{
    "gateway": "TPBank",
    "accountNumber": "83689318888",
    "transferAmount": 1000,
    "content": "TKPBMS TXN-TEST123456"
  }'
```

---

## ✅ Kết luận

**Vấn đề đã được fix**: Code đã hỗ trợ cả 2 format header:
1. ✅ `Authorization: Apikey K8O32IEZAGV56cui` (Postman test)
2. ✅ `Authorization: K8O32IEZAGV56cui` (SePay production) **← KEY FIX**

**Next Steps**:
1. Deploy code mới lên production
2. Clear toàn bộ cache
3. Test với chuyển khoản thực tế
4. Monitor logs để confirm

---

**Fixed by**: AI Assistant  
**Date**: 2024-12-09  
**Issue**: Authorization header format mismatch  
**Solution**: Add support for direct API key format  
**Status**: ✅ READY TO DEPLOY

