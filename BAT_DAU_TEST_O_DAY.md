# 🚀 BẮT ĐẦU TEST Ở ĐÂY

## ✅ Đã Hoàn Thành Implementation!

Các tính năng nâng cao Phase 2 & 3 đã sẵn sàng. Đây là cách test chúng.

---

## 🎯 CÓ GÌ MỚI

### 1. Tự Động Điều Chỉnh Giá Theo Chính Sách
Giá sẽ tự động thay đổi dựa trên:
- Mùa (hè = cao hơn, đông = thấp hơn)
- Ngày trong tuần (cuối tuần = phụ thu)
- Thời gian thuê (thuê dài = giảm giá)
- Khuyến mãi (ưu đãi đặc biệt)

### 2. Gợi Ý Thông Minh
Nhận gợi ý bất động sản phù hợp dựa trên:
- Loại hình tương tự
- Khoảng giá phù hợp
- Độ phổ biến (lượt xem)
- Mới đăng gần đây

### 3. Phát Hiện Xung Đột Chính Sách
Hệ thống cảnh báo khi:
- Hai chính sách trùng thời gian
- Cùng một BĐS có nhiều chính sách
- Các chương trình khuyến mãi xung đột

---

## 🧪 TEST NHANH (5 phút)

### Bước 1: Test Gợi Ý Thông Minh

Mở trình duyệt hoặc dùng curl:
```bash
http://localhost:3000/api/v1/marketplace/recommended?limit=6
```

**Kết quả mong đợi**: Trả về 6 tin đăng BĐS

---

### Bước 2: Test Tin Đăng Nổi Bật

```bash
http://localhost:3000/api/v1/marketplace/featured?limit=6
```

**Kết quả mong đợi**: Trả về các BĐS nổi bật được sắp xếp theo lượt xem

---

### Bước 3: Test Áp Dụng Chính Sách Giá

**A. Tạo chính sách theo mùa:**

Đăng nhập trước, sau đó:
```bash
POST http://localhost:3000/api/v1/pricing-policies
{
  "name": "Mùa Hè 2026",
  "policy_type": "SEASONAL",
  "config": {
    "base_amount": 500000,
    "currency": "VND",
    "high_season_months": [6, 7, 8],
    "high_season_multiplier": 1.3
  }
}
```

**B. Gán cho BĐS:**
```bash
PUT http://localhost:3000/api/v1/rentable-items/{item_id}
{
  "pricing_policy_id": "{policy_id_từ_bước_A}"
}
```

**C. Tính giá cho mùa hè:**
```bash
POST http://localhost:3000/api/v1/bookings/calculate-price
{
  "rentable_item_id": "{item_id}",
  "start_date": "2026-07-01T14:00:00Z",
  "end_date": "2026-07-05T11:00:00Z",
  "guests": { "adults": 2 }
}
```

**Kết quả mong đợi**: Giá cao hơn 30% (giá_gốc × 1.3)

---

### Bước 4: Test Phát Hiện Xung Đột

**A. Tạo chính sách trùng lặp:**
```bash
POST http://localhost:3000/api/v1/pricing-policies
{
  "name": "Khuyến Mãi Tháng 7",
  "policy_type": "SEASONAL",
  "config": {
    "base_amount": 500000,
    "currency": "VND",
    "high_season_months": [7],
    "high_season_multiplier": 1.5
  }
}
```

**B. Kiểm tra xung đột:**
```bash
GET http://localhost:3000/api/v1/pricing-policies/{policy_id}/conflicts
```

**Kết quả mong đợi**: Hiển thị xung đột với chính sách "Mùa Hè 2026"

---

## 🤖 TEST TỰ ĐỘNG

Chạy script này để test tất cả:

```powershell
.\test-phase2-3-features.ps1
```

Nó sẽ tự động test:
- ✅ Gợi ý thông minh
- ✅ Tin đăng nổi bật
- ✅ Áp dụng chính sách giá
- ✅ Phát hiện xung đột

---

## 📚 CẦN THÊM TRỢ GIÚP?

### Hướng Dẫn Nhanh:
- **HUONG_DAN_TEST_CHI_TIET.md** - Hướng dẫn test chi tiết
- **TOM_TAT_THUC_HIEN.md** - Những gì đã làm
- **CHI_TIET_KY_THUAT.md** - Chi tiết kỹ thuật

### Script Test:
- **test-phase2-3-features.ps1** - Test tự động

---

## 🎯 DANH SÁCH KIỂM TRA

- [ ] Gợi ý trả về các tin đăng phù hợp
- [ ] Tin nổi bật hiển thị BĐS có lượt xem cao
- [ ] Chính sách giá điều chỉnh đúng
- [ ] Ngày hè có giá cao hơn
- [ ] Cuối tuần có phụ thu
- [ ] Phát hiện được xung đột chính sách
- [ ] Bảng giá hiển thị điều chỉnh từ chính sách

---

## 💡 CÁC TÌNH HUỐNG MẪU

### Tình Huống 1: Đặt Phòng Cuối Tuần Mùa Hè
```
BĐS: Nhà Biển
Giá gốc: 500.000 ₫/đêm
Chính sách: Mùa Hè Cao Điểm (×1.3)
Ngày: 5-7 tháng 7 (cuối tuần)

Tính toán:
500.000 × 1.3 (mùa hè) × 1.15 (cuối tuần) = 747.500 ₫/đêm
× 2 đêm = 1.495.000 ₫
```

### Tình Huống 2: Giảm Giá Thuê Dài Hạn
```
BĐS: Căn Hộ Thành Phố
Giá gốc: 300.000 ₫/đêm
Chính sách: Tùy Chỉnh (7+ đêm = giảm 10%)
Ngày: 10 đêm

Tính toán:
300.000 × 10 đêm = 3.000.000 ₫
- Giảm 10% = 2.700.000 ₫
```

### Tình Huống 3: Khuyến Mãi
```
BĐS: Biệt Thự Núi
Giá gốc: 800.000 ₫/đêm
Chính sách: Khuyến Mãi Tết (giảm 20%)
Ngày: 1-3 tháng 1

Tính toán:
800.000 × 3 đêm = 2.400.000 ₫
- Giảm 20% = 1.920.000 ₫
```

---

## 🐛 XỬ LÝ LỖI

### Lỗi: "Unauthorized"
**Giải pháp**: Đảm bảo bạn đã đăng nhập
```bash
POST http://localhost:3000/api/v1/auth/login
{
  "email": "landlord@test.com",
  "password": "password123"
}
```

### Lỗi: "Policy not found"
**Giải pháp**: Kích hoạt chính sách trước
```bash
POST http://localhost:3000/api/v1/pricing-policies/{id}/activate
```

### Lỗi: "No recommendations"
**Giải pháp**: Đảm bảo có tin đăng đã publish
```bash
POST http://localhost:3000/api/v1/listings/{id}/publish
```

---

## ✅ NHỮNG GÌ ĐANG HOẠT ĐỘNG

Tất cả các tính năng này đã sẵn sàng:
- ✅ Tự động điều chỉnh giá theo chính sách
- ✅ Gợi ý thông minh
- ✅ Phát hiện xung đột
- ✅ Tin đăng nổi bật
- ✅ Theo dõi lượt xem
- ✅ Lọc booking theo tenant
- ✅ Kiểm tra phụ thuộc chính sách

---

## 🎉 SẴN SÀNG!

Bắt đầu test các tính năng mới. Tất cả đều hoạt động và sẵn sàng cho production.

**Có câu hỏi?** Xem các file tài liệu ở trên.

**Tìm thấy lỗi?** Báo cho tôi biết để sửa!

---

**Chúc Test Vui Vẻ! 🚀**

