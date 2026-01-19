# 🔒 LANDLORD ISOLATION - IMPLEMENTATION GUIDE

**Ngày:** 2026-01-19  
**Mục đích:** Thêm landlord isolation vào tất cả APIs

---

## 📋 OVERVIEW

Sau khi thêm `landlord_party_id` vào schema, cần sửa backend APIs để:
- **Landlord** chỉ thấy dữ liệu của mình (filter theo `landlord_party_id`)
- **Tenant** chỉ thấy dữ liệu của mình (filter theo `tenant_party_id`)
- **Admin** thấy tất cả

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Tạo Helper Service để get Party ID

**File:** `apps/backend/src/common/helpers/party.helper.ts`

```typescript
import { PrismaService } from '../../modules/platform/prisma/prisma.service';

export class PartyHelper {
  static async getLandlordPartyId(
    prisma: PrismaService,
    userId: string,
    orgId: string,
  ): Promise<string | null> {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: email, role: true },
    });

    if (!user) return null;

    // If not landlord, return null
    if (user.role !== 'Landlord') return null;

    // Find party by email
    const party = await prisma.party.findFirst({
      where: {
        org_id: orgId,
        party_type: 'LANDLORD',
        email: user.email,
      },
      select: { id: true },
    });

    return party?.id || null;
  }

  static async getTenantPartyId(
    prisma: PrismaService,
    userId: string,
    orgId: string,
  ): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    if (!user) return null;
    if (user.role !== 'Tenant') return null;

    const party = await prisma.party.findFirst({
      where: {
        org_id: orgId,
        party_type: 'TENANT',
        email: user.email,
      },
      select: { id: true },
    });

    return party?.id || null;
  }
}
```

---

### Step 2: Sửa Listing Service

**File:** `apps/backend/src/modules/marketplace/listing/listing.service.ts`

**Thay đổi method `findAll`:**

```typescript
async findAll(
  orgId: string,
  userId: string,  // ADD THIS
  userRole: string,  // ADD THIS
  page: number = 1,
  pageSize: number = 20,
  status?: string
) {
  const pageNum = Number(page) || 1;
  const pageSizeNum = Number(pageSize) || 20;
  const skip = (pageNum - 1) * pageSizeNum;
  
  const where: any = { 
    org_id: orgId,
    status: { not: 'ARCHIVED' }
  };
  
  if (status) {
    where.status = status;
  }

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

  const [listings, total] = await Promise.all([
    this.prisma.listing.findMany({
      where,
      skip,
      take: pageSizeNum,
      include: {
        rentable_items: {
          include: {
            rentable_item: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    }),
    this.prisma.listing.count({ where }),
  ]);

  return {
    data: listings,
    meta: {
      page: pageNum,
      pageSize: pageSizeNum,
      total,
      totalPages: Math.ceil(total / pageSizeNum),
    },
  };
}
```

**Thay đổi method `create`:**

```typescript
async create(
  orgId: string,
  userId: string,  // ADD THIS
  dto: CreateListingDto
) {
  // Get landlord party ID
  const landlordPartyId = await PartyHelper.getLandlordPartyId(
    this.prisma,
    userId,
    orgId,
  );

  // Create listing
  const listing = await this.prisma.listing.create({
    data: {
      org_id: orgId,
      landlord_party_id: landlordPartyId,  // ADD THIS
      title: dto.title,
      description: dto.description || null,
      media: dto.media || [],
      tags: dto.tags || [],
      pricing_display: dto.pricing_display || {},
      status: 'DRAFT',
      // ... rest of the code
    },
  });

  return listing;
}
```

---

### Step 3: Sửa Rentable Item Service

**File:** `apps/backend/src/modules/ops/rentable-item/rentable-item.service.ts`

**Thay đổi method `findAll`:**

```typescript
async findAll(
  orgId: string,
  userId: string,  // ADD THIS
  userRole: string,  // ADD THIS
  filters?: any
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
  if (filters?.property_category) where.property_category = filters.property_category;
  // ... rest of filters

  const items = await this.prisma.rentableItem.findMany({
    where,
    include: {
      space_node: true,
      pricing_policy: true,
    },
  });

  return items;
}
```

**Thay đổi method `create`:**

```typescript
async create(
  orgId: string,
  userId: string,  // ADD THIS
  dto: CreateRentableItemDto
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
      landlord_party_id: landlordPartyId,  // ADD THIS
      space_node_id: dto.space_node_id,
      code: dto.code,
      // ... rest of fields
    },
  });

  return item;
}
```

---

### Step 4: Sửa Agreement Service

**File:** `apps/backend/src/modules/ops/agreement/agreement.service.ts`

**Thay đổi method `findAll`:**

```typescript
async findAll(
  orgId: string,
  userId: string,  // ADD THIS
  userRole: string,  // ADD THIS
  filters?: any
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
  // ... rest of filters

  const agreements = await this.prisma.agreement.findMany({
    where,
    include: {
      rentable_item: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return agreements;
}
```

---

### Step 5: Sửa Booking Service

**File:** `apps/backend/src/modules/ops/booking/booking.service.ts`

**Thay đổi method `findAll`:**

```typescript
async findAll(
  orgId: string,
  userId: string,  // ADD THIS
  userRole: string,  // ADD THIS
  filters?: any
) {
  const where: any = { org_id: orgId };

  // ADD ROLE-BASED ISOLATION
  if (userRole === 'Landlord') {
    // Landlord sees bookings for their properties
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
    // Tenant sees their own bookings
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
  // ... rest of filters

  const bookings = await this.prisma.booking.findMany({
    where,
    include: {
      rentable_item: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return bookings;
}
```

---

### Step 6: Sửa Invoice Service

**File:** `apps/backend/src/modules/finance/invoice/invoice.service.ts`

**Thay đổi method `findAll`:**

```typescript
async findAll(
  orgId: string,
  userId: string,  // ADD THIS
  userRole: string,  // ADD THIS
  query: InvoiceQueryDto
) {
  const where: any = { org_id: orgId };

  // ADD ROLE-BASED ISOLATION
  if (userRole === 'Landlord') {
    // Landlord sees invoices for their agreements
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
    // Tenant sees their own invoices
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
  if (query.state) where.state = query.state;
  if (query.search) {
    where.invoice_code = { contains: query.search, mode: 'insensitive' };
  }
  // ... rest of filters

  const [invoices, total] = await Promise.all([
    this.prisma.invoice.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        agreement: true,
        rentable_item: true,
        line_items_table: true,
      },
      orderBy: { created_at: 'desc' },
    }),
    this.prisma.invoice.count({ where }),
  ]);

  return {
    data: invoices,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}
```

---

### Step 7: Sửa Controllers

Tất cả controllers cần pass `userId` và `userRole` vào services:

**Example - Listing Controller:**

```typescript
@Get()
async findAll(
  @Req() req,
  @Query('page') page?: number,
  @Query('pageSize') pageSize?: number,
  @Query('status') status?: string,
) {
  const orgId = req.user.org_id;
  const userId = req.user.sub;  // ADD THIS
  const userRole = req.user.role;  // ADD THIS
  
  return this.listingService.findAll(
    orgId,
    userId,  // ADD THIS
    userRole,  // ADD THIS
    page,
    pageSize,
    status,
  );
}

@Post()
async create(@Req() req, @Body() dto: CreateListingDto) {
  const orgId = req.user.org_id;
  const userId = req.user.sub;  // ADD THIS
  
  return this.listingService.create(orgId, userId, dto);  // ADD userId
}
```

---

## ✅ TESTING

Sau khi implement, test với:

### Test 1: Landlord Isolation
```bash
# Login as landlord@example.com
# GET /api/v1/listings
# Should see ~42 listings (not 210)

# Login as landlord1@example.com
# GET /api/v1/listings
# Should see different ~42 listings
```

### Test 2: Tenant Isolation
```bash
# Login as tenant@example.com
# GET /api/v1/agreements
# Should see ~5 agreements (not 50)

# Login as tenant1@example.com
# GET /api/v1/agreements
# Should see different ~5 agreements
```

### Test 3: Create Operations
```bash
# Login as landlord@example.com
# POST /api/v1/listings
# Created listing should have landlord_party_id set

# Login as landlord1@example.com
# GET /api/v1/listings
# Should NOT see the listing created by landlord@example.com
```

---

## 📝 SUMMARY

**Files to modify:**
1. ✅ Create `apps/backend/src/common/helpers/party.helper.ts`
2. ✅ Modify `listing.service.ts` - findAll, create
3. ✅ Modify `rentable-item.service.ts` - findAll, create
4. ✅ Modify `agreement.service.ts` - findAll
5. ✅ Modify `booking.service.ts` - findAll
6. ✅ Modify `invoice.service.ts` - findAll
7. ✅ Modify all controllers to pass userId and userRole

**Total changes:** ~7 files, ~50 lines of code

---

**Status:** 📋 READY TO IMPLEMENT  
**Estimated time:** 30-45 minutes
