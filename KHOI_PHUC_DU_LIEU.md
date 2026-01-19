# 🔄 KHÔI PHỤC DỮ LIỆU - HƯỚNG DẪN NHANH

## ⚠️ Vấn Đề
Database đã bị xóa. Tất cả dữ liệu của các module đã hoàn thành đã mất.

## ✅ Giải Pháp
Tôi đã tạo seed script hoàn chỉnh để khôi phục tất cả dữ liệu.

---

## 🚀 CÁCH CHẠY (2 OPTIONS)

### Option 1: Khôi Phục Dữ Liệu (Không Xóa)
```powershell
# 1. Stop backend (Ctrl+C)
# 2. Chạy script
.\restore-all-data.ps1
```

### Option 2: Reset & Tạo Mới (Xóa Hết)
```powershell
# 1. Stop backend (Ctrl+C)
# 2. Chạy script
.\reset-and-restore-all.ps1
# 3. Xác nhận: gõ "yes" và "DELETE ALL"
```

---

## 📦 DỮ LIỆU SẼ ĐƯỢC TẠO

✅ **3 Listings** (tin đăng)  
✅ **1 Asset** với 3 units (Sunrise Apartments)  
✅ **3 Rentable Items** (căn cho thuê)  
✅ **3 Bookings** (1 CONFIRMED, 1 CHECKED_IN, 1 COMPLETED)  
✅ **2 Agreements** (1 ACTIVE, 1 DRAFT)  
✅ **2 Pricing Policies** (chính sách giá)  
✅ **3 Invoices** (1 ISSUED, 1 PAID, 1 DRAFT)  
✅ **1 Payment**  
✅ **4 Notifications**  
✅ **2 Leads**  

---

## 🔑 ĐĂNG NHẬP

| Email | Password | Role |
|-------|----------|------|
| landlord@example.com | Password123! | Landlord |
| tenant@example.com | Password123! | Tenant |
| admin@example.com | Password123! | Admin |

---

## ✅ SAU KHI CHẠY XONG

```powershell
# 1. Khởi động backend
cd apps/backend
pnpm start:dev

# 2. Khởi động frontend (terminal mới)
cd apps/frontend
pnpm dev

# 3. Truy cập
http://localhost:5173
```

---

## 📋 KIỂM TRA

Đăng nhập với **landlord@example.com** và kiểm tra:

- ✅ Listings Page - phải thấy 3 tin đăng
- ✅ Bookings Page - phải thấy 3 bookings
- ✅ Agreements Page - phải thấy 2 agreements
- ✅ Invoices Page - phải thấy 3 invoices
- ✅ Pricing Policies Page - phải thấy 2 policies

---

## 🔧 NẾU GẶP LỖI

### "Backend đang chạy"
→ Stop backend (Ctrl+C) và chạy lại

### "Migration chưa chạy"
```powershell
cd apps/backend
pnpm prisma migrate deploy
```

### "Unique constraint violation"
→ Dùng `reset-and-restore-all.ps1` để xóa hết và tạo mới

---

## 📚 CHI TIẾT

Xem file `DATA_RECOVERY_GUIDE.md` để biết thêm chi tiết về:
- Dữ liệu cụ thể được tạo
- Troubleshooting
- API testing
- Best practices

---

**Lưu ý:** Tất cả dữ liệu là **dữ liệu thực từ database**, không phải mock data!
