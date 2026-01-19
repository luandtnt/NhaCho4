# ✅ Fix Calendar Not Showing CHECKED_IN Bookings

## Problem
After creating a walk-in check-in at 16:36, the calendar still shows the time slot as green (available) instead of orange (checked-in/in-use).

## Root Cause
The `getBookingTimeline()` method in `booking.service.ts` only queries bookings with status `['PENDING', 'CONFIRMED']` but **excludes `'CHECKED_IN'`** status.

```typescript
// ❌ BEFORE - Missing CHECKED_IN status
status: {
  in: ['PENDING', 'CONFIRMED'],  // Walk-in bookings have CHECKED_IN status!
},
```

## Solution
Added `'CHECKED_IN'` status to the query filter.

```typescript
// ✅ AFTER - Includes CHECKED_IN status
status: {
  in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
},
```

## Files Modified
- `apps/backend/src/modules/ops/booking/booking.service.ts` (line 502-504)

## How Walk-in Bookings Work

### When Check-in Happens:
```typescript
const booking = await this.prisma.booking.create({
  data: {
    start_at: now,                    // ✅ Set to current time
    end_at: estimatedEndTime,         // ✅ Set to estimated checkout
    actual_start_at: now,             // Actual check-in time
    actual_end_at: null,              // Will be set on checkout
    status: 'CHECKED_IN',             // ⚠️ This status was missing from timeline query!
    is_walk_in: true,
    // ...
  },
});
```

### Timeline Query Logic:
The `getBookingTimeline()` method queries bookings that overlap with the requested date range:
```typescript
where: {
  rentable_item_id: rentableItemId,
  status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },  // ✅ Now includes CHECKED_IN
  OR: [
    {
      AND: [
        { start_at: { lte: new Date(endDate) } },
        { end_at: { gte: new Date(startDate) } },
      ],
    },
  ],
}
```

## Calendar Color Logic

The `AvailabilityCalendar` component already has logic to show CHECKED_IN bookings in orange:

```typescript
const getAvailabilityColor = (percentage: number, booking?: Booking) => {
  // Check if booking is currently checked-in (walk-in customer using room)
  if (booking && booking.status === 'CHECKED_IN') {
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      dot: 'bg-orange-500',
      text: 'text-orange-700',
      label: '🚶 Đang sử dụng',
      isActive: true  // Adds pulse animation
    };
  }
  // ... other color logic
};
```

## Testing

1. **Create a walk-in check-in:**
   - Go to `/availability`
   - Switch to "Check-in Nhanh" tab
   - Select a room
   - Enter guest count and duration
   - Click "Check-in Ngay"

2. **Verify calendar shows the booking:**
   - Switch to "Lịch Trống" tab
   - Select the same room
   - View "Giờ" (Hour) mode
   - ✅ The hour slot should now show **orange** with "🚶 Đang sử dụng" label
   - ✅ The orange dot should have a pulse animation

3. **Verify active bookings tab:**
   - Switch to "Đang Sử Dụng" tab
   - ✅ Should see the booking card with orange border

## Status Colors Reference

- 🟢 **Green (Còn trống)**: 0% booked - Available
- 🟡 **Yellow (Đặt 1 phần)**: 1-99% booked - Partially booked
- 🟠 **Orange (Đang sử dụng)**: CHECKED_IN status - Walk-in customer currently using room (with pulse animation)
- 🔴 **Red (Đã full)**: 100% booked - Fully booked

## Impact

### Before Fix:
- Walk-in bookings invisible on calendar ❌
- Landlord might double-book the room ❌
- Calendar shows green (available) even when room is occupied ❌

### After Fix:
- Walk-in bookings visible on calendar ✅
- Orange color with pulse animation indicates active use ✅
- Prevents double-booking ✅
- Real-time status visibility ✅

## Related Booking Statuses

The system uses these booking statuses:
- **PENDING**: Booking created, awaiting confirmation
- **CONFIRMED**: Booking confirmed by landlord
- **CHECKED_IN**: Walk-in customer currently using the room (active)
- **CHECKED_OUT**: Walk-in customer has checked out (completed)
- **CANCELLED**: Booking cancelled
- **COMPLETED**: Regular booking completed

## Status: ✅ FIXED

Backend will automatically reload. Refresh the calendar page and walk-in bookings will now appear correctly with orange color and pulse animation.
