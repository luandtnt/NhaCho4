# ⚡ Pricing Policies - Quick Start

## 🎯 Bạn đang ở đây:
- ✅ Backend code hoàn thành
- ✅ Frontend components hoàn thành
- ⏳ **CẦN: Setup database & start backend**

---

## 🚀 3 BƯỚC ĐỂ CHẠY

### Bước 1: Kiểm tra Backend
```powershell
.\check-backend-status.ps1
```

**Nếu backend đang chạy** → Tắt nó (Ctrl+C)  
**Nếu backend không chạy** → Tiếp tục bước 2

---

### Bước 2: Setup Database
```powershell
.\setup-pricing-policies.ps1
```

Script này sẽ:
- Generate Prisma Client
- Run migration (tạo tables)
- Báo kết quả

**Kết quả mong đợi**:
```
✅ Prisma Client generated
✅ Migration completed
✅ SETUP COMPLETE!
```

---

### Bước 3: Start Backend
```bash
cd apps/backend
npm run start:dev
```

**Kết quả mong đợi**:
```
[Nest] LOG [NestApplication] Nest application successfully started
```

---

## ✅ Verify Setup

### Test 1: Check API
```bash
curl http://localhost:3000/api/v1/pricing-policies
```

**Kết quả mong đợi**: `{"data":[],"total":0}`

### Test 2: Check Database
```sql
-- Connect to your database
SELECT * FROM pricing_policies;
SELECT * FROM pricing_policy_versions;
SELECT * FROM booking_price_snapshots;
```

---

## 🎨 Frontend Access

### Tạm thời test bằng URL trực tiếp:
```
http://localhost:5173/pricing-policies-new
```

**Lưu ý**: Route chưa được add vào menu, nhưng component đã hoạt động!

---

## 🐛 Gặp Lỗi?

### "EPERM: operation not permitted"
→ Backend đang chạy, tắt nó đi!

### "Migration already applied"
→ OK, bỏ qua, chỉ cần start backend

### "Cannot find module '@prisma/client'"
→ Chạy lại: `cd apps/backend && npx prisma generate`

### API trả về 401 Unauthorized
→ Cần login và lấy token trước

---

## 📋 TODO Tiếp Theo

Sau khi backend chạy OK:

1. **Add Route** cho PricingPoliciesPageNew
2. **Update EnhancedPropertyForm** để dùng PricingPolicySelector
3. **Test Full Flow**: Tạo policy → Tạo item → Verify

---

## 🆘 Cần Giúp?

Chạy lệnh này để xem hướng dẫn chi tiết:
```powershell
Get-Content .\PRICING_POLICIES_SETUP_GUIDE.md
```

Hoặc mở file: `PRICING_POLICIES_SETUP_GUIDE.md`

---

**Ready? Let's go!** 🚀
