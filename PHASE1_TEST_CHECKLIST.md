# ✅ Phase 1 Test Checklist

## Pre-Test Setup

- [ ] Backend is running (`npm run dev` in apps/backend)
- [ ] Database is accessible
- [ ] Have a short-term rentable item in database (HOMESTAY, HOTEL, etc.)

## Quick Test (Recommended)

```powershell
# 1. Check backend status
.\check-backend-status.ps1

# 2. Run automated test
.\quick-test-booking-apis.ps1
```

## Test Results Expected

### Test 1: Check Availability ✅
**Endpoint**: `POST /api/v1/bookings/check-availability`

**Success Criteria**:
- [ ] Returns 200 OK
- [ ] Response has `available` field (boolean)
- [ ] Response has `message` field
- [ ] If not available, shows `conflicting_bookings`
- [ ] If not available, shows `suggested_dates`

**Example Success Response**:
```json
{
  "available": true,
  "message": "Còn trống"
}
```

---

### Test 2: Calculate Price ✅
**Endpoint**: `POST /api/v1/bookings/calculate-price`

**Success Criteria**:
- [ ] Returns 200 OK
- [ ] Response has `base_price` field
- [ ] Response has `nights` field (calculated correctly)
- [ ] Response has `subtotal` field
- [ ] Response has `fees` object
- [ ] Response has `total` field
- [ ] Response has `breakdown` array
- [ ] Breakdown items have `label` and `amount`

**Example Success Response**:
```json
{
  "base_price": 3500000,
  "nights": 3,
  "subtotal": 10500000,
  "fees": {
    "cleaning_fee": 200000,
    "service_fee": 1050000
  },
  "discounts": {},
  "total": 11750000,
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
      "label": "Phí dịch vụ (10%)",
      "amount": 1050000
    }
  ]
}
```

---

### Test 3: Create Enhanced Booking ✅
**Endpoint**: `POST /api/v1/bookings/create-enhanced`

**Success Criteria**:
- [ ] Returns 201 Created (with valid auth token)
- [ ] Returns 401 Unauthorized (without auth token)
- [ ] Response has `id` field
- [ ] Response has `booking_code` field (format: BK + 8 chars)
- [ ] Response has `status` field (CONFIRMED or PENDING)
- [ ] If instant_booking = true → status = CONFIRMED
- [ ] If instant_booking = false → status = PENDING
- [ ] Response has `metadata` with full details
- [ ] Metadata includes `guests`, `contact`, `pricing`
- [ ] Metadata includes `policies_accepted: true`

**Example Success Response** (Instant Booking):
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
    "guests": { "adults": 2, "children": 1 },
    "contact": { "full_name": "...", "phone": "..." },
    "pricing": { "total": 11750000 },
    "auto_confirmed": true,
    "policies_accepted": true
  },
  "created_at": "2024-01-16T...",
  "updated_at": "2024-01-16T..."
}
```

---

## Error Cases to Test

### Check Availability
- [ ] Invalid rentable_item_id → 404 Not Found
- [ ] Missing required fields → 400 Bad Request

### Calculate Price
- [ ] Invalid rentable_item_id → 404 Not Found
- [ ] Invalid date format → 400 Bad Request
- [ ] Missing guests field → 400 Bad Request

### Create Enhanced Booking
- [ ] No auth token → 401 Unauthorized
- [ ] Invalid token → 401 Unauthorized
- [ ] policies_accepted = false → 400 Bad Request
- [ ] Invalid phone format → 400 Bad Request
- [ ] Exceeds max_occupancy → 400 Bad Request
- [ ] Dates not available → 409 Conflict

---

## Validation Tests

### Phone Number Validation
Test these phone formats:

**Valid** ✅:
- `0912345678` (10 digits starting with 0)
- `+84912345678` (with country code)

**Invalid** ❌:
- `123456789` (too short)
- `09123456789` (too long)
- `1234567890` (doesn't start with 0 or +84)
- `abc1234567` (contains letters)

### Date Validation
- [ ] start_date < end_date
- [ ] Valid ISO 8601 format
- [ ] Timezone handled correctly

### Guest Validation
- [ ] adults >= 1
- [ ] children >= 0
- [ ] Total guests <= max_occupancy

---

## Performance Tests

- [ ] Check Availability responds < 1 second
- [ ] Calculate Price responds < 1 second
- [ ] Create Booking responds < 2 seconds

---

## Database Verification

After creating a booking, verify in database:

```sql
-- Check booking was created
SELECT * FROM booking 
WHERE id = 'YOUR_BOOKING_ID';

-- Check metadata is stored correctly
SELECT metadata FROM booking 
WHERE id = 'YOUR_BOOKING_ID';

-- Check status is correct
SELECT status FROM booking 
WHERE id = 'YOUR_BOOKING_ID';
```

---

## Troubleshooting

### Backend not responding
```powershell
# Check if backend is running
.\check-backend-status.ps1

# Check backend logs
cd apps/backend
npm run dev
# Look for errors in console
```

### 404 Not Found
- Verify endpoint URL: `http://localhost:3000/api/v1/bookings/...`
- Check controller routes are registered
- Restart backend

### 500 Internal Server Error
- Check backend console for error stack trace
- Verify database connection
- Check if rentable_item exists in database

### Validation Errors
- Read error message carefully
- Check request body format
- Verify all required fields are present
- Check data types (string, number, boolean)

---

## Success Criteria Summary

Phase 1 is **COMPLETE** when:

✅ All 3 endpoints respond correctly
✅ Check availability works for both available and unavailable dates
✅ Calculate price returns correct breakdown with all fees
✅ Create booking works with instant_booking = true (CONFIRMED)
✅ Create booking works with instant_booking = false (PENDING)
✅ All validation errors are clear and helpful
✅ No TypeScript compilation errors
✅ No runtime errors in backend logs
✅ Booking data is stored correctly in database

---

## Next Phase

Once all tests pass:

**Phase 2: Frontend Components**
1. Create BookingPage layout
2. Build DateSelector component
3. Build GuestSelector component
4. Build PriceBreakdown component
5. Build ContactForm component
6. Build Policies component
7. Connect to APIs
8. Add loading states
9. Handle errors

---

## Test Log Template

Use this to track your test results:

```
Date: _______________
Tester: _______________

Test 1: Check Availability
  Status: [ ] Pass  [ ] Fail
  Notes: _______________________________

Test 2: Calculate Price
  Status: [ ] Pass  [ ] Fail
  Notes: _______________________________

Test 3: Create Enhanced Booking
  Status: [ ] Pass  [ ] Fail
  Notes: _______________________________

Error Cases Tested:
  [ ] Invalid IDs
  [ ] Missing fields
  [ ] Invalid formats
  [ ] Auth errors

Overall Result: [ ] PASS  [ ] FAIL
```

