# Guest Selector Simplification - COMPLETE ✅

## Yêu cầu
User muốn đơn giản hóa phần chọn số lượng khách - chỉ cần 1 trường nhập tổng số khách thay vì phân biệt người lớn/trẻ em/em bé.

## Thay đổi thực hiện

### 1. BookingGuestSelector Component
**File**: `apps/frontend/src/components/booking/BookingGuestSelector.tsx`

**Trước đây**: 3 trường riêng biệt
- Người lớn (từ 13 tuổi trở lên)
- Trẻ em (từ 2-12 tuổi)
- Em bé (dưới 2 tuổi)

**Bây giờ**: 1 trường duy nhất
- Số khách (tổng số người)

**Props thay đổi**:
```typescript
// Trước
interface BookingGuestSelectorProps {
  adults: number;
  children: number;
  infants: number;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onInfantsChange: (value: number) => void;
  maxOccupancy?: number;
}

// Sau
interface BookingGuestSelectorProps {
  guests: number;
  onGuestsChange: (value: number) => void;
  maxOccupancy?: number;
}
```

**UI cải tiến**:
- Nút +/- lớn hơn (10x10 thay vì 8x8)
- Border dày hơn (border-2)
- Hover effect màu xanh
- Font size lớn hơn cho số khách (text-xl)

### 2. BookingPage Component
**File**: `apps/frontend/src/pages/BookingPage.tsx`

**State thay đổi**:
```typescript
// Trước
const [adults, setAdults] = useState(1);
const [children, setChildren] = useState(0);
const [infants, setInfants] = useState(0);

// Sau
const [guests, setGuests] = useState(1);
```

**API calls cập nhật**:
- `calculatePrice()`: Gửi `guests.adults = guests`, `guests.children = 0`, `guests.infants = 0`
- `handleSubmitBooking()`: Tương tự, chuyển đổi `guests` thành format backend yêu cầu

**Component usage**:
```typescript
// Trước
<BookingGuestSelector
  adults={adults}
  children={children}
  infants={infants}
  onAdultsChange={setAdults}
  onChildrenChange={setChildren}
  onInfantsChange={setInfants}
  maxOccupancy={rentableItem.max_occupancy}
/>

// Sau
<BookingGuestSelector
  guests={guests}
  onGuestsChange={setGuests}
  maxOccupancy={rentableItem.max_occupancy}
/>
```

### 3. BookingSummaryCard Component
**File**: `apps/frontend/src/components/booking/BookingSummaryCard.tsx`

**Props thay đổi**:
```typescript
// Trước
interface BookingSummaryCardProps {
  adults: number;
  children: number;
  infants: number;
  // ...
}

// Sau
interface BookingSummaryCardProps {
  guests: number;
  // ...
}
```

**Display thay đổi**:
```typescript
// Trước
<div className="flex justify-between">
  <span>Tổng số khách:</span>
  <span className="font-medium">{totalGuests} người</span>
</div>
<div className="text-xs text-gray-500 mt-1">
  {adults} người lớn
  {children > 0 && `, ${children} trẻ em`}
  {infants > 0 && `, ${infants} em bé`}
</div>

// Sau
<div className="flex justify-between">
  <span>Số khách:</span>
  <span className="font-medium">{guests} người</span>
</div>
```

## Backend Compatibility
Backend vẫn nhận format cũ với 3 trường (adults, children, infants), nên frontend chuyển đổi:
```typescript
guests: {
  adults: guests,  // Tất cả khách được tính là người lớn
  children: 0,
  infants: 0,
}
```

Điều này đảm bảo tương thích ngược với backend mà không cần thay đổi API.

## UI/UX Improvements

### Trước
- 3 hàng riêng biệt với nút +/- nhỏ
- Phức tạp cho người dùng
- Hiển thị chi tiết breakdown trong summary

### Sau
- 1 hàng duy nhất với nút +/- lớn hơn
- Đơn giản, dễ sử dụng
- Hiển thị tổng số khách rõ ràng
- Hover effect màu xanh đẹp mắt

## Validation
- Minimum: 1 khách (không thể giảm xuống 0)
- Maximum: Kiểm tra với `maxOccupancy` của rentable item
- Hiển thị cảnh báo nếu vượt quá sức chứa

## Testing Checklist
- [ ] Chọn số khách từ 1-10
- [ ] Kiểm tra nút - bị disable khi guests = 1
- [ ] Kiểm tra cảnh báo khi vượt quá maxOccupancy
- [ ] Kiểm tra API calculatePrice hoạt động đúng
- [ ] Kiểm tra API createBooking hoạt động đúng
- [ ] Kiểm tra hiển thị trong BookingSummaryCard
- [ ] Kiểm tra hover effect trên nút +/-

## Files Modified
1. `apps/frontend/src/components/booking/BookingGuestSelector.tsx` - Đơn giản hóa UI
2. `apps/frontend/src/pages/BookingPage.tsx` - Cập nhật state và API calls
3. `apps/frontend/src/components/booking/BookingSummaryCard.tsx` - Cập nhật display

## Status
✅ **COMPLETE** - Guest selector đã được đơn giản hóa thành 1 trường duy nhất
