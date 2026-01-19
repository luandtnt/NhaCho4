# ✅ Đã Cập Nhật: Form Edit Rentable Item

## Các cải tiến

### 1. Tự động load data hiện tại ✅
```tsx
useEffect(() => {
  if (initialData) {
    console.log('📝 Edit mode - Loading initial data:', initialData);
    const mergedData = {
      ...formData,
      ...initialData,
      amenities: initialData.amenities || [],
      metadata: initialData.metadata || formData.metadata,
    };
    setFormData(mergedData);
    if (initialData.property_category) {
      setStep(2); // Skip category selection
    }
  }
}, [initialData]);
```

### 2. Hiển thị loại hình (không cho đổi) ✅
```
┌─────────────────────────────────────────┐
│ Loại hình: HOTEL (SHORT_TERM)          │
│ ⚠️ Không thể thay đổi loại hình...     │
└─────────────────────────────────────────┘
```

### 3. Pricing Policy Selector trong Edit Mode ✅
- Dropdown tự động chọn policy hiện tại
- Hiển thị chi tiết policy bên dưới
- Có thể đổi sang policy khác
- Có thể override giá

### 4. Thông báo Edit Mode ✅
```
┌─────────────────────────────────────────┐
│ ℹ️ Chế độ chỉnh sửa                     │
│ Bạn có thể thay đổi chính sách giá...  │
└─────────────────────────────────────────┘
```

## Flow Edit

```
Click "✏️ Sửa"
  ↓
Form load với data hiện tại
  ↓
Dropdown hiển thị policy đang dùng
  ↓
User có thể:
  - Giữ nguyên policy
  - Đổi sang policy khác
  - Override giá riêng
  - Sửa các trường khác
  ↓
Click "Cập nhật"
  ↓
Data được lưu vào DB
```

## Files đã sửa

1. **`apps/frontend/src/components/EnhancedPropertyForm.tsx`**
   - Thêm `pricing_policy_id`, `pricing_policy_version`, `pricing_snapshot_at`, `pricing_override` vào formData
   - Cải thiện useEffect để load initialData đúng cách
   - Thêm UI hiển thị loại hình trong edit mode
   - Thêm thông báo "Chế độ chỉnh sửa"

2. **`apps/frontend/src/components/property-forms/PricingFieldsWithPolicy.tsx`**
   - Thêm useEffect để handle edit mode
   - Console log khi có pricing_policy_id

3. **`apps/frontend/src/components/PricingPolicySelector.tsx`**
   - Thêm useEffect để auto-select policy trong edit mode
   - Console log khi auto-select

4. **`apps/frontend/src/pages/RentableItemsPage.tsx`**
   - Đã xóa chức năng "💰 Gán giá" (không cần nữa)

## Test ngay

1. **Hard refresh**: `Ctrl + Shift + R`
2. Tạo 1 item mới với pricing policy
3. Click **"✏️ Sửa"** item đó
4. Verify:
   - ✅ Form load đầy đủ data
   - ✅ Dropdown hiển thị policy đang dùng
   - ✅ Có thể đổi policy hoặc override giá
   - ✅ Click "Cập nhật" → lưu thành công

## Tài liệu chi tiết

Xem file: **`EDIT_RENTABLE_ITEM_GUIDE.md`**
