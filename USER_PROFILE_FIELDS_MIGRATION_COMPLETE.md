# ✅ USER PROFILE FIELDS MIGRATION - HOÀN THÀNH

## 🎯 Mục tiêu
Thêm các fields profile vào User model để hỗ trợ:
- Họ tên (name)
- Số điện thoại (phone)
- Liên hệ khẩn cấp (emergency_contact)
- **Số CCCD/Passport (id_number)** - Cho Landlord

---

## ✅ Đã hoàn thành

### 1. Database Schema
**File:** `apps/backend/prisma/schema.prisma`

**Fields mới trong User model:**
```prisma
model User {
  // ... existing fields
  
  // Profile fields
  name               String?
  phone              String?
  emergency_contact  String?
  id_number          String?  // CCCD/Passport for Landlord
  
  // ... rest
}
```

### 2. Migration SQL
**File:** `apps/backend/prisma/migrations/add_user_profile_fields.sql`

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number TEXT;
```

### 3. Frontend Updated
**File:** `apps/frontend/src/pages/LandlordProfilePage.tsx`

- ✅ Enable `id_number` field
- ✅ Send `id_number` in PUT request
- ✅ Remove warning message

---

## 🚀 Chạy Migration

### Bước 1: Chạy migration script
```powershell
.\run-user-profile-migration.ps1
```

**Hoặc manual:**
```powershell
cd apps/backend
npx prisma db push
npx prisma generate
```

### Bước 2: Restart backend
```powershell
cd apps/backend
npm run dev
```

### Bước 3: Test frontend
```
URL: http://localhost:5173/landlord-profile
```

---

## 🧪 Test Guide

### 1. Login as Landlord
```
Email: landlord@example.com
Password: Password123!
```

### 2. Vào trang Tài khoản
- Click "👤 Tài khoản" ở sidebar
- Hoặc truy cập: `http://localhost:5173/landlord-profile`

### 3. Cập nhật thông tin
```
Họ và tên: Nguyễn Văn A
Số điện thoại: 0912345678
Số CCCD/Passport: 001234567890  ← NEW!
Liên hệ khẩn cấp: 0987654321
```

### 4. Click "Lưu thay đổi"
- ✅ Thành công: "Cập nhật thông tin thành công!"
- ✅ Refresh page → Thông tin vẫn còn
- ✅ CCCD đã được lưu vào database

---

## 📊 Database Structure

### Before:
```sql
users (
  id, org_id, email, password_hash, role, status,
  scopes, assigned_asset_ids, created_at, updated_at
)
```

### After:
```sql
users (
  id, org_id, email, password_hash, role, status,
  scopes, assigned_asset_ids,
  name, phone, emergency_contact, id_number,  ← NEW!
  created_at, updated_at
)
```

---

## 🔗 Integration với Agreement Module

**Use Case:** Khi tạo hợp đồng, backend có thể:

```typescript
// Get landlord info
const landlord = await prisma.user.findUnique({
  where: { id: landlordId },
  select: {
    name: true,
    phone: true,
    id_number: true,  // ← CCCD for contract
  },
});

// Use in agreement
const agreement = await prisma.agreement.create({
  data: {
    landlord_party_id: landlordId,
    landlord_name: landlord.name,
    landlord_id_number: landlord.id_number,  // ← Save to contract
    // ...
  },
});
```

---

## 📁 Files Changed

### Backend
- ✅ `apps/backend/prisma/schema.prisma`
- ✅ `apps/backend/prisma/migrations/add_user_profile_fields.sql`

### Frontend
- ✅ `apps/frontend/src/pages/LandlordProfilePage.tsx`

### Scripts
- ✅ `run-user-profile-migration.ps1`

### Documentation
- ✅ `USER_PROFILE_FIELDS_MIGRATION_COMPLETE.md` (this file)

---

## ✅ Status

**Backend Schema:** ✅ COMPLETE  
**Migration:** ✅ READY TO RUN  
**Frontend:** ✅ COMPLETE  
**Testing:** ✅ READY TO TEST  

---

## 🚀 Next Steps (Optional)

### Priority P1:
1. **Validation CCCD format**
   - Frontend: Check 12 digits
   - Backend: Regex validation
   - Format: 001234567890

2. **Unique constraint**
   - Ensure CCCD is unique per org
   - Prevent duplicate registrations

3. **Update TenantProfilePage**
   - Add same fields (name, phone, emergency_contact)
   - No id_number for tenant

### Priority P2:
4. **Upload ảnh CCCD**
   - Front/back images
   - OCR auto-fill
   - Store in documents

5. **Verification workflow**
   - Admin approval
   - Verification badge
   - Status tracking

---

**Chạy migration ngay để enable CCCD field! 🎉**

```powershell
.\run-user-profile-migration.ps1
```
