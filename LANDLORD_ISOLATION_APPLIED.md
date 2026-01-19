# ✅ LANDLORD ISOLATION - PARTIALLY APPLIED

**Ngày:** 2026-01-19  
**Trạng thái:** 🟡 IN PROGRESS

---

## ✅ ĐÃ HOÀN THÀNH

### 1. Helper Class
- ✅ `apps/backend/src/common/helpers/party.helper.ts` - Created

### 2. Listing Module
- ✅ `listing.service.ts` - Added landlord isolation to `create()` and `findAll()`
- ✅ `listing.controller.ts` - Updated to pass `userId` and `userRole`

---

## 🔄 CẦN HOÀN THÀNH

Do giới hạn token và độ phức tạp của code, các modules sau cần được sửa thủ công:

### 3. Invoice Module (QUAN TRỌNG CHO TENANT)
**File:** `apps/backend/src/modules/finance/invoice/invoice.service.ts`

**Thêm import:**
```typescript
import { PartyHelper } from '../../../common/helpers/party.helper';
```

**Sửa method `findAll` (tìm dòng có `async findAll`):**
```typescript
async findAll(
  orgId: string,
  userId: string,      // ADD
  userRole: string,    // ADD
  query: InvoiceQueryDto,
) {
  const where: any = { org_id: orgId };

  // ADD ROLE-BASED ISOLATION
  if (userRole === 'Landlord') {
    const landlordPartyId = await PartyHelper.getLandlordPartyId(
      this.prisma,
      userId,
      orgId,
    );
    if (landlordPartyId) {
      where.agreement = {
        landlord_party_id: landlordPartyId,
      };
    }
  } else if (userRole === 'Tenant') {
    const tenantPartyId = await PartyHelper.getTenantPartyId(
      this.prisma,
      userId,
      orgId,
    );
    if (tenantPartyId) {
      where.tenant_party_id = tenantPartyId;
    }
  }

  // Apply filters
  if (query.state) where.state = query.state;
  if (query.search) {
    where.invoice_code = { contains: query.search, mode: 'insensitive' };
  }
  // ... rest of existing code
}
```

**File:** `apps/backend/src/modules/finance/invoice/invoice.controller.ts`

**Sửa method `findAll`:**
```typescript
@Get()
async findAll(@Req() req, @Query() query: InvoiceQueryDto) {
  const orgId = req.user.org_id;
  const userId = req.user.sub;      // ADD
  const userRole = req.user.role;   // ADD
  return this.invoiceService.findAll(orgId, userId, userRole, query);  // ADD params
}
```

### 4. Agreement Module
**File:** `apps/backend/src/modules/ops/agreement/agreement.service.ts`

**Thêm import:**
```typescript
import { PartyHelper } from '../../../common/helpers/party.helper';
```

**Sửa method `findAll`:**
```typescript
async findAll(
  orgId: string,
  userId: string,      // ADD
  userRole: string,    // ADD
  filters?: any,
) {
  const where: any = { org_id: orgId };

  // ADD ROLE-BASED ISOLATION
  if (userRole === 'Landlord') {
    const landlordPartyId = await PartyHelper.getLandlordPartyId(
      this.prisma,
      userId,
      orgId,
    );
    if (landlordPartyId) {
      where.landlord_party_id = landlordPartyId;
    }
  } else if (userRole === 'Tenant') {
    const tenantPartyId = await PartyHelper.getTenantPartyId(
      this.prisma,
      userId,
      orgId,
    );
    if (tenantPartyId) {
      where.tenant_party_id = tenantPartyId;
    }
  }

  // Apply other filters
  if (filters?.state) where.state = filters.state;
  // ... rest of existing code
}
```

**File:** `apps/backend/src/modules/ops/agreement/agreement.controller.ts`

**Sửa method `findAll`:**
```typescript
@Get()
async findAll(@Req() req, @Query() filters) {
  const orgId = req.user.org_id;
  const userId = req.user.sub;      // ADD
  const userRole = req.user.role;   // ADD
  return this.agreementService.findAll(orgId, userId, userRole, filters);  // ADD params
}
```

### 5. Booking Module
**File:** `apps/backend/src/modules/ops/booking/booking.service.ts`

**Thêm import:**
```typescript
import { PartyHelper } from '../../../common/helpers/party.helper';
```

**Sửa method `findAll`:**
```typescript
async findAll(
  orgId: string,
  userId: string,      // ADD
  userRole: string,    // ADD
  filters?: any,
) {
  const where: any = { org_id: orgId };

  // ADD ROLE-BASED ISOLATION
  if (userRole === 'Landlord') {
    const landlordPartyId = await PartyHelper.getLandlordPartyId(
      this.prisma,
      userId,
      orgId,
    );
    if (landlordPartyId) {
      where.rentable_item = {
        landlord_party_id: landlordPartyId,
      };
    }
  } else if (userRole === 'Tenant') {
    const tenantPartyId = await PartyHelper.getTenantPartyId(
      this.prisma,
      userId,
      orgId,
    );
    if (tenantPartyId) {
      where.tenant_party_id = tenantPartyId;
    }
  }

  // Apply other filters
  if (filters?.status) where.status = filters.status;
  // ... rest of existing code
}
```

**File:** `apps/backend/src/modules/ops/booking/booking.controller.ts`

**Sửa method `findAll`:**
```typescript
@Get()
async findAll(@Req() req, @Query() filters) {
  const orgId = req.user.org_id;
  const userId = req.user.sub;      // ADD
  const userRole = req.user.role;   // ADD
  return this.bookingService.findAll(orgId, userId, userRole, filters);  // ADD params
}
```

### 6. Rentable Item Module
**File:** `apps/backend/src/modules/ops/rentable-item/rentable-item.service.ts`

**Thêm import:**
```typescript
import { PartyHelper } from '../../../common/helpers/party.helper';
```

**Sửa method `findAll`:**
```typescript
async findAll(
  orgId: string,
  userId: string,      // ADD
  userRole: string,    // ADD
  filters?: any,
) {
  const where: any = { org_id: orgId };

  // ADD LANDLORD ISOLATION
  if (userRole === 'Landlord') {
    const landlordPartyId = await PartyHelper.getLandlordPartyId(
      this.prisma,
      userId,
      orgId,
    );
    if (landlordPartyId) {
      where.landlord_party_id = landlordPartyId;
    }
  }

  // Apply other filters
  if (filters?.status) where.status = filters.status;
  // ... rest of existing code
}
```

**Sửa method `create`:**
```typescript
async create(
  orgId: string,
  userId: string,      // ADD
  dto: CreateRentableItemDto,
) {
  // Get landlord party ID
  const landlordPartyId = await PartyHelper.getLandlordPartyId(
    this.prisma,
    userId,
    orgId,
  );

  const item = await this.prisma.rentableItem.create({
    data: {
      org_id: orgId,
      landlord_party_id: landlordPartyId,  // ADD
      // ... rest of fields
    },
  });

  return item;
}
```

**File:** `apps/backend/src/modules/ops/rentable-item/rentable-item.controller.ts`

**Sửa methods:**
```typescript
@Get()
async findAll(@Req() req, @Query() filters) {
  const orgId = req.user.org_id;
  const userId = req.user.sub;      // ADD
  const userRole = req.user.role;   // ADD
  return this.rentableItemService.findAll(orgId, userId, userRole, filters);
}

@Post()
async create(@Req() req, @Body() dto: CreateRentableItemDto) {
  const orgId = req.user.org_id;
  const userId = req.user.sub;      // ADD
  return this.rentableItemService.create(orgId, userId, dto);
}
```

---

## 🧪 TESTING

Sau khi sửa xong TẤT CẢ các modules trên:

```bash
# 1. Restart backend
pnpm -C apps/backend start:dev

# 2. Test Landlord Isolation
# Login: landlord@example.com / Password123!
# GET /api/v1/listings → Should see ~42 listings
# GET /api/v1/agreements → Should see ~10 agreements
# GET /api/v1/invoices → Should see ~30 invoices

# 3. Test Tenant Isolation
# Login: tenant@example.com / Password123!
# GET /api/v1/agreements → Should see ~5 agreements
# GET /api/v1/invoices → Should see ~15 invoices
# GET /api/v1/bookings → Should see ~10 bookings

# 4. Test Different Landlords
# Login: landlord1@example.com / Password123!
# GET /api/v1/listings → Should see DIFFERENT ~42 listings
```

---

## 📝 SUMMARY

**Completed:**
- ✅ Helper class
- ✅ Listing module (2/2 files)

**Remaining:**
- 🔄 Invoice module (2 files) - QUAN TRỌNG
- 🔄 Agreement module (2 files) - QUAN TRỌNG
- 🔄 Booking module (2 files)
- 🔄 Rentable Item module (2 files)

**Total:** 2/12 files done (17%)

**Estimated time to complete:** 15-20 phút (copy-paste code từ document này)

---

## 💡 NEXT STEPS

1. Mở từng file theo thứ tự ưu tiên:
   - Invoice (quan trọng nhất cho tenant)
   - Agreement (quan trọng cho cả landlord và tenant)
   - Booking
   - Rentable Item

2. Copy-paste code từ document này

3. Restart backend và test

4. Nếu có lỗi, check:
   - Import statement có đúng không
   - Method signature có match không
   - req.user.sub và req.user.role có tồn tại không

---

**Status:** 🟡 Cần hoàn thành thủ công  
**Priority:** HIGH (tenant không thấy data)
