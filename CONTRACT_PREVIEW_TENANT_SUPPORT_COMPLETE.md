# ✅ TENANT SUPPORT FOR CONTRACT PREVIEW - HOÀN THÀNH

## 🎯 Mục tiêu
Cho phép Tenant cũng có thể xem và in hợp đồng giống như Landlord.

---

## ✅ Đã hoàn thành

### 1. Backend API
**Không cần thay đổi!** Endpoint đã có quyền cho Tenant:
```typescript
@Get(':id/contract-data')
@Roles('Landlord', 'Tenant', 'OrgAdmin')  // ← Tenant đã có quyền
```

### 2. Frontend - Tenant Agreement Detail Page
**File:** `apps/frontend/src/pages/TenantAgreementDetailPage.tsx`

**Button mới:**
```typescript
<button
  onClick={() => navigate(`/my-agreements/${id}/contract`)}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
>
  📄 Xem hợp đồng
</button>
```

**Vị trí:** Đầu tiên trong section "Hành động"

### 3. Frontend - Contract Page Update
**File:** `apps/frontend/src/pages/AgreementContractPage.tsx`

**Changes:**
```typescript
// Auto-detect user role
const [userRole, setUserRole] = useState<string>('LANDLORD');

useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  setUserRole(user.role || 'LANDLORD');
  loadContractData();
}, [id]);

// Dynamic back URL
const backUrl = userRole === 'Tenant' ? `/my-agreements/${id}` : `/agreements/${id}`;

// Dynamic Layout
<Layout userRole={userRole as any}>
```

### 4. Route Configuration
**File:** `apps/frontend/src/App.tsx`

**Route mới:**
```typescript
<Route path="/my-agreements/:id/contract" element={<PrivateRoute><AgreementContractPage /></PrivateRoute>} />
```

---

## 🔄 Flow Comparison

### Landlord Flow:
```
/agreements/[id]
    ↓ Click "📄 Xem hợp đồng"
/agreements/[id]/contract
    ↓ Click "← Quay lại"
/agreements/[id]
```

### Tenant Flow:
```
/my-agreements/[id]
    ↓ Click "📄 Xem hợp đồng"
/my-agreements/[id]/contract
    ↓ Click "← Quay lại"
/my-agreements/[id]
```

**Note:** Cùng 1 component `AgreementContractPage`, nhưng:
- Auto-detect role từ localStorage
- Navigate đúng URL dựa trên role
- Layout render đúng role

---

## 🧪 Test Guide

### Test Case 1: Tenant xem hợp đồng SENT
```
1. Login as Tenant
2. Vào /my-agreements
3. Click vào 1 agreement (state = SENT)
4. ✅ Thấy button "📄 Xem hợp đồng" màu tím
5. Click button
6. ✅ Navigate to /my-agreements/[id]/contract
7. ✅ Hiển thị hợp đồng đầy đủ
8. ✅ Thấy thông tin của mình ở phần "BÊN THUÊ (Bên B)"
9. ✅ Thấy CCCD của mình (từ agreement.tenant_id_number)
```

### Test Case 2: Tenant in hợp đồng
```
1. Ở contract preview page
2. Click "🖨️ In hợp đồng"
3. ✅ Print dialog mở
4. ✅ Format đẹp, có thể save PDF
5. ✅ Tenant có thể lưu bản hợp đồng của mình
```

### Test Case 3: Tenant quay lại
```
1. Ở contract preview page
2. Click "← Quay lại"
3. ✅ Navigate về /my-agreements/[id] (không phải /agreements/[id])
```

### Test Case 4: Landlord vẫn hoạt động bình thường
```
1. Login as Landlord
2. Vào /agreements/[id]
3. Click "📄 Xem hợp đồng"
4. ✅ Navigate to /agreements/[id]/contract
5. ✅ Hiển thị hợp đồng
6. Click "← Quay lại"
7. ✅ Navigate về /agreements/[id]
```

---

## 📊 Use Cases

### Use Case 1: Tenant xác nhận hợp đồng
```
Landlord tạo HĐ → Gửi cho Tenant
         ↓
Tenant nhận được (state = SENT)
         ↓
Tenant click "📄 Xem hợp đồng"
         ↓
Đọc kỹ các điều khoản
         ↓
Nếu OK → Click "← Quay lại" → Click "✅ Xác nhận"
Nếu không OK → Click "← Quay lại" → Click "❌ Từ chối"
```

### Use Case 2: Tenant lưu bản hợp đồng
```
Tenant vào /my-agreements/[id]
         ↓
Click "📄 Xem hợp đồng"
         ↓
Click "🖨️ In hợp đồng"
         ↓
Save as PDF
         ↓
Lưu vào máy để tham khảo sau này
```

### Use Case 3: Tenant chia sẻ hợp đồng
```
Tenant xem hợp đồng
         ↓
Print to PDF
         ↓
Gửi email cho gia đình/bạn bè
         ↓
Hoặc in ra giấy để ký tay
```

---

## 🎨 UI/UX

### Button Position (cả 2 roles)
```
┌─────────────────────────────────────┐
│ Hành động                           │
├─────────────────────────────────────┤
│ [📄 Xem hợp đồng]  [Other buttons]  │
└─────────────────────────────────────┘
```

**Button style:**
- Background: purple-600
- Hover: purple-700
- Icon: 📄
- Text: "Xem hợp đồng"
- Position: Đầu tiên (trước tất cả buttons khác)

### Contract Preview (cả 2 roles)
```
┌─────────────────────────────────────┐
│ [← Quay lại]  [🖨️ In hợp đồng]      │
├─────────────────────────────────────┤
│                                     │
│   CỘNG HÒA XÃ HỘI CHỦ NGHĨA VN     │
│   Độc lập - Tự do - Hạnh phúc       │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                     │
│   HỢP ĐỒNG THUÊ NHÀ                 │
│   Số: AG-2026-00001                 │
│                                     │
│   BÊN CHO THUÊ (Bên A):             │
│   - Ông/Bà: [Landlord name]         │
│   - CCCD: [Landlord CCCD]           │
│                                     │
│   BÊN THUÊ (Bên B):                 │
│   - Ông/Bà: [Tenant name]           │
│   - CCCD: [Tenant CCCD]             │
│                                     │
│   ĐIỀU 1: ĐỐI TƯỢNG...              │
│   ...                               │
│                                     │
└─────────────────────────────────────┘
```

---

## 📁 Files Changed

### Frontend
- ✅ `apps/frontend/src/pages/TenantAgreementDetailPage.tsx` (added button)
- ✅ `apps/frontend/src/pages/AgreementContractPage.tsx` (role detection)
- ✅ `apps/frontend/src/App.tsx` (added tenant route)

### Documentation
- ✅ `AGREEMENT_CONTRACT_PREVIEW_COMPLETE.md` (updated)
- ✅ `CONTRACT_PREVIEW_TENANT_SUPPORT_COMPLETE.md` (this file)

---

## ✅ Status

**Backend:** ✅ NO CHANGES NEEDED (already supports Tenant)  
**Frontend Button:** ✅ COMPLETE  
**Frontend Route:** ✅ COMPLETE  
**Role Detection:** ✅ COMPLETE  
**Navigation:** ✅ COMPLETE  
**Testing:** ✅ READY TO TEST  

---

## 💡 Key Points

1. **Cùng 1 component cho cả 2 roles**
   - `AgreementContractPage` phục vụ cả Landlord và Tenant
   - Auto-detect role từ localStorage
   - Dynamic navigation based on role

2. **2 routes khác nhau**
   - Landlord: `/agreements/:id/contract`
   - Tenant: `/my-agreements/:id/contract`
   - Cùng component, khác URL

3. **Backend không cần thay đổi**
   - Endpoint đã có `@Roles('Landlord', 'Tenant', 'OrgAdmin')`
   - Tenant đã có quyền truy cập từ đầu

4. **UX nhất quán**
   - Button giống nhau (màu tím, icon 📄)
   - Contract format giống nhau
   - Print function giống nhau

---

**Tính năng đã sẵn sàng cho cả Landlord và Tenant! 🎉**

```bash
# Test Landlord
http://localhost:5173/agreements/[id]
→ Click "📄 Xem hợp đồng"

# Test Tenant
http://localhost:5173/my-agreements/[id]
→ Click "📄 Xem hợp đồng"
```

