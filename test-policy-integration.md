# Test Policy-Based Pricing Integration

## Các bước test:

### 1. Kiểm tra Pricing Policies
- [ ] Vào `/pricing-policies-new`
- [ ] Xác nhận có 10 sample policies
- [ ] Thử tạo policy mới
- [ ] Thử edit policy
- [ ] Thử xóa policy

### 2. Kiểm tra Rentable Item Form
- [ ] Vào trang tạo Rentable Item
- [ ] Chọn loại hình (ví dụ: RESIDENTIAL - LONG_TERM)
- [ ] Kiểm tra dropdown "Chọn chính sách giá" xuất hiện
- [ ] Xác nhận chỉ hiển thị policies phù hợp với loại hình đã chọn
- [ ] Chọn 1 policy
- [ ] Xác nhận các field giá tự động điền:
  - base_price
  - price_unit
  - min_rent_duration
  - deposit_amount
  - service_fee
  - building_mgmt_fee

### 3. Kiểm tra Override
- [ ] Sau khi chọn policy, bật checkbox "Cho phép ghi đè giá"
- [ ] Xác nhận các field giá có border màu vàng (editable)
- [ ] Thay đổi base_price
- [ ] Lưu rentable item
- [ ] Kiểm tra database: pricing_policy_id đã được lưu
- [ ] Kiểm tra database: base_price là giá đã override

### 4. Kiểm tra Listing
- [ ] Tạo listing từ rentable item vừa tạo
- [ ] Xác nhận giá trong listing = giá trong rentable item
- [ ] Xem listing detail page
- [ ] Xác nhận giá hiển thị đúng

### 5. Kiểm tra Agreement
- [ ] Tạo agreement từ rentable item
- [ ] Xác nhận giá trong agreement = giá trong rentable item
- [ ] Kiểm tra các field:
  - monthly_rent
  - deposit_amount
  - service_fee

### 6. Kiểm tra Invoice
- [ ] Tạo invoice từ agreement
- [ ] Xác nhận các khoản tiền đúng:
  - rent_amount
  - service_fee
  - total_amount

## Expected Results:

✅ Pricing policies hiển thị và quản lý được
✅ Form tạo item có dropdown chọn policy
✅ Giá tự động điền khi chọn policy
✅ Override giá hoạt động đúng
✅ Giá được sử dụng nhất quán qua các module
✅ Database lưu đúng pricing_policy_id và snapshot

## Nếu có lỗi:

1. **Dropdown không hiển thị policies**
   - Check: API `/pricing-policies` có trả về data không
   - Check: Filter property_category và rental_duration_type đúng chưa

2. **Giá không tự động điền**
   - Check: handlePolicySelect có gọi onChange không
   - Check: formData có nhận được giá trị không

3. **Lưu item bị lỗi**
   - Check: Backend DTO có field pricing_policy_id chưa
   - Check: Service có lưu field này chưa

4. **Giá không đồng bộ qua modules**
   - Check: Listing/Agreement có copy giá từ rentable_item không
   - Check: Invoice có lấy giá từ agreement không
