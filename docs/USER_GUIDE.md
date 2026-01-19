# User Guide - Multi-Property Type System

**Version**: 1.0  
**Last Updated**: 2026-01-15

---

## Table of Contents

1. [Introduction](#introduction)
2. [Property Types Overview](#property-types-overview)
3. [Creating Rentable Items](#creating-rentable-items)
4. [Setting Up Pricing](#setting-up-pricing)
5. [Managing Amenities](#managing-amenities)
6. [Filtering and Search](#filtering-and-search)
7. [Booking Flow](#booking-flow)
8. [Best Practices](#best-practices)

---

## Introduction

Hệ thống Multi-Property Type cho phép bạn quản lý nhiều loại hình bất động sản khác nhau với các cấu hình giá và tiện nghi phù hợp. Hệ thống hỗ trợ 21 loại hình bất động sản và 30 tiện nghi.

### Supported Property Types

- **Short-Term (< 1 tháng)**: Homestay, Hotel, Serviced Apartment, Villa, Airbnb Room, Co-living
- **Medium-Term (1-6 tháng)**: Private House, Room Rental, Apartment, Whole House, Retail Space, Warehouse
- **Long-Term (> 6 tháng)**: Office, Land, Commercial Space, Luxury Apartment, Villa, Shophouse

---

## Property Types Overview

### Short-Term Properties

**Đặc điểm**:
- Thuê theo đêm hoặc tuần
- Phù hợp cho du lịch, công tác ngắn ngày
- Giá linh hoạt theo ngày trong tuần và mùa

**Ví dụ**:
- 🏠 Homestay: Nhà dân với không gian chung
- 🏨 Hotel: Khách sạn với dịch vụ đầy đủ
- 🏖️ Villa Resort: Biệt thự nghỉ dưỡng cao cấp

### Medium-Term Properties

**Đặc điểm**:
- Thuê theo tháng (1-6 tháng)
- Phù hợp cho người chuyển việc, du học
- Yêu cầu đặt cọc

**Ví dụ**:
- 🏡 Private House: Nhà riêng nguyên căn
- 🏢 Apartment: Căn hộ chung cư
- 🛏️ Room Rental: Phòng trọ

### Long-Term Properties

**Đặc điểm**:
- Thuê theo năm (> 6 tháng)
- Hợp đồng dài hạn
- Giá tăng hàng năm

**Ví dụ**:
- 🏢 Office: Văn phòng làm việc
- 🌾 Land: Đất nền
- 🏬 Commercial Space: Mặt bằng thương mại

---

## Creating Rentable Items

### Step 1: Choose Property Type

1. Vào trang **Rentable Items**
2. Click **"Tạo Rentable Item"**
3. Chọn loại hình bất động sản phù hợp

![Property Category Selection](images/property-category-selection.png)

### Step 2: Fill Basic Information

**Required Fields**:
- **Code**: Mã định danh (VD: HOMESTAY-001)
- **Space Node**: Vị trí trong cây không gian
- **Allocation Type**: Loại phân bổ (exclusive/capacity/slot)

**Property Details**:
- **Area (m²)**: Diện tích
- **Bedrooms**: Số phòng ngủ
- **Bathrooms**: Số phòng tắm
- **Floor Number**: Tầng số

### Step 3: Select Amenities

Chọn các tiện nghi có sẵn:

**Basic**:
- 📶 Wifi
- ❄️ Air Conditioning
- 🔥 Heating
- 📺 TV

**Kitchen**:
- 🍳 Kitchen
- 🧊 Refrigerator
- 📻 Microwave

**Entertainment**:
- 🏊 Swimming Pool
- 💪 Gym
- 🌳 Garden

### Step 4: Set House Rules

Chọn quy định nhà:
- 🚭 No Smoking
- 🐕 No Pets
- 🎉 No Parties
- 🔇 Quiet Hours (22h-6h)

### Step 5: Configure Booking Settings

- **Instant Booking**: Cho phép đặt ngay không cần xác nhận
- **Advance Booking Days**: Số ngày đặt trước tối thiểu
- **Cancellation Policy**: Chính sách hủy (Flexible/Moderate/Strict)

---

## Setting Up Pricing

### Create Pricing Policy

1. Vào trang **Pricing Policies**
2. Click **"Tạo Pricing Policy"**
3. Điền thông tin:

**Basic Information**:
- **Name**: Tên chính sách (VD: "Giá homestay mùa cao điểm")
- **Policy Type**: Loại giá (daily_rent/monthly_rent/yearly_rent)
- **Base Amount**: Giá cơ bản

**Advanced Settings**:

#### For Short-Term:
```json
{
  "base_amount": 1000000,
  "currency": "VND",
  "unit": "night",
  "weekday_rates": {
    "0": 1200000,  // Chủ nhật
    "6": 1200000   // Thứ 7
  },
  "seasonal_rates": [
    {
      "name": "Tết",
      "start_month": 1,
      "start_day": 20,
      "end_month": 2,
      "end_day": 5,
      "rate_multiplier": 1.5
    }
  ],
  "duration_discounts": [
    {
      "min_days": 7,
      "discount_percent": 10
    }
  ],
  "fees": {
    "cleaning_fee": 200000,
    "service_fee_percent": 5
  }
}
```

#### For Medium-Term:
```json
{
  "base_amount": 10000000,
  "currency": "VND",
  "unit": "month",
  "fees": {
    "deposit_months": 2
  }
}
```

#### For Long-Term:
```json
{
  "base_amount": 10000000,
  "currency": "VND",
  "unit": "month",
  "annual_increase_percent": 5,
  "fees": {
    "deposit_months": 3
  }
}
```

### Assign Pricing to Rentable Item

1. Vào trang **Rentable Items**
2. Click **"💰 Gán giá"** trên item
3. Chọn pricing policy
4. Click **"Áp dụng"**

---

## Managing Amenities

### View All Amenities

Vào trang **Amenities** để xem danh sách đầy đủ 30 tiện nghi được phân loại:

- **Basic** (5): Wifi, AC, Heating, TV, Washing Machine
- **Kitchen** (4): Kitchen, Refrigerator, Microwave, Utensils
- **Bathroom** (3): Water Heater, Bathtub, Private Bathroom
- **Entertainment** (5): Pool, Gym, Garden, Balcony, BBQ
- **Safety** (4): Security 24/7, CCTV, Fire Alarm, First Aid
- **Transportation** (3): Parking, Elevator, Bike Parking
- **Work** (4): Desk, Meeting Room, Printer, High-speed Internet
- **Other** (2): Pet Friendly, Wheelchair Accessible

### Add Amenities to Property

Khi tạo hoặc chỉnh sửa rentable item, chọn các tiện nghi phù hợp từ danh sách.

---

## Filtering and Search

### Discover Page Filters

Trên trang **Discover**, sử dụng bộ lọc nâng cao:

1. Click **"Bộ lọc"**
2. Chọn tiêu chí:
   - **Property Category**: Loại hình
   - **Duration Type**: Thời gian thuê
   - **Bedrooms**: Số phòng ngủ
   - **Bathrooms**: Số phòng tắm
   - **Area Range**: Khoảng diện tích
   - **Amenities**: Tiện nghi
   - **Instant Booking**: Đặt ngay

3. Click **"Áp dụng"**

### Quick Filters

Sử dụng quick filters để lọc nhanh:
- 🏠 Căn hộ
- 🏢 Chung cư
- 🏡 Nhà riêng
- ⚡ Đặt ngay

---

## Booking Flow

### For Tenants

1. **Browse Listings**: Xem danh sách bất động sản
2. **Filter**: Lọc theo tiêu chí
3. **View Details**: Xem chi tiết listing
4. **Calculate Price**: Tính giá thuê
5. **Create Booking**: Tạo booking request
6. **Wait for Confirmation**: Chờ chủ nhà xác nhận

### For Landlords

1. **Create Asset**: Tạo tài sản
2. **Create Space Tree**: Tạo cây không gian
3. **Create Rentable Items**: Tạo các đơn vị cho thuê
4. **Create Pricing Policy**: Tạo chính sách giá
5. **Assign Price**: Gán giá cho rentable items
6. **Create Listing**: Tạo tin đăng
7. **Publish**: Xuất bản tin đăng
8. **Manage Bookings**: Quản lý booking requests

---

## Best Practices

### Property Setup

1. **Choose Correct Type**: Chọn đúng loại hình để có pricing unit phù hợp
2. **Complete Information**: Điền đầy đủ thông tin (area, bedrooms, bathrooms)
3. **Select Relevant Amenities**: Chọn tiện nghi thực tế có sẵn
4. **Set Clear Rules**: Đặt quy định rõ ràng

### Pricing Strategy

1. **Competitive Pricing**: Nghiên cứu giá thị trường
2. **Seasonal Adjustments**: Điều chỉnh giá theo mùa
3. **Duration Discounts**: Khuyến khích thuê dài hạn
4. **Weekend Rates**: Tăng giá cuối tuần cho short-term

### Listing Optimization

1. **High-Quality Photos**: Sử dụng ảnh chất lượng cao
2. **Detailed Description**: Mô tả chi tiết, chính xác
3. **Highlight Amenities**: Nhấn mạnh tiện nghi nổi bật
4. **Update Regularly**: Cập nhật thông tin thường xuyên

### Booking Management

1. **Quick Response**: Phản hồi booking requests nhanh
2. **Clear Communication**: Giao tiếp rõ ràng với khách
3. **Flexible Policies**: Chính sách linh hoạt hợp lý
4. **Professional Service**: Dịch vụ chuyên nghiệp

---

## Troubleshooting

### Common Issues

**Q: Không thể tạo rentable item?**
A: Kiểm tra:
- Space node đã được tạo chưa
- Code có bị trùng không
- Đã chọn property category chưa

**Q: Giá tính không đúng?**
A: Kiểm tra:
- Pricing policy đã được gán chưa
- Cấu hình pricing policy có đúng không
- Duration type có khớp không

**Q: Không tìm thấy listing?**
A: Kiểm tra:
- Listing đã được publish chưa
- Bộ lọc có quá strict không
- Status của rentable items

---

## Support

Nếu cần hỗ trợ:
- Email: support@urp.com
- Phone: 1900-xxxx
- Documentation: https://docs.urp.com

---

**Happy renting! 🏠**
