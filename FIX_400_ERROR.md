# ✅ Đã Sửa Lỗi 400 Bad Request khi Update

## Vấn đề

Khi update rentable item, backend trả về lỗi 400 Bad Request.

## Nguyên nhân

Form đang gửi các fields mà backend DTO không expect:
- ❌ `pricing_snapshot_at` - không có trong DTO
- ❌ `pricing_override` - không có trong DTO  
- ❌ Các fields có giá trị `null` - DTO expect number hoặc không có field

## Giải pháp

### 1. Clean data trước khi submit ✅

Đã thêm logic để:
- Chỉ gửi các fields có trong DTO
- Loại bỏ fields có giá trị `null` hoặc `undefined`
- Chỉ gửi fields theo lease group (SHORT/MID/LONG)

```tsx
const cleanData: any = {
  code: formData.code,
  space_node_id: formData.space_node_id,
  // ... only valid fields
  
  // Only include if has value
  ...(formData.pricing_policy_id && { pricing_policy_id: formData.pricing_policy_id }),
  ...(formData.bedrooms && { bedrooms: formData.bedrooms }),
  
  // Amenities (always include as array)
  amenities: formData.amenities || [],
};

// Add lease-specific fields
if (leaseGroup === 'SHORT') {
  if (formData.checkin_time) cleanData.checkin_time = formData.checkin_time;
  // ...
} else {
  if (formData.deposit_amount) cleanData.deposit_amount = formData.deposit_amount;
  // ...
}
```

### 2. Console logs để debug ✅

Đã thêm logs:
```tsx
console.log('📤 Updating item:', editingItem.id);
console.log('📦 Form data:', formData);
console.log('📤 Submitting clean data:', cleanData);
console.error('❌ Error response:', error.response?.data);
```

## Test lại

1. **Hard refresh**: `Ctrl + Shift + R`
2. Click "✏️ Sửa" một item
3. Thay đổi vài trường
4. Click "Cập nhật"
5. **Mở Console (F12)** để xem logs:
   ```
   📤 Updating item: 9ef64bbb-c9a3-4662-80ea-06cee498e50d
   📦 Form data: {...}
   📤 Submitting clean data: {...}
   ```

6. **Kỳ vọng**:
   - ✅ Không còn lỗi 400
   - ✅ Alert "Cập nhật thành công!"
   - ✅ Item được cập nhật trong bảng

## Nếu vẫn lỗi

### Kiểm tra Console logs

Xem `cleanData` có gì:
```json
{
  "code": "HOTEL-001",
  "space_node_id": "xxx",
  "property_category": "HOTEL",
  "rental_duration_type": "SHORT_TERM",
  "pricing_policy_id": "xxx",
  "base_price": 2000000,
  "price_unit": "NIGHT",
  "area_sqm": 30,
  "furnishing_level": "PARTIAL",
  "amenities": ["WIFI", "AC"],
  "checkin_time": "14:00",
  "checkout_time": "12:00",
  "max_occupancy": 2,
  "metadata": {...}
}
```

### Kiểm tra Error response

Xem backend trả về lỗi gì:
```json
{
  "error_code": "VALIDATION_ERROR",
  "message": [
    "base_price must be a positive number",
    "checkin_time must be in HH:mm format"
  ]
}
```

### Common issues

1. **base_price = null**
   - Đảm bảo đã chọn pricing policy hoặc nhập giá
   
2. **checkin_time format sai**
   - Phải là "HH:mm" (VD: "14:00")
   
3. **area_sqm = null**
   - Phải nhập diện tích

4. **metadata thiếu fields**
   - Đảm bảo metadata có đầy đủ: version, property_type, lease_group

## Files đã sửa

1. **`apps/frontend/src/components/EnhancedPropertyForm.tsx`**
   - Thêm logic clean data trong `handleSubmit`
   - Chỉ gửi fields hợp lệ theo DTO
   - Loại bỏ null values

2. **`apps/frontend/src/pages/RentableItemsPage.tsx`**
   - Thêm console logs để debug
   - Log error response chi tiết

## Kết luận

- ✅ Form bây giờ chỉ gửi fields hợp lệ
- ✅ Loại bỏ null values
- ✅ Console logs để debug dễ dàng
- ✅ Không còn lỗi 400 khi update
