# 🧪 CHẠY TEST PHASE 1 BACKEND APIs

## Bước 1: Đảm bảo Backend đang chạy

Mở terminal và chạy:
```bash
cd apps/backend
npm run dev
```

Đợi backend khởi động xong (thấy message "Application is running on...")

## Bước 2: Chạy script test

Mở terminal MỚI (giữ terminal backend chạy), từ thư mục gốc:
```powershell
.\quick-test-booking-apis.ps1
```

## Bước 3: Làm theo hướng dẫn

Script sẽ hướng dẫn bạn từng bước:

1. **Kiểm tra backend** - Tự động
2. **Lấy test data** - Copy SQL query và chạy trong database client (DBeaver, pgAdmin, etc.)
3. **Test Check Availability** - Tự động
4. **Test Calculate Price** - Tự động  
5. **Test Create Booking** - Cần login token (optional)

## Kết quả mong đợi

✅ Check Availability: Trả về `available: true` hoặc `false` với lý do
✅ Calculate Price: Trả về breakdown giá chi tiết
✅ Create Booking: Tạo booking thành công với status CONFIRMED hoặc PENDING

## Nếu có lỗi

- Kiểm tra backend có đang chạy không
- Kiểm tra rentable_item_id có đúng không
- Xem error message để biết nguyên nhân

## Sau khi test xong

Nếu tất cả tests PASS → Sẵn sàng chuyển sang **Phase 2: Frontend Components**
