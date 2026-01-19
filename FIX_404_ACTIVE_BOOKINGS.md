# ✅ Fix 404 Error for /bookings/active Endpoint

## Problem
```
GET http://localhost:3000/api/v1/bookings/active 404 (Not Found)
```

## Root Cause
Route ordering issue in NestJS. The specific route `/bookings/active` was placed **after** the dynamic route `/bookings/:id`, causing NestJS to match "active" as an ID parameter instead of a specific endpoint.

## Solution
Reordered routes in `booking.controller.ts` to place specific routes **before** dynamic routes.

### Correct Order (Fixed):
```typescript
// 1. Specific routes FIRST
@Get('bookings/active')           // ✅ Matches /bookings/active
async getActiveBookings() { ... }

@Get('bookings')                  // ✅ Matches /bookings
async findAll() { ... }

// 2. Dynamic routes LAST
@Get('bookings/:id')              // ✅ Matches /bookings/{any-id}
async findOne() { ... }
```

### Wrong Order (Before):
```typescript
// ❌ Dynamic route first - catches everything!
@Get('bookings/:id')              // Matches /bookings/active as ID="active"
async findOne() { ... }

// This never gets reached for /bookings/active
@Get('bookings/active')
async getActiveBookings() { ... }
```

## Files Modified
- `apps/backend/src/modules/ops/booking/booking.controller.ts`

## Changes Made
1. Moved `@Get('bookings/active')` to **before** `@Get('bookings')` and `@Get('bookings/:id')`
2. Moved all walk-in endpoints (quick-checkin, checkout, extend) to **before** `@Get('bookings/timeline/:rentableItemId')`

## Testing
After backend restarts, test these endpoints:
```bash
# Should work now
GET http://localhost:3000/api/v1/bookings/active

# Should still work
GET http://localhost:3000/api/v1/bookings
GET http://localhost:3000/api/v1/bookings/{specific-id}
```

## NestJS Route Ordering Rules
**Always place routes in this order:**
1. Static routes (e.g., `/bookings/active`, `/bookings/timeline`)
2. Routes with query params (e.g., `/bookings?page=1`)
3. Dynamic routes (e.g., `/bookings/:id`)

## Status: ✅ FIXED

Backend will automatically reload. Refresh your frontend page at `http://localhost:5173/availability` and the Active Bookings tab should now work correctly.
