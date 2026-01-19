# 🧪 HƯỚNG DẪN TEST CHI TIẾT - PHASE 2 & 3

## 📋 TỔNG QUAN

Tài liệu này hướng dẫn chi tiết cách test 6 tính năng mới đã được implement.

---

## 🎯 CÁC TÍNH NĂNG CẦN TEST

1. ✅ Áp Dụng Chính Sách Giá Trong Booking
2. ✅ Gợi Ý Thông Minh
3. ✅ Phát Hiện Xung Đột Chính Sách
4. ✅ Tin Đăng Nổi Bật
5. ✅ Lọc Booking Theo Tenant
6. ✅ Kiểm Tra Phụ Thuộc Chính Sách

---

## 🧪 TEST 1: ÁP DỤNG CHÍNH SÁCH GIÁ

### Mục Đích
Kiểm tra xem giá có tự động điều chỉnh theo chính sách không.

### Các Loại Chính Sách

#### A. Chính Sách Theo Mùa (SEASONAL)

**Bước 1: Tạo chính sách mùa hè**
```bash
POST http://localhost:3000/api/v1/pricing-policies
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mùa Hè Cao Điểm 2026",
  "policy_type": "SEASONAL",
  "config": {
    "base_amount": 500000,
    "currency": "VND",
    "high_season_months": [6, 7, 8],
    "high_season_multiplier": 1.3,
    "low_season_months": [11, 12, 1, 2],
    "low_season_multiplier": 0.8,
    "weekend_multiplier": 1.15
  },
  "effective_from": "2026-01-01T00:00:00Z",
  "effective_to": "2026-12-31T23:59:59Z"
}
```

**Bước 2: Kích hoạt chính sách**
```bash
POST http://localhost:3000/api/v1/pricing-policies/{policy_id}/activate
Authorization: Bearer {token}
```

**Bước 3: Gán cho BĐS**
```bash
PUT http://localhost:3000/api/v1/rentable-items/{item_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "pricing_policy_id": "{policy_id}"
}
```

**Bước 4: Test tính giá mùa hè (tháng 7)**
```bash
POST http://localhost:3000/api/v1/bookings/calculate-price
Authorization: Bearer {token}
Content-Type: application/json

{
  "rentable_item_id": "{item_id}",
  "start_date": "2026-07-01T14:00:00Z",
  "end_date": "2026-07-05T11:00:00Z",
  "guests": {
    "adults": 2,
    "children": 0,
    "infants": 0
  }
}
```

**Kết quả mong đợi:**
- `base_price` được nhân với 1.3
- Trong `breakdown` có dòng "Điều chỉnh chính sách giá: Mùa Hè Cao Điểm 2026"
- Nếu là cuối tuần, thêm nhân 1.15

**Bước 5: Test tính giá mùa đông (tháng 12)**
```bash
POST http://localhost:3000/api/v1/bookings/calculate-price
Authorization: Bearer {token}
Content-Type: application/json

{
  "rentable_item_id": "{item_id}",
  "start_date": "2026-12-01T14:00:00Z",
  "end_date": "2026-12-05T11:00:00Z",
  "guests": {
    "adults": 2,
    "children": 0,
    "infants": 0
  }
}
```

**Kết quả mong đợi:**
- `base_price` được nhân với 0.8 (giảm 20%)

---

#### B. Chính Sách Khuyến Mãi (PROMOTIONAL)

**Bước 1: Tạo chính sách khuyến mãi**
```bash
POST http://localhost:3000/api/v1/pricing-policies
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Khuyến Mãi Khai Trương",
  "policy_type": "PROMOTIONAL",
  "config": {
    "base_amount": 500000,
    "currency": "VND",
    "discount_type": "PERCENTAGE",
    "discount_value": 20
  },
  "effective_from": "2026-01-01T00:00:00Z",
  "effective_to": "2026-01-31T23:59:59Z"
}
```

**Bước 2: Kích hoạt và gán cho BĐS**
(Tương tự như trên)

**Bước 3: Test tính giá**
```bash
POST http://localhost:3000/api/v1/bookings/calculate-price
Authorization: Bearer {token}
Content-Type: application/json

{
  "rentable_item_id": "{item_id}",
  "start_date": "2026-01-15T14:00:00Z",
  "end_date": "2026-01-18T11:00:00Z",
  "guests": {
    "adults": 2
  }
}
```

**Kết quả mong đợi:**
- Giá giảm 20%
- Breakdown hiển thị điều chỉnh chính sách

---

#### C. Chính Sách Tùy Chỉnh (CUSTOM)

**Bước 1: Tạo chính sách giảm giá thuê dài**
```bash
POST http://localhost:3000/api/v1/pricing-policies
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Giảm Giá Thuê Dài Hạn",
  "policy_type": "CUSTOM",
  "config": {
    "base_amount": 500000,
    "currency": "VND",
    "duration_discounts": [
      {
        "min_nights": 7,
        "discount_percent": 10
      },
      {
        "min_nights": 30,
        "discount_percent": 20
      }
    ]
  }
}
```

**Bước 2: Test với 10 đêm**
```bash
POST http://localhost:3000/api/v1/bookings/calculate-price
Authorization: Bearer {token}
Content-Type: application/json

{
  "rentable_item_id": "{item_id}",
  "start_date": "2026-02-01T14:00:00Z",
  "end_date": "2026-02-11T11:00:00Z",
  "guests": {
    "adults": 2
  }
}
```

**Kết quả mong đợi:**
- Giảm 10% (vì >= 7 đêm)

---

## 🧪 TEST 2: GỢI Ý THÔNG MINH

### A. Gợi Ý Chung (Không Có Ngữ Cảnh)

**Request:**
```bash
GET http://localhost:3000/api/v1/marketplace/recommended?limit=6
```

**Kết quả mong đợi:**
- Trả về 6 tin đăng
- Sắp xếp theo điểm số (property type, price, views, recency)
- Response format:
```json
{
  "data": [
    {
      "id": "xxx",
      "title": "...",
      "view_count": 150,
      "created_at": "...",
      "pricing_display": {
        "from_amount": 500000
      }
    }
  ]
}
```

---

### B. Gợi Ý Theo Ngữ Cảnh

**Bước 1: Lấy ID của một tin đăng**
```bash
GET http://localhost:3000/api/v1/marketplace/discover?page=1&page_size=1
```

**Bước 2: Lấy gợi ý dựa trên tin đó**
```bash
GET http://localhost:3000/api/v1/marketplace/recommended?limit=6&context_listing_id={listing_id}
```

**Kết quả mong đợi:**
- Trả về 6 tin đăng tương tự
- Ưu tiên cùng loại BĐS (property_category)
- Ưu tiên giá tương tự (±30%)
- Không bao gồm tin đăng hiện tại

---

### C. Kiểm Tra Thuật Toán Chấm Điểm

**Công thức:**
```
điểm = 
  (cùng_loại_BĐS ? 40 : 0) +
  (giá_tương_tự ? 30 : 0) +
  min(20, lượt_xem / 10) +
  max(0, 10 - số_ngày_tạo / 3)
```

**Ví dụ:**
- Tin A: Cùng loại, giá tương tự, 100 views, 5 ngày tuổi
  - Điểm = 40 + 30 + 10 + 8.33 = 88.33
- Tin B: Khác loại, giá khác, 200 views, 30 ngày tuổi
  - Điểm = 0 + 0 + 20 + 0 = 20

→ Tin A được ưu tiên hơn

---

## 🧪 TEST 3: PHÁT HIỆN XUNG ĐỘT CHÍNH SÁCH

### A. Xung Đột Trùng Ngày Tháng (DATE_OVERLAP)

**Bước 1: Tạo chính sách mùa hè**
```bash
POST http://localhost:3000/api/v1/pricing-policies
{
  "name": "Mùa Hè 2026",
  "policy_type": "SEASONAL",
  "config": {
    "high_season_months": [6, 7, 8],
    "high_season_multiplier": 1.3
  }
}
```

**Bước 2: Tạo chính sách tháng 7 (trùng với mùa hè)**
```bash
POST http://localhost:3000/api/v1/pricing-policies
{
  "name": "Khuyến Mãi Tháng 7",
  "policy_type": "SEASONAL",
  "config": {
    "high_season_months": [7],
    "high_season_multiplier": 1.5
  }
}
```

**Bước 3: Kiểm tra xung đột**
```bash
GET http://localhost:3000/api/v1/pricing-policies/{policy_id}/conflicts
Authorization: Bearer {token}
```

**Kết quả mong đợi:**
```json
{
  "has_conflicts": true,
  "conflict_count": 1,
  "conflicts": [
    {
      "policy_id": "xxx",
      "policy_name": "Khuyến Mãi Tháng 7",
      "conflict_type": "DATE_OVERLAP",
      "severity": "HIGH",
      "description": "Seasonal date ranges overlap"
    }
  ]
}
```

---

### B. Xung Đột Khuyến Mãi (PROMOTIONAL_OVERLAP)

**Bước 1: Tạo 2 chính sách khuyến mãi cùng thời gian**
```bash
# Khuyến mãi 1
POST http://localhost:3000/api/v1/pricing-policies
{
  "name": "Khuyến Mãi Tết",
  "policy_type": "PROMOTIONAL",
  "config": {
    "discount_type": "PERCENTAGE",
    "discount_value": 20
  },
  "effective_from": "2026-01-20T00:00:00Z",
  "effective_to": "2026-02-10T23:59:59Z"
}

# Khuyến mãi 2 (trùng thời gian)
POST http://localhost:3000/api/v1/pricing-policies
{
  "name": "Khuyến Mãi Đầu Năm",
  "policy_type": "PROMOTIONAL",
  "config": {
    "discount_type": "FIXED_AMOUNT",
    "discount_value": 100000
  },
  "effective_from": "2026-01-01T00:00:00Z",
  "effective_to": "2026-01-31T23:59:59Z"
}
```

**Bước 2: Kiểm tra xung đột**
```bash
GET http://localhost:3000/api/v1/pricing-policies/{policy_id}/conflicts
```

**Kết quả mong đợi:**
- Phát hiện xung đột PROMOTIONAL_OVERLAP
- Severity: LOW

---

## 🧪 TEST 4: TIN ĐĂNG NỔI BẬT

### A. Đánh Dấu Tin Nổi Bật

**Bước 1: Cập nhật tin đăng**
```bash
PUT http://localhost:3000/api/v1/listings/{listing_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_featured": true
}
```

**Bước 2: Lấy danh sách tin nổi bật**
```bash
GET http://localhost:3000/api/v1/marketplace/featured?limit=6
```

**Kết quả mong đợi:**
- Chỉ trả về tin có `is_featured = true`
- Sắp xếp theo `view_count` DESC, sau đó `created_at` DESC

---

### B. Tăng Lượt Xem

**Bước 1: Xem chi tiết tin đăng**
```bash
GET http://localhost:3000/api/v1/marketplace/listings/{listing_id}
```

**Bước 2: Kiểm tra lượt xem tăng**
```bash
GET http://localhost:3000/api/v1/marketplace/listings/{listing_id}
```

**Kết quả mong đợi:**
- `view_count` tăng lên 1
- `last_viewed_at` được cập nhật

---

## 🧪 TEST 5: LỌC BOOKING THEO TENANT

**Bước 1: Đăng nhập với tài khoản tenant**
```bash
POST http://localhost:3000/api/v1/auth/login
{
  "email": "tenant@test.com",
  "password": "password123"
}
```

**Bước 2: Lấy danh sách booking**
```bash
GET http://localhost:3000/api/v1/bookings
Authorization: Bearer {tenant_token}
```

**Kết quả mong đợi:**
- Chỉ trả về booking của tenant đó
- Không thấy booking của tenant khác

---

## 🧪 TEST 6: KIỂM TRA PHỤ THUỘC CHÍNH SÁCH

**Bước 1: Gán chính sách cho BĐS**
```bash
PUT http://localhost:3000/api/v1/rentable-items/{item_id}
{
  "pricing_policy_id": "{policy_id}"
}
```

**Bước 2: Thử xóa chính sách**
```bash
DELETE http://localhost:3000/api/v1/pricing-policies/{policy_id}
Authorization: Bearer {token}
```

**Kết quả mong đợi:**
```json
{
  "error_code": "POLICY_IN_USE",
  "message": "Cannot delete policy. It is being used in 1 rentable item(s). Please remove the policy from all items first.",
  "details": {
    "usage_count": 1
  }
}
```

---

## 📊 BẢNG KIỂM TRA TỔNG HỢP

| Tính Năng | Test Case | Kết Quả |
|-----------|-----------|---------|
| Chính sách theo mùa | Giá mùa hè × 1.3 | [ ] |
| Chính sách theo mùa | Giá mùa đông × 0.8 | [ ] |
| Chính sách theo mùa | Phụ thu cuối tuần × 1.15 | [ ] |
| Chính sách khuyến mãi | Giảm 20% | [ ] |
| Chính sách tùy chỉnh | Giảm 10% cho 7+ đêm | [ ] |
| Gợi ý chung | Trả về 6 tin | [ ] |
| Gợi ý theo ngữ cảnh | Ưu tiên cùng loại | [ ] |
| Phát hiện xung đột | DATE_OVERLAP | [ ] |
| Phát hiện xung đột | PROMOTIONAL_OVERLAP | [ ] |
| Tin nổi bật | Sắp xếp theo views | [ ] |
| Tăng lượt xem | view_count +1 | [ ] |
| Lọc booking | Chỉ thấy của mình | [ ] |
| Kiểm tra phụ thuộc | Không xóa được | [ ] |

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi 1: "Unauthorized"
**Nguyên nhân**: Chưa đăng nhập hoặc token hết hạn  
**Giải pháp**: Đăng nhập lại

### Lỗi 2: "Policy not found"
**Nguyên nhân**: Chính sách chưa được kích hoạt  
**Giải pháp**: Gọi endpoint `/activate`

### Lỗi 3: "No recommendations"
**Nguyên nhân**: Không có tin đăng published  
**Giải pháp**: Publish ít nhất 6 tin đăng

### Lỗi 4: Giá không thay đổi
**Nguyên nhân**: 
- Chính sách chưa ACTIVE
- Chưa gán pricing_policy_id cho BĐS
- Ngày booking không khớp với quy tắc

**Giải pháp**: Kiểm tra lại các điều kiện trên

---

## 🎉 HOÀN THÀNH

Sau khi test xong tất cả, bạn sẽ có:
- ✅ Hệ thống giá tự động hoạt động
- ✅ Gợi ý thông minh chính xác
- ✅ Phát hiện xung đột hiệu quả
- ✅ Tin nổi bật được ưu tiên
- ✅ Bảo mật dữ liệu booking
- ✅ Toàn vẹn dữ liệu chính sách

**Chúc mừng! Hệ thống sẵn sàng production! 🚀**

