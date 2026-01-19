# URP - Setup Guide (PR1: M1 Foundation)

## ✅ PR1 Completed - M1 Foundation

Đã hoàn thành:
- ✅ Repo scaffolding + docker-compose + Prisma baseline migrations
- ✅ Auth (login/refresh/me) + request-id middleware
- ✅ RBAC engine + data scope guards (deny-by-default)
- ✅ AuditLog cho mọi mutations
- ✅ ConfigBundle skeleton (create/list/activate/rollback)
- ✅ OpenAPI skeleton + CI pipeline cơ bản

## Prerequisites

- Node.js 20+
- pnpm 8+ (`npm install -g pnpm`)
- Docker & Docker Compose
- Git

## Quick Start

### 1. Start Infrastructure

```bash
# Start PostgreSQL, Redis, MinIO
docker compose up -d

# Verify services are running
docker compose ps
```

Expected output:
```
NAME            STATUS    PORTS
urp_postgres    Up        0.0.0.0:5432->5432/tcp
urp_redis       Up        0.0.0.0:6379->6379/tcp
urp_minio       Up        0.0.0.0:9000-9001->9000-9001/tcp
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 3. Setup Database

```bash
# Generate Prisma Client
pnpm -C apps/backend prisma generate

# Run migrations
pnpm -C apps/backend prisma migrate dev

# Seed database with demo data
pnpm -C apps/backend seed
```

Expected output from seed:
```
🌱 Seeding database...
✅ Organizations created
✅ Users created
   - landlord@example.com / Password123!
   - tenant@example.com / Password123!
   - admin@example.com / Password123!
✅ Config bundle created
✅ Sample asset created
✅ Space nodes created
✅ Rentable item created
✅ Listing created
🎉 Seeding completed!
```

### 4. Start Development Servers

```bash
# Start all services (backend + frontend)
pnpm dev
```

Or start individually:

```bash
# Terminal 1: Backend
pnpm -C apps/backend dev

# Terminal 2: Frontend
pnpm -C apps/frontend dev
```

### 5. Access Points

- **Backend API**: http://localhost:3000
- **API Documentation (Swagger)**: http://localhost:3000/api/docs
- **Frontend**: http://localhost:5173
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)
- **Prisma Studio**: `pnpm -C apps/backend prisma studio`

## Testing

### Run All Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm -C apps/backend test:e2e

# With coverage
pnpm -C apps/backend test:cov
```

### Test Specific Modules

```bash
# Auth tests only
pnpm -C apps/backend test auth

# Config tests only
pnpm -C apps/backend test config
```

## API Testing with cURL

### 1. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "landlord@example.com",
    "password": "Password123!"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

### 2. Get Profile

```bash
# Replace <TOKEN> with access_token from login
curl http://localhost:3000/api/v1/auth/me \
  -H 'Authorization: Bearer <TOKEN>'
```

### 3. Create Config Bundle

```bash
curl -X POST http://localhost:3000/api/v1/configs/bundles \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "bundle_id": "test_001",
    "version": "1.0.0",
    "config": {
      "asset_types": {
        "apartment": {
          "schema_ref": "schemas/apartment.json"
        }
      }
    }
  }'
```

### 4. List Config Bundles

```bash
curl http://localhost:3000/api/v1/configs/bundles \
  -H 'Authorization: Bearer <TOKEN>'
```

## Database Management

### View Database

```bash
# Open Prisma Studio
pnpm -C apps/backend prisma studio
```

### Reset Database

```bash
# Reset and re-seed
pnpm -C apps/backend prisma migrate reset
```

### Create New Migration

```bash
# After modifying schema.prisma
pnpm -C apps/backend prisma migrate dev --name your_migration_name
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker compose ps postgres

# View logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
pnpm -C apps/backend prisma generate

# If still issues, delete and regenerate
rm -rf apps/backend/node_modules/.prisma
pnpm -C apps/backend prisma generate
```

### Clean Install

```bash
# Stop all services
docker compose down -v

# Remove node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Reinstall
pnpm install

# Restart from step 1
```

## Project Structure

```
urp/
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── src/
│   │   │   ├── common/       # Shared utilities
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   └── middleware/
│   │   │   ├── modules/
│   │   │   │   └── platform/
│   │   │   │       ├── auth/
│   │   │   │       ├── audit/
│   │   │   │       ├── config/
│   │   │   │       └── prisma/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── test/
│   └── frontend/             # React SPA
│       └── src/
├── packages/
│   └── shared/               # Shared types & constants
├── docs/
│   └── openapi/
├── .github/workflows/        # CI/CD
└── docker-compose.yml
```

## Next Steps (M2 - Marketplace)

PR2 sẽ implement:
- Listing CRUD + publish/unpublish + media
- Search endpoints (filters, pagination, geo, suggest)
- Lead/inquiry flow + conversion
- Frontend pages: listing list/detail, search, lead form
- Tests: API contract + E2E

## Demo Accounts

| Email | Password | Role | Org |
|---|---|---|---|
| landlord@example.com | Password123! | Landlord | Demo Landlord Org |
| tenant@example.com | Password123! | Tenant | Demo Tenant Org |
| admin@example.com | Password123! | OrgAdmin | Demo Landlord Org |

## Constraints Verification (8 MUST)

✅ **C-001**: No hard-coded asset types - ConfigBundle system implemented
✅ **C-002**: Ledger append-only - Schema enforces, no UPDATE/DELETE endpoints
✅ **C-003**: Multi-tenant isolation - org_id filter in all queries via DataScopeGuard
✅ **C-004**: Finance idempotency - Ready for M4 (Payment schema has idempotency_key)
✅ **C-005**: RBAC deny-by-default - RbacGuard enforces
✅ **C-006**: Audit logs - AuditLogInterceptor logs all mutations
✅ **C-007**: Rate limiting - Ready for M2 (public endpoints)
✅ **C-008**: Webhook security - Ready for M4 (Payment webhook)
✅ **C-009**: PII masking - HttpExceptionFilter + AuditLogInterceptor sanitize

## Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Check API docs: http://localhost:3000/api/docs
3. Review Prisma Studio: `pnpm -C apps/backend prisma studio`
