# 🔧 FIX: 401 Unauthorized Error

## Vấn đề

Khi submit booking, gặp lỗi:
```
POST http://localhost:3000/api/v1/bookings/create-enhanced 401 (Unauthorized)
```

## Nguyên nhân

1. **Chưa login**: User chưa đăng nhập
2. **Token hết hạn**: Access token đã expire
3. **Token không hợp lệ**: Token bị corrupt hoặc sai format

## Giải pháp đã implement

### 1. Check token trước khi gửi request

```typescript
const token = localStorage.getItem('access_token');

if (!token) {
  alert('Vui lòng đăng nhập để đặt phòng');
  navigate('/login');
  return;
}
```

### 2. Handle 401 response

```typescript
if (response.status === 401) {
  alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
  localStorage.removeItem('access_token');
  navigate('/login');
  return;
}
```

## Cách test

### Test 1: Chưa login

1. Logout (hoặc xóa token):
   ```javascript
   // Trong browser console
   localStorage.removeItem('access_token');
   ```

2. Refresh page
3. Điền form booking
4. Click "Đặt phòng"
5. ✅ Verify: Alert "Vui lòng đăng nhập để đặt phòng"
6. ✅ Verify: Redirect to /login

### Test 2: Token hết hạn

1. Login bình thường
2. Đợi token expire (hoặc set token fake):
   ```javascript
   // Trong browser console
   localStorage.setItem('access_token', 'fake_token_123');
   ```

3. Refresh page
4. Điền form booking
5. Click "Đặt phòng"
6. ✅ Verify: Alert "Phiên đăng nhập đã hết hạn"
7. ✅ Verify: Token bị xóa
8. ✅ Verify: Redirect to /login

### Test 3: Login hợp lệ

1. Login với tài khoản tenant
2. Navigate to booking page
3. Điền form đầy đủ
4. Click "Đặt phòng"
5. ✅ Verify: Booking created thành công
6. ✅ Verify: Navigate to /my-bookings

## Cách login lại

### Option 1: Login page

1. Go to http://localhost:5173/login
2. Nhập credentials:
   - Email: tenant@example.com
   - Password: password123
3. Click "Đăng nhập"
4. ✅ Token được lưu vào localStorage

### Option 2: API call trực tiếp

```bash
# Postman/Thunder Client
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "tenant@example.com",
  "password": "password123"
}

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

Copy access_token và set vào localStorage:
```javascript
localStorage.setItem('access_token', 'YOUR_TOKEN_HERE');
```

## Debug tips

### Check token trong browser

```javascript
// Browser console
const token = localStorage.getItem('access_token');
console.log('Token:', token);

// Decode JWT (nếu có)
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Payload:', payload);
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

### Check token validity

```bash
# Test với token hiện tại
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/bookings

# Nếu 401 → Token invalid
# Nếu 200 → Token valid
```

### Check backend logs

```bash
# Terminal backend
# Xem logs khi gửi request
# Nếu thấy "Unauthorized" → Token issue
# Nếu thấy "JWT expired" → Token hết hạn
```

## Troubleshooting

### Lỗi: "Vui lòng đăng nhập để đặt phòng"
→ Chưa có token
→ Login lại

### Lỗi: "Phiên đăng nhập đã hết hạn"
→ Token expired
→ Login lại

### Lỗi: Vẫn 401 sau khi login
→ Check token có được set đúng không
→ Check backend có chạy không
→ Check endpoint có đúng không

### Lỗi: Token bị xóa liên tục
→ Check token expiry time
→ Có thể cần tăng JWT_EXPIRES_IN trong backend

## Prevention

### Frontend:

1. **Auto-refresh token** (TODO - enhancement):
   ```typescript
   // Refresh token trước khi expire
   setInterval(() => {
     refreshToken();
   }, 50 * 60 * 1000); // 50 minutes
   ```

2. **Interceptor** (TODO - enhancement):
   ```typescript
   // Axios interceptor để auto-handle 401
   axios.interceptors.response.use(
     response => response,
     error => {
       if (error.response.status === 401) {
         // Auto redirect to login
       }
     }
   );
   ```

### Backend:

1. **Longer token expiry**:
   ```env
   # .env
   JWT_EXPIRES_IN=7d  # Thay vì 1h
   ```

2. **Refresh token mechanism**:
   - Implement refresh token endpoint
   - Frontend auto-refresh khi token gần expire

## Status

✅ **Fixed**: Đã thêm check token và handle 401
✅ **User-friendly**: Alert rõ ràng + auto redirect
✅ **Secure**: Xóa token invalid khỏi localStorage

User sẽ được thông báo rõ ràng và redirect đến login page nếu chưa login hoặc token hết hạn! 🔐
