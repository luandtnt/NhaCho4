# Test Scripts Summary

## ✅ Đã tạo thành công

Đã tạo đầy đủ test scripts cho M1 Foundation tại `C:\Users\Intel\Downloads\Nhacho4\Script Test\`

### Files đã tạo:

1. **test-m1.ps1** - PowerShell test script chính (17 tests)
2. **test-m1.bat** - CMD batch script (17 tests)  
3. **test-m1.sh** - Bash script cho Linux/Mac (17 tests)
4. **test-advanced.ps1** - Advanced tests (9 tests)
5. **run-all-tests.ps1** - Chạy tất cả tests (PowerShell)
6. **run-all-tests.bat** - Chạy tất cả tests (CMD)
7. **README.md** - Hướng dẫn chi tiết

## 📊 Kết quả hiện tại

**13/17 tests PASS** (76% success rate)

### ✅ Tests đang PASS (13):
- Login với 3 roles (Landlord, Admin, Tenant)
- Login thất bại với mật khẩu sai
- Get profile với token hợp lệ
- Get profile không có token (401)
- Refresh token
- Logout
- List config bundles
- Landlord có quyền list
- Token không hợp lệ (401)
- Validation errors (email thiếu, bundle_id thiếu)

### ❌ Tests đang FAIL (4):
1. **Create config bundle với Admin** - `org_id` undefined
2. **Create config bundle với Tenant** - RBAC không chặn
3. **Create bundle thứ 2** - `org_id` undefined  
4. **Landlord không thể tạo bundle** - RBAC không chặn

## 🐛 Vấn đề cần sửa

### 1. org_id undefined
**Nguyên nhân:** Thứ tự guards execution
- RBAC Guard và DataScope Guard chạy trước JWT Guard
- `request.user` chưa được set khi DataScope Guard chạy
- `request.org_id` không được attach

**Giải pháp đề xuất:**
- Sử dụng `@UseGuards(AuthGuard('jwt'))` trước các global guards
- Hoặc sửa thứ tự guards trong app.module.ts

### 2. RBAC không chặn Tenant/Landlord tạo config
**Nguyên nhân:** RBAC Guard return true khi user chưa được set
**Giải pháp:** Đã sửa nhưng cần verify lại

## 🎯 Cách sử dụng

### Chạy basic tests:
```powershell
cd "C:\Users\Intel\Downloads\Nhacho4\Script Test"
.\test-m1.ps1
```

### Chạy tất cả tests:
```powershell
.\run-all-tests.ps1
```

## 📝 Test Coverage

### Auth Flow (8 tests)
- [x] Login Landlord
- [x] Login Admin
- [x] Login Tenant
- [x] Login với mật khẩu sai
- [x] Get profile
- [x] Get profile không token
- [x] Refresh token
- [x] Logout

### Config Bundle (5 tests)
- [x] List bundles
- [ ] Create bundle (Admin) - FAIL: org_id undefined
- [ ] Create bundle (Tenant) - FAIL: RBAC không chặn
- [ ] Activate bundle
- [ ] Rollback bundle

### RBAC (3 tests)
- [x] Landlord list bundles
- [ ] Landlord không tạo bundle - FAIL: RBAC không chặn
- [x] Invalid token

### Validation (2 tests)
- [x] Email thiếu
- [x] Bundle_id thiếu

## 🚀 Next Steps

1. Sửa thứ tự guards để JWT guard chạy trước
2. Verify RBAC guard chặn đúng roles
3. Re-run tests để đạt 17/17 PASS
4. Chạy advanced tests
5. Document kết quả cuối cùng

## 📚 Documentation

Chi tiết đầy đủ trong `README.md`
