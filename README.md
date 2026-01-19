# URP - Universal Rental Platform

Multi-tenant SaaS platform for managing rental properties, marketplace listings, tenant relationships, and financial operations.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **PostgreSQL** 14+ (via Docker or local)

### Installation

```bash
# 1. Clone repository
git clone <repo-url> urp
cd urp

# 2. Copy environment file
cp .env.example .env
# Edit .env with your configuration

# 3. Start infrastructure services
docker compose up -d

# 4. Install dependencies
pnpm install

# 5. Setup database
pnpm -C apps/backend prisma generate
pnpm -C apps/backend prisma migrate dev
pnpm -C apps/backend seed

# 6. Start development servers
pnpm dev
```

### Access Points
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Frontend**: http://localhost:5173
- **MinIO Console**: http://localhost:9001 (admin/password123)
- **PostgreSQL**: localhost:5432 (urp_user/urp_password)
- **Redis**: localhost:6379

### Default Accounts
```
Landlord: landlord@example.com / Password123!
Tenant:   tenant@example.com / Password123!
```

## 📚 Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and module overview
- **[Security Guide](docs/SECURITY.md)** - OWASP compliance and security practices
- **[Performance Guide](docs/PERFORMANCE.md)** - Optimization and benchmarking
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment procedures
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[API Documentation](http://localhost:3000/api/docs)** - Interactive Swagger docs

## 🏗️ Architecture

### Technology Stack

**Backend**
- **Framework**: NestJS 10.x (TypeScript)
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Storage**: MinIO (S3-compatible)
- **Auth**: JWT (access + refresh tokens)

**Frontend**
- **Framework**: React 18.x
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: React Context / Zustand

**Infrastructure**
- **Containers**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana (recommended)

### Module Overview

```
Platform (Foundation)
├── Auth - JWT authentication with refresh token rotation
├── RBAC - Role-based access control (deny-by-default)
├── Config Engine - Dynamic configuration management
├── Audit - Mutation audit trail
└── Multi-tenant - Organization-scoped data isolation

Marketplace
├── Listings - Rental property listings (CRUD + publish/unpublish)
├── Search - Full-text search with filters and geo search
└── Leads - Inquiry and lead management

Property Operations
├── Assets - Physical property registry
├── Space Nodes - Hierarchical space graph (building → floor → unit)
├── Rentable Items - Rentable units with availability tracking
├── Bookings - Reservation management with conflict detection
├── Agreements - Rental agreement lifecycle (state machine)
└── Tickets - Maintenance and support tickets

Finance
├── Pricing Policies - Config-driven pricing rules
├── Invoices - Billing and invoicing
├── Payments - Payment processing with webhook handlers
└── Ledger - Append-only financial ledger

Tenant Journey
├── Tenant Portal - Self-service portal for tenants
├── Notifications - In-app notifications
├── Reports - Business intelligence dashboards
└── Party - Party (person/organization) management
```

## 🧪 Testing

### Run Tests

```bash
# All tests
pnpm test

# Specific module tests
pnpm -C apps/backend test auth
pnpm -C apps/backend test listing

# E2E tests
pnpm -C apps/backend test:e2e

# Coverage report
pnpm -C apps/backend test:cov

# Watch mode
pnpm -C apps/backend test:watch
```

### Milestone Tests

```bash
# M1: Foundation (24 tests)
.\Script Test\test-m1.ps1

# M2: Marketplace (55 tests)
.\Script Test\test-m2.ps1

# M3: Property Ops (70 tests)
.\Script Test\test-m3.ps1

# M4: Finance (66 tests)
.\Script Test\test-m4.ps1

# M5: Tenant Journey (50 tests)
.\Script Test\test-m5.ps1

# All milestones
.\Script Test\run-all-tests.ps1
```

### Performance Testing

```bash
# Search benchmark
.\scripts\benchmark-search.ps1

# Load testing (50 concurrent users)
.\scripts\load-test.ps1 -ConcurrentUsers 50 -DurationSeconds 60
```

## 🔒 Security

### Security Features
- ✅ **RBAC**: Deny-by-default role-based access control
- ✅ **Multi-tenant isolation**: org_id enforced at service layer
- ✅ **JWT authentication**: Access + refresh token rotation
- ✅ **Password hashing**: bcrypt with salt rounds = 10
- ✅ **Webhook security**: HMAC-SHA256 signature verification
- ✅ **Audit logging**: All mutations logged with actor_id
- ✅ **PII masking**: Email, phone, credit card numbers masked in logs
- ✅ **Rate limiting**: Public endpoints protected
- ✅ **Security headers**: Helmet middleware (CSP, HSTS, etc.)
- ✅ **Input validation**: class-validator on all DTOs
- ✅ **SQL injection prevention**: Prisma ORM with parameterized queries

### OWASP Top 10 Compliance
See [Security Guide](docs/SECURITY.md) for detailed compliance checklist.

## 📊 Performance

### Performance Targets
- **Auth endpoints**: < 200ms (p95)
- **Search endpoints**: < 500ms (p95)
- **CRUD operations**: < 300ms (p95)
- **Report generation**: < 2s (p95)
- **Throughput**: 500+ RPS

### Optimization Features
- Database indexes on all foreign keys and frequently queried fields
- Full-text search indexes for listings
- Pagination on all list endpoints
- Cache interceptor (60s TTL)
- Connection pooling (20 connections)

See [Performance Guide](docs/PERFORMANCE.md) for optimization details.

## 🚢 Deployment

### Production Deployment

```bash
# 1. Build application
pnpm install --frozen-lockfile
pnpm -C apps/backend build
pnpm -C apps/frontend build

# 2. Run database migrations
pnpm -C apps/backend prisma migrate deploy

# 3. Start application
pm2 start apps/backend/dist/main.js --name urp-backend

# 4. Run smoke tests
.\scripts\smoke-test.ps1 https://api.urp.com
```

See [Deployment Guide](docs/DEPLOYMENT.md) for complete procedures.

## 🛠️ Development

### Project Structure

```
urp/
├── apps/
│   ├── backend/                    # NestJS API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── platform/       # Auth, RBAC, Config, Audit
│   │   │   │   ├── marketplace/    # Listings, Search, Leads
│   │   │   │   ├── ops/            # Assets, Bookings, Agreements, Tickets
│   │   │   │   ├── finance/        # Pricing, Invoices, Payments, Ledger
│   │   │   │   ├── tenant/         # Tenant Portal
│   │   │   │   ├── notifications/  # Notifications
│   │   │   │   └── reports/        # Reports
│   │   │   ├── common/             # Guards, Interceptors, Filters
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   ├── migrations/         # Database migrations
│   │   │   └── seed.ts             # Seed data
│   │   └── test/                   # E2E tests
│   └── frontend/                   # React SPA
├── packages/
│   └── shared/                     # Shared types & constants
├── docs/                           # Documentation
├── scripts/                        # Utility scripts
└── Script Test/                    # Milestone test scripts
```

### Available Scripts

```bash
# Development
pnpm dev                            # Start all services
pnpm -C apps/backend dev            # Start backend only
pnpm -C apps/frontend dev           # Start frontend only

# Building
pnpm build                          # Build all apps
pnpm -C apps/backend build          # Build backend only

# Database
pnpm -C apps/backend prisma generate    # Generate Prisma client
pnpm -C apps/backend prisma migrate dev # Run migrations
pnpm -C apps/backend prisma studio      # Open Prisma Studio
pnpm -C apps/backend seed               # Seed database

# Testing
pnpm test                           # Run all tests
pnpm test:e2e                       # Run E2E tests
pnpm test:cov                       # Generate coverage report

# Linting
pnpm lint                           # Lint all code
pnpm lint:fix                       # Fix linting issues
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://urp_user:urp_password@localhost:5432/urp_dev

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Webhook
WEBHOOK_SECRET=your-webhook-secret-here

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password123
MINIO_BUCKET=urp-dev

# Application
NODE_ENV=development
PORT=3000
```

## 📈 Project Status

### Completed Milestones
- ✅ **M1: Foundation** (24/24 tests passing)
- ✅ **M2: Marketplace** (55/55 tests passing)
- ✅ **M3: Property Ops** (70/70 tests passing)
- ✅ **M4: Finance** (66/66 tests passing)
- ✅ **M5: Tenant Journey** (50/50 tests passing)
- 🚧 **M6: Hardening** (in progress)

**Total**: 265/265 tests passing (100%)

See [PROJECT_CHECKLIST.md](PROJECT_CHECKLIST.md) for detailed progress.

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement feature with tests
3. Run linting and tests
4. Submit pull request
5. Code review and approval
6. Merge to `main`

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- 100% test coverage for critical paths
- Comprehensive API documentation
- Security-first development

## 📝 License

Proprietary - All rights reserved

## 🆘 Support

- **Documentation**: See [docs/](docs/) folder
- **Troubleshooting**: [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **API Docs**: http://localhost:3000/api/docs
- **Issues**: GitHub Issues
- **Email**: support@urp.com

## 🎯 Roadmap

### Upcoming Features
- [ ] Real-time notifications (WebSocket)
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics (BI dashboards)
- [ ] AI-powered pricing recommendations
- [ ] Automated rent collection
- [ ] Tenant screening integration
- [ ] Maintenance scheduling automation

### Technical Improvements
- [ ] Replace in-memory cache with Redis
- [ ] Implement database read replicas
- [ ] Add comprehensive E2E tests
- [ ] Set up distributed tracing
- [ ] Implement rate limiting with Redis
- [ ] Add database row-level security
- [ ] Implement MFA for authentication
- [ ] Add webhook retry mechanism
