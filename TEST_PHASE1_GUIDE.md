# 🧪 Hướng dẫn Test Phase 1: Backend APIs

## Chuẩn bị

### 1. Start Backend
```bash
cd apps/backend
npm run dev
```

Đợi cho đến khi thấy:
```
[Nest] ... LOG [NestApplication] Nest application successfully started
```

### 2. Get Test Data từ Database

Chạy file `get-test-data.sql` trong database client (pgAdmin, DBeaver, etc.)

Kết quả sẽ cho bạn:
- `rentable_item_id`: ID của một homestay/hotel
- `listing_id`: ID của listing tương ứng
- `user_id`: ID của tenant user

### 3. Login để lấy Access Token

**Option 1: Dùng existing user**
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "tenant@example.com",
  "password": "password123"
}
```

**Option 2: Tạo user mới**
```bash
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "email": "test-tenant@example.com",
  "password": "Test123456",
  "role": "Tenant"
}
```

Lưu lại `access_token` từ response.

## Test APIs

### Test 1: Check Availability ✅

**Endpoint**: `POST /api/v1/bookings/check-availability`

**Request** (No auth needed):
```json
{
  "rentable_item_id": "PASTE_YOUR_RENTABLE_ITEM_ID",
  "start_date": "2024-02-01T14:00:00Z",
  "end_date": "2024-02-04T12:00:00Z",
  "quantity": 1
}
```

**Expected Response** (Available):
```json
{
  "available": true,
  "message": "Còn trống"
}
```

**Expected Response** (Not Available):
```json
{
  "available": false,
  "message": "Đã có người đặt trong khoảng thời gian này",
  "conflicting_bookings": [
    {
      "id": "...",
      "start_date": "2024-02-02T14:00:00Z",
      "end_date": "2024-02-05T12:00:00Z",
      "status": "CONFIRMED"
    }
  ],
  "suggested_dates": [
    {
      "start_date": "2024-02-06T14:00:00Z",
      "end_date": "2024-02-09T12:00:00Z"
    }
  ]
}
```

**Test Cases**:
- [ ] Available dates → `available: true`
- [ ] Conflicting dates → `available: false` + suggestions
- [ ] Invalid rentable_item_id → 404 error
- [ ] Past dates → Should still check (no validation yet)

---

### Test 2: Calculate Price ✅

**Endpoint**: `POST /api/v1/bookings/calculate-price`

**Request** (No auth needed):
```json
{
  "rentable_item_id": "PASTE_YOUR_RENTABLE_ITEM_ID",
  "start_date": "2024-02-01T14:00:00Z",
  "end_date": "2024-02-04T12:00:00Z",
  "guests": {
    "adults": 2,
    "children": 1
  }
}
```

**Expected Response**:
```json
{
  "base_price": 3500000,
  "nights": 3,
  "subtotal": 10500000,
  "fees": {
    "cleaning_fee": 200000,
    "extra_guest_fee": 300000,
    "service_fee": 1050000
  },
  "discounts": {},
  "booking_hold_deposit": 1000000,
  "total": 12050000,
  "breakdown": [
    {
      "label": "Giá cơ bản (3.500.000 ₫ x 3 đêm)",
      "amount": 10500000
    },
    {
      "label": "Phí dọn dẹp",
      "amount": 200000
    },
    {
      "label": "Phụ thu thêm người (1 người x 3 đêm)",
      "amount": 300000
    },
    {
      "label": "Phí dịch vụ (10%)",
      "amount": 1050000
    }
  ]
}
```

**Test Cases**:
- [ ] Base price calculated correctly (nights * base_price)
- [ ] Cleaning fee added (if exists in metadata)
- [ ] Extra guest fee calculated (if guests > base occupancy)
- [ ] Weekend surcharge added (if period includes Sat/Sun)
- [ ] Service fee = 10% of subtotal
- [ ] Long stay discount (7+ nights = 10% off)
- [ ] Breakdown array has all items

---

### Test 3: Create Enhanced Booking ✅

**Endpoint**: `POST /api/v1/bookings/create-enhanced`

**Request** (Requires auth):
```json
{
  "rentable_item_id": "PASTE_YOUR_RENTABLE_ITEM_ID",
  "listing_id": "PASTE_YOUR_LISTING_ID",
  "start_date": "2024-02-01T14:00:00Z",
  "end_date": "2024-02-04T12:00:00Z",
  "guests": {
    "adults": 2,
    "children": 1
  },
  "contact": {
    "full_name": "Nguyễn Văn A",
    "phone": "0912345678",
    "email": "test@example.com",
    "special_requests": "Nhận phòng muộn"
  },
  "pricing": {
    "total": 12050000,
    "breakdown": {
      "base_price": 10500000,
      "cleaning_fee": 200000,
      "extra_guest_fee": 300000,
      "service_fee": 1050000
    }
  },
  "policies_accepted": true
}
```

**Headers**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Expected Response** (Instant Booking):
```json
{
  "id": "uuid",
  "booking_code": "BK12345678",
  "org_id": "uuid",
  "rentable_item_id": "uuid",
  "tenant_party_id": "uuid",
  "start_at": "2024-02-01T14:00:00.000Z",
  "end_at": "2024-02-04T12:00:00.000Z",
  "quantity": 1,
  "status": "CONFIRMED",
  "metadata": {
    "listing_id": "uuid",
    "guests": { "adults": 2, "children": 1 },
    "contact": { ... },
    "pricing": { ... },
    "auto_confirmed": true,
    "policies_accepted": true,
    "policies_accepted_at": "2024-01-16T..."
  },
  "created_at": "2024-01-16T...",
  "updated_at": "2024-01-16T..."
}
```

**Expected Response** (Normal Booking):
```json
{
  ...
  "status": "PENDING",
  "metadata": {
    ...
    "auto_confirmed": false
  }
}
```

**Test Cases**:
- [ ] Instant booking → status = CONFIRMED
- [ ] Normal booking → status = PENDING
- [ ] Without auth → 401 Unauthorized
- [ ] policies_accepted = false → 400 error
- [ ] Invalid phone format → 400 validation error
- [ ] Exceeds max_occupancy → 400 error
- [ ] Dates not available → 409 conflict
- [ ] Metadata stored correctly
- [ ] Booking code generated (BK + first 8 chars of ID)

---

## Using PowerShell Script

### 1. Update test-booking-apis.ps1

Replace these values:
```powershell
$token = "YOUR_ACCESS_TOKEN_HERE"  # From login
$rentableItemId = "YOUR_RENTABLE_ITEM_ID"  # From SQL
$listingId = "YOUR_LISTING_ID"  # From SQL
```

### 2. Run Script
```powershell
.\test-booking-apis.ps1
```

### 3. Check Results

Script will test all 3 endpoints and show:
- ✅ Success with response data
- ❌ Error with error message

---

## Using Thunder Client / Postman

### 1. Import Collection

Create a new collection with 3 requests:

**Request 1: Check Availability**
- Method: POST
- URL: `http://localhost:3000/api/v1/bookings/check-availability`
- Body: Raw JSON (see above)

**Request 2: Calculate Price**
- Method: POST
- URL: `http://localhost:3000/api/v1/bookings/calculate-price`
- Body: Raw JSON (see above)

**Request 3: Create Enhanced Booking**
- Method: POST
- URL: `http://localhost:3000/api/v1/bookings/create-enhanced`
- Headers: `Authorization: Bearer {{token}}`
- Body: Raw JSON (see above)

### 2. Set Variables

- `{{baseUrl}}`: `http://localhost:3000/api/v1`
- `{{token}}`: Your access token
- `{{rentableItemId}}`: From SQL
- `{{listingId}}`: From SQL

### 3. Run Tests

Execute each request and verify responses.

---

## Troubleshooting

### Backend not starting
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <PID> /F

# Restart backend
cd apps/backend
npm run dev
```

### Database connection error
```bash
# Check .env file
cat apps/backend/.env

# Verify DATABASE_URL is correct
# Should be: postgresql://user:password@localhost:5432/dbname
```

### 404 Not Found
- Check if backend is running
- Verify URL is correct: `http://localhost:3000/api/v1/bookings/...`
- Check controller routes are registered

### 401 Unauthorized
- Token expired → Login again
- Token invalid → Check Bearer format: `Bearer <token>`
- No token → Add Authorization header

### 400 Bad Request
- Check request body format
- Verify all required fields
- Check validation errors in response

### 409 Conflict
- Dates already booked → Try different dates
- Check existing bookings in database

---

## Success Criteria

Phase 1 is complete when:

- [ ] Backend starts without errors
- [ ] All 3 endpoints respond correctly
- [ ] Check availability works for both available and unavailable dates
- [ ] Calculate price returns correct breakdown
- [ ] Create booking works with instant_booking = true (CONFIRMED)
- [ ] Create booking works with instant_booking = false (PENDING)
- [ ] Validation errors are clear and helpful
- [ ] No TypeScript compilation errors
- [ ] No runtime errors in backend logs

---

## Next Phase

Once all tests pass, we move to:

**Phase 2: Frontend Components**
- Create BookingPage
- Build date/guest selectors
- Connect to APIs
- Add loading states
- Handle errors

