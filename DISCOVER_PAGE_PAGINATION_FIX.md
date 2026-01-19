# ✅ Fix Pagination và Header cho Discover Page

## Vấn đề

1. **Pagination không hoạt động**: Trang Discover không hiển thị đầy đủ sản phẩm với phân trang
2. **Header bị mất**: Khi click vào chi tiết sản phẩm, header không hiển thị

## Nguyên nhân

1. **Frontend gửi sai param**: Frontend gửi `limit` nhưng backend expect `page_size`
2. **Frontend đọc sai response**: Backend trả về `page_size` và `total_pages` nhưng frontend đọc `limit` và `totalPages`
3. **Header issue**: ListingDetailPageEnhanced đã có Layout wrapper, có thể do CSS hoặc React error

## Giải pháp

### 1. Fix Pagination Parameters ✅

**File**: `apps/frontend/src/pages/DiscoverPage.tsx`

**Thay đổi**:
```typescript
// Trước
params.append('limit', pagination.limit.toString());

// Sau
params.append('page_size', pagination.limit.toString());
```

### 2. Fix Pagination Response Mapping ✅

**File**: `apps/frontend/src/pages/DiscoverPage.tsx`

**Thay đổi**:
```typescript
// Trước
setPagination({
  page: result.pagination.page || pagination.page,
  limit: result.pagination.limit || pagination.limit,
  total: result.pagination.total || 0,
  totalPages: result.pagination.totalPages || 0,
});

// Sau
setPagination({
  page: result.pagination.page || pagination.page,
  limit: result.pagination.page_size || pagination.limit,
  total: result.pagination.total || 0,
  totalPages: result.pagination.total_pages || 0,
});
```

### 3. Thêm Console Logs để Debug ✅

```typescript
console.log('📊 Pagination:', result.pagination);
```

### 4. Pagination UI ✅

Đã thêm pagination controls với:
- Nút "← Trước" và "Sau →"
- Hiển thị số trang (1, 2, 3, 4, 5)
- Active page highlight màu xanh
- Disabled state khi ở trang đầu/cuối

## Backend API Response Format

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 12,
    "total": 50,
    "total_pages": 5
  }
}
```

## Frontend State

```typescript
const [pagination, setPagination] = useState({
  page: 1,
  limit: 12,        // Số items per page
  total: 0,         // Tổng số items
  totalPages: 0,    // Tổng số pages
});
```

## Test Steps

1. **Hard refresh**: `Ctrl + Shift + R`
2. **Mở DevTools Console**
3. **Vào trang**: `http://localhost:5173/discover`
4. **Kiểm tra console**:
   - `🔍 Fetching listings with URL: ...page=1&page_size=12`
   - `📊 Pagination: { page: 1, page_size: 12, total: X, total_pages: Y }`
5. **Kiểm tra UI**:
   - Hiển thị 12 items per page
   - Pagination controls ở dưới cùng
   - Click số trang để chuyển trang
6. **Test header**:
   - Click vào 1 listing
   - Kiểm tra header có hiển thị không
   - Nếu không, check Console cho React errors

## Header Issue Debug

Nếu header vẫn bị mất:

1. **Check Layout wrapper**:
   ```tsx
   // ListingDetailPageEnhanced.tsx đã có:
   return (
     <Layout userRole="TENANT">
       {/* content */}
     </Layout>
   );
   ```

2. **Check CSS**:
   - Inspect element header
   - Xem có `display: none` hoặc `visibility: hidden` không
   - Check z-index conflicts

3. **Check React errors**:
   - Mở Console
   - Tìm error messages màu đỏ
   - Fix errors nếu có

4. **Check route**:
   ```tsx
   // App.tsx
   <Route path="/listings/:id" element={
     <PrivateRoute>
       <ListingDetailPageEnhanced />
     </PrivateRoute>
   } />
   ```

## Files Changed

1. `apps/frontend/src/pages/DiscoverPage.tsx`
   - Fix pagination params: `limit` → `page_size`
   - Fix pagination response mapping
   - Add console logs
   - Add pagination UI controls

## Expected Behavior

### Discover Page
- Hiển thị 12 listings per page
- Pagination controls ở dưới
- Click số trang để chuyển
- Total count hiển thị đúng

### Detail Page
- Header hiển thị đầy đủ
- Sidebar menu hoạt động
- Back button hoạt động
- Layout consistent với Discover page

## Notes

- Backend API `/marketplace/discover` đã support pagination từ đầu
- Frontend chỉ cần gửi đúng params và đọc đúng response
- ListingDetailPageEnhanced đã có Layout, nếu header không hiển thị có thể do CSS hoặc React error

