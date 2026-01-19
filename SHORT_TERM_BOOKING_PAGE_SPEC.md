# 📋 Spec: Trang Đặt Phòng Chuyên Nghiệp (Short-Term Rentals)

## 🎯 Mục tiêu

Tạo trang đặt phòng chuyên nghiệp cho các loại hình cho thuê ngắn hạn (Homestay, Hotel, Guesthouse, v.v.) với đầy đủ tính năng như Airbnb/Booking.com

## 📍 Route

```
/booking/:listingId/:rentableItemId
```

## 🏗️ Kiến trúc

### Frontend
- **Page**: `apps/frontend/src/pages/BookingPage.tsx`
- **Components**:
  - `BookingDateSelector.tsx` - Chọn ngày/giờ
  - `BookingGuestSelector.tsx` - Chọn số khách
  - `BookingPriceBreakdown.tsx` - Bảng giá chi tiết
  - `BookingContactForm.tsx` - Form thông tin
  - `BookingPolicies.tsx` - Chính sách & nội quy
  - `BookingSummaryCard.tsx` - Card tóm tắt sticky

### Backend
- **Endpoint mới**: `POST /api/v1/bookings/check-availability`
- **Endpoint mới**: `POST /api/v1/bookings/calculate-price`
- **Endpoint hiện có**: `POST /api/v1/bookings` (cần enhance)

## 📋 Chi tiết tính năng

### P0 - Must Have (Làm ngay)

#### 1. Chọn thời gian đặt phòng ✅

**Homestay/Hotel (theo đêm)**
```tsx
interface DateSelection {
  checkIn: Date;
  checkOut: Date;
  nights: number;
  checkinTime: string;  // From rentable_item
  checkoutTime: string; // From rentable_item
}
```

**Validation**:
- ❌ Không chọn ngày quá khứ
- ❌ Check-out phải > Check-in
- ❌ Tối thiểu >= `min_rent_duration` đêm
- ✅ Tự động tính số đêm

**Nhà nghỉ (theo giờ + theo đêm)**
```tsx
interface HourlyBooking {
  mode: 'HOURLY' | 'OVERNIGHT';
  date: Date;
  startTime?: string;  // For hourly
  endTime?: string;    // For hourly
  hours?: number;      // Auto calculate
}
```

**Validation**:
- ❌ End time > Start time
- ❌ Tối thiểu >= X giờ (từ metadata)

#### 2. Chọn số lượng khách ✅

```tsx
interface GuestSelection {
  adults: number;
  children?: number;
  infants?: number;
}
```

**Validation**:
- ❌ Total guests <= `max_occupancy`
- ⚠️ Nếu vượt base occupancy → hiện cảnh báo phụ thu
- 💰 Tự động tính `extra_guest_fee`

#### 3. Kiểm tra tình trạng trống ✅

**API Call**:
```typescript
POST /api/v1/bookings/check-availability
{
  rentable_item_id: string;
  start_date: string;
  end_date: string;
}

Response:
{
  available: boolean;
  conflicting_bookings?: Booking[];
  suggested_dates?: Date[];
}
```

**UI**:
- ✅ Còn trống → Cho phép tiếp tục
- ❌ Hết chỗ → Hiện message + gợi ý ngày khác
- 🔄 Loading state khi check

#### 4. Tính giá tự động ✅

**API Call**:
```typescript
POST /api/v1/bookings/calculate-price
{
  rentable_item_id: string;
  start_date: string;
  end_date: string;
  guests: {
    adults: number;
    children?: number;
  }
}

Response:
{
  base_price: number;
  nights: number;
  subtotal: number;
  cleaning_fee?: number;
  extra_guest_fee?: number;
  weekend_surcharge?: number;
  service_fee?: number;
  booking_hold_deposit?: number;
  total: number;
  breakdown: PriceItem[];
}
```

**Price Breakdown UI**:
```
┌─────────────────────────────────┐
│ Chi tiết giá                    │
├─────────────────────────────────┤
│ 3.500.000 ₫ x 3 đêm             │
│ = 10.500.000 ₫                  │
│                                 │
│ Phí dọn dẹp: 200.000 ₫          │
│ Phụ thu thêm người: 300.000 ₫  │
│ Phụ thu cuối tuần: 500.000 ₫   │
│ Phí dịch vụ (10%): 1.150.000 ₫ │
├─────────────────────────────────┤
│ Tổng cộng: 12.650.000 ₫         │
│                                 │
│ 💰 Phí giữ chỗ: 1.000.000 ₫    │
│ (Sẽ trừ vào tổng tiền)          │
└─────────────────────────────────┘
```

#### 5. Nhập thông tin người đặt ✅

```tsx
interface ContactInfo {
  full_name: string;      // Required
  phone: string;          // Required, validate VN format
  email?: string;         // Optional
  special_requests?: string; // Optional
}
```

**Validation**:
- ❌ Tên không để trống
- ❌ SĐT đúng format: `0[0-9]{9}` hoặc `+84[0-9]{9}`
- ✅ Email format (nếu có)

#### 6. Hiển thị chính sách & nội quy ✅

**Từ rentable_item.metadata**:
```tsx
interface Policies {
  house_rules_text?: string;
  allow_smoking: boolean;
  allow_pets: boolean;
  allow_guests_overnight: boolean;
  quiet_hours?: string;
  cancellation_policy: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  cancellation_fee_percent?: number;
}
```

**UI**:
```
┌─────────────────────────────────┐
│ 📋 Nội quy nhà                  │
├─────────────────────────────────┤
│ ✅ Không hút thuốc              │
│ ❌ Không cho phép thú cưng      │
│ ✅ Cho phép khách qua đêm       │
│ 🕐 Giờ yên tĩnh: 22:00 - 06:00 │
│                                 │
│ 📜 Chính sách hủy: Linh hoạt   │
│ - Hủy trước 24h: Hoàn 100%     │
│ - Hủy trong 24h: Phạt 20%      │
└─────────────────────────────────┘

☑️ Tôi đồng ý với nội quy nhà
☑️ Tôi hiểu chính sách hủy
```

**Validation**:
- ❌ Phải check cả 2 checkbox mới cho submit

#### 7. Tạo booking (CTA) ✅

**Logic**:
```typescript
if (instant_booking === true) {
  // Đặt ngay → status = CONFIRMED
  POST /api/v1/bookings {
    status: 'CONFIRMED',
    auto_confirmed: true
  }
} else {
  // Gửi yêu cầu → status = PENDING
  POST /api/v1/bookings {
    status: 'PENDING'
  }
}
```

**Success Flow**:
```
1. Show success message
2. Navigate to /my-bookings
3. Show booking detail
```

**Error Handling**:
- ❌ Hết phòng → "Rất tiếc, phòng đã được đặt"
- ❌ API error → "Có lỗi xảy ra, vui lòng thử lại"
- ❌ Network error → "Kiểm tra kết nối mạng"

#### 8. Trạng thái & xử lý lỗi ✅

**Loading States**:
```tsx
const [loadingStates, setLoadingStates] = useState({
  checkingAvailability: false,
  calculatingPrice: false,
  submitting: false,
});
```

**Error States**:
```tsx
const [errors, setErrors] = useState({
  availability: null,
  price: null,
  submission: null,
});
```

**Prevent Double Submit**:
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);
  try {
    // ... submit logic
  } finally {
    setIsSubmitting(false);
  }
};
```

### P1 - Nice to Have (Nâng cấp sau)

#### 9. Sticky Summary Card ⭕

```
┌─────────────────────────────────┐
│ [Ảnh listing]                   │
│                                 │
│ Căn hộ 2PN view biển            │
│ 📍 Quận 1, TP.HCM               │
│                                 │
│ 📅 20/01 - 23/01 (3 đêm)        │
│ 👥 2 khách                      │
│                                 │
│ 💰 Tổng: 12.650.000 ₫           │
│                                 │
│ [Đặt phòng]                     │
└─────────────────────────────────┘
```

**Sticky behavior**:
- Desktop: Sticky right sidebar
- Mobile: Fixed bottom bar

#### 10. Voucher / Mã giảm giá ⭕

```tsx
interface Voucher {
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_booking_value?: number;
  valid_from: Date;
  valid_to: Date;
}
```

**UI**:
```
┌─────────────────────────────────┐
│ 🎟️ Mã giảm giá                 │
│ [____________] [Áp dụng]        │
│                                 │
│ ✅ Giảm 500.000 ₫               │
└─────────────────────────────────┘
```

#### 11. Chọn phương thức thanh toán ⭕

```tsx
interface PaymentOption {
  method: 'BANK_TRANSFER' | 'E_WALLET' | 'CREDIT_CARD';
  amount_type: 'DEPOSIT' | 'FULL';
}
```

**UI**:
```
┌─────────────────────────────────┐
│ 💳 Thanh toán                   │
├─────────────────────────────────┤
│ ○ Thanh toán giữ chỗ            │
│   (1.000.000 ₫)                 │
│                                 │
│ ○ Thanh toán toàn bộ            │
│   (12.650.000 ₫)                │
│                                 │
│ Phương thức:                    │
│ ○ Chuyển khoản ngân hàng        │
│ ○ Ví điện tử (Momo, ZaloPay)   │
│ ○ Thẻ tín dụng                  │
└─────────────────────────────────┘
```

#### 12. UI lịch đẹp hơn ⭕

**Features**:
- Highlight cuối tuần (màu khác)
- Disable ngày đã full (màu xám)
- Hiển thị giá theo ngày (nếu dynamic pricing)
- Hover tooltip với thông tin

**Library**: `react-day-picker` hoặc `react-calendar`

## 🗂️ File Structure

```
apps/frontend/src/
├── pages/
│   └── BookingPage.tsx                    # Main booking page
├── components/
│   └── booking/
│       ├── BookingDateSelector.tsx        # Date/time picker
│       ├── BookingGuestSelector.tsx       # Guest counter
│       ├── BookingPriceBreakdown.tsx      # Price details
│       ├── BookingContactForm.tsx         # Contact info form
│       ├── BookingPolicies.tsx            # Policies & rules
│       └── BookingSummaryCard.tsx         # Sticky summary
└── utils/
    ├── bookingValidation.ts               # Validation helpers
    └── priceCalculation.ts                # Price calc helpers

apps/backend/src/modules/
└── booking/
    ├── booking.controller.ts              # Add new endpoints
    ├── booking.service.ts                 # Add new methods
    └── dto/
        ├── check-availability.dto.ts      # New DTO
        └── calculate-price.dto.ts         # New DTO
```

## 🔌 API Endpoints

### 1. Check Availability

```typescript
POST /api/v1/bookings/check-availability

Request:
{
  rentable_item_id: string;
  start_date: string; // ISO format
  end_date: string;   // ISO format
}

Response:
{
  available: boolean;
  conflicting_bookings?: {
    id: string;
    start_date: string;
    end_date: string;
  }[];
  suggested_dates?: {
    start_date: string;
    end_date: string;
  }[];
}
```

### 2. Calculate Price

```typescript
POST /api/v1/bookings/calculate-price

Request:
{
  rentable_item_id: string;
  start_date: string;
  end_date: string;
  guests: {
    adults: number;
    children?: number;
    infants?: number;
  };
  voucher_code?: string;
}

Response:
{
  base_price: number;
  nights: number;
  subtotal: number;
  fees: {
    cleaning_fee?: number;
    extra_guest_fee?: number;
    weekend_surcharge?: number;
    service_fee?: number;
  };
  discounts: {
    voucher?: number;
    long_stay?: number;
  };
  booking_hold_deposit?: number;
  total: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
}
```

### 3. Create Booking (Enhanced)

```typescript
POST /api/v1/bookings

Request:
{
  rentable_item_id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  guests: {
    adults: number;
    children?: number;
  };
  contact: {
    full_name: string;
    phone: string;
    email?: string;
    special_requests?: string;
  };
  pricing: {
    total: number;
    breakdown: object;
  };
  policies_accepted: boolean;
  voucher_code?: string;
}

Response:
{
  id: string;
  status: 'PENDING' | 'CONFIRMED';
  booking_code: string;
  // ... other fields
}
```

## 🎨 UI/UX Design

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header (Back button + Title)                            │
├──────────────────────────────────┬──────────────────────┤
│                                  │                      │
│ Left Column (Main Content)       │ Right Column         │
│                                  │ (Sticky Summary)     │
│ 1. Date Selector                 │                      │
│ 2. Guest Selector                │ [Image]              │
│ 3. Price Breakdown               │ Title                │
│ 4. Contact Form                  │ Location             │
│ 5. Policies                      │ Dates                │
│ 6. [Submit Button]               │ Guests               │
│                                  │ Total Price          │
│                                  │ [Book Button]        │
│                                  │                      │
└──────────────────────────────────┴──────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────────────┐
│ Header                          │
├─────────────────────────────────┤
│                                 │
│ Main Content (Full Width)       │
│ 1. Date Selector                │
│ 2. Guest Selector               │
│ 3. Price Breakdown              │
│ 4. Contact Form                 │
│ 5. Policies                     │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Fixed Bottom Bar                │
│ Total: 12.650.000 ₫  [Đặt phòng]│
└─────────────────────────────────┘
```

## ✅ Acceptance Criteria

### P0 Must Have
- [ ] Chọn ngày check-in/check-out với validation
- [ ] Tự động tính số đêm
- [ ] Chọn số khách (adults + children)
- [ ] Validate max_occupancy
- [ ] Check availability realtime
- [ ] Tính giá tự động với breakdown đầy đủ
- [ ] Form thông tin liên hệ với validation
- [ ] Hiển thị policies & house rules
- [ ] Checkbox đồng ý policies (required)
- [ ] Submit tạo booking (PENDING hoặc CONFIRMED)
- [ ] Loading states cho tất cả async operations
- [ ] Error handling đầy đủ
- [ ] Prevent double submit
- [ ] Navigate to /my-bookings sau khi success

### P1 Nice to Have
- [ ] Sticky summary card (desktop)
- [ ] Fixed bottom bar (mobile)
- [ ] Voucher/discount code
- [ ] Payment method selection
- [ ] Calendar với highlight cuối tuần
- [ ] Disable ngày đã full
- [ ] Dynamic pricing display

## 🚀 Implementation Plan

### Phase 1: Backend API (1 day)
1. Create `check-availability` endpoint
2. Create `calculate-price` endpoint
3. Enhance `create booking` endpoint
4. Add validation logic
5. Test APIs

### Phase 2: Frontend Components (2 days)
1. Create BookingPage layout
2. Build DateSelector component
3. Build GuestSelector component
4. Build PriceBreakdown component
5. Build ContactForm component
6. Build Policies component

### Phase 3: Integration (1 day)
1. Connect components to APIs
2. Add loading states
3. Add error handling
4. Test full flow
5. Fix bugs

### Phase 4: Polish (P1 features - 1 day)
1. Add sticky summary card
2. Add voucher support
3. Improve calendar UI
4. Mobile optimization

## 📝 Notes

- Sử dụng `formatPrice` utility đã có
- Reuse Layout component với userRole="TENANT"
- Follow existing code style
- Add proper TypeScript types
- Add console logs for debugging
- Test với nhiều scenarios khác nhau

