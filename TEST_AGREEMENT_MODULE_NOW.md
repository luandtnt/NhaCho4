# 🧪 TEST AGREEMENT MODULE - HƯỚNG DẪN NHANH

## ✅ LATEST FIX (2026-01-17)

**Issue Fixed:** Backend error `Argument landlord_party_id is missing`

**Root Cause:** Controller was using `req.user.id` but JWT strategy returns `req.user.sub`

**Solution:** Updated all controller methods to use `req.user.sub` instead of `req.user.id`

**Files Changed:**
- `apps/backend/src/modules/ops/agreement/agreement.controller.ts`

**Status:** ✅ READY TO TEST

---

## Chuẩn bị

### 1. Backend đang chạy
```powershell
cd apps/backend
npm run dev
```

### 2. Frontend đang chạy
```powershell
cd apps/frontend
npm run dev
```

### 3. Database đã có migration
✅ Đã chạy `prisma db push` thành công

---

## 🎯 Test Scenarios

### Scenario 1: Landlord tạo & gửi hợp đồng

**Steps:**
1. Login as Landlord: `landlord@example.com` / `Password123!`
2. Vào `/agreements`
3. Click "Tạo hợp đồng mới"
4. Điền form:
   - Tenant ID: `tenant-party-123` (hoặc ID thật từ database)
   - Chọn rentable item (AVAILABLE)
   - Ngày bắt đầu: Hôm nay + 7 ngày
   - Ngày kết thúc: +12 tháng
   - Giá thuê: 5.000.000
   - Tiền cọc: 10.000.000
5. Click "Tạo hợp đồng"
6. ✅ Redirect về detail page, state = DRAFT
7. Click "Gửi cho khách thuê"
8. ✅ State → SENT

**Expected:**
- Hợp đồng được tạo thành công
- State chuyển từ DRAFT → SENT
- Có thể xem trong danh sách

---

### Scenario 2: Tenant xác nhận hợp đồng

**Steps:**
1. Login as Tenant (nếu có account)
2. Vào `/my-agreements`
3. Thấy hợp đồng với badge "⚠️ Cần xác nhận"
4. Click vào hợp đồng
5. Xem chi tiết (giá, utilities, điều khoản)
6. Click "✅ Xác nhận hợp đồng"
7. ✅ State → PENDING_CONFIRM

**Expected:**
- Tenant thấy được hợp đồng
- Có thể xác nhận
- State chuyển sang PENDING_CONFIRM

**Note:** Nếu không có tenant account, dùng API test:
```powershell
# Confirm via API
$token = "tenant_token_here"
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/agreements/{id}/confirm" -Method Post -Headers @{"Authorization"="Bearer $token"}
```

---

### Scenario 3: Landlord kích hoạt hợp đồng

**Steps:**
1. Login as Landlord
2. Vào `/agreements/{id}`
3. Thấy state = PENDING_CONFIRM
4. Thấy text "✓ Khách thuê đã xác nhận"
5. Click "✅ Kích hoạt hợp đồng"
6. ✅ State → ACTIVE
7. ✅ Rentable item → OCCUPIED

**Expected:**
- Hợp đồng được kích hoạt
- Tài sản chuyển sang OCCUPIED
- Snapshot được tạo

---

### Scenario 4: Landlord chấm dứt hợp đồng

**Steps:**
1. Ở detail page (ACTIVE)
2. Click "⛔ Chấm dứt"
3. Modal hiện ra
4. Điền form:
   - Ngày chấm dứt: Hôm nay
   - Loại: Thỏa thuận chung
   - Lý do: "Khách thuê chuyển đi"
   - Phí phạt: 0
   - Hoàn cọc: 10.000.000
5. Click "Chấm dứt hợp đồng"
6. ✅ State → TERMINATED
7. ✅ Rentable item → AVAILABLE

**Expected:**
- Hợp đồng bị chấm dứt
- Tài sản trở về AVAILABLE
- Thông tin terminate được lưu

---

### Scenario 5: Landlord gia hạn hợp đồng

**Steps:**
1. Ở detail page (ACTIVE hoặc EXPIRED)
2. Click "🔄 Gia hạn"
3. Xem thông tin hợp đồng cũ
4. Thấy giá mới đã auto-apply price increase
5. Điều chỉnh giá nếu cần
6. Click "Tạo hợp đồng gia hạn"
7. ✅ Hợp đồng mới (DRAFT) được tạo
8. ✅ Hợp đồng cũ: is_renewed = true
9. ✅ Redirect về detail của HĐ mới

**Expected:**
- Hợp đồng mới được tạo
- Link renewal_of_agreement_id đúng
- Giá tăng tự động (nếu có config)

---

### Scenario 6: Tenant từ chối hợp đồng

**Steps:**
1. Login as Tenant
2. Vào `/my-agreements/{id}` (state = SENT)
3. Click "❌ Từ chối"
4. Modal hiện ra
5. Nhập lý do: "Giá quá cao"
6. Click "Từ chối hợp đồng"
7. ✅ State → CANCELLED

**Expected:**
- Hợp đồng bị hủy
- Lý do từ chối được lưu
- Landlord có thể xem lý do

---

### Scenario 7: Tenant yêu cầu gia hạn

**Steps:**
1. Login as Tenant
2. Vào `/my-agreements/{id}` (state = ACTIVE)
3. Click "🔄 Yêu cầu gia hạn"
4. Modal hiện ra
5. Điền form:
   - Lý do: "Muốn ở tiếp"
   - Thời gian: 12 tháng
   - Giá mong muốn: 5.000.000
6. Click "Gửi yêu cầu"
7. ✅ pending_request_type = RENEWAL
8. ✅ Hiển thị "Yêu cầu đang chờ xử lý"

**Expected:**
- Request được tạo
- Landlord có thể xem trong detail page
- Tenant thấy pending status

---

## 🔍 Quick Checks

### Check 1: Stats Cards
- Vào `/agreements`
- Xem stats cards có đúng số lượng không
- Filter theo state có work không

### Check 2: Auto-fill from Policy
- Tạo hợp đồng mới
- Chọn item có pricing policy
- Giá có tự động điền không

### Check 3: Price Formatting
- Tất cả giá có format đúng: `12.000.000 ₫`
- Date có format đúng: `dd/MM/yyyy`

### Check 4: State Machine
- Chỉ thấy actions phù hợp với state
- Không thể làm actions không hợp lệ

### Check 5: Modals
- Terminate modal có đầy đủ fields
- Reject modal có validation
- Request modal có conditional fields

---

## 🐛 Common Issues

### Issue 1: "Không tìm thấy tài sản"
**Solution:** Đảm bảo có rentable items với status = AVAILABLE

### Issue 2: "Invalid credentials"
**Solution:** Check password là `Password123!` (có dấu chấm than)

### Issue 3: "Item already has active agreement"
**Solution:** Chọn item khác hoặc terminate agreement cũ

### Issue 4: TypeScript errors
**Solution:** Chạy `npx prisma generate` trong apps/backend

### Issue 5: 404 Not Found
**Solution:** Check backend đang chạy và routes đúng

---

## 📊 Test Checklist

### Backend APIs
- [ ] POST /agreements (create)
- [ ] GET /agreements (list)
- [ ] GET /agreements/:id (detail)
- [ ] PUT /agreements/:id (update)
- [ ] DELETE /agreements/:id (delete)
- [ ] POST /agreements/:id/send
- [ ] POST /agreements/:id/confirm
- [ ] POST /agreements/:id/reject
- [ ] POST /agreements/:id/activate
- [ ] POST /agreements/:id/terminate
- [ ] POST /agreements/:id/renew
- [ ] POST /agreements/:id/request

### Frontend Landlord
- [ ] AgreementsPage loads
- [ ] Stats cards show correct numbers
- [ ] Filter works
- [ ] CreateAgreementPage form works
- [ ] Auto-fill from policy works
- [ ] AgreementDetailPage shows correct info
- [ ] State machine actions work
- [ ] Terminate modal works
- [ ] RenewAgreementPage works
- [ ] Price increase auto-calculated

### Frontend Tenant
- [ ] TenantAgreementsPage loads
- [ ] Warning badge shows for SENT
- [ ] TenantAgreementDetailPage shows correct info
- [ ] Confirm action works
- [ ] Reject modal works
- [ ] Request renewal modal works
- [ ] Request termination modal works
- [ ] Cost breakdown displays correctly

---

## 🎯 Success Criteria

✅ **Backend:** All APIs return correct responses  
✅ **Frontend Landlord:** Can create, send, activate, terminate, renew  
✅ **Frontend Tenant:** Can view, confirm, reject, request  
✅ **State Machine:** All transitions work correctly  
✅ **Business Rules:** Validations work (no duplicate active, etc.)  
✅ **UI/UX:** Vietnamese, price format, date format correct  

---

## 📞 Support

Nếu gặp lỗi:
1. Check backend logs
2. Check browser console
3. Check database có data không
4. Xem file `AGREEMENT_MODULE_HOAN_THANH_100_PHAN_TRAM.md` để hiểu flow

---

**Happy Testing! 🎉**
