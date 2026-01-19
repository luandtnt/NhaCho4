# Hướng Dẫn Test - Edit Rentable Item với Pricing Policy

## ✅ Các cải tiến cho chế độ Edit

### 1. Form tự động load data hiện tại
- ✅ Load tất cả thông tin từ item đang edit
- ✅ Hiển thị pricing_policy_id hiện tại
- ✅ Load amenities đã chọn
- ✅ Skip bước chọn loại hình (vì đã có rồi)

### 2. Hiển thị thông tin loại hình
- ✅ Hiển thị loại hình hiện tại (không cho đổi)
- ✅ Thông báo: "⚠️ Không thể thay đổi loại hình khi chỉnh sửa"

### 3. Pricing Policy trong Edit Mode
- ✅ Dropdown tự động chọn policy hiện tại
- ✅ Có thể đổi sang policy khác
- ✅ Có thể bật override để tùy chỉnh giá riêng
- ✅ Thông báo: "ℹ️ Chế độ chỉnh sửa"

## 📝 Hướng dẫn Test

### Test 1: Edit item có pricing policy

#### Bước 1: Tạo item mới với pricing policy
1. Vào trang Rentable Items
2. Click "➕ Tạo Rentable Item"
3. Chọn loại hình **HOTEL**
4. Điền thông tin:
   - Mã: `HOTEL-TEST-001`
   - Space Node: chọn 1 node
   - **Chọn pricing policy từ dropdown**
   - Diện tích: 30
   - Số phòng ngủ: 1
   - Chọn vài tiện ích
   - Check-in: 14:00
   - Check-out: 12:00
5. Click "Tạo mới"
6. Verify: Item được tạo thành công

#### Bước 2: Edit item vừa tạo
1. Trong bảng, tìm item `HOTEL-TEST-001`
2. Click **"✏️ Sửa"**
3. **Kỳ vọng**:
   ```
   ┌─────────────────────────────────────────┐
   │ Chỉnh sửa Rentable Item - HOTEL        │
   └─────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────┐
   │ Loại hình: HOTEL (SHORT_TERM)          │
   │ ⚠️ Không thể thay đổi loại hình...     │
   └─────────────────────────────────────────┘
   
   [Các trường đã điền sẵn]
   
   ┌─────────────────────────────────────────┐
   │ 💰 Chính sách Giá                       │
   │ ▼ [Chính sách đang dùng]               │
   └─────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────┐
   │ 📋 Chi tiết chính sách: [Tên]          │
   │ [Thông tin giá]                         │
   └─────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────┐
   │ ℹ️ Chế độ chỉnh sửa                     │
   │ Bạn có thể thay đổi chính sách giá...  │
   └─────────────────────────────────────────┘
   ```

4. **Verify**:
   - ✅ Mã: `HOTEL-TEST-001` (đã điền)
   - ✅ Space Node: đã chọn
   - ✅ Dropdown pricing policy: hiển thị policy đang dùng
   - ✅ Chi tiết policy hiển thị bên dưới
   - ✅ Amenities: các tiện ích đã chọn trước đó
   - ✅ Check-in/Check-out: đã điền

#### Bước 3: Thay đổi pricing policy
1. Click vào dropdown pricing policy
2. Chọn **policy khác** (nếu có)
3. **Kỳ vọng**:
   - ✅ Dropdown cập nhật
   - ✅ Chi tiết policy mới hiển thị
   - ✅ Console log: "🎯 Policy selected: [policy mới]"
4. Click "Cập nhật"
5. **Verify database**:
```sql
SELECT 
  code,
  pricing_policy_id,
  pricing_policy_version,
  base_price
FROM rentable_item
WHERE code = 'HOTEL-TEST-001';
```
   - ✅ `pricing_policy_id` đã thay đổi
   - ✅ `base_price` cập nhật theo policy mới

#### Bước 4: Override giá
1. Click "✏️ Sửa" lại item
2. Tích checkbox **"Cho phép ghi đè giá"**
3. **Kỳ vọng**:
   - ✅ Hiển thị form với các trường có viền vàng
   - ✅ Có thể chỉnh sửa giá
4. Thay đổi giá cơ bản: `3,000,000`
5. Click "Cập nhật"
6. **Verify database**:
```sql
SELECT 
  code,
  pricing_policy_id,
  pricing_override,
  base_price
FROM rentable_item
WHERE code = 'HOTEL-TEST-001';
```
   - ✅ `pricing_policy_id` vẫn giữ nguyên
   - ✅ `pricing_override` có data
   - ✅ `base_price` = 3,000,000

---

### Test 2: Edit item KHÔNG có pricing policy (legacy)

#### Bước 1: Tạo item legacy (không có policy)
Nếu có item cũ trong DB không có `pricing_policy_id`:
```sql
SELECT * FROM rentable_item 
WHERE pricing_policy_id IS NULL 
LIMIT 1;
```

#### Bước 2: Edit item legacy
1. Click "✏️ Sửa" item đó
2. **Kỳ vọng**:
   - ✅ Form load bình thường
   - ✅ Dropdown pricing policy: "-- Chọn chính sách giá --"
   - ✅ KHÔNG hiển thị chi tiết policy
   - ✅ Các trường giá hiện tại vẫn hiển thị

3. Chọn 1 pricing policy từ dropdown
4. Click "Cập nhật"
5. **Verify**: Item legacy được gán pricing policy

---

### Test 3: Edit các trường khác (không đổi policy)

1. Click "✏️ Sửa" item
2. Thay đổi:
   - Diện tích: 35
   - Thêm/bớt amenities
   - Thay đổi check-in time
3. **KHÔNG** thay đổi pricing policy
4. Click "Cập nhật"
5. **Verify**:
   - ✅ Các trường khác được cập nhật
   - ✅ `pricing_policy_id` KHÔNG thay đổi
   - ✅ `base_price` KHÔNG thay đổi

---

## 🐛 Troubleshooting

### Vấn đề: Dropdown không hiển thị policy hiện tại

**Kiểm tra**:
1. Console log có hiển thị "🔄 Edit mode - auto-selecting existing policy" không?
2. Kiểm tra `pricing_policy_id` trong database:
```sql
SELECT pricing_policy_id FROM rentable_item WHERE code = 'HOTEL-TEST-001';
```
3. Kiểm tra policy đó còn ACTIVE không:
```sql
SELECT * FROM pricing_policy WHERE id = '[pricing_policy_id]';
```

### Vấn đề: Form không load data

**Kiểm tra**:
1. Console log có hiển thị "📝 Edit mode - Loading initial data" không?
2. Xem data trong console log
3. Hard refresh: `Ctrl + Shift + R`

### Vấn đề: Không thể thay đổi policy

**Kiểm tra**:
1. Dropdown có hiển thị các policy khác không?
2. Console có lỗi khi chọn policy không?
3. Verify API `/pricing-policies` hoạt động

---

## 📊 Summary

| Tính năng | Status | Ghi chú |
|-----------|--------|---------|
| Load data khi edit | ✅ Working | Tất cả fields được load |
| Hiển thị policy hiện tại | ✅ Working | Dropdown auto-select |
| Thay đổi policy | ✅ Working | Chọn policy khác từ dropdown |
| Override giá | ✅ Working | Checkbox để bật override |
| Edit các trường khác | ✅ Working | Không ảnh hưởng policy |
| Edit item legacy | ✅ Working | Có thể gán policy mới |
| Không cho đổi loại hình | ✅ Working | Hiển thị thông báo |

## 🎯 Kết luận

- ✅ **Form edit hoạt động đầy đủ** với pricing policy
- ✅ **Tự động load và hiển thị** policy hiện tại
- ✅ **Có thể thay đổi** policy hoặc override giá
- ✅ **Console logs** để debug dễ dàng
- ✅ **UI/UX rõ ràng** với các thông báo hướng dẫn
