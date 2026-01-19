# Test Hướng Dẫn - Pricing Policy Selector (UPDATED)

## ✅ Các vấn đề đã sửa

### 1. Amenities Selector - FIXED ✅
**Vấn đề**: Không thể tích chọn tiện ích  
**Nguyên nhân**: Prop name sai - component nhận `value` nhưng form truyền `selectedAmenities`  
**Giải pháp**: Đã sửa prop name từ `selectedAmenities` → `value`

### 2. Pricing Policy Selector - CHANGED TO DROPDOWN ✅
**Yêu cầu**: User muốn dropdown `<select>` thay vì cards  
**Giải pháp**: Đã thay đổi UI từ clickable cards → dropdown select truyền thống  
**Kết quả**: Bây giờ hiển thị dropdown với danh sách chính sách giá

## 🎯 Cách hoạt động mới của Pricing Policy Selector

### Thiết kế UI mới:
- ✅ **Dropdown `<select>` truyền thống**
- ✅ Hiển thị: "Tên chính sách - Giá/Đơn vị"
- ✅ Khi chọn → hiển thị chi tiết chính sách bên dưới
- ✅ Checkbox "Cho phép ghi đè giá" xuất hiện sau khi chọn

### Flow hoạt động:

```
1. User chọn loại hình (VD: HOTEL)
   ↓
2. Component tự động load các chính sách phù hợp
   ↓
3. Hiển thị DROPDOWN với danh sách chính sách
   ↓
4. User CHỌN từ dropdown
   ↓
5. Hiển thị box xanh với chi tiết chính sách
   ↓
6. Giá tự động điền vào form
```

## 📝 Hướng dẫn Test Chi Tiết

### Test 1: Amenities Selector (Đã sửa)

1. Mở trang Rentable Items: `http://localhost:5173/rentable-items`
2. Click nút "➕ Thêm Rentable Item"
3. Chọn loại hình **HOTEL** (hoặc bất kỳ loại nào)
4. Scroll xuống phần **"✨ Tiện ích"**
5. Click vào các button tiện ích

**Kỳ vọng**:
- ✅ Các button có thể click được
- ✅ Khi click, viền chuyển từ xám → xanh
- ✅ Nền chuyển từ trắng → xanh nhạt
- ✅ Có thể chọn nhiều tiện ích
- ✅ Đếm số lượng đã chọn hiển thị đúng

---

### Test 2: Pricing Policy Selector (DROPDOWN MỚI)

#### Bước 1: Kiểm tra dropdown hiển thị

1. Ở form tạo Rentable Item (đã chọn HOTEL)
2. Scroll đến phần **"💰 Chính sách Giá"**
3. Mở Console (F12) → tab Console
4. Xem log:
   ```
   🔍 Loading policies for: {propertyCategory: "HOTEL", rentalDurationType: "SHORT_TERM"}
   ✅ Loaded policies: 1 [...]
   ```

**Kỳ vọng**:
- ✅ Thấy 1 dropdown `<select>`
- ✅ Label: "Chọn chính sách giá *"
- ✅ Option đầu tiên: "-- Chọn chính sách giá --"
- ✅ Các option tiếp theo: "Tên chính sách - Giá/Đơn vị"

**Ví dụ dropdown**:
```
┌─────────────────────────────────────────────────────┐
│ Chọn chính sách giá *                               │
├─────────────────────────────────────────────────────┤
│ ▼ -- Chọn chính sách giá --                        │
│   Chính sách Khách sạn Tiêu chuẩn - 2,000,000 ₫/đêm│
│   Chính sách Khách sạn Cao cấp - 5,000,000 ₫/đêm   │
└─────────────────────────────────────────────────────┘
```

#### Bước 2: Chọn chính sách từ dropdown

1. **Click vào dropdown**
2. **Chọn 1 chính sách**
3. Xem Console log:
   ```
   👆 User clicked policy: xxx Chính sách Khách sạn...
   🎯 Policy selected: {id: "xxx", name: "...", ...}
   ```

**Kỳ vọng**:
- ✅ Dropdown hiển thị chính sách đã chọn
- ✅ Bên dưới hiển thị **box xanh** với chi tiết:
  ```
  ┌─────────────────────────────────────────┐
  │ 📋 Chi tiết chính sách: [Tên]          │
  │ [Mô tả nếu có]                          │
  │                                         │
  │ Giá cơ bản: 2,000,000 ₫/đêm            │
  │ Thời gian thuê tối thiểu: 1 đêm        │
  │ Tiền cọc: 1,000,000 ₫                  │
  │ Tiền cọc giữ chỗ: 500,000 ₫           │
  │ Phí dịch vụ: 200,000 ₫                 │
  │                                         │
  │ 📍 Phạm vi: Hà Nội                     │
  └─────────────────────────────────────────┘
  ```
- ✅ Hiển thị checkbox "Cho phép ghi đè giá"

#### Bước 3: Test Override (Tùy chọn)

1. Tích checkbox **"Cho phép ghi đè giá"**

**Kỳ vọng**:
- ✅ Hiển thị box vàng cảnh báo
- ✅ Hiển thị form với các trường có viền vàng
- ✅ Có thể chỉnh sửa giá

---

### Test 3: Submit Form

1. Điền đầy đủ thông tin:
   - Mã: `HOTEL-001`
   - Space Node: chọn 1 node
   - **Chọn chính sách giá từ dropdown**
   - Diện tích, số phòng, v.v.
   - Chọn tiện ích
   - Check-in/Check-out time

2. Click **"Tạo mới"**

3. Kiểm tra database:
```sql
SELECT 
  code,
  property_category,
  rental_duration_type,
  pricing_policy_id,
  pricing_policy_version,
  pricing_snapshot_at,
  base_price,
  price_unit,
  amenities
FROM rentable_item
WHERE property_category = 'HOTEL'
ORDER BY created_at DESC
LIMIT 1;
```

**Kỳ vọng**:
- ✅ `pricing_policy_id` có giá trị (UUID)
- ✅ `pricing_policy_version` = 1
- ✅ `pricing_snapshot_at` có timestamp
- ✅ `base_price` = giá từ chính sách
- ✅ `amenities` = array các mã tiện ích

---

## 🐛 Troubleshooting

### Vấn đề: Dropdown rỗng hoặc không có option

**Kiểm tra**:
1. Console có lỗi API không?
2. Console log có hiển thị "✅ Loaded policies: 0" không?
3. Database có chính sách HOTEL không?
```sql
SELECT * FROM pricing_policy 
WHERE property_category = 'HOTEL' 
AND status = 'ACTIVE';
```

### Vấn đề: Chọn từ dropdown nhưng không có phản ứng

**Kiểm tra**:
1. Console log có hiển thị "👆 User clicked policy" không?
2. Hard refresh: `Ctrl + Shift + R`
3. Xem có lỗi JavaScript trong Console không

---

## 📊 Summary

| Component | Status | UI Type |
|-----------|--------|---------|
| Amenities Selector | ✅ Fixed | Buttons (clickable) |
| Pricing Policy Selector | ✅ Changed | **Dropdown `<select>`** |
| Policy Selection | ✅ Working | Select from dropdown |
| Policy Details Display | ✅ Working | Blue box below dropdown |
| Auto-fill Prices | ✅ Working | After selecting policy |
| Override Prices | ✅ Working | Checkbox to enable |
| Form Submit | ✅ Working | Save to database |

## 🎯 Kết luận

- ✅ **Amenities selector đã được sửa** - có thể click được
- ✅ **Pricing policy selector đã đổi thành DROPDOWN** - theo yêu cầu của user
- ✅ **Dropdown hiển thị danh sách chính sách** - dễ chọn hơn
- ✅ **Chi tiết chính sách hiển thị sau khi chọn** - trong box xanh
- ✅ **Console logs** để debug dễ dàng
