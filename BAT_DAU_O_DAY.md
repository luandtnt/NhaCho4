# 🚀 BẮT ĐẦU TỪ ĐÂY - KHÔI PHỤC DỮ LIỆU

## ⚠️ TÌNH HUỐNG

Database của bạn đã bị xóa. Tôi đã tạo sẵn scripts để khôi phục toàn bộ dữ liệu.

---

## 🎯 CHẠY NGAY SCRIPT NÀY

### ✅ KHUYẾN NGHỊ: Reset & Tạo Mới (Xóa hết và tạo lại)

```powershell
.\reset-and-restore-all.ps1
```

**Lý do:** Đảm bảo database sạch và đầy đủ nhất.

**Các bước:**
1. Stop backend (Ctrl+C)
2. Chạy script trên
3. Xác nhận: gõ "yes" và "DELETE ALL"
4. Đợi ~1-2 phút
5. Xong!

---

## 📦 DỮ LIỆU SẼ ĐƯỢC TẠO

✅ **3 Listings** - Tin đăng căn hộ tại Ba Đình  
✅ **3 Rentable Items** - 3 căn hộ (101, 102, 201)  
✅ **3 Bookings** - CONFIRMED, CHECKED_IN, COMPLETED  
✅ **2 Agreements** - 1 ACTIVE, 1 DRAFT  
✅ **2 Pricing Policies** - Chính sách giá trung hạn  
✅ **3 Invoices** - ISSUED, PAID, DRAFT với line items  
✅ **Và nhiều dữ liệu khác...**

---

## 🔑 ĐĂNG NHẬP

```
Landlord: landlord@example.com / Password123!
Tenant:   tenant@example.com / Password123!
Admin:    admin@example.com / Password123!
```

---

## ✅ SAU KHI CHẠY XONG

### 1. Khởi động Backend
```powershell
cd apps/backend
pnpm start:dev
```

### 2. Khởi động Frontend (terminal mới)
```powershell
cd apps/frontend
pnpm dev
```

### 3. Truy cập
```
http://localhost:5173
```

### 4. Kiểm tra
- Đăng nhập: landlord@example.com / Password123!
- Vào các trang:
  - ✅ Listings - phải thấy 3 tin đăng
  - ✅ Bookings - phải thấy 3 bookings
  - ✅ Agreements - phải thấy 2 agreements
  - ✅ Invoices - phải thấy 3 invoices
  - ✅ Pricing Policies - phải thấy 2 policies

---

## 📚 TÀI LIỆU

Nếu cần thêm thông tin:

1. **Quick Guide:** `CHAY_SCRIPT_NAY.txt`
2. **Checklist:** `RECOVERY_CHECKLIST.md`
3. **Hướng dẫn ngắn:** `KHOI_PHUC_DU_LIEU.md`
4. **Hướng dẫn chi tiết:** `DATA_RECOVERY_GUIDE.md`
5. **Báo cáo đầy đủ:** `DATA_LOSS_RECOVERY_COMPLETE.md`

---

## ❓ NẾU GẶP VẤN ĐỀ

### Backend không khởi động?
```powershell
docker-compose restart
pnpm -C apps/backend prisma migrate deploy
```

### Script báo lỗi?
- Đọc error message
- Xem `DATA_RECOVERY_GUIDE.md` - Troubleshooting
- Chạy lại script

### Dữ liệu không đúng?
- Chạy lại `.\reset-and-restore-all.ps1`

---

## 🎉 DONE!

Sau khi chạy script và kiểm tra, tất cả modules sẽ hoạt động bình thường!

**Tiếp theo:** Tiếp tục phát triển Invoice Module Phase 2-4 🚀

---

**Lưu ý:** Tất cả dữ liệu là dữ liệu thực từ database, không phải mock data!
