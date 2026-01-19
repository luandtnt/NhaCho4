# Trạng Thái Dự Án URP

**Ngày cập nhật:** 05/01/2026

## 📍 Giai Đoạn Hiện Tại

Dự án đang ở **PR1: M1 Foundation** - Đã hoàn thành ✅

### Các Milestone (Theo Master Spec)

```
✅ M1: Foundation (PR1) - HOÀN THÀNH
   ├─ Repo scaffolding + Docker + Prisma
   ├─ Auth (login/refresh/me)
   ├─ RBAC engine + Data scope guards
   ├─ Audit logs
   └─ Config Engine skeleton

⏳ M2: Marketplace (PR2) - TIẾP THEO
   ├─ Listing CRUD + publish/unpublish
   ├─ Search endpoints (filters, geo, suggest)
   ├─ Lead/inquiry flow
   └─ Frontend: listing pages

⏸️ M3: Property Ops (PR3)
   ├─ Asset registry + Space graph
   ├─ Agreement engine
   └─ Availability engine

⏸️ M4: Finance (PR4)
   ├─ Pricing policies
   ├─ Billing & invoicing
   ├─ Payment integration
   └─ Ledger (append-only)

⏸️ M5: Operations (PR5)
   ├─ Tickets/maintenance
   ├─ Check-in/out
   └─ Inspections

⏸️ M6: Production Ready (PR6)
   ├─ Performance optimization
   ├─ Security hardening
   └─ Deployment automation
```

## 🎯 Đã Hoàn Thành (M1)

### Backend APIs
- ✅ **Auth APIs** (tiếng Việt trong Swagger)
  - POST `/api/v1/auth/login` - Đăng nhập
  - POST `/api/v1/auth/refresh` - Làm mới token
  - POST `/api/v1/auth/logout` - Đăng xuất
  - GET `/api/v1/auth/me` - Lấy thông tin người dùng

- ✅ **Config APIs** (tiếng Việt trong Swagger)
  - POST `/api/v1/configs/bundles` - Tạo gói cấu hình
  - GET `/api/v1/configs/bundles` - Danh sách gói cấu hình
  - GET `/api/v1/configs/bundles/:id` - Chi tiết gói cấu hình
  - POST `/api/v1/configs/bundles/:id/activate` - Kích hoạt
  - POST `/api/v1/configs/bundles/:id/rollback` - Khôi phục

### Infrastructure
- ✅ PostgreSQL 15 + PostGIS (Docker)
- ✅ Redis (Docker)
- ✅ MinIO (Docker)
- ✅ Prisma ORM + Migrations
- ✅ Seed data với 3 tài khoản demo

### Security & Compliance
- ✅ JWT authentication (access + refresh tokens)
- ✅ RBAC với 5 roles: Tenant, Landlord, PropertyManager, OrgAdmin, PlatformAdmin
- ✅ Data scope guards (multi-tenant isolation)
- ✅ Audit logs cho mọi mutations
- ✅ Request ID middleware
- ✅ PII masking trong logs

### Testing
- ✅ 10 E2E tests (auth + config)
- ✅ CI pipeline (GitHub Actions)

### Documentation
- ✅ OpenAPI/Swagger UI: http://localhost:3000/api/docs
- ✅ Mô tả API bằng tiếng Việt
- ✅ SETUP.md với hướng dẫn chi tiết
- ✅ README.md

## 🔑 Tài Khoản Demo

| Email | Mật khẩu | Vai trò | Tổ chức |
|---|---|---|---|
| landlord@example.com | Password123! | Landlord | Demo Landlord Org |
| tenant@example.com | Password123! | Tenant | Demo Tenant Org |
| admin@example.com | Password123! | OrgAdmin | Demo Landlord Org |

## 🌐 Access Points

- **Backend API**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:3000/api/docs
- **Frontend**: http://localhost:5173
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)
- **Prisma Studio**: `pnpm -C apps/backend prisma studio`

## 📊 Database Schema

### Core Entities (M1)
- ✅ Organization (multi-tenant boundary)
- ✅ User (authentication + RBAC)
- ✅ RefreshToken (token management)
- ✅ Party (business actors)
- ✅ ConfigBundle (config engine)
- ✅ AuditLog (audit trail)

### Property Entities (Schema ready, APIs in M3)
- ⏸️ Asset
- ⏸️ SpaceNode
- ⏸️ RentableItem

### Marketplace Entities (Schema ready, APIs in M2)
- ⏸️ Listing
- ⏸️ ListingRentableItem
- ⏸️ Lead
- ⏸️ Booking

### Finance Entities (Schema ready, APIs in M4)
- ⏸️ Agreement
- ⏸️ Invoice
- ⏸️ Payment
- ⏸️ LedgerEntry

### Operations Entities (Schema ready, APIs in M5)
- ⏸️ Ticket

## 🎨 Tech Stack

### Backend
- **Framework**: NestJS 10 + TypeScript 5
- **Database**: PostgreSQL 15 + PostGIS
- **ORM**: Prisma 5
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **Auth**: JWT (passport-jwt)
- **Validation**: class-validator + class-transformer
- **API Docs**: Swagger/OpenAPI 3.0

### Frontend
- **Framework**: React 18 + Vite 5
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **State**: (TBD in M2)

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Package Manager**: pnpm 8
- **Monorepo**: pnpm workspaces

## 🚀 Tiếp Theo (M2 - Marketplace)

### Scope PR2
1. **Listing Management**
   - CRUD endpoints cho Listing
   - Publish/unpublish workflow
   - Media upload integration (MinIO)

2. **Search & Discovery**
   - Full-text search
   - Geo search (PostGIS)
   - Filters (price, type, location)
   - Autocomplete suggestions
   - Rate limiting cho public endpoints

3. **Lead Management**
   - Lead/inquiry creation
   - Lead status workflow
   - Lead assignment
   - Lead conversion to booking

4. **Frontend Pages**
   - Listing list page
   - Listing detail page
   - Search results page
   - Lead/inquiry form

5. **Testing**
   - API contract tests
   - E2E: search → view → lead flow

### Estimated Effort
1-2 ngày (tương tự M1)

## 📝 Ghi Chú

### Constraints Đã Verify (8/8)
- ✅ C-001: No hard-coded asset types (ConfigBundle)
- ✅ C-002: Ledger append-only
- ✅ C-003: Multi-tenant isolation
- ✅ C-004: Finance idempotency (ready)
- ✅ C-005: RBAC deny-by-default
- ✅ C-006: Audit logs
- ✅ C-007: Rate limiting (ready for M2)
- ✅ C-008: Webhook security (ready for M4)

### Thay Đổi Gần Đây
- ✅ Sửa lỗi Prisma schema (missing relations)
- ✅ Cài @nestjs/config
- ✅ Sửa lỗi auth.service.ts (select vs include)
- ✅ Cập nhật tất cả mô tả API sang tiếng Việt

## 📚 Tài Liệu Tham Khảo

- **Master Spec**: `URP_AI_MASTER_SPEC_v1.0_2026-01-04.md`
- **Setup Guide**: `SETUP.md`
- **PR1 Summary**: `PR1_SUMMARY.md`
- **OpenAPI Spec**: `docs/openapi/openapi.yaml`
- **Prisma Schema**: `apps/backend/prisma/schema.prisma`
