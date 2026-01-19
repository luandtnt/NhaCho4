# 📋 HƯỚNG DẪN TEST ỨNG DỤNG URP

## 🎯 TỔNG QUAN DỰ ÁN

### Thông tin cơ bản
- **Tên dự án**: URP (Universal Rental Platform)
- **Mô tả**: Hệ thống quản lý cho thuê bất động sản toàn diện
- **Công nghệ**: NestJS (Backend) + React + TypeScript (Frontend)
- **Database**: PostgreSQL
- **Trạng thái**:   Hoàn thành 100% - Sẵn sàng test

### Thông tin đăng nhập
```
Chủ nhà (Landlord):
- Email: landlord@example.com
- Password: Password123!

Người thuê (Tenant):
- Email: tenant@example.com
- Password: Password123!
```

### URL ứng dụng
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **API Docs**: http://localhost:3000/api

---

## 📊 TỔNG HỢP CHỨC NĂNG

### 🏠 VAI TRÒ CHỦ NHÀ (LANDLORD) - 16 Chức năng

#### 1. **Quản lý Tài sản (Assets Management)**
- Tạo/sửa/xóa tài sản
- Quản lý thông tin: tên, địa chỉ, loại tài sản
- Xem danh sách tất cả tài sản

#### 2. **Cấu trúc Không gian (Space Graph)**
- Tạo cấu trúc phân cấp: Tầng → Phòng → Giường
- Thêm/sửa/xóa node trong cây không gian
- Tạo hàng loạt node (bulk create)
- Xem cây phân cấp trực quan

#### 3. **Đơn vị cho thuê (Rentable Items)**
- Tạo rentable items từ space nodes
- Quản lý trạng thái: AVAILABLE, OCCUPIED, MAINTENANCE
- Gán giá và chính sách giá
- Xem danh sách và lọc theo trạng thái

#### 4. **Chính sách Giá (Pricing Policies)**
- Tạo chính sách giá linh hoạt
- Hỗ trợ nhiều loại: FIXED, TIERED, DYNAMIC
- Kích hoạt/vô hiệu hóa chính sách
- Áp dụng cho nhiều rentable items

#### 5. **Lịch & Booking (Availability)**
- Xem lịch trống/đã đặt theo tháng
- Tạo booking mới
- Quản lý trạng thái booking: PENDING, CONFIRMED, CANCELLED
- Xem chi tiết booking

#### 6. **Tin đăng (Listings)**
- Tạo tin đăng từ rentable items
- Quản lý trạng thái: DRAFT, PUBLISHED, ARCHIVED
- Đăng/gỡ tin đăng
- Sao chép tin đăng
- Upload ảnh và mô tả chi tiết

#### 7. **Khách hàng tiềm năng (Leads)**
- Xem danh sách leads từ marketplace
- Quản lý trạng thái: NEW, CONTACTED, QUALIFIED, CONVERTED, LOST
- Thêm ghi chú cho từng lead
- Chuyển đổi lead thành hợp đồng

#### 8. **Hợp đồng (Agreements)**
- Tạo hợp đồng cho thuê
- Quản lý thông tin: người thuê, rentable item, thời hạn, giá
- Trạng thái: DRAFT, ACTIVE, EXPIRED, TERMINATED
- Xem chi tiết hợp đồng

#### 9. **Hóa đơn (Invoices)**
- Tạo hóa đơn từ hợp đồng
- Tự động tính toán theo chính sách giá
- Trạng thái: DRAFT, ISSUED, PAID, OVERDUE, CANCELLED
- Xem chi tiết và lịch sử thanh toán

#### 10. **Thanh toán (Payments)**
- Ghi nhận thanh toán
- Hỗ trợ nhiều phương thức: CASH, BANK_TRANSFER, CREDIT_CARD, E_WALLET
- Liên kết với hóa đơn
- Xem lịch sử thanh toán

#### 11. **Sổ cái (Ledger)**
- Xem tất cả giao dịch tài chính
- Lọc theo loại: DEBIT, CREDIT
- Export dữ liệu CSV
- Đối soát tài chính

#### 12. **Yêu cầu hỗ trợ (Tickets)**
- Xem tất cả yêu cầu từ người thuê
- Quản lý trạng thái: OPEN, IN_PROGRESS, CLOSED
- Phân loại: MAINTENANCE, COMPLAINT, INQUIRY, OTHER
- Mức độ ưu tiên: LOW, MEDIUM, HIGH, URGENT

#### 13. **Báo cáo & Phân tích (Reports)**
- Tỷ lệ lấp đầy (Occupancy Rate)
- Tổng quan doanh thu
- Thống kê yêu cầu hỗ trợ
- Dashboard trực quan

#### 14. **Người dùng & Vai trò (Users & Roles)**
- Mời người dùng mới
- Phân quyền: Landlord, Tenant, Staff
- Quản lý data scope: org, assigned
- Xem danh sách người dùng

#### 15. **Tích hợp (Integrations)**
- Cấu hình Email (SMTP)
- Cấu hình SMS
- Test kết nối
- Quản lý API keys

#### 16. **Cấu hình hệ thống (Config Bundles)**
- Quản lý cấu hình theo môi trường
- Tạo/sửa/xóa config bundles
- Xem chi tiết cấu hình JSON

---

### 👤 VAI TRÒ NGƯỜI THUÊ (TENANT) - 9 Chức năng

#### 1. **Khám phá (Discover)**
- Xem tin đăng nổi bật
- Tìm kiếm nhanh theo địa điểm
- Xem tất cả tin đăng có sẵn
- Giao diện đẹp với ảnh và thông tin chi tiết

#### 2. **Tìm kiếm (Search)**
- Lọc theo địa điểm, loại phòng
- Lọc theo giá (min-max)
- Lọc theo số phòng ngủ, phòng tắm
- Sắp xếp theo giá, ngày đăng
- Phân trang kết quả

#### 3. **Chi tiết Tin đăng (Listing Detail)**
- Xem ảnh gallery
- Xem thông tin đầy đủ
- Xem giá và tiện ích
- Gửi yêu cầu tư vấn

#### 4. **Yêu cầu của tôi (My Inquiries)**
- Xem danh sách yêu cầu đã gửi
- Theo dõi trạng thái: NEW, CONTACTED, QUALIFIED
- Xem chi tiết yêu cầu
- Xem thông tin liên hệ

#### 5. **Hợp đồng của tôi (My Agreements)**
- Xem danh sách hợp đồng
- Trạng thái: ACTIVE, EXPIRED, TERMINATED
- Xem chi tiết hợp đồng
- Thông tin: địa chỉ, giá, thời hạn

#### 6. **Hóa đơn của tôi (My Invoices)**
- Xem danh sách hóa đơn
- Trạng thái: ISSUED, PAID, OVERDUE
- Thanh toán trực tuyến
- Xem chi tiết hóa đơn

#### 7. **Thanh toán của tôi (My Payments)**
- Xem lịch sử thanh toán
- Thông tin: số tiền, phương thức, ngày thanh toán
- Liên kết với hóa đơn
- Xem chi tiết giao dịch

#### 8. **Yêu cầu hỗ trợ (My Tickets)**
- Tạo yêu cầu hỗ trợ mới
- Phân loại: BẢO TRÌ, KHIẾU NẠI, THẮC MẮC
- Mức độ ưu tiên
- Theo dõi trạng thái xử lý

#### 9. **Tài khoản (My Profile)**
- Cập nhật thông tin cá nhân
- Đổi mật khẩu
- Cài đặt thông báo
- Quản lý tùy chọn

---

## CÁC LUỒNG TEST CHÍNH


### LUỒNG 1: Tạo Tài sản và Cấu trúc Không gian (Landlord)

**Mục tiêu**: Tạo tài sản mới và thiết lập cấu trúc phân cấp

**Các bước thực hiện**:

1. **Đăng nhập với tài khoản Landlord**
   - Truy cập: http://localhost:5173/login
   - Email: `landlord@example.com`
   - Password: `Password123!`

2. **Tạo Tài sản mới**
   - Click menu "🏢 Tài sản"
   - Click nút "➕ Tạo tài sản"
   - Nhập thông tin:
     - Tên: "Nhà trọ ABC"
     - Địa chỉ: "123 Đường XYZ, Quận 1, TP.HCM"
     - Loại: "APARTMENT"
   - Click "Tạo"
   - Kiểm tra: Tài sản mới xuất hiện trong danh sách

3. **Tạo Cấu trúc Không gian**
   - Click vào tài sản vừa tạo
   - Chuyển đến trang "⚙️ Cấu hình"
   - Click "Space Graph"
   - Tạo cấu trúc:
     - **Tầng 1**: Click "➕ Thêm Node" → Tên: "Tầng 1", Loại: "floor"
     - **Phòng 101**: Chọn "Tầng 1" → Click "➕ Thêm Node" → Tên: "Phòng 101", Loại: "room"
     - **Giường A**: Chọn "Phòng 101" → Click "➕ Thêm Node" → Tên: "Giường A", Loại: "bed"
   - Kiểm tra: Cây phân cấp hiển thị đúng

4. **Tạo hàng loạt (Bulk Create)**
   - Click "➕ Tạo hàng loạt"
   - Nhập:
     - Prefix: "Phòng"
     - Bắt đầu từ: 102
     - Số lượng: 5
     - Parent: "Tầng 1"
   - Click "Tạo"
   -   Kiểm tra: 5 phòng (102-106) được tạo

**Kết quả mong đợi**:
-   Tài sản được tạo thành công
-   Cấu trúc không gian hiển thị đúng phân cấp
-   Bulk create hoạt động chính xác

---

### LUỒNG 2: Tạo Rentable Items và Chính sách Giá (Landlord)

**Mục tiêu**: Tạo đơn vị cho thuê và áp dụng chính sách giá

**Các bước thực hiện**:

1. **Tạo Chính sách Giá**
   - Click menu "💵 Chính sách giá"
   - Click "➕ Tạo chính sách"
   - Nhập thông tin:
     - Tên: "Giá phòng tiêu chuẩn"
     - Loại: "FIXED"
     - Giá cơ bản: 3000000
     - Đơn vị: "VND"
     - Chu kỳ: "MONTHLY"
   - Click "Tạo"
   - Click "Kích hoạt" trên chính sách vừa tạo
   -   Kiểm tra: Chính sách có trạng thái "ACTIVE"

2. **Tạo Rentable Items**
   - Click vào tài sản "Nhà trọ ABC"
   - Click "Rentable Items"
   - Click "➕ Tạo Rentable Item"
   - Nhập thông tin:
     - Mã: "ROOM-101"
     - Space Node: Chọn "Phòng 101"
     - Chính sách giá: Chọn "Giá phòng tiêu chuẩn"
     - Trạng thái: "AVAILABLE"
   - Click "Tạo"
   -   Kiểm tra: Rentable item xuất hiện với giá 3,000,000 VND/tháng

3. **Tạo thêm Rentable Items**
   - Lặp lại bước 2 cho các phòng 102-106
   - Mã: "ROOM-102", "ROOM-103", ...
   -   Kiểm tra: Tất cả rentable items được tạo

**Kết quả mong đợi**:
-   Chính sách giá được tạo và kích hoạt
-   Rentable items được tạo với giá đúng
-   Trạng thái AVAILABLE hiển thị

---

### 🔵 LUỒNG 3: Tạo và Đăng Tin (Landlord)

**Mục tiêu**: Tạo tin đăng và publish lên marketplace

**Các bước thực hiện**:

1. **Tạo Tin đăng**
   - Click menu "📋 Tin đăng"
   - Click "➕ Tạo tin đăng"
   - Nhập thông tin:
     - Tiêu đề: "Phòng trọ giá rẻ Quận 1"
     - Mô tả: "Phòng sạch sẽ, đầy đủ tiện nghi, gần trường học"
     - Rentable Item: Chọn "ROOM-101"
     - Loại: "ROOM"
     - Số phòng ngủ: 1
     - Số phòng tắm: 1
     - Diện tích: 20
     - Địa chỉ: "123 Đường XYZ, Quận 1, TP.HCM"
     - Giá: 3000000
     - Tiện ích: ["wifi", "điều hòa", "nóng lạnh"]
   - Click "Tạo"
   -   Kiểm tra: Tin đăng có trạng thái "DRAFT"

2. **Đăng Tin**
   - Tìm tin đăng vừa tạo
   - Click nút "Đăng tin"
   -   Kiểm tra: Trạng thái chuyển sang "PUBLISHED"

3. **Tạo thêm tin đăng**
   - Lặp lại bước 1-2 cho ROOM-102, ROOM-103
   - Thay đổi tiêu đề và mô tả cho đa dạng
   -   Kiểm tra: Có ít nhất 3 tin đăng PUBLISHED

**Kết quả mong đợi**:
-   Tin đăng được tạo với trạng thái DRAFT
-   Đăng tin thành công, trạng thái chuyển sang PUBLISHED
-   Tin đăng hiển thị đầy đủ thông tin

---

### 🔵 LUỒNG 4: Khám phá và Gửi Yêu cầu (Tenant)

**Mục tiêu**: Người thuê tìm kiếm và gửi yêu cầu tư vấn

**Các bước thực hiện**:

1. **Đăng xuất và Đăng nhập Tenant**
   - Click "Đăng xuất"
   - Đăng nhập với:
     - Email: `tenant@example.com`
     - Password: `Password123!`

2. **Khám phá Tin đăng**
   - Click menu "🔍 Khám phá"
   -   Kiểm tra: Hiển thị hero section và tin đăng nổi bật
   -   Kiểm tra: Hiển thị danh sách tất cả tin đăng

3. **Tìm kiếm Tin đăng**
   - Click vào thanh tìm kiếm
   - Nhập: "Quận 1"
   - Click "Tìm kiếm"
   -   Kiểm tra: Chuyển đến trang Search với kết quả

4. **Lọc và Sắp xếp**
   - Trên trang Search:
     - Chọn loại: "ROOM"
     - Giá từ: 2000000
     - Giá đến: 5000000
     - Số phòng ngủ: 1
   - Click "Áp dụng bộ lọc"
   - Sắp xếp: "Giá thấp đến cao"
   -   Kiểm tra: Kết quả được lọc và sắp xếp đúng

5. **Xem Chi tiết và Gửi Yêu cầu**
   - Click vào một tin đăng
   -   Kiểm tra: Hiển thị ảnh, mô tả, giá, tiện ích
   - Click "Gửi yêu cầu tư vấn"
   - Nhập thông tin:
     - Họ tên: "Nguyễn Văn A"
     - Email: "nguyenvana@example.com"
     - Số điện thoại: "0901234567"
     - Tin nhắn: "Tôi muốn xem phòng vào cuối tuần"
   - Click "Gửi yêu cầu"
   -   Kiểm tra: Hiển thị thông báo "Gửi yêu cầu thành công!"

6. **Xem Yêu cầu của tôi**
   - Click menu "💬 Yêu cầu của tôi"
   -   Kiểm tra: Yêu cầu vừa gửi hiển thị trong danh sách
   - Click vào yêu cầu để xem chi tiết
   -   Kiểm tra: Hiển thị đầy đủ thông tin

**Kết quả mong đợi**:
-   Marketplace hiển thị tin đăng đúng
-   Tìm kiếm và lọc hoạt động chính xác
-   Gửi yêu cầu thành công
-   Yêu cầu hiển thị trong "Yêu cầu của tôi"

---

### 🔵 LUỒNG 5: Quản lý Leads và Tạo Hợp đồng (Landlord)

**Mục tiêu**: Xử lý leads và chuyển đổi thành hợp đồng

**Các bước thực hiện**:

1. **Đăng nhập Landlord**
   - Đăng xuất Tenant
   - Đăng nhập với `landlord@example.com`

2. **Xem Leads**
   - Click menu "👥 Khách hàng"
   -   Kiểm tra: Hiển thị lead từ yêu cầu của Tenant
   -   Kiểm tra: Trạng thái "NEW"

3. **Cập nhật Lead**
   - Click vào lead
   - Thay đổi trạng thái: "CONTACTED"
   - Thêm ghi chú: "Đã liên hệ, hẹn xem phòng thứ 7"
   - Click "Lưu ghi chú"
   -   Kiểm tra: Ghi chú được lưu

4. **Tạo Hợp đồng**
   - Click menu "📄 Hợp đồng"
   - Click "➕ Tạo hợp đồng"
   - Nhập thông tin:
     - Rentable Item: Chọn "ROOM-101"
     - Người thuê: Nhập email tenant hoặc chọn từ danh sách
     - Ngày bắt đầu: Chọn ngày hiện tại
     - Ngày kết thúc: Chọn sau 12 tháng
     - Giá thuê: 3000000
     - Tiền cọc: 6000000
   - Click "Tạo"
   -   Kiểm tra: Hợp đồng có trạng thái "DRAFT"

5. **Kích hoạt Hợp đồng**
   - Click vào hợp đồng vừa tạo
   - Click "Kích hoạt"
   -   Kiểm tra: Trạng thái chuyển sang "ACTIVE"
   -   Kiểm tra: Rentable Item chuyển sang "OCCUPIED"

**Kết quả mong đợi**:
-   Leads hiển thị đúng từ marketplace
-   Cập nhật trạng thái và ghi chú thành công
-   Hợp đồng được tạo và kích hoạt
-   Trạng thái rentable item tự động cập nhật

---

### 🔵 LUỒNG 6: Tạo Hóa đơn và Thanh toán (Landlord + Tenant)

**Mục tiêu**: Tạo hóa đơn và xử lý thanh toán

**Các bước thực hiện (Landlord)**:

1. **Tạo Hóa đơn**
   - Click menu "💰 Hóa đơn"
   - Click "➕ Tạo hóa đơn"
   - Nhập thông tin:
     - Hợp đồng: Chọn hợp đồng vừa tạo
     - Chính sách giá: Tự động điền
     - Kỳ thanh toán: Chọn tháng hiện tại
     - Ngày đến hạn: Chọn ngày 5 tháng sau
   - Click "Tạo"
   -   Kiểm tra: Hóa đơn có trạng thái "DRAFT"

2. **Phát hành Hóa đơn**
   - Click vào hóa đơn vừa tạo
   - Click "Phát hành"
   -   Kiểm tra: Trạng thái chuyển sang "ISSUED"

**Các bước thực hiện (Tenant)**:

3. **Xem Hóa đơn**
   - Đăng xuất và đăng nhập Tenant
   - Click menu "💰 Hóa đơn"
   -   Kiểm tra: Hóa đơn hiển thị với trạng thái "ISSUED"
   - Click vào hóa đơn để xem chi tiết

4. **Thanh toán**
   - Click "Thanh toán"
   - Chọn phương thức: "BANK_TRANSFER"
   - Click "Xác nhận thanh toán"
   -   Kiểm tra: Hiển thị thông báo chuyển đến trang thanh toán

**Các bước thực hiện (Landlord)**:

5. **Ghi nhận Thanh toán**
   - Đăng nhập lại Landlord
   - Click menu "💳 Thanh toán"
   - Click "➕ Ghi nhận thanh toán"
   - Nhập thông tin:
     - Hóa đơn: Chọn hóa đơn vừa tạo
     - Số tiền: 3000000
     - Phương thức: "BANK_TRANSFER"
     - Ngày thanh toán: Chọn ngày hiện tại
   - Click "Lưu"
   -   Kiểm tra: Thanh toán được ghi nhận
   -   Kiểm tra: Trạng thái hóa đơn chuyển sang "PAID"

6. **Kiểm tra Sổ cái**
   - Click menu "📒 Sổ cái"
   -   Kiểm tra: Có 2 giao dịch:
     - DEBIT: Hóa đơn phát hành
     - CREDIT: Thanh toán nhận được

**Kết quả mong đợi**:
-   Hóa đơn được tạo và phát hành
-   Tenant xem được hóa đơn của mình
-   Thanh toán được ghi nhận chính xác
-   Sổ cái cập nhật đúng

---


### 🔵 LUỒNG 7: Yêu cầu Hỗ trợ (Tenant + Landlord)

**Mục tiêu**: Người thuê tạo yêu cầu hỗ trợ và chủ nhà xử lý

**Các bước thực hiện (Tenant)**:

1. **Tạo Yêu cầu Hỗ trợ**
   - Đăng nhập Tenant
   - Click menu "🔧 Yêu cầu hỗ trợ"
   - Click "➕ Tạo yêu cầu"
   - Nhập thông tin:
     - Tiêu đề: "Điều hòa không hoạt động"
     - Mô tả: "Điều hòa trong phòng không lạnh, cần kiểm tra"
     - Loại: "BẢO TRÌ"
     - Mức độ: "CAO"
   - Click "Tạo"
   -   Kiểm tra: Hiển thị thông báo "Đã tạo yêu cầu thành công!"
   -   Kiểm tra: Yêu cầu hiển thị trong danh sách với trạng thái "MỞ"

**Các bước thực hiện (Landlord)**:

2. **Xem và Xử lý Yêu cầu**
   - Đăng nhập Landlord
   - Click menu "🎫 Yêu cầu"
   -   Kiểm tra: Yêu cầu mới hiển thị
   - Click vào yêu cầu
   - Xem chi tiết: tiêu đề, mô tả, người tạo
   - Cập nhật trạng thái: "ĐANG XỬ LÝ"
   -   Kiểm tra: Trạng thái được cập nhật

3. **Đóng Yêu cầu**
   - Sau khi xử lý xong
   - Cập nhật trạng thái: "ĐÃ ĐÓNG"
   -   Kiểm tra: Yêu cầu có trạng thái "ĐÃ ĐÓNG"

**Kết quả mong đợi**:
-   Tenant tạo yêu cầu thành công
-   Landlord xem được tất cả yêu cầu
-   Cập nhật trạng thái hoạt động đúng

---

### 🔵 LUỒNG 8: Báo cáo và Phân tích (Landlord)

**Mục tiêu**: Xem báo cáo tổng quan về hoạt động kinh doanh

**Các bước thực hiện**:

1. **Xem Dashboard**
   - Đăng nhập Landlord
   - Click menu "🏠 Trang chủ"
   -   Kiểm tra: Hiển thị thống kê:
     - Số lượng hóa đơn
     - Số lượng thanh toán
     - Số lượng yêu cầu hỗ trợ

2. **Xem Báo cáo Chi tiết**
   - Click menu "📊 Báo cáo"
   -   Kiểm tra: Hiển thị các báo cáo:
     - **Tỷ lệ lấp đầy**: X% (số phòng đã cho thuê / tổng số phòng)
     - **Tổng quan doanh thu**:
       - Tổng hóa đơn
       - Đã thanh toán
       - Quá hạn
     - **Tổng quan yêu cầu**:
       - Số yêu cầu MỞ
       - Số yêu cầu ĐANG XỬ LÝ
       - Số yêu cầu ĐÃ ĐÓNG

3. **Kiểm tra Audit Logs**
   - Click menu "📋 Audit Logs"
   -   Kiểm tra: Hiển thị lịch sử các thao tác:
     - Người thực hiện
     - Hành động
     - Thời gian
     - Chi tiết thay đổi

**Kết quả mong đợi**:
-   Dashboard hiển thị thống kê chính xác
-   Báo cáo tính toán đúng
-   Audit logs ghi nhận đầy đủ

---

### 🔵 LUỒNG 9: Quản lý Tài khoản (Tenant)

**Mục tiêu**: Cập nhật thông tin cá nhân và cài đặt

**Các bước thực hiện**:

1. **Cập nhật Thông tin Cá nhân**
   - Đăng nhập Tenant
   - Click menu "👤 Tài khoản"
   - Tab "Thông tin cá nhân"
   - Cập nhật:
     - Họ tên: "Nguyễn Văn B"
     - Số điện thoại: "0987654321"
     - Địa chỉ: "456 Đường ABC, Quận 2"
   - Click "Lưu thay đổi"
   -   Kiểm tra: Hiển thị "Cập nhật thông tin thành công!"

2. **Đổi Mật khẩu**
   - Tab "Bảo mật"
   - Nhập:
     - Mật khẩu hiện tại: "Password123!"
     - Mật khẩu mới: "NewPassword123!"
     - Xác nhận mật khẩu: "NewPassword123!"
   - Click "Đổi mật khẩu"
   -   Kiểm tra: Hiển thị "Đổi mật khẩu thành công!"

3. **Cài đặt Thông báo**
   - Tab "Tùy chọn"
   - Bật/tắt các thông báo:
     - Email thông báo
     - SMS thông báo
     - Thông báo hóa đơn
   - Click "Lưu tùy chọn"
   -   Kiểm tra: Hiển thị "Lưu tùy chọn thành công!"

4. **Xem Thông báo**
   - Click menu "🔔 Thông báo"
   -   Kiểm tra: Hiển thị danh sách thông báo
   - Click vào thông báo chưa đọc
   -   Kiểm tra: Thông báo được đánh dấu đã đọc
   - Click "Đánh dấu tất cả đã đọc"
   -   Kiểm tra: Tất cả thông báo được đánh dấu đã đọc

**Kết quả mong đợi**:
-   Cập nhật thông tin thành công
-   Đổi mật khẩu hoạt động đúng
-   Cài đặt được lưu
-   Thông báo hoạt động chính xác

---

### 🔵 LUỒNG 10: Quản lý Người dùng và Phân quyền (Landlord)

**Mục tiêu**: Mời người dùng mới và phân quyền

**Các bước thực hiện**:

1. **Mời Người dùng Mới**
   - Đăng nhập Landlord
   - Click menu "👤 Users & Roles"
   - Click "➕ Mời người dùng"
   - Nhập thông tin:
     - Email: "staff@example.com"
     - Vai trò: "Landlord"
     - Data Scope: "assigned"
   - Click "Gửi lời mời"
   -   Kiểm tra: Hiển thị "Đã mời người dùng thành công!"
   -   Kiểm tra: Người dùng mới xuất hiện trong danh sách

2. **Xem Danh sách Người dùng**
   -   Kiểm tra: Hiển thị tất cả người dùng với:
     - Email
     - Vai trò
     - Data Scope
     - Trạng thái

3. **Xem Vai trò**
   - Tab "Vai trò"
   -   Kiểm tra: Hiển thị các vai trò:
     - Landlord
     - Tenant
     - Staff (nếu có)

**Kết quả mong đợi**:
-   Mời người dùng thành công
-   Danh sách người dùng hiển thị đúng
-   Phân quyền hoạt động chính xác

---

### 🔵 LUỒNG 11: Cấu hình Tích hợp (Landlord)

**Mục tiêu**: Cấu hình email và SMS

**Các bước thực hiện**:

1. **Cấu hình Email**
   - Click menu "🔌 Integrations"
   - Tab "Email (SMTP)"
   - Nhập thông tin:
     - Host: "smtp.gmail.com"
     - Port: 587
     - Username: "your-email@gmail.com"
     - Password: "your-app-password"
     - From Email: "noreply@urp.com"
   - Click "Lưu cấu hình"
   -   Kiểm tra: Hiển thị "Đã lưu cấu hình Email!"

2. **Test Email**
   - Click "Test Email"
   - Nhập email nhận: "test@example.com"
   - Click "Gửi"
   -   Kiểm tra: Hiển thị kết quả test

3. **Cấu hình SMS**
   - Tab "SMS"
   - Nhập thông tin:
     - Provider: "Twilio"
     - API Key: "your-api-key"
     - API Secret: "your-api-secret"
     - From Number: "+84901234567"
   - Click "Lưu cấu hình"
   -   Kiểm tra: Hiển thị "Đã lưu cấu hình SMS!"

**Kết quả mong đợi**:
-   Cấu hình được lưu thành công
-   Test kết nối hoạt động
-   Thông tin hiển thị đúng

---

## 📝 CHECKLIST TEST TỔNG QUAN

###   Chức năng Cơ bản
- [ ] Đăng nhập/Đăng xuất hoạt động
- [ ] Menu điều hướng hiển thị đúng theo vai trò
- [ ] Layout responsive trên các màn hình
- [ ] Tất cả text đã là tiếng Việt

###   Landlord Features
- [ ] Tạo/sửa/xóa tài sản
- [ ] Tạo cấu trúc không gian (Space Graph)
- [ ] Tạo rentable items
- [ ] Tạo chính sách giá
- [ ] Tạo và đăng tin
- [ ] Quản lý leads
- [ ] Tạo hợp đồng
- [ ] Tạo hóa đơn
- [ ] Ghi nhận thanh toán
- [ ] Xem sổ cái
- [ ] Xử lý yêu cầu hỗ trợ
- [ ] Xem báo cáo
- [ ] Quản lý người dùng
- [ ] Cấu hình tích hợp

###   Tenant Features
- [ ] Khám phá tin đăng
- [ ] Tìm kiếm và lọc
- [ ] Xem chi tiết tin đăng
- [ ] Gửi yêu cầu tư vấn
- [ ] Xem yêu cầu của tôi
- [ ] Xem hợp đồng
- [ ] Xem hóa đơn
- [ ] Xem thanh toán
- [ ] Tạo yêu cầu hỗ trợ
- [ ] Cập nhật thông tin cá nhân
- [ ] Xem thông báo

###   API & Performance
- [ ] Tất cả API trả về đúng dữ liệu
- [ ] Không có lỗi 500 Internal Server Error
- [ ] Loading states hiển thị đúng
- [ ] Error messages rõ ràng
- [ ] Pagination hoạt động
- [ ] Sorting hoạt động
- [ ] Filtering hoạt động

---

## 🐛 BÁO CÁO LỖI

Nếu phát hiện lỗi trong quá trình test, vui lòng ghi nhận theo mẫu:

```
**Tên lỗi**: [Mô tả ngắn gọn]
**Trang**: [Tên trang/URL]
**Vai trò**: [Landlord/Tenant]
**Các bước tái hiện**:
1. [Bước 1]
2. [Bước 2]
3. [Bước 3]

**Kết quả thực tế**: [Điều gì đã xảy ra]
**Kết quả mong đợi**: [Điều gì nên xảy ra]
**Screenshot**: [Nếu có]
**Console errors**: [Nếu có]
```

---

## 📞 HỖ TRỢ

Nếu cần hỗ trợ trong quá trình test:
- Kiểm tra Backend logs: Terminal đang chạy backend
- Kiểm tra Frontend logs: Browser Console (F12)
- Kiểm tra Database: Kết nối vào PostgreSQL
- Restart services nếu cần:
  ```bash
  # Backend
  cd apps/backend
  npm run start:dev
  
  # Frontend
  cd apps/frontend
  npm run dev
  ```

---

## 🎉 KẾT LUẬN

Tài liệu này cung cấp hướng dẫn chi tiết để test toàn bộ chức năng của ứng dụng URP. Hãy thực hiện từng luồng test một cách cẩn thận và ghi nhận mọi vấn đề phát hiện được.

**Chúc bạn test thành công!** 🚀
