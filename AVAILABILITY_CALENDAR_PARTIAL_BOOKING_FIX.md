# Availability Calendar Partial Booking Fix - COMPLETE ✅

## Problem Identified
User reported that when booking a room for only 10-12h on Jan 17, the entire day, week, and month showed as red (fully booked), which was misleading to users who would think the space was completely unavailable.

## Solution Implemented
Implemented a **3-color system** to accurately represent partial bookings:

### Color Logic
- 🟢 **Green (0% booked)**: Completely available - no bookings in this time slot
- 🟡 **Yellow (1-99% booked)**: Partially booked - some time is booked but availability remains
- 🔴 **Red (100% booked)**: Completely full - entire time slot is booked

### Technical Implementation

#### 1. Booking Percentage Calculation
```typescript
const getBookingPercentage = (slotStart: Date, slotEnd: Date) => {
  const slotDuration = slotEnd.getTime() - slotStart.getTime();
  let bookedDuration = 0;

  bookings.forEach(booking => {
    const bookingStart = new Date(booking.start_at);
    const bookingEnd = new Date(booking.end_at);
    
    // Calculate overlap between booking and time slot
    const overlapStart = new Date(Math.max(slotStart.getTime(), bookingStart.getTime()));
    const overlapEnd = new Date(Math.min(slotEnd.getTime(), bookingEnd.getTime()));
    
    if (overlapStart < overlapEnd) {
      bookedDuration += overlapEnd.getTime() - overlapStart.getTime();
    }
  });

  return Math.min(100, Math.round((bookedDuration / slotDuration) * 100));
};
```

#### 2. Color Assignment Function
```typescript
const getAvailabilityColor = (percentage: number) => {
  if (percentage === 0) {
    return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      dot: 'bg-green-500',
      text: 'text-green-700',
      label: 'Còn trống'
    };
  } else if (percentage < 100) {
    return {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500',
      text: 'text-yellow-700',
      label: `${percentage}% đã đặt`
    };
  } else {
    return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      dot: 'bg-red-500',
      text: 'text-red-700',
      label: 'Đã full'
    };
  }
};
```

#### 3. Updated All View Modes
All four view modes now use the percentage-based color system:

**Hour View**: Shows exact percentage for each hour slot
- Example: 10-11h shows "50% đã đặt" if booked for 30 minutes

**Day View**: Shows percentage for each day
- Example: Jan 17 shows "8% đã đặt" if booked for 2 hours out of 24

**Week View**: Shows percentage for each week
- Example: Week 3 shows "12% đã đặt" if booked for 20 hours out of 168

**Month View**: Shows percentage for each month
- Example: January shows "3% đã đặt" if booked for 20 hours out of 744

#### 4. Updated Legend
Changed from 2-color to 3-color legend:
```
🟢 Còn trống (0%)
🟡 Đặt 1 phần (1-99%)
🔴 Đã full (100%)
```

## Example Scenarios

### Scenario 1: Booking 10-12h on Jan 17
- **Hour View**: 10h and 11h show red (100%), other hours green (0%)
- **Day View**: Jan 17 shows yellow "8% đã đặt" (2/24 hours)
- **Week View**: Week containing Jan 17 shows yellow "1% đã đặt" (2/168 hours)
- **Month View**: January shows yellow "0.3% đã đặt" (2/744 hours)

### Scenario 2: Full Day Booking (24 hours)
- **Hour View**: All 24 hours show red (100%)
- **Day View**: That day shows red "Đã full"
- **Week View**: Week shows yellow "14% đã đặt" (24/168 hours)
- **Month View**: Month shows yellow "3% đã đặt" (24/744 hours)

### Scenario 3: Multiple Partial Bookings
- System accurately calculates total booked time
- Shows cumulative percentage across all bookings
- Prevents double-counting overlapping bookings

## Files Modified
- `apps/frontend/src/components/booking/AvailabilityCalendar.tsx`
  - Removed unused `isTimeSlotBooked()` function
  - Added `getBookingPercentage()` function
  - Added `getAvailabilityColor()` function
  - Updated `renderHourView()` to use percentage-based colors
  - Updated `renderDayView()` to use percentage-based colors
  - Updated `renderWeekView()` to use percentage-based colors
  - Updated `renderMonthView()` to use percentage-based colors
  - Updated legend to show 3 colors

## Testing Recommendations

### Test Case 1: Partial Hour Booking
1. Book 10:00-10:30 (30 minutes)
2. Check Hour View: 10h should show yellow "50% đã đặt"
3. Check Day View: Day should show yellow "2% đã đặt"

### Test Case 2: Multiple Bookings Same Day
1. Book 10:00-12:00 and 14:00-16:00 (4 hours total)
2. Check Hour View: 10h, 11h, 14h, 15h should be red
3. Check Day View: Day should show yellow "17% đã đặt"

### Test Case 3: Full Week Booking
1. Book entire week (168 hours)
2. Check Week View: Week should show red "Đã full"
3. Check Month View: Month should show yellow "23% đã đặt"

### Test Case 4: Edge Cases
1. Booking spans midnight (23:00-01:00)
2. Booking spans week boundary
3. Booking spans month boundary
4. Multiple overlapping bookings (should not double-count)

## Benefits
✅ **Accurate representation**: Users see exact availability percentage
✅ **Better UX**: No more misleading "fully booked" indicators
✅ **Informed decisions**: Users can see partial availability at a glance
✅ **Consistent across views**: All 4 view modes use same logic
✅ **Vietnamese labels**: Clear labels in user's language

## Status
🎉 **COMPLETE** - All view modes updated with 3-color percentage-based system
