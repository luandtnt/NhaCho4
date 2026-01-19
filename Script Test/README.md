# Script Test M1 Foundation

Thư mục này chứa các script để test đầy đủ chức năng M1 Foundation.

## 📋 Yêu cầu

- Backend server phải đang chạy tại `http://localhost:3000`
- Database đã được seed với dữ liệu demo
- PowerShell 5.1+ (Windows) hoặc Bash (Linux/Mac)

## 🚀 Cách sử dụng nhanh

### Chạy tất cả tests (Khuyến nghị)

**Windows PowerShell:**
```powershell
cd "C:\Users\Intel\Downloads\Nhacho4\Script Test"
.\run-all-tests.ps1
```

**Windows CMD:**
```cmd
cd "C:\Users\Intel\Downloads\Nhacho4\Script Test"
run-all-tests.bat
```

### Chạy từng test suite

**Basic Tests (Auth + Config + RBAC):**
```powershell
# PowerShell
.\test-m1.ps1

# CMD
test-m1.bat

# Linux/Mac
chmod +x test-m1.sh
./test-m1.sh
```

**Advanced Tests (Multi-tenant + Performance):**
```powershell
.\test-advanced.ps1
```

## 📊 Test Suites

### 1. Basic Tests (`test-m1.ps1` / `test-m1.bat` / `test-m1.sh`)

**Auth Flow (8 tests):**
- ✅ Login với landlord@example.com
- ✅ Login với admin@example.com
- ✅ Login với tenant@example.com
- ✅ Login thất bại với mật khẩu sai (401)
- ✅ Get profile với token hợp lệ
- ✅ Get profile không có token (401)
- ✅ Refresh access token
- ✅ Logout

**Config Bundle Flow (8 tests):**
- ✅ List config bundles với Landlord
- ✅ Create config bundle với Admin
- ✅ Create config bundle với Tenant (phải fail - 403)
- ✅ Get config bundle detail
- ✅ Activate config bundle
- ✅ Create bundle thứ 2
- ✅ Activate bundle thứ 2
- ✅ Rollback về bundle đầu tiên

**RBAC & Security (3 tests):**
- ✅ Landlord có quyền list config bundles
- ✅ Landlord không được tạo config bundle (403)
- ✅ Token không hợp lệ trả về 401

**Validation (2 tests):**
- ✅ Login với email thiếu (400)
- ✅ Create bundle với bundle_id thiếu (400)

**Tổng: ~21 tests**

### 2. Advanced Tests (`test-advanced.ps1`)

**Multi-tenant Isolation (3 tests):**
- ✅ Landlord và Tenant thuộc các org khác nhau
- ✅ Tạo bundle trong Landlord org
- ✅ Tenant không thấy bundle của Landlord

**Request ID Tracking (1 test):**
- ✅ Request ID được trả về trong response headers

**Error Handling (2 tests):**
- ✅ Error response có cấu trúc đúng (error_code, message)
- ✅ 404 cho resource không tồn tại

**Token Lifecycle (2 tests):**
- ✅ Refresh token nhiều lần
- ✅ Logout vô hiệu hóa refresh token

**Performance (1 test):**
- ✅ Thời gian login < 1 giây

**Tổng: ~9 tests**

## 📈 Kết quả mong đợi

```
╔═══════════════════════════════════════════════════════════╗
║                    KẾT QUẢ TEST                           ║
╠═══════════════════════════════════════════════════════════╣
║  Tổng số tests:    30                                     ║
║  ✅ Passed:         30                                     ║
║  ❌ Failed:         0                                      ║
╚═══════════════════════════════════════════════════════════╝

🎉 TẤT CẢ TESTS ĐỀU PASS! M1 Foundation hoạt động hoàn hảo!
```

## 🔍 Chi tiết các test cases

### Auth Flow
| Test | Mô tả | Expected |
|------|-------|----------|
| Login Landlord | Đăng nhập với landlord@example.com | 200, access_token |
| Login Admin | Đăng nhập với admin@example.com | 200, access_token |
| Login Tenant | Đăng nhập với tenant@example.com | 200, access_token |
| Login Invalid | Đăng nhập với mật khẩu sai | 401, error_code |
| Get Profile | Lấy thông tin user với token | 200, email, role |
| Get Profile No Token | Lấy thông tin không có token | 401 |
| Refresh Token | Làm mới access token | 200, new access_token |
| Logout | Đăng xuất | 200, message |

### Config Bundle Flow
| Test | Mô tả | Expected |
|------|-------|----------|
| List Bundles | List tất cả bundles | 200, array |
| Create Bundle (Admin) | Tạo bundle với Admin | 200, id |
| Create Bundle (Tenant) | Tạo bundle với Tenant | 403 |
| Get Bundle | Lấy chi tiết bundle | 200, bundle data |
| Activate Bundle | Kích hoạt bundle | 200, status: ACTIVE |
| Rollback Bundle | Khôi phục bundle cũ | 200, status: ACTIVE |

### RBAC & Security
| Test | Mô tả | Expected |
|------|-------|----------|
| Landlord List | Landlord list bundles | 200 |
| Landlord Create | Landlord tạo bundle | 403 |
| Invalid Token | Request với token sai | 401 |

### Multi-tenant Isolation
| Test | Mô tả | Expected |
|------|-------|----------|
| Different Orgs | Landlord ≠ Tenant org | org_id khác nhau |
| Create in Org | Tạo bundle trong org | 200 |
| Cross-tenant Access | Tenant xem bundle của Landlord | Không thấy |

## 🐛 Troubleshooting

### Backend không chạy
```
❌ Backend server không chạy!
```
**Giải pháp:**
```bash
cd C:\Users\Intel\Downloads\Nhacho4
pnpm -C apps/backend dev
```

### Database chưa seed
```
❌ Login thất bại với Landlord
```
**Giải pháp:**
```bash
pnpm -C apps/backend seed
```

### Port 3000 đã được sử dụng
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Giải pháp:**
```bash
# Tìm process đang dùng port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

## 📝 Ghi chú

- Scripts sử dụng `curl` (Windows 10+) hoặc `Invoke-RestMethod` (PowerShell)
- Tất cả tests đều độc lập, có thể chạy riêng lẻ
- Tests không làm thay đổi dữ liệu quan trọng (chỉ tạo test bundles)
- Có thể chạy nhiều lần mà không cần reset database

## 🎯 Checklist M1 Foundation

Sau khi chạy tests thành công, verify:

- [x] Auth APIs hoạt động (login/refresh/logout/me)
- [x] Config Engine hoạt động (CRUD + activate + rollback)
- [x] RBAC deny-by-default được enforce
- [x] Multi-tenant isolation hoạt động
- [x] Request ID tracking
- [x] Error handling chuẩn
- [x] Token lifecycle đúng
- [x] Performance < 1s cho login

✅ **M1 Foundation READY FOR M2!**
