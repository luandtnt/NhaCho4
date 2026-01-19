# URP Architecture Documentation

## System Overview

URP (Universal Rental Platform) is a multi-tenant SaaS platform for managing rental properties, marketplace listings, tenant relationships, and financial operations.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (React + Vite + Tailwind)                 │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
│                    (Nginx / Cloud LB)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (NestJS)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Platform: Auth, RBAC, Config, Audit, Multi-tenant  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Marketplace: Listings, Search, Leads                │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Ops: Assets, Spaces, Rentables, Bookings, Tickets  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Finance: Pricing, Invoices, Payments, Ledger       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Tenant: Portal, Notifications, Reports              │   │
│  └──────────────────────────────────────────────────────┘   │
└───┬─────────────┬─────────────┬─────────────┬──────────────┘
    │             │             │             │
    ▼             ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│PostgreSQL│  │  Redis  │  │  MinIO  │  │ Payment │
│         │  │ (Cache) │  │ (S3)    │  │ Gateway │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
```

## Technology Stack

### Backend
- **Framework**: NestJS 10.x (TypeScript)
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Storage**: MinIO (S3-compatible)
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context / Zustand
- **HTTP Client**: Axios
- **Routing**: React Router

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana (recommended)
- **Logging**: Structured JSON logs

## Module Architecture

### Platform Modules (Foundation)

#### Auth Module
- **Purpose**: User authentication and session management
- **Endpoints**:
  - `POST /api/v1/auth/login` - Login with email/password
  - `POST /api/v1/auth/refresh` - Refresh access token
  - `POST /api/v1/auth/logout` - Logout and revoke refresh token
  - `GET /api/v1/auth/me` - Get current user profile
- **Security**: bcrypt password hashing, JWT tokens, refresh token rotation

#### RBAC Module
- **Purpose**: Role-based access control (deny-by-default)
- **Roles**: Landlord, PropertyManager, Tenant, OrgAdmin
- **Permissions**: Resource-action pairs (e.g., `listing:create`)
- **Guards**: RbacGuard (checks permissions), DataScopeGuard (enforces org_id)

#### Config Engine Module
- **Purpose**: Dynamic configuration management
- **Features**: Config bundles, versioning, activation, rollback
- **Endpoints**:
  - `POST /api/v1/config` - Create config bundle
  - `GET /api/v1/config` - List config bundles
  - `POST /api/v1/config/:id/activate` - Activate bundle
  - `POST /api/v1/config/:id/rollback` - Rollback to previous

#### Audit Module
- **Purpose**: Audit trail for all mutations
- **Logged Data**: actor_id, org_id, action, resource, request_id, metadata
- **Implementation**: AuditLogInterceptor (automatic)

### Marketplace Modules

#### Listing Module
- **Purpose**: Manage rental property listings
- **Features**: CRUD, publish/unpublish, media attachments, soft delete
- **Status Flow**: DRAFT → PUBLISHED → ARCHIVED
- **Endpoints**: 8 endpoints (create, list, get, update, delete, publish, unpublish, media)

#### Search Module
- **Purpose**: Search and discovery of listings
- **Features**: Full-text search, filters, geo search, autocomplete
- **Indexes**: PostgreSQL FTS, trigram (fuzzy), PostGIS (geo)
- **Endpoints**: 3 endpoints (search, suggest, geo)

#### Lead Module
- **Purpose**: Inquiry and lead management
- **Features**: Create inquiry, assign, convert to booking
- **Status Flow**: NEW → CONTACTED → QUALIFIED → CONVERTED → LOST
- **Endpoints**: 5 endpoints (create, list, get, update, assign, convert)

### Ops Modules

#### Asset Module
- **Purpose**: Physical property asset registry
- **Features**: CRUD, config-driven fields, space node management
- **Endpoints**: 5 endpoints (create, list, get, update, add-space-nodes)

#### Space Node Module
- **Purpose**: Hierarchical space graph (building → floor → unit)
- **Features**: CRUD, tree hierarchy, cycle prevention
- **Endpoints**: 5 endpoints (create, list, get, update, delete, tree)

#### Rentable Item Module
- **Purpose**: Rentable units/resources
- **Features**: CRUD, availability tracking, allocation types
- **Allocation Types**: exclusive, capacity, slot
- **Endpoints**: 4 endpoints (create, list, update, availability)

#### Booking Module
- **Purpose**: Reservation and booking management
- **Features**: Create booking, confirm, cancel, conflict detection
- **Status Flow**: PENDING → CONFIRMED → ACTIVE → COMPLETED → CANCELLED
- **Endpoints**: 4 endpoints (create, list, confirm, cancel)

#### Agreement Module
- **Purpose**: Rental agreement lifecycle
- **Features**: State machine, e-sign stub, RBAC per transition
- **Status Flow**: DRAFT → UNDER_REVIEW → SIGNED → ACTIVE → SUSPENDED → TERMINATED
- **Endpoints**: 8 endpoints (create, list, get, review, sign, activate, suspend, terminate, extend)

#### Ticket Module
- **Purpose**: Maintenance and support tickets
- **Features**: CRUD, comments, assign, close, attachments
- **Status Flow**: OPEN → IN_PROGRESS → CLOSED
- **Categories**: MAINTENANCE, REPAIR, COMPLAINT, REQUEST, EMERGENCY
- **Priorities**: LOW, MEDIUM, HIGH, URGENT
- **Endpoints**: 8 endpoints (create, list, get, update, comment, assign, close, attachments)

### Finance Modules

#### Pricing Policy Module
- **Purpose**: Config-driven pricing rules
- **Features**: CRUD, activate, effective date ranges, currency support
- **Endpoints**: 5 endpoints (create, list, get, update, activate)

#### Invoice Module
- **Purpose**: Billing and invoicing
- **Features**: CRUD, void, mark overdue, line items, total validation
- **Status Flow**: ISSUED → PAID / VOID / OVERDUE
- **Endpoints**: 5 endpoints (create, list, get, void, mark-overdue)

#### Payment Module
- **Purpose**: Payment processing and webhooks
- **Features**: Payment intent, webhook handler, refund, idempotency
- **Providers**: vnpay, stripe, momo
- **Security**: Signature verification, replay protection
- **Status Flow**: PENDING → SUCCEEDED / FAILED → REFUNDED
- **Endpoints**: 5 endpoints (create, webhook, list, get, refund)

#### Ledger Module
- **Purpose**: Append-only financial ledger
- **Features**: Query, export, reconcile, immutable
- **Entry Types**: INVOICE_ISSUED, PAYMENT_SUCCEEDED, REFUND
- **Endpoints**: 3 endpoints (list, export, reconcile)

### Tenant Modules

#### Tenant Portal Module
- **Purpose**: Tenant self-service portal
- **Features**: View agreements, invoices, payments, tickets
- **Scoping**: Tenant can only see own data (via party email)
- **Endpoints**: 5 endpoints (agreements, invoices, payments, tickets, create-payment)

#### Notifications Module
- **Purpose**: In-app notifications
- **Features**: List notifications, mark as read
- **Types**: EMAIL, SMS, IN_APP, PUSH
- **Status**: UNREAD, READ, SENT, FAILED
- **Endpoints**: 2 endpoints (list, mark-read)

#### Reports Module
- **Purpose**: Business intelligence and dashboards
- **Features**: Occupancy, revenue, tickets summary
- **RBAC**: Landlord/PropertyManager/OrgAdmin only
- **Endpoints**: 3 endpoints (occupancy, revenue, tickets-summary)

#### Party Module
- **Purpose**: Party (person/organization) management
- **Features**: List parties with type filter
- **Types**: LANDLORD, TENANT, VENDOR, CONTRACTOR
- **Endpoints**: 1 endpoint (list)

## Data Model

### Core Entities

```
organizations (org_id, name, settings)
  ├── users (user_id, org_id, email, role)
  ├── parties (party_id, org_id, type, email, name)
  ├── assets (asset_id, org_id, name, address)
  │   └── space_nodes (node_id, asset_id, parent_id, name)
  │       └── rentable_items (item_id, node_id, allocation_type)
  ├── listings (listing_id, org_id, status, title, price)
  ├── leads (lead_id, org_id, listing_id, status)
  ├── bookings (booking_id, org_id, item_id, status, dates)
  ├── agreements (agreement_id, org_id, booking_id, status)
  ├── pricing_policies (policy_id, org_id, rules)
  ├── invoices (invoice_id, org_id, agreement_id, status, total)
  ├── payments (payment_id, org_id, invoice_id, status, amount)
  ├── ledger_entries (entry_id, org_id, type, amount) [append-only]
  ├── tickets (ticket_id, org_id, reporter_id, status, priority)
  ├── notifications (notification_id, user_id, type, status)
  └── audit_logs (log_id, org_id, actor_id, action, resource)
```

### Key Relationships
- **1:N**: Organization → Users, Assets, Listings, etc.
- **1:N**: Asset → SpaceNodes
- **1:N**: SpaceNode → RentableItems
- **1:1**: Booking → Agreement
- **1:N**: Agreement → Invoices
- **1:N**: Invoice → Payments
- **1:N**: Payment → LedgerEntries

## Security Architecture

### Multi-Tenant Isolation
- **org_id enforcement**: Every query filtered by org_id
- **DataScopeGuard**: Automatically injects org_id from JWT
- **Service layer**: All services enforce org_id in queries
- **Database**: Row-level security (optional, not yet implemented)

### Authentication Flow
```
1. User submits email + password
2. Backend validates credentials (bcrypt)
3. Backend issues access token (15m) + refresh token (7d)
4. Client stores tokens (httpOnly cookies or localStorage)
5. Client includes access token in Authorization header
6. Backend validates JWT signature and expiration
7. On expiration, client uses refresh token to get new access token
8. On logout, refresh token is revoked
```

### Authorization Flow
```
1. Request arrives with JWT access token
2. JwtAuthGuard validates token and extracts user
3. RbacGuard checks user role and permissions
4. DataScopeGuard injects org_id into request context
5. Controller/service executes with org_id scope
6. AuditLogInterceptor logs mutation (if applicable)
```

### RBAC Permissions Matrix

| Resource | Landlord | PropertyManager | Tenant | OrgAdmin |
|----------|----------|-----------------|--------|----------|
| Listings | CRUD | CRUD | Read (public) | CRUD |
| Assets | CRUD | CRUD | - | CRUD |
| Bookings | CRUD | CRUD | Read (own) | CRUD |
| Agreements | CRUD | CRUD | Read (own) | CRUD |
| Invoices | CRUD | CRUD | Read (own) | CRUD |
| Payments | CRUD | CRUD | Create (own) | CRUD |
| Tickets | CRUD | CRUD | Create, Read (own) | CRUD |
| Reports | Read | Read | - | Read |

## Performance Optimizations

### Database Indexes
- All foreign keys indexed
- Composite indexes on (org_id, status) for list queries
- Full-text search indexes on listings
- Timestamp indexes for audit logs and ledger

### Caching Strategy
- **In-memory cache**: CacheInterceptor (60s TTL)
- **Redis cache**: Planned for search results and reports
- **Cache invalidation**: On mutations via service layer

### Query Optimization
- Pagination on all list endpoints (limit/offset)
- Selective field loading with Prisma `select`
- Avoid N+1 queries with Prisma `include`
- Connection pooling (20 connections)

## Scalability Considerations

### Horizontal Scaling
- **Stateless backend**: Can run multiple instances behind load balancer
- **Session storage**: JWT tokens (no server-side sessions)
- **Cache**: Redis for shared cache across instances

### Database Scaling
- **Read replicas**: For read-heavy workloads
- **Connection pooling**: PgBouncer for connection management
- **Partitioning**: For large tables (audit_logs, ledger_entries)

### File Storage Scaling
- **MinIO**: Distributed mode for high availability
- **CDN**: CloudFront or Cloudflare for static assets

## Monitoring and Observability

### Logging
- **Structured logs**: JSON format with request_id
- **PII masking**: Email, phone, credit card numbers
- **Log levels**: ERROR, WARN, INFO, DEBUG
- **Log aggregation**: ELK stack or cloud logging

### Metrics
- **Response time**: p50, p95, p99 latencies
- **Error rate**: 4xx and 5xx responses
- **Throughput**: Requests per second
- **Database**: Query duration, connection pool usage
- **Cache**: Hit rate, miss rate

### Tracing
- **Request ID**: Propagated through all services
- **Distributed tracing**: OpenTelemetry (recommended)

## Disaster Recovery

### Backup Strategy
- **Database**: Daily backups, retained for 30 days
- **Files**: Daily backups to S3, retained for 30 days
- **Configuration**: Versioned in Git

### Recovery Procedures
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours
- **Backup restoration**: Automated scripts
- **Failover**: Manual (automated in future)

## Future Enhancements

### Planned Features
- [ ] Real-time notifications (WebSocket)
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics (BI dashboards)
- [ ] AI-powered pricing recommendations
- [ ] Automated rent collection
- [ ] Tenant screening integration
- [ ] Maintenance scheduling automation

### Technical Debt
- [ ] Replace in-memory cache with Redis
- [ ] Implement database read replicas
- [ ] Add comprehensive E2E tests
- [ ] Set up distributed tracing
- [ ] Implement rate limiting with Redis
- [ ] Add database row-level security
- [ ] Implement MFA for authentication
- [ ] Add webhook retry mechanism

## References
- [API Documentation](http://localhost:3000/api/docs)
- [Database Schema](../apps/backend/prisma/schema.prisma)
- [Security Guide](./SECURITY.md)
- [Performance Guide](./PERFORMANCE.md)
- [Deployment Guide](./DEPLOYMENT.md)
