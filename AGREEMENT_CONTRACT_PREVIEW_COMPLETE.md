# ✅ HỢP ĐỒNG PREVIEW & PRINT - HOÀN THÀNH

## 🎯 Mục tiêu
Tạo tính năng xem và in hợp đồng thuê nhà với format chuẩn Việt Nam, tự động điền thông tin từ database.

---

## ✅ Đã hoàn thành

### 1. Backend API
**File:** `apps/backend/src/modules/ops/agreement/agreement.controller.ts`

**Endpoint mới:**
```typescript
@Get(':id/contract-data')
@Roles('Landlord', 'Tenant', 'OrgAdmin')  // ← Tenant cũng có quyền truy cập
@ApiOperation({ summary: 'Lấy data đầy đủ để tạo hợp đồng (preview/print)' })
getContractData(@Request() req, @Param('id') id: string)
```

**File:** `apps/backend/src/modules/ops/agreement/agreement.service.ts`

**Method mới:**
```typescript
async getContractData(orgId: string, id: string) {
  // Lấy agreement + landlord + tenant + property + organization
  return {
    agreement,
    landlord: { id, name, email, phone, id_number },
    tenant: { id, name, email, phone, id_number },
    organization: { id, name },
    property: { id, name, address, area_sqm, bedrooms, bathrooms }
  };
}
```

### 2. Frontend Contract Preview Page
**File:** `apps/frontend/src/pages/AgreementContractPage.tsx`

**Features:**
- ✅ Template hợp đồng thuê nhà chuẩn Việt Nam
- ✅ Tự động điền thông tin từ API
- ✅ **Hỗ trợ cả Landlord và Tenant role**
- ✅ Auto-detect user role và navigate đúng
- ✅ Format giá tiền chuẩn VN: 5.000.000 ₫
- ✅ Format ngày tháng: ngày 17 tháng 1 năm 2026
- ✅ Chuyển số thành chữ (số tiền bằng chữ)
- ✅ Button "In hợp đồng" (window.print)
- ✅ Print-friendly CSS (ẩn buttons, margins)
- ✅ Responsive layout

**Cấu trúc hợp đồng:**
```
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HỢP ĐỒNG THUÊ NHÀ
Số: AG-2026-00001

BÊN CHO THUÊ (Bên A):
- Ông/Bà: [Tên chủ nhà]
- CCCD: [Số CCCD]
- Điện thoại: [SĐT]
- Email: [Email]

BÊN THUÊ (Bên B):
- Ông/Bà: [Tên khách thuê]
- CCCD: [Số CCCD từ agreement.tenant_id_number]
- Điện thoại: [SĐT]
- Email: [Email]

ĐIỀU 1: ĐỐI TƯỢNG CỦA HỢP ĐỒNG
- Tên tài sản: [...]
- Địa chỉ: [...]
- Diện tích: [...] m²
- Số phòng ngủ: [...]
- Tình trạng: [...]

ĐIỀU 2: THỜI HẠN THUÊ
- Ngày bắt đầu: [...]
- Ngày kết thúc: [...]
- Ngày bàn giao: [...]

ĐIỀU 3: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN
- Giá thuê: 5.000.000 ₫/tháng (Bằng chữ: năm triệu đồng)
- Tiền cọc: 10.000.000 ₫
- Phí dịch vụ: [...]
- Phí quản lý: [...]
- Phí gửi xe: [...]
- Chu kỳ thanh toán: Hàng tháng
- Ngày chốt hóa đơn: Ngày 1 hàng tháng
- Hạn thanh toán: Trong vòng 5 ngày

ĐIỀU 4: ĐIỆN, NƯỚC VÀ CÁC DỊCH VỤ KHÁC
- Tiền điện: Theo đồng hồ riêng / Giá chủ nhà: 3.500 ₫/kWh
- Tiền nước: Theo đồng hồ riêng / Giá chủ nhà: 15.000 ₫/m³
- Chỉ số điện ban đầu: [...]
- Chỉ số nước ban đầu: [...]

ĐIỀU 5: NỘI QUY VÀ QUY ĐỊNH
- [Nội quy chung]
- Thú cưng: Được phép / Không được phép
- Hút thuốc: Được phép / Không được phép
- Khách qua đêm: Được phép / Không được phép

ĐIỀU 6: CHẤM DỨT HỢP ĐỒNG
- [Điều khoản chấm dứt]
- Phí phạt vi phạm: [...]

ĐIỀU 7: ĐIỀU KHOẢN CHUNG
- Hai bên cam kết thực hiện đúng các điều khoản...
- Hợp đồng có hiệu lực kể từ ngày ký
- Hợp đồng lập thành 02 bản

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ĐẠI DIỆN BÊN A          ĐẠI DIỆN BÊN B
(Ký và ghi rõ họ tên)  (Ký và ghi rõ họ tên)


[Tên chủ nhà]          [Tên khách thuê]
```

### 3. Route Configuration
**File:** `apps/frontend/src/App.tsx`

```typescript
import AgreementContractPage from './pages/AgreementContractPage';

// Landlord route
<Route path="/agreements/:id/contract" element={<PrivateRoute><AgreementContractPage /></PrivateRoute>} />

// Tenant route
<Route path="/my-agreements/:id/contract" element={<PrivateRoute><AgreementContractPage /></PrivateRoute>} />
```

**Note:** Cùng 1 component, nhưng 2 routes khác nhau cho Landlord và Tenant

### 4. Buttons trong Agreement Detail Pages

**Landlord:** `apps/frontend/src/pages/AgreementDetailPage.tsx`
```typescript
<button
  onClick={() => navigate(`/agreements/${id}/contract`)}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
>
  📄 Xem hợp đồng
</button>
```

**Tenant:** `apps/frontend/src/pages/TenantAgreementDetailPage.tsx`
```typescript
<button
  onClick={() => navigate(`/my-agreements/${id}/contract`)}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
>
  📄 Xem hợp đồng
</button>
```

**Vị trí:** Đầu tiên trong section "Hành động", hiển thị cho tất cả trạng thái

---

## 🚀 Cách sử dụng

### Landlord Flow:

**Bước 1:** Vào trang chi tiết hợp đồng
```
URL: http://localhost:5173/agreements/[agreement-id]
```

**Bước 2:** Click button **"📄 Xem hợp đồng"** (màu tím)

**Bước 3:** Xem preview hợp đồng format chuẩn

**Bước 4:** Click **"🖨️ In hợp đồng"** → Save as PDF hoặc in

---

### Tenant Flow:

**Bước 1:** Vào trang hợp đồng của tôi
```
URL: http://localhost:5173/my-agreements/[agreement-id]
```

**Bước 2:** Click button **"📄 Xem hợp đồng"** (màu tím)

**Bước 3:** Xem preview hợp đồng format chuẩn (giống landlord)

**Bước 4:** Click **"🖨️ In hợp đồng"** → Save as PDF hoặc in

---

## 🧪 Test Guide

### Test Case 1: Landlord xem hợp đồng
```
1. Login as Landlord
2. Vào /agreements/[id]
3. Click "📄 Xem hợp đồng"
4. ✅ Navigate to /agreements/[id]/contract
5. ✅ Hiển thị hợp đồng đầy đủ
6. ✅ Button "← Quay lại" về /agreements/[id]
```

### Test Case 2: Tenant xem hợp đồng
```
1. Login as Tenant
2. Vào /my-agreements/[id]
3. Click "📄 Xem hợp đồng"
4. ✅ Navigate to /my-agreements/[id]/contract
5. ✅ Hiển thị hợp đồng đầy đủ (giống landlord)
6. ✅ Button "← Quay lại" về /my-agreements/[id]
```

### Test Case 3: In hợp đồng (cả 2 roles)
```
1. Vào contract preview page
2. Click "🖨️ In hợp đồng"
3. ✅ Print dialog mở ra
4. ✅ Buttons bị ẩn trong print preview
5. ✅ Format đẹp, margins chuẩn
6. ✅ Có thể save as PDF
```

### Test Case 3: Kiểm tra data mapping
```
Landlord info:
✅ Tên: từ users.name
✅ CCCD: từ users.id_number
✅ Phone: từ users.phone
✅ Email: từ users.email

Tenant info:
✅ Tên: từ users.name
✅ CCCD: từ agreements.tenant_id_number (ưu tiên) hoặc users.id_number
✅ Phone: từ users.phone
✅ Email: từ users.email

Property info:
✅ Tên: từ space_node.name
✅ Địa chỉ: từ rentable_item.address_full
✅ Diện tích: từ rentable_item.area_sqm
✅ Phòng ngủ: từ rentable_item.bedrooms

Agreement info:
✅ Mã HĐ: từ agreement.contract_code
✅ Tiêu đề: từ agreement.contract_title
✅ Giá thuê: từ agreement.base_price
✅ Tiền cọc: từ agreement.deposit_amount
✅ Các phí: từ agreement.*_fee
✅ Điện/nước: từ agreement.electricity_billing, water_billing
✅ Nội quy: từ agreement.house_rules
✅ Điều khoản: từ agreement.termination_clause
```

### Test Case 4: Format kiểm tra
```
✅ Giá tiền: 5.000.000 ₫ (có dấu chấm phân cách)
✅ Ngày tháng: 17/01/2026
✅ Ngày dài: ngày 17 tháng 1 năm 2026
✅ Số thành chữ: năm triệu đồng
✅ Layout: căn giữ, margins đẹp
✅ Font: dễ đọc, professional
```

---

## 📊 Data Flow

```
User clicks "Xem hợp đồng"
         ↓
Navigate to /agreements/:id/contract
         ↓
Frontend calls GET /api/v1/agreements/:id/contract-data
         ↓
Backend AgreementService.getContractData()
         ↓
Query: Agreement + Landlord + Tenant + Property + Organization
         ↓
Return full data object
         ↓
Frontend renders contract template
         ↓
Auto-fill all fields from data
         ↓
Display formatted contract
         ↓
User clicks "In hợp đồng"
         ↓
window.print() → Print dialog
         ↓
Save as PDF or Print
```

---

## 🎨 UI/UX Features

### Preview Mode
- ✅ Button "← Quay lại" để về detail page
- ✅ Button "🖨️ In hợp đồng" màu xanh
- ✅ White background với shadow
- ✅ Padding 3rem (12) cho content
- ✅ Max-width 5xl (1024px)

### Print Mode
- ✅ Ẩn tất cả buttons
- ✅ Ẩn navigation/sidebar
- ✅ White background, no shadow
- ✅ Padding 2cm cho A4 paper
- ✅ Page breaks tự động
- ✅ Font size phù hợp cho in

### Typography
- ✅ Header: text-2xl, font-bold, text-center
- ✅ Section titles: text-lg, font-bold
- ✅ Body text: text-base, leading-relaxed
- ✅ Labels: font-medium
- ✅ Values: font-normal

---

## 📁 Files Changed

### Backend
- ✅ `apps/backend/src/modules/ops/agreement/agreement.controller.ts`
- ✅ `apps/backend/src/modules/ops/agreement/agreement.service.ts`

### Frontend
- ✅ `apps/frontend/src/pages/AgreementContractPage.tsx` (NEW - supports both roles)
- ✅ `apps/frontend/src/pages/AgreementDetailPage.tsx` (Landlord)
- ✅ `apps/frontend/src/pages/TenantAgreementDetailPage.tsx` (Tenant)
- ✅ `apps/frontend/src/App.tsx`

### Documentation
- ✅ `AGREEMENT_CONTRACT_PREVIEW_COMPLETE.md` (this file)

---

## ✅ Status

**Backend API:** ✅ COMPLETE  
**Frontend Page:** ✅ COMPLETE  
**Route:** ✅ COMPLETE  
**Button:** ✅ COMPLETE  
**Print CSS:** ✅ COMPLETE  
**Testing:** ✅ READY TO TEST  

---

## 🚀 Next Steps (Optional Enhancements)

### Priority P1:
1. **Export PDF từ server**
   - Backend generate PDF với library (puppeteer, pdfkit)
   - Endpoint: POST /agreements/:id/export-pdf
   - Return: PDF file download

2. **Template customization**
   - Cho phép org tùy chỉnh template
   - Logo công ty
   - Header/footer custom

3. **Digital signature**
   - Landlord ký điện tử
   - Tenant ký điện tử
   - Lưu signature vào database

### Priority P2:
4. **Email hợp đồng**
   - Gửi PDF qua email cho tenant
   - Attach file PDF
   - Email template đẹp

5. **Version history**
   - Lưu mỗi lần generate contract
   - So sánh versions
   - Audit trail

6. **Multi-language**
   - English version
   - Template theo ngôn ngữ

---

## 💡 Tips

### Tip 1: Customize template
Chỉnh sửa file `AgreementContractPage.tsx` để thay đổi:
- Layout sections
- Wording điều khoản
- Format giá tiền
- Signature layout

### Tip 2: Add logo
```tsx
<div className="text-center mb-8">
  <img src="/logo.png" alt="Logo" className="h-16 mx-auto mb-4" />
  <div className="text-sm mb-2">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
  ...
</div>
```

### Tip 3: Custom print margins
```css
@media print {
  @page {
    margin: 2cm;
    size: A4;
  }
}
```

### Tip 4: Add watermark for DRAFT
```tsx
{agreement.state === 'DRAFT' && (
  <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-10 print:opacity-20">
    <div className="text-9xl font-bold text-gray-500 rotate-45">
      NHÁP
    </div>
  </div>
)}
```

---

**Tính năng đã sẵn sàng! Restart backend và test ngay! 🎉**

```bash
# Restart backend
cd apps/backend
npm run dev

# Test
http://localhost:5173/agreements/[id]
→ Click "📄 Xem hợp đồng"
→ Click "🖨️ In hợp đồng"
```

