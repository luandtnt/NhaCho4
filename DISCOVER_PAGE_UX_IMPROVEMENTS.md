# Cải Tiến UX cho Trang Discover (Khám Phá)

## 🎯 Priority P0 - Cần làm ngay

### 1. ✅ Format giá theo chuẩn Việt Nam
**Hiện tại**: `VND/month` - số dài, khó đọc
**Cần sửa thành**:
- `12.000.000 ₫/tháng`
- `3.800.000 ₫/đêm`
- `120.000 ₫/giờ`
- Optional: Rút gọn `12 triệu/tháng`

**Implementation**:
```tsx
const formatPrice = (price: number, unit: string) => {
  const formatted = new Intl.NumberFormat('vi-VN').format(price);
  const unitMap: any = {
    'MONTH': 'tháng',
    'NIGHT': 'đêm',
    'HOUR': 'giờ',
    'DAY': 'ngày',
  };
  return `${formatted} ₫/${unitMap[unit] || unit}`;
};

// Optional: Rút gọn
const formatPriceShort = (price: number, unit: string) => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)} triệu/${unitMap[unit]}`;
  }
  return formatPrice(price, unit);
};
```

---

### 2. ✅ Tối giản nội dung Card
**Hiện tại**: Card dài, nhiều thông tin rối
**Cần sửa thành**:

```
┌─────────────────────────────────┐
│ [Ảnh]                           │
├─────────────────────────────────┤
│ Căn hộ 2PN view đẹp             │ ← Tiêu đề (1 dòng)
│ 📍 Quận 1, TP.HCM               │ ← Địa điểm rút gọn
│ 160m² · 3 PN · 2 WC             │ ← Chips info
│                                 │
│ 12.000.000 ₫/tháng             │ ← Giá nổi bật
└─────────────────────────────────┘
```

**Card structure**:
- Ảnh (16:9 ratio)
- Tiêu đề (max 1 line, truncate)
- Địa điểm (Quận/Tỉnh only)
- Quick info chips (diện tích, phòng ngủ, WC)
- Giá (font lớn, nổi bật)
- Mô tả dài → chuyển sang trang chi tiết

---

### 3. ✅ Thêm Sort (Sắp xếp)
**Cần thêm dropdown**:
```tsx
<select onChange={handleSortChange}>
  <option value="newest">Mới đăng</option>
  <option value="price_asc">Giá thấp → cao</option>
  <option value="price_desc">Giá cao → thấp</option>
  <option value="area_desc">Diện tích lớn</option>
  <option value="featured">Nổi bật</option>
</select>
```

**Backend cần support**:
- `?sort=newest` (created_at DESC)
- `?sort=price_asc` (base_price ASC)
- `?sort=price_desc` (base_price DESC)
- `?sort=area_desc` (area_sqm DESC)
- `?sort=featured` (is_featured DESC, created_at DESC)

---

### 4. ✅ Cải thiện Bộ lọc
**Filter panel cần có**:

```
┌─────────────────────────────────┐
│ 🔍 Bộ lọc                       │
├─────────────────────────────────┤
│ 📍 Địa điểm                     │
│ [Dropdown Tỉnh/Thành phố]      │
│ [Dropdown Quận/Huyện]           │
│                                 │
│ 💰 Khoảng giá                   │
│ [Từ: _______] - [Đến: _______] │
│                                 │
│ 🏠 Loại hình                    │
│ [Dropdown 21 loại]              │
│                                 │
│ 🛏️ Số phòng ngủ                │
│ [ ] Studio  [ ] 1PN  [ ] 2PN   │
│ [ ] 3PN     [ ] 4PN+            │
│                                 │
│ ✨ Tiện ích                     │
│ [ ] WiFi    [ ] Điều hòa        │
│ [ ] Bếp     [ ] Bãi xe          │
│ [ ] Thang máy [ ] Hồ bơi        │
│                                 │
│ 📷 Chỉ hiện tin có ảnh          │
│ [Toggle switch]                 │
│                                 │
│ [Xóa bộ lọc] [Áp dụng]         │
└─────────────────────────────────┘
```

---

## 🚀 Priority P1 - Nâng cấp UI

### 5. ✅ Thu gọn Grid 21 loại hình
**Hiện tại**: Grid chiếm nhiều diện tích
**Cần sửa**:

**Option 1: Collapse**
```tsx
<div>
  <button onClick={() => setShowAllCategories(!showAllCategories)}>
    {showAllCategories ? 'Thu gọn' : 'Xem tất cả loại hình'}
  </button>
  {showAllCategories && (
    <div className="grid grid-cols-7 gap-4">
      {/* 21 categories */}
    </div>
  )}
</div>
```

**Option 2: Carousel + "Xem thêm"**
```tsx
// Hiển thị 7 loại hot trước
<div className="grid grid-cols-7 gap-4">
  {hotCategories.map(...)}
</div>
<button onClick={openCategoryModal}>
  Xem thêm 14 loại hình →
</button>
```

**Option 3: Dropdown thay vì Grid**
```tsx
<select>
  <option value="">Tất cả loại hình</option>
  {categories.map(cat => (
    <option value={cat.code}>{cat.name_vi}</option>
  ))}
</select>
```

---

### 6. ✅ Loading Skeleton + Empty State

**Loading skeleton**:
```tsx
{loading && (
  <div className="grid grid-cols-3 gap-6">
    {[1,2,3,4,5,6].map(i => (
      <div key={i} className="animate-pulse">
        <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
        <div className="bg-gray-200 h-4 rounded mb-2"></div>
        <div className="bg-gray-200 h-4 rounded w-2/3"></div>
      </div>
    ))}
  </div>
)}
```

**Empty state**:
```tsx
{!loading && listings.length === 0 && (
  <div className="text-center py-16">
    <div className="text-6xl mb-4">🏠</div>
    <h3 className="text-xl font-semibold mb-2">
      Không tìm thấy kết quả phù hợp
    </h3>
    <p className="text-gray-600 mb-4">
      Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
    </p>
    <button 
      onClick={() => setFilters({})}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg"
    >
      Xóa bộ lọc
    </button>
  </div>
)}
```

---

## 📋 Implementation Plan

### Phase 1: P0 - Core UX (1-2 days)
1. ✅ Format giá VN
2. ✅ Tối giản card
3. ✅ Thêm sort dropdown
4. ✅ Cải thiện filter panel

### Phase 2: P1 - Polish (1 day)
5. ✅ Thu gọn categories grid
6. ✅ Loading skeleton + empty state

---

## 🎨 Design Reference

### Card Layout (Tối giản)
```
┌───────────────────────────┐
│                           │
│      [Ảnh 16:9]          │
│                           │
├───────────────────────────┤
│ Căn hộ 2PN Vinhomes       │ ← h3, font-semibold
│ 📍 Quận 1, TP.HCM         │ ← text-sm, text-gray-600
│                           │
│ 80m² · 2 PN · 2 WC       │ ← chips, text-xs
│                           │
│ 15.000.000 ₫/tháng       │ ← text-xl, font-bold, text-blue-600
└───────────────────────────┘
```

### Filter Panel (Sidebar)
- Width: 280px
- Sticky position
- Collapsible sections
- Clear visual hierarchy

### Sort Dropdown (Top right)
```
[Sắp xếp: Mới đăng ▼]
```

---

## 🔧 Technical Notes

### Backend Changes Needed
1. Add sort parameters to `/marketplace/discover` endpoint
2. Add price range filter
3. Add bedrooms filter
4. Add amenities filter
5. Add has_images filter

### Frontend Components to Create
1. `ListingCard.tsx` - Tối giản card component
2. `FilterPanel.tsx` - Advanced filter sidebar
3. `SortDropdown.tsx` - Sort selector
4. `LoadingSkeleton.tsx` - Skeleton cards
5. `EmptyState.tsx` - No results state

### Utilities to Add
1. `formatPrice()` - Format giá VN
2. `formatPriceShort()` - Rút gọn giá
3. `formatLocation()` - Rút gọn địa điểm

---

## ✅ Acceptance Criteria

### P0 Must Have
- [ ] Giá hiển thị đúng format VN với dấu phân cách
- [ ] Card tối giản, dễ đọc, không quá dài
- [ ] Có dropdown sắp xếp hoạt động
- [ ] Filter panel đầy đủ và rõ ràng

### P1 Nice to Have
- [ ] Categories grid thu gọn hoặc carousel
- [ ] Loading skeleton mượt mà
- [ ] Empty state thân thiện với CTA

---

## 📊 Current vs Target

| Feature | Current | Target |
|---------|---------|--------|
| Price format | `VND/month` | `12.000.000 ₫/tháng` |
| Card content | Dài, nhiều info | Tối giản, 5 elements |
| Sort | ❌ Không có | ✅ 5 options |
| Filter | Basic | Advanced (7 filters) |
| Categories | Grid 21 items | Collapsed/Carousel |
| Loading | Spinner | Skeleton cards |
| Empty | Text only | Illustration + CTA |

---

Bạn muốn tôi bắt đầu implement từ đâu? Tôi suggest làm theo thứ tự P0 trước:
1. Format giá VN
2. Tối giản card
3. Thêm sort
4. Cải thiện filter
