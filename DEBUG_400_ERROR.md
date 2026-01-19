# 🔍 DEBUG: 400 Bad Request Error

## Vấn đề

```
POST http://localhost:3000/api/v1/bookings/create-enhanced 400 (Bad Request)
```

## Cách debug

### 1. Check Browser Console

Mở DevTools (F12) → Console tab

Tìm log:
```javascript
Booking request: { ... }
Booking error: { ... }
```

### 2. Check Backend Terminal

Xem logs trong terminal backend để thấy validation errors:

```
[Nest] ERROR [ExceptionsHandler] Validation failed
[Nest] ERROR - property X should not exist
[Nest] ERROR - property Y must be a string
```

### 3. Common Issues

#### Issue 1: Missing required fields

**Error:**
```json
{
  "message": ["guests.adults must be a number"],
  "error": "Bad Request"
}
```

**Fix:** Đảm bảo tất cả required fields có giá trị

#### Issue 2: Wrong data type

**Error:**
```json
{
  "message": ["pricing.total must be a number"],
  "error": "Bad Request"
}
```

**Fix:** Check data types match DTO

#### Issue 3: Invalid phone format

**Error:**
```json
{
  "message": ["Số điện thoại không đúng định dạng Việt Nam"],
  "error": "Bad Request"
}
```

**Fix:** Phone phải match regex: `^(0[0-9]{9}|\+84[0-9]{9})$`

#### Issue 4: Invalid email format

**Error:**
```json
{
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

**Fix:** Email phải đúng format hoặc để undefined

#### Issue 5: Invalid date format

**Error:**
```json
{
  "message": ["start_date must be a valid ISO 8601 date string"],
  "error": "Bad Request"
}
```

**Fix:** Dates phải là ISO string: `2024-02-01T14:00:00Z`

## Expected Request Format

```json
{
  "rentable_item_id": "uuid-string",
  "listing_id": "uuid-string",
  "start_date": "2024-02-01T14:00:00.000Z",
  "end_date": "2024-02-04T12:00:00.000Z",
  "guests": {
    "adults": 2,
    "children": 1,
    "infants": 0
  },
  "contact": {
    "full_name": "Nguyen Van A",
    "phone": "0912345678",
    "email": "test@example.com",
    "special_requests": "Late check-in"
  },
  "pricing": {
    "total": 10000000,
    "breakdown": {}
  },
  "policies_accepted": true
}
```

## Validation Rules

### guests (GuestInfoDto)
- `adults`: number, min 1, required
- `children`: number, min 0, optional
- `infants`: number, min 0, optional

### contact (ContactInfoDto)
- `full_name`: string, required
- `phone`: string, required, must match VN format
- `email`: string, optional, must be valid email
- `special_requests`: string, optional

### pricing (PricingInfoDto)
- `total`: number, optional
- `breakdown`: object, optional

### Other fields
- `rentable_item_id`: string, required
- `listing_id`: string, optional
- `start_date`: ISO date string, required
- `end_date`: ISO date string, required
- `policies_accepted`: boolean, required

## Test với curl

```bash
curl -X POST http://localhost:3000/api/v1/bookings/create-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rentable_item_id": "your-id",
    "start_date": "2024-02-01T14:00:00Z",
    "end_date": "2024-02-04T12:00:00Z",
    "guests": {
      "adults": 2,
      "children": 0,
      "infants": 0
    },
    "contact": {
      "full_name": "Test User",
      "phone": "0912345678"
    },
    "pricing": {
      "total": 1000000
    },
    "policies_accepted": true
  }'
```

## Fix Applied

### Backend DTO Update

Changed `PricingInfoDto` to make fields optional:

```typescript
export class PricingInfoDto {
  @IsOptional()
  total?: number;

  @IsObject()
  @IsOptional()
  breakdown?: any;
}
```

### Frontend Logging

Added console.log to see request data:

```typescript
console.log('Booking request:', requestBody);
```

Added detailed error logging:

```typescript
console.error('Booking error:', error);
```

## How to Test Now

1. **Refresh browser** (Ctrl+R)
2. **Fill booking form**
3. **Submit**
4. **Check console** for logs:
   - Request data
   - Error details
5. **Check backend terminal** for validation errors
6. **Fix issues** based on error messages

## Common Fixes

### Fix 1: Phone validation
```typescript
// Make sure phone is string, not number
phone: "0912345678"  // ✅ Good
phone: 912345678     // ❌ Bad
```

### Fix 2: Email optional
```typescript
// If no email, send undefined or omit
email: email || undefined  // ✅ Good
email: ""                  // ❌ Bad (empty string fails validation)
```

### Fix 3: Dates ISO format
```typescript
// Use .toISOString()
start_date: startDate.toISOString()  // ✅ Good
start_date: startDate.toString()     // ❌ Bad
```

### Fix 4: Pricing optional
```typescript
// Can send empty object or omit
pricing: {
  total: priceData?.total || 0,
  breakdown: priceData?.breakdown || {}
}
```

## Status

✅ **Fixed**: PricingInfoDto fields now optional
✅ **Added**: Console logging for debugging
✅ **Added**: Detailed error messages

Try again và check console/backend logs để thấy error cụ thể! 🔍
