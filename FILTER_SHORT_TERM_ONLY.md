# ✅ Filter Short-Term Rentals Only for Booking System

## Change Summary
Updated the Unified Availability Page to only show SHORT_TERM rental properties in the booking system, as walk-in bookings and hourly/daily rentals are only applicable to short-term properties.

## What Was Changed

### File Modified
- `apps/frontend/src/pages/UnifiedAvailabilityPage.tsx`

### API Call Update
**Before:**
```typescript
const response = await fetch('http://localhost:3000/api/v1/rentable-items?page=1&page_size=100', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

**After:**
```typescript
const response = await fetch('http://localhost:3000/api/v1/rentable-items?page=1&page_size=100&rental_duration_type=SHORT_TERM', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

## Impact

### Affected Tabs in `/availability` Page:

1. **Lịch Trống (Calendar Tab)**
   - Room selector dropdown now only shows SHORT_TERM properties
   - ✅ Correct: Only hourly/daily rental rooms

2. **Check-in Nhanh (Quick Check-in Tab)**
   - Room selector dropdown now only shows SHORT_TERM properties
   - ✅ Correct: Walk-in bookings only make sense for short-term rentals

3. **Đang Sử Dụng (Active Bookings Tab)**
   - Shows active bookings (filtered by backend based on actual bookings)
   - ✅ Correct: Only short-term bookings will be active

4. **Tất Cả Bookings (All Bookings Tab)**
   - Shows all bookings (not filtered by rental type)
   - ✅ Correct: Shows all booking history regardless of property type

## Rental Duration Types

The system supports 3 types:
- **SHORT_TERM**: Hourly, daily, weekly rentals (e.g., hotel rooms, homestays)
- **MEDIUM_TERM**: Monthly rentals (e.g., serviced apartments)
- **LONG_TERM**: Yearly rentals (e.g., residential apartments, offices)

## Backend Support

The backend already supports this filter via `QueryRentableItemDto`:
```typescript
@ApiProperty({ 
  required: false, 
  description: 'Filter by rental duration type', 
  enum: ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'] 
})
@IsOptional()
@IsEnum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'])
rental_duration_type?: string;
```

## Testing

1. Go to `http://localhost:5173/availability`
2. Switch to "Lịch Trống" tab
3. Open room selector dropdown
4. ✅ Should only see SHORT_TERM properties (hourly/daily rentals)
5. Switch to "Check-in Nhanh" tab
6. Open room selector dropdown
7. ✅ Should only see SHORT_TERM properties

## Why This Makes Sense

**Walk-in bookings and hourly rentals are only applicable to SHORT_TERM properties:**
- ✅ Hotel rooms, homestays, hostels → SHORT_TERM
- ❌ Monthly apartments → MEDIUM_TERM (not suitable for walk-in)
- ❌ Yearly offices, houses → LONG_TERM (not suitable for walk-in)

**Business Logic:**
- Short-term properties: Flexible check-in/check-out, hourly pricing
- Medium/Long-term properties: Fixed lease periods, monthly/yearly contracts

## Status: ✅ COMPLETE

The booking system now correctly filters to show only SHORT_TERM rental properties, making the walk-in booking and availability calendar features relevant and useful.
