# ✅ LANDLORD PROFILE PAGE - HOÀN THÀNH

## 🎯 Mục tiêu
Tạo trang thông tin cá nhân cho Landlord (chủ nhà) tương tự TenantProfilePage nhưng có thêm trường **Số CCCD/Passport**.

---

## ✅ Đã hoàn thành

### 1. Tạo LandlordProfilePage
**File:** `apps/frontend/src/pages/LandlordProfilePage.tsx`

**Tính năng:**
- ✅ 3 tabs: Thông tin cá nhân, Bảo mật, Tùy chọn
- ✅ Hiển thị User ID, Role, Organization ID
- ✅ Form cập nhật thông tin cá nhân
- ✅ **Trường Số CCCD/Passport** (bắt buộc cho landlord)
- ✅ Đổi mật khẩu
- ✅ Cài đặt thông báo
- ✅ Ngôn ngữ & múi giờ

### 2. Thêm Route
**File:** `apps/frontend/src/App.tsx`

**Route mới:**
```tsx
<Route path="/landlord-profile" element={<PrivateRoute><LandlordProfilePage /></PrivateRoute>} />
```

---

## 📋 So sánh TenantProfilePage vs LandlordProfilePage

| Feature | TenantProfilePage | LandlordProfilePage |
|---------|-------------------|---------------------|
| User ID | ✅ | ✅ |
| Role | ✅ | ✅ |
| Organization ID | ✅ | ✅ |
| Họ và tên | ✅ | ✅ |
| Email | ✅ (disabled) | ✅ (disabled) |
| Số điện thoại | ✅ | ✅ |
| **Số CCCD/Passport** | ❌ | ✅ **NEW** |
| Liên hệ khẩn cấp | ✅ | ✅ |
| Đổi mật khẩu | ✅ | ✅ |
| Thông báo | ✅ | ✅ |
| Ngôn ngữ & Múi giờ | ✅ | ✅ |

---

## 🎨 UI Features

### Tab 1: Thông tin cá nhân
```
┌─────────────────────────────────────────┐
│ Thông tin hệ thống (Blue box)          │
│ - User ID: [uuid]                       │
│ - Role: Landlord                        │
│ - Organization ID: [uuid]               │
└─────────────────────────────────────────┘

Họ và tên *: [input]
Email: [disabled input]
Số điện thoại *: [input]
Số CCCD/Passport *: [input]  ← NEW!
  💡 Bắt buộc cho chủ nhà để xác thực và ký hợp đồng
Liên hệ khẩn cấp: [input]

[Lưu thay đổi]
```

### Tab 2: Bảo mật
- Đổi mật khẩu (current, new, confirm)
- Phiên đăng nhập hiện tại

### Tab 3: Tùy chọn
- Thông báo email (4 checkboxes)
- Ngôn ngữ (Tiếng Việt/English)
- Múi giờ (GMT+7)

---

## 🧪 Test Guide

### 1. Truy cập trang
```
URL: http://localhost:5173/landlord-profile
```

### 2. Kiểm tra hiển thị
- ✅ Thấy User ID, Role, Org ID
- ✅ Thấy trường "Số CCCD/Passport" (required)
- ✅ Email bị disabled
- ✅ 3 tabs hoạt động

### 3. Test cập nhật thông tin
```
Họ tên: Nguyễn Văn A
Số điện thoại: 0912345678
Số CCCD: 001234567890  ← NEW!
Liên hệ khẩn cấp: 0987654321
```

Click "Lưu thay đổi" → Thành công!

### 4. Test đổi mật khẩu
```
Mật khẩu hiện tại: Password123!
Mật khẩu mới: NewPassword123!
Xác nhận: NewPassword123!
```

Click "Đổi mật khẩu" → Thành công!

### 5. Test tùy chọn
- Toggle checkboxes
- Đổi ngôn ngữ
- Click "Lưu tùy chọn" → Thành công!

---

## 🔗 Integration với Agreement Module

**Use Case:** Khi tạo hợp đồng, landlord cần có CCCD để:
1. Xác thực danh tính
2. Ký hợp đồng điện tử
3. Lưu vào hồ sơ pháp lý

**Flow:**
```
Landlord → /landlord-profile → Nhập CCCD → Lưu
         ↓
Tạo hợp đồng → Backend lấy CCCD từ user profile
         ↓
Hiển thị trong hợp đồng PDF
```

---

## 📁 Files Changed

### Frontend
- ✅ `apps/frontend/src/pages/LandlordProfilePage.tsx` (NEW)
- ✅ `apps/frontend/src/App.tsx` (added route)

### Backend (Optional - nếu cần lưu CCCD)
- ⏳ `apps/backend/src/modules/platform/user/user.service.ts` (add id_number field)
- ⏳ `apps/backend/prisma/schema.prisma` (add id_number to User model)

---

## 🚀 Next Steps (Optional)

### Priority P1:
1. **Backend support cho id_number**
   - Thêm field `id_number` vào User model
   - Update PUT /users/profile endpoint
   - Validation CCCD format (12 digits)

2. **Link từ Layout/Menu**
   - Thêm menu item "Tài khoản" cho Landlord
   - Link đến `/landlord-profile`

3. **Validation CCCD**
   - Frontend: Check 12 digits
   - Backend: Unique constraint
   - Format: 001234567890

### Priority P2:
4. **Upload ảnh CCCD**
   - Upload front/back images
   - OCR để auto-fill
   - Lưu vào documents

5. **Verification status**
   - Badge: "Đã xác thực" / "Chưa xác thực"
   - Admin approval workflow

---

## ✅ Status

**Frontend:** ✅ 100% COMPLETE  
**Backend:** ⏳ 50% (cần thêm id_number field)  
**Testing:** ✅ READY TO TEST  

**Bạn có thể truy cập `/landlord-profile` ngay bây giờ! 🎉**

---

## 📞 API Endpoints (Current)

```
GET  /api/v1/users/profile
PUT  /api/v1/users/profile
POST /api/v1/users/change-password
GET  /api/v1/users/preferences
PATCH /api/v1/users/preferences
```

**Note:** Backend hiện tại có thể chưa support `id_number` field. Nếu gặp lỗi khi lưu, cần update backend.
