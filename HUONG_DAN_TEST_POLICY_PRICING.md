# 🧪 Hướng Dẫn Test Policy-Based Pricing

## ✅ Chuẩn bị

- Backend đang chạy: http://localhost:3000 ✓
- Frontend đang chạy: http://localhost:5173 ✓
- Đã đăng nhập với role Landlord ✓

---

## 📝 TEST 1: Kiểm tra Pricing Policies

### Bước 1.1: Xem danh sách policies
1. Mở trình duyệt: http://localhost:5173
2. Đăng nhập (nếu chưa)
3. Click vào sidebar: **"💵 Chính sách giá"**
4. **Kỳ vọng:** 
   - Hiển thị 10 sample policies
   - Có filter: Tất cả, Đang hoạt động, Không hoạt động
   - Mỗi policy hiển thị: tên, giá, loại hình, trạng thái

### Bước 1.2: Xem chi tiết policy
1. Click vào nút **"👁️ Xem chi tiết"** của bất kỳ policy nào
2. **Kỳ vọng:**
   - Modal hiển thị đầy đủ thông tin:
     - Tên policy
     - Loại hình (property_category)
     - Thời hạn thuê (rental_duration_type)
     - Giá cơ bản
     - Các phí (deposit, service_fee, v.v.)

### Bước 1.3: Tạo policy mới (Optional)
1. Click **"+ Tạo Chính sách Giá"**
2. Chọn loại hình: **RESIDENTIAL - LONG_TERM**
3. Điền thông tin:
   - Tên: "Test Policy - Căn hộ 2PN"
   - Giá cơ bản: 8,000,000 VNĐ
   - Tiền cọc: 16,000,000 VNĐ
4. Click **"Tạo chính sách"**
5. **Kỳ vọng:** Policy mới xuất hiện trong danh sách

---

## 📝 TEST 2: Tạo Rentable Item với Policy

### Bước 2.1: Vào trang tạo Rentable Item
1. Click sidebar: **"🏠 Tài sản"**
2. Chọn 1 asset bất kỳ
3. Click **"+ Thêm Rentable Item"**

### Bước 2.2: Chọn loại hình
1. Chọn loại hình: **APARTMENT** (Căn hộ)
2. **Kỳ vọng:**
   - Form chuyển sang bước 2
   - Hiển thị các section: Thông tin cơ bản, Location, Chính sách Giá, v.v.

### Bước 2.3: Kiểm tra Policy Selector
1. Scroll xuống section **"💰 Chính sách Giá"**
2. **Kỳ vọng:**
   - Hiển thị dropdown "Chọn chính sách giá"
   - Danh sách chỉ hiển thị policies phù hợp với APARTMENT - LONG_TERM
   - Mỗi policy hiển thị: tên, giá, thời gian thuê tối thiểu

### Bước 2.4: Chọn policy
1. Click vào 1 policy trong danh sách
2. **Kỳ vọng:**
   - Policy được highlight (border xanh, background xanh nhạt)
   - Hiển thị badge "✓ Đã chọn"
   - Hiển thị box màu xanh lá: "✅ Sử dụng chính sách: [Tên policy]"
   - Box này hiển thị tóm tắt giá từ policy

### Bước 2.5: Kiểm tra auto-fill
1. Mở DevTools (F12) → Console
2. Gõ: `console.log(formData)` (nếu có access)
3. **Kỳ vọng:** Các field sau đã được điền tự động:
   ```
   pricing_policy_id: "uuid-của-policy"
   pricing_policy_version: 1
   base_price: 8000000
   price_unit: "MONTH"
   min_rent_duration: 1
   deposit_amount: 16000000
   service_fee: 500000
   building_mgmt_fee: 300000
   ```

### Bước 2.6: Điền thông tin còn lại
1. **Thông tin cơ bản:**
   - Mã: `APT-101-TEST`
   - Space Node: Chọn bất kỳ

2. **Location:**
   - Địa chỉ: `123 Nguyễn Huệ, Quận 1`
   - Tỉnh: `Hồ Chí Minh`
   - Quận: `Quận 1`

3. **Physical:**
   - Diện tích: `50` m²
   - Phòng ngủ: `2`
   - Phòng tắm: `1`

4. Click **"Tạo mới"**

5. **Kỳ vọng:**
   - Thông báo "Tạo thành công"
   - Item mới xuất hiện trong danh sách

---

## 📝 TEST 3: Kiểm tra Override Giá

### Bước 3.1: Tạo item mới với override
1. Lặp lại TEST 2 đến bước 2.4 (chọn policy)
2. Sau khi chọn policy, tìm checkbox: **"Cho phép ghi đè giá"**
3. Click vào checkbox này

### Bước 3.2: Kiểm tra UI override
**Kỳ vọng:**
- Hiển thị box màu vàng: "⚠️ Ghi đè giá riêng cho item này"
- Các field giá có border màu vàng và background vàng nhạt:
  - Giá cơ bản
  - Thời gian thuê tối thiểu
  - Tiền đặt cọc
  - Phí dịch vụ
  - Phí quản lý tòa nhà

### Bước 3.3: Thay đổi giá
1. Sửa **Giá cơ bản** từ 8,000,000 → **10,000,000**
2. Sửa **Tiền đặt cọc** từ 16,000,000 → **20,000,000**
3. Điền thông tin còn lại:
   - Mã: `APT-102-OVERRIDE`
   - Space Node, Location, Physical (tương tự TEST 2)
4. Click **"Tạo mới"**

### Bước 3.4: Xác nhận override
1. Vào danh sách Rentable Items
2. Tìm item `APT-102-OVERRIDE`
3. Click xem chi tiết
4. **Kỳ vọng:**
   - Giá hiển thị: **10,000,000 VNĐ** (giá đã override)
   - Tiền cọc: **20,000,000 VNĐ**
   - Vẫn có thông tin pricing_policy_id (link đến policy gốc)

---

## 📝 TEST 4: Kiểm tra Database

### Bước 4.1: Query database
Mở terminal và chạy:

```powershell
cd apps/backend
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.rentableItem.findFirst({
  where: { code: 'APT-102-OVERRIDE' },
  select: {
    code: true,
    pricing_policy_id: true,
    pricing_policy_version: true,
    pricing_snapshot_at: true,
    base_price: true,
    deposit_amount: true,
  }
}).then(item => {
  console.log(JSON.stringify(item, null, 2));
  process.exit(0);
});
"
```

### Bước 4.2: Xác nhận kết quả
**Kỳ vọng output:**
```json
{
  "code": "APT-102-OVERRIDE",
  "pricing_policy_id": "uuid-của-policy",
  "pricing_policy_version": 1,
  "pricing_snapshot_at": "2026-01-16T...",
  "base_price": 10000000,
  "deposit_amount": 20000000
}
```

---

## 📝 TEST 5: Kiểm tra Listing (Nếu có)

### Bước 5.1: Tạo listing từ item
1. Vào danh sách Rentable Items
2. Tìm item `APT-102-OVERRIDE`
3. Click **"Tạo Listing"** (nếu có button này)
4. **Kỳ vọng:**
   - Form tạo listing tự động điền giá từ rentable item
   - Giá = 10,000,000 VNĐ (giá đã override)

### Bước 5.2: Xem listing detail
1. Vào trang Discover hoặc Listings
2. Tìm listing vừa tạo
3. Click xem chi tiết
4. **Kỳ vọng:**
   - Giá hiển thị: **10,000,000 VNĐ/tháng**
   - Tiền cọc: **20,000,000 VNĐ**

---

## 🐛 Troubleshooting

### Lỗi 1: Dropdown không hiển thị policies
**Nguyên nhân:** API không trả về data hoặc filter sai

**Cách fix:**
1. Mở DevTools → Network tab
2. Tìm request: `GET /api/v1/pricing-policies?property_category=...`
3. Kiểm tra response có data không
4. Nếu không có data → Tạo policy mới cho loại hình đó

### Lỗi 2: Giá không tự động điền
**Nguyên nhân:** handlePolicySelect không hoạt động

**Cách fix:**
1. Mở DevTools → Console
2. Kiểm tra có lỗi JavaScript không
3. Thử refresh trang và chọn lại policy

### Lỗi 3: Lưu item bị lỗi 400
**Nguyên nhân:** Validation lỗi hoặc thiếu field bắt buộc

**Cách fix:**
1. Mở DevTools → Network tab
2. Tìm request POST `/api/v1/rentable-items`
3. Xem response error message
4. Điền đầy đủ các field bắt buộc (code, space_node_id, base_price, area_sqm)

### Lỗi 4: Override không hoạt động
**Nguyên nhân:** Checkbox không trigger handleOverrideChange

**Cách fix:**
1. Kiểm tra console có lỗi không
2. Thử uncheck và check lại checkbox
3. Nếu vẫn lỗi → Refresh trang và thử lại

---

## ✅ Checklist Tổng Hợp

- [ ] Xem được danh sách 10 pricing policies
- [ ] Tạo được policy mới
- [ ] Edit được policy
- [ ] Dropdown policy selector hiển thị đúng
- [ ] Chọn policy → giá tự động điền
- [ ] Tạo item với policy thành công
- [ ] Override giá hoạt động
- [ ] Database lưu đúng pricing_policy_id
- [ ] Database lưu đúng giá đã override
- [ ] Listing hiển thị đúng giá từ item

---

## 🎉 Kết luận

Nếu tất cả các test đều PASS → Hệ thống Policy-Based Pricing hoạt động hoàn hảo!

Nếu có lỗi → Báo lại để tôi fix ngay!
