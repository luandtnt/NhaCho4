# 📋 KẾ HOẠCH TRIỂN KHAI MODULE HÓA ĐƠN (INVOICES)

**Ngày tạo:** 2026-01-19  
**Trạng thái:** READY TO START  
**Ưu tiên:** P0 - Critical Business Module

---

## 🎯 MỤC TIÊU

Xây dựng module Hóa đơn hoàn chỉnh cho URP với đầy đủ tính năng:
- ✅ Landlord: Tạo, quản lý, đối soát hóa đơn
- ✅ Tenant: Xem, thanh toán, khiếu nại hóa đơn
- ✅ Auto recurring: Tự động tạo hóa đơn theo kỳ
- ✅ Export: PDF, Excel/CSV
- ✅ Notification: Email/SMS nhắc nợ
- ✅ Reports: Doanh thu, công nợ

---

## 📊 PHÂN TÍCH HIỆN TRẠNG

### ✅ ĐÃ CÓ

**Database Schema:**
```prisma
model Invoice {
  id           String   @id @default(uuid())
  org_id       String
  agreement_id String
  period_start DateTime @db.Date
  period_end   DateTime @db.Date
  currency     String   @default("VND")
  total_amount BigInt
  status       String   // ISSUED, PAID, VOID, OVERDUE
  line_items   Json     @default("[]")
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
}

model Payment {
  id                String   @id @default(uuid())
  org_id            String
  invoice_id        String
  provider          String
  amount            BigInt
  currency          String
  status            String
  ...
}

model LedgerEntry {
  id          String   @id @default(uuid())
  org_id      String
  entry_type  String
  ref_type    String
  ref_id      String
  amount      BigInt
  direction   String   // debit, credit
  ...
}
```

**Backend APIs (Landlord only):**
- `POST /invoices` - Tạo hóa đơn
- `GET /invoices` - Danh sách (có pagination, filter by status)
- `GET /invoices/:id` - Chi tiết
- `POST /invoices/:id/void` - Hủy hóa đơn
- `POST /invoices/:id/mark-overdue` - Đánh dấu quá hạn

**Frontend:**
- `InvoicesPage.tsx` - Trang quản lý hóa đơn (landlord)
- Có pagination, filter by status
- Wizard tạo hóa đơn (4 bước)

### ❌ CÒN THIẾU

#### Backend:
1. **Tenant APIs** - tenant xem hóa đơn của mình
2. **Auto recurring** - cron job tạo hóa đơn tự động
3. **Export** - PDF, Excel/CSV
4. **Notification** - email/SMS nhắc nợ
5. **Partial payment** - thanh toán một phần
6. **Search** - tìm kiếm theo tenant, item, invoice_code
7. **Reports** - doanh thu, công nợ, tenant nợ nhiều nhất
8. **Edit invoice** - sửa hóa đơn khi DRAFT
9. **Invoice from booking** - tạo hóa đơn từ booking (short-term)

#### Frontend:
1. **Landlord:**
   - Tìm kiếm nâng cao
   - Chi tiết hóa đơn đầy đủ (breakdown, payment history)
   - Sửa hóa đơn (DRAFT)
   - Báo cáo công nợ
   - Export UI

2. **Tenant:**
   - Trang xem hóa đơn
   - Thanh toán hóa đơn
   - Upload biên lai
   - Tạo ticket khiếu nại

---

## 🚀 KẾ HOẠCH TRIỂN KHAI (4 PHASES)

### **PHASE 1: CORE ENHANCEMENTS (P0)** ⭐
**Mục tiêu:** Hoàn thiện chức năng cơ bản cho Landlord

#### 1.1. Database Migration
```sql
-- Thêm các trường cần thiết
ALTER TABLE invoices ADD COLUMN tenant_party_id VARCHAR;
ALTER TABLE invoices ADD COLUMN rentable_item_id VARCHAR;
ALTER TABLE invoices ADD COLUMN booking_id VARCHAR;
ALTER TABLE invoices ADD COLUMN invoice_code VARCHAR UNIQUE;
ALTER TABLE invoices ADD COLUMN issued_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN due_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN subtotal_amount BIGINT;
ALTER TABLE invoices ADD COLUMN balance_due BIGINT;
ALTER TABLE invoices ADD COLUMN notes TEXT;
ALTER TABLE invoices ADD COLUMN state VARCHAR; -- DRAFT, ISSUED, PAID, OVERDUE, CANCELLED

-- Invoice line items table (normalize từ JSON)
CREATE TABLE invoice_line_items (
  id VARCHAR PRIMARY KEY,
  invoice_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- RENT, SERVICE_FEE, MGMT_FEE, ELECTRICITY, WATER, PARKING, OTHER
  description TEXT,
  qty DECIMAL(10,2) DEFAULT 1,
  unit_price BIGINT NOT NULL,
  amount BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
```

#### 1.2. Backend APIs

**A. Enhanced Invoice Creation**
```typescript
// POST /invoices
// Thêm validation và auto-fill từ agreement
interface CreateInvoiceDto {
  agreement_id: string;
  booking_id?: string; // Optional for short-term
  period_start: string;
  period_end: string;
  due_date?: string; // Auto calculate if not provided
  line_items: LineItemDto[];
  notes?: string;
  auto_issue?: boolean; // true = ISSUED, false = DRAFT
}

interface LineItemDto {
  type: 'RENT' | 'SERVICE_FEE' | 'MGMT_FEE' | 'ELECTRICITY' | 'WATER' | 'PARKING' | 'OTHER';
  description: string;
  qty: number;
  unit_price: number;
  metadata?: any;
}
```

**B. Edit Invoice (DRAFT only)**
```typescript
// PATCH /invoices/:id
// Chỉ cho phép edit khi state = DRAFT
interface UpdateInvoiceDto {
  period_start?: string;
  period_end?: string;
  due_date?: string;
  line_items?: LineItemDto[];
  notes?: string;
}
```

**C. Issue Invoice**
```typescript
// POST /invoices/:id/issue
// Chuyển từ DRAFT → ISSUED
// Tạo ledger entry
// Gửi notification cho tenant
```

**D. Search & Filter**
```typescript
// GET /invoices?search=&tenant_id=&item_id=&status=&month=&page=&page_size=
interface InvoiceQueryDto {
  search?: string; // Search by invoice_code, tenant name, phone
  tenant_id?: string;
  item_id?: string;
  status?: string;
  month?: string; // YYYY-MM
  page?: number;
  page_size?: number;
}
```

**E. Invoice Detail (Enhanced)**
```typescript
// GET /invoices/:id
// Include:
// - Agreement info (contract_code, tenant, item)
// - Line items breakdown
// - Payment history
// - Balance due
// - Attachments (PDF URL)
```

#### 1.3. Frontend (Landlord)

**A. Enhanced InvoicesPage.tsx**
- ✅ Tìm kiếm nâng cao (search box)
- ✅ Filter theo tenant, item, month
- ✅ Hiển thị invoice_code thay vì id
- ✅ Hiển thị tenant name, item address

**B. InvoiceDetailPage.tsx (NEW)**
- ✅ Thông tin hóa đơn đầy đủ
- ✅ Breakdown line items
- ✅ Payment history
- ✅ Actions: Edit (DRAFT), Issue, Void, Export PDF

**C. EditInvoicePage.tsx (NEW)**
- ✅ Chỉ cho DRAFT
- ✅ Edit line items
- ✅ Recalculate total

---

### **PHASE 2: TENANT FEATURES (P0)** ⭐
**Mục tiêu:** Tenant có thể xem và thanh toán hóa đơn

#### 2.1. Backend APIs

**A. Tenant Invoice List**
```typescript
// GET /me/invoices
// Tenant chỉ thấy hóa đơn của mình
// Filter: tenant_party_id = current_user.party_id
```

**B. Tenant Invoice Detail**
```typescript
// GET /me/invoices/:id
// Tenant isolation check
```

**C. Payment Intent**
```typescript
// POST /invoices/:id/payment-intent
// Tạo payment intent (VNPay, Momo, etc.)
interface CreatePaymentIntentDto {
  amount: number; // Full or partial
  method: 'vnpay' | 'momo' | 'bank_transfer' | 'cash';
  return_url: string;
}
```

**D. Upload Receipt**
```typescript
// POST /invoices/:id/upload-receipt
// Upload biên lai chuyển khoản
interface UploadReceiptDto {
  file: File;
  notes?: string;
}
```

**E. Create Ticket from Invoice**
```typescript
// POST /invoices/:id/create-ticket
// Tenant tạo ticket khiếu nại
interface CreateTicketFromInvoiceDto {
  title: string;
  description: string;
  category: 'COMPLAINT' | 'REQUEST';
}
```

#### 2.2. Frontend (Tenant)

**A. TenantInvoicesPage.tsx (NEW)**
- ✅ Danh sách hóa đơn của tenant
- ✅ Filter by status, month
- ✅ Hiển thị balance due

**B. TenantInvoiceDetailPage.tsx (NEW)**
- ✅ Chi tiết hóa đơn
- ✅ Breakdown line items
- ✅ Payment history
- ✅ Actions: Pay, Upload Receipt, Create Ticket

**C. PayInvoicePage.tsx (NEW)**
- ✅ Chọn phương thức thanh toán
- ✅ Full or partial payment
- ✅ Redirect to payment gateway

---

### **PHASE 3: AUTO RECURRING & NOTIFICATIONS (P1)** 🔄
**Mục tiêu:** Tự động hóa quy trình

#### 3.1. Auto Recurring Invoices

**A. Cron Job Service**
```typescript
// apps/backend/src/modules/finance/invoice/invoice-cron.service.ts
@Injectable()
export class InvoiceCronService {
  @Cron('0 0 * * *') // Run daily at midnight
  async generateRecurringInvoices() {
    // 1. Find all ACTIVE agreements
    // 2. Check if billing_day matches today
    // 3. Create invoice with line items from agreement
    // 4. Auto calculate electricity/water if usage exists
    // 5. Send notification to tenant
  }
  
  @Cron('0 1 * * *') // Run daily at 1am
  async markOverdueInvoices() {
    // 1. Find all ISSUED invoices where due_at < now
    // 2. Mark as OVERDUE
    // 3. Send overdue notification
  }
}
```

**B. Invoice Template from Agreement**
```typescript
// Service method to generate invoice from agreement
async generateInvoiceFromAgreement(agreementId: string, periodStart: Date, periodEnd: Date) {
  const agreement = await this.prisma.agreement.findUnique({
    where: { id: agreementId },
    include: { fees: true, pricing_policy: true }
  });
  
  const lineItems = [
    {
      type: 'RENT',
      description: `Tiền thuê tháng ${periodStart.getMonth() + 1}/${periodStart.getFullYear()}`,
      qty: 1,
      unit_price: agreement.base_price,
    },
    ...agreement.fees.map(fee => ({
      type: fee.fee_type,
      description: fee.description,
      qty: 1,
      unit_price: fee.amount,
    })),
  ];
  
  // Create invoice
  return this.create(agreement.org_id, {
    agreement_id: agreementId,
    period_start: periodStart,
    period_end: periodEnd,
    due_date: new Date(periodEnd.getTime() + agreement.payment_due_days * 86400000),
    line_items: lineItems,
    auto_issue: true,
  });
}
```

#### 3.2. Notification System

**A. Email Templates**
```typescript
// Invoice issued notification
// Invoice due reminder (X days before due_date)
// Invoice overdue notification
// Payment received confirmation
```

**B. Notification Service**
```typescript
@Injectable()
export class InvoiceNotificationService {
  async sendInvoiceIssued(invoiceId: string) { }
  async sendDueReminder(invoiceId: string) { }
  async sendOverdueNotification(invoiceId: string) { }
  async sendPaymentConfirmation(invoiceId: string) { }
}
```

#### 3.3. Frontend

**A. Landlord Settings**
- ✅ Cấu hình auto recurring
- ✅ Cấu hình notification templates
- ✅ Cấu hình reminder schedule

---

### **PHASE 4: EXPORT & REPORTS (P1)** 📊
**Mục tiêu:** Báo cáo và xuất dữ liệu

#### 4.1. Export Features

**A. Export PDF**
```typescript
// GET /invoices/:id/export/pdf
// Generate PDF from template
// Return PDF URL or stream
```

**B. Export Excel/CSV**
```typescript
// GET /invoices/export?format=excel&from=&to=&status=
// Export filtered invoices to Excel/CSV
```

#### 4.2. Reports

**A. Revenue Report**
```typescript
// GET /reports/revenue?from=&to=&group_by=month
interface RevenueReport {
  period: string;
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  invoice_count: number;
}
```

**B. Outstanding Report**
```typescript
// GET /reports/outstanding
interface OutstandingReport {
  tenant_id: string;
  tenant_name: string;
  total_outstanding: number;
  overdue_count: number;
  oldest_overdue_date: Date;
}
```

**C. Tenant Payment History**
```typescript
// GET /reports/tenant-payment-history/:tenant_id
```

#### 4.3. Frontend

**A. ReportsPage.tsx (NEW)**
- ✅ Revenue chart (by month)
- ✅ Outstanding summary
- ✅ Top debtors list
- ✅ Export reports

**B. Export Buttons**
- ✅ Export single invoice PDF
- ✅ Export multiple invoices Excel
- ✅ Export reports

---

## 🔒 QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

### P0 - Critical Rules

1. **Invoice Creation Rules**
   - ✅ Chỉ tạo invoice khi agreement.state = ACTIVE
   - ✅ Agreement chưa expired
   - ✅ Item thuộc đúng org/ownership
   - ✅ Auto generate invoice_code (format: INV-YYYYMM-XXXX)

2. **Invoice State Transitions**
   ```
   DRAFT → ISSUED → PAID
         ↓         ↓
      CANCELLED  OVERDUE → PAID
   ```
   - ✅ DRAFT: Có thể edit, delete
   - ✅ ISSUED: Không cho edit (audit), chỉ cho void
   - ✅ PAID: Không cho void, chỉ cho refund
   - ✅ OVERDUE: Auto mark khi due_at < now && status = ISSUED

3. **Tenant Isolation**
   - ✅ Tenant chỉ xem invoice của mình: `tenant_party_id = current_user.party_id`
   - ✅ Backend MUST validate tenant_party_id trước khi return data

4. **Payment Rules**
   - ✅ Full payment: invoice.status = PAID, balance_due = 0
   - ✅ Partial payment: invoice.status = PARTIALLY_PAID, balance_due > 0
   - ✅ Overpayment: Tạo credit note cho lần sau

5. **Ledger Rules**
   - ✅ Mọi transaction phải ghi ledger (append-only)
   - ✅ INVOICE_ISSUED → debit
   - ✅ PAYMENT_SUCCEEDED → credit
   - ✅ INVOICE_VOID → reverse debit

---

## 🧪 TEST SCENARIOS

### E2E-INV-01: Auto Recurring Invoice
```
GIVEN agreement ACTIVE với billing_day = 1
WHEN cron chạy vào ngày 1 hàng tháng
THEN hệ thống tự tạo invoice ISSUED
AND tenant nhận notification
AND ledger ghi nhận INVOICE_ISSUED
```

### E2E-INV-02: Landlord Create Manual Invoice
```
GIVEN landlord mở agreement detail
WHEN bấm "Tạo hóa đơn"
THEN wizard hiện ra với 4 bước
AND prefill line items từ agreement
AND landlord có thể chỉnh sửa
WHEN landlord confirm
THEN invoice tạo với state = DRAFT
WHEN landlord bấm "Issue"
THEN invoice chuyển ISSUED
AND tenant nhận notification
```

### E2E-INV-03: Tenant Pay Invoice
```
GIVEN tenant xem invoice ISSUED
WHEN tenant bấm "Thanh toán"
THEN chọn phương thức (VNPay/Momo/Bank)
WHEN tenant confirm
THEN redirect to payment gateway
WHEN payment success
THEN invoice chuyển PAID
AND ledger ghi nhận PAYMENT_SUCCEEDED
AND tenant nhận confirmation email
```

### E2E-INV-04: Overdue & Reminder
```
GIVEN invoice ISSUED với due_at = yesterday
WHEN cron chạy
THEN invoice chuyển OVERDUE
AND tenant nhận overdue notification
WHEN tenant trả trễ
THEN invoice chuyển PAID
AND có thể add penalty line item (optional)
```

### E2E-INV-05: Void Invoice
```
GIVEN invoice ISSUED chưa có payment
WHEN landlord void invoice
THEN invoice chuyển CANCELLED
AND ledger ghi nhận reverse entry
AND tenant nhận notification
```

### E2E-INV-06: Partial Payment
```
GIVEN invoice total = 10,000,000
WHEN tenant trả 5,000,000
THEN invoice.status = PARTIALLY_PAID
AND balance_due = 5,000,000
WHEN tenant trả 5,000,000 nữa
THEN invoice.status = PAID
AND balance_due = 0
```

---

## 📁 FILE STRUCTURE

```
apps/backend/src/modules/finance/invoice/
├── invoice.controller.ts          # ✅ Đã có (cần enhance)
├── invoice.service.ts             # ✅ Đã có (cần enhance)
├── invoice-cron.service.ts        # ❌ Cần tạo
├── invoice-notification.service.ts # ❌ Cần tạo
├── invoice-export.service.ts      # ❌ Cần tạo
├── dto/
│   ├── create-invoice.dto.ts      # ✅ Đã có (cần enhance)
│   ├── update-invoice.dto.ts      # ❌ Cần tạo
│   ├── issue-invoice.dto.ts       # ❌ Cần tạo
│   ├── create-payment-intent.dto.ts # ❌ Cần tạo
│   └── invoice-query.dto.ts       # ❌ Cần tạo
└── templates/
    └── invoice.pdf.hbs            # ❌ Cần tạo

apps/backend/src/modules/finance/invoice-tenant/
├── invoice-tenant.controller.ts   # ❌ Cần tạo
└── invoice-tenant.service.ts      # ❌ Cần tạo

apps/backend/src/modules/finance/reports/
├── reports.controller.ts          # ❌ Cần tạo
└── reports.service.ts             # ❌ Cần tạo

apps/frontend/src/pages/
├── InvoicesPage.tsx               # ✅ Đã có (cần enhance)
├── InvoiceDetailPage.tsx          # ❌ Cần tạo
├── EditInvoicePage.tsx            # ❌ Cần tạo
├── TenantInvoicesPage.tsx         # ❌ Cần tạo
├── TenantInvoiceDetailPage.tsx    # ❌ Cần tạo
├── PayInvoicePage.tsx             # ❌ Cần tạo
└── ReportsPage.tsx                # ❌ Cần tạo
```

---

## 🎯 PRIORITY & TIMELINE

### Sprint 1 (Week 1): PHASE 1 - Core Enhancements
- Day 1-2: Database migration + Backend APIs
- Day 3-4: Frontend Landlord pages
- Day 5: Testing & bug fixes

### Sprint 2 (Week 2): PHASE 2 - Tenant Features
- Day 1-2: Backend Tenant APIs
- Day 3-4: Frontend Tenant pages
- Day 5: Testing & bug fixes

### Sprint 3 (Week 3): PHASE 3 - Auto Recurring
- Day 1-2: Cron jobs + Notification
- Day 3-4: Frontend settings
- Day 5: Testing & bug fixes

### Sprint 4 (Week 4): PHASE 4 - Export & Reports
- Day 1-2: Export PDF/Excel
- Day 3-4: Reports + Charts
- Day 5: Final testing & deployment

---

## ✅ DEFINITION OF DONE

### Phase 1:
- [ ] Migration chạy thành công
- [ ] Landlord có thể tạo invoice (DRAFT/ISSUED)
- [ ] Landlord có thể edit invoice (DRAFT only)
- [ ] Landlord có thể search/filter invoices
- [ ] Landlord có thể xem chi tiết invoice đầy đủ
- [ ] Landlord có thể void invoice
- [ ] All E2E tests pass

### Phase 2:
- [ ] Tenant có thể xem danh sách invoices của mình
- [ ] Tenant có thể xem chi tiết invoice
- [ ] Tenant có thể thanh toán invoice (full/partial)
- [ ] Tenant có thể upload receipt
- [ ] Tenant có thể tạo ticket từ invoice
- [ ] Tenant isolation hoạt động đúng
- [ ] All E2E tests pass

### Phase 3:
- [ ] Cron job tạo invoice tự động hàng tháng
- [ ] Cron job mark overdue invoices
- [ ] Email notification gửi đúng lúc
- [ ] Landlord có thể config auto recurring
- [ ] All E2E tests pass

### Phase 4:
- [ ] Export PDF invoice hoạt động
- [ ] Export Excel/CSV hoạt động
- [ ] Revenue report hiển thị đúng
- [ ] Outstanding report hiển thị đúng
- [ ] Charts render đẹp
- [ ] All E2E tests pass

---

## 🚀 READY TO START?

**Bước tiếp theo:**
1. Review plan này
2. Confirm priority (có thể adjust)
3. Bắt đầu Phase 1: Database Migration

**Câu hỏi cần clarify:**
1. Có cần support multiple currencies không? (hiện tại default VND)
2. Có cần support tax/VAT không?
3. Payment gateway nào ưu tiên? (VNPay, Momo, Stripe?)
4. Email service nào dùng? (SendGrid, AWS SES, SMTP?)
5. PDF library nào dùng? (Puppeteer, PDFKit, jsPDF?)

---

**Created by:** Kiro AI  
**Date:** 2026-01-19  
**Version:** 1.0
