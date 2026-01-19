# Deployment Guide - Multi-Property Type System

**Version**: 1.0  
**Last Updated**: 2026-01-15

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Database Migration](#database-migration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedure](#rollback-procedure)
8. [Monitoring](#monitoring)

---

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **pnpm**: 8.x or higher
- **Docker**: 20.x or higher (optional)

### Access Requirements

- Database admin credentials
- Server SSH access
- CI/CD pipeline access
- Monitoring dashboard access

---

## Pre-Deployment Checklist

### 1. Code Review

- [ ] All code reviewed and approved
- [ ] All tests passing
- [ ] No critical security vulnerabilities
- [ ] Documentation updated

### 2. Database Backup

```bash
# Backup production database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

### 3. Environment Variables

Ensure all required environment variables are set:

```bash
# Backend
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key
NODE_ENV=production

# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_APP_ENV=production
```

### 4. Dependencies

```bash
# Update dependencies
pnpm install

# Audit for vulnerabilities
pnpm audit
```

---

## Database Migration

### Step 1: Review Migration

```bash
cd apps/backend

# Review migration SQL
cat prisma/migrations/20260115_add_property_types/migration.sql
```

### Step 2: Test on Staging

```bash
# Run migration on staging
docker exec -i staging_postgres psql -U urp -d urp_staging < \
  prisma/migrations/20260115_add_property_types/migration.sql

# Verify migration
docker exec -i staging_postgres psql -U urp -d urp_staging -c \
  "SELECT COUNT(*) FROM property_categories;"
# Expected: 21

docker exec -i staging_postgres psql -U urp -d urp_staging -c \
  "SELECT COUNT(*) FROM amenities;"
# Expected: 30
```

### Step 3: Run on Production

```bash
# Create backup first!
pg_dump $PROD_DATABASE_URL > backup_before_migration_$(date +%Y%m%d).sql

# Run migration
docker exec -i prod_postgres psql -U urp -d urp_prod < \
  prisma/migrations/20260115_add_property_types/migration.sql

# Verify
docker exec -i prod_postgres psql -U urp -d urp_prod -c \
  "SELECT COUNT(*) FROM property_categories;"

docker exec -i prod_postgres psql -U urp -d urp_prod -c \
  "SELECT COUNT(*) FROM amenities;"

docker exec -i prod_postgres psql -U urp -d urp_prod -c \
  "SELECT COUNT(*) FROM rentable_items WHERE property_category IS NOT NULL;"
```

### Step 4: Generate Prisma Client

```bash
cd apps/backend
npm run prisma:generate
```

---

## Backend Deployment

### Step 1: Build

```bash
cd apps/backend

# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm run build

# Verify build
ls -lh dist/
```

### Step 2: Run Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Verify all tests pass
```

### Step 3: Deploy

#### Option A: Docker Deployment

```bash
# Build Docker image
docker build -t urp-backend:v1.1.0 .

# Tag for registry
docker tag urp-backend:v1.1.0 registry.yourdomain.com/urp-backend:v1.1.0

# Push to registry
docker push registry.yourdomain.com/urp-backend:v1.1.0

# Deploy to production
docker pull registry.yourdomain.com/urp-backend:v1.1.0
docker stop urp-backend-prod
docker rm urp-backend-prod
docker run -d \
  --name urp-backend-prod \
  --env-file .env.production \
  -p 3000:3000 \
  registry.yourdomain.com/urp-backend:v1.1.0
```

#### Option B: PM2 Deployment

```bash
# Copy files to server
rsync -avz --exclude node_modules dist/ user@server:/app/backend/

# On server
cd /app/backend
pnpm install --prod
pm2 restart urp-backend
```

### Step 4: Verify Backend

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Test new endpoints
curl http://localhost:3000/api/v1/property-categories
curl http://localhost:3000/api/v1/amenities
```

---

## Frontend Deployment

### Step 1: Build

```bash
cd apps/frontend

# Install dependencies
pnpm install --frozen-lockfile

# Build for production
pnpm run build

# Verify build
ls -lh dist/
```

### Step 2: Deploy

#### Option A: Static Hosting (Vercel/Netlify)

```bash
# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

#### Option B: Nginx

```bash
# Copy build to server
rsync -avz dist/ user@server:/var/www/urp-frontend/

# On server, reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### Option C: Docker

```bash
# Build Docker image
docker build -t urp-frontend:v1.1.0 .

# Deploy
docker run -d \
  --name urp-frontend-prod \
  -p 80:80 \
  urp-frontend:v1.1.0
```

### Step 3: Verify Frontend

```bash
# Check homepage
curl https://yourdomain.com

# Check new pages
curl https://yourdomain.com/discover
curl https://yourdomain.com/assets
```

---

## Post-Deployment Verification

### 1. Smoke Tests

```bash
# Test property categories API
curl -X GET "https://api.yourdomain.com/api/v1/property-categories" \
  -H "Authorization: Bearer $TOKEN"

# Test amenities API
curl -X GET "https://api.yourdomain.com/api/v1/amenities" \
  -H "Authorization: Bearer $TOKEN"

# Test pricing calculator
curl -X POST "https://api.yourdomain.com/api/v1/pricing/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rentable_item_id": "test-id",
    "pricing_policy_id": "test-policy-id",
    "start_date": "2026-01-20",
    "end_date": "2026-01-25"
  }'
```

### 2. UI Tests

- [ ] Login works
- [ ] Create rentable item with new fields
- [ ] Select property category
- [ ] Select amenities
- [ ] Filter listings
- [ ] Calculate price
- [ ] Create booking

### 3. Data Integrity

```sql
-- Check existing data migrated correctly
SELECT COUNT(*) FROM rentable_items WHERE property_category IS NOT NULL;
-- Should match total rentable items

-- Check reference tables
SELECT COUNT(*) FROM property_categories;
-- Expected: 21

SELECT COUNT(*) FROM amenities;
-- Expected: 30

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'rentable_items';
-- Should include new indexes
```

### 4. Performance Tests

```bash
# Load test with 100 concurrent users
ab -n 1000 -c 100 https://api.yourdomain.com/api/v1/property-categories

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.yourdomain.com/api/v1/amenities
```

---

## Rollback Procedure

### If Issues Occur

#### 1. Rollback Database

```bash
# Run rollback SQL
docker exec -i prod_postgres psql -U urp -d urp_prod < \
  prisma/migrations/20260115_add_property_types/rollback.sql

# Or restore from backup
psql $PROD_DATABASE_URL < backup_before_migration_20260115.sql
```

#### 2. Rollback Backend

```bash
# Docker
docker stop urp-backend-prod
docker rm urp-backend-prod
docker run -d \
  --name urp-backend-prod \
  registry.yourdomain.com/urp-backend:v1.0.0

# PM2
pm2 stop urp-backend
cd /app/backend
git checkout v1.0.0
pnpm install
pnpm run build
pm2 start urp-backend
```

#### 3. Rollback Frontend

```bash
# Vercel
vercel rollback

# Nginx
rsync -avz backup/dist/ user@server:/var/www/urp-frontend/
sudo systemctl reload nginx
```

---

## Monitoring

### 1. Application Logs

```bash
# Backend logs
pm2 logs urp-backend

# Or Docker logs
docker logs -f urp-backend-prod

# Frontend logs (Nginx)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 2. Database Monitoring

```sql
-- Check query performance
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Error Tracking

Monitor for:
- 500 errors
- Database connection errors
- Authentication failures
- Slow queries (> 1s)

### 4. Metrics to Watch

- **Response Time**: < 200ms for API calls
- **Error Rate**: < 1%
- **Database Connections**: < 80% of max
- **Memory Usage**: < 80%
- **CPU Usage**: < 70%

---

## Maintenance

### Daily

- [ ] Check error logs
- [ ] Monitor response times
- [ ] Verify backups

### Weekly

- [ ] Review performance metrics
- [ ] Check disk space
- [ ] Update dependencies (if needed)

### Monthly

- [ ] Database optimization
- [ ] Security audit
- [ ] Capacity planning

---

## Support Contacts

- **DevOps Lead**: devops@urp.com
- **Database Admin**: dba@urp.com
- **On-Call Engineer**: +84-xxx-xxx-xxx
- **Incident Channel**: #incidents (Slack)

---

## Deployment History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| v1.1.0 | 2026-01-15 | Multi-property type system | ✅ Deployed |
| v1.0.0 | 2025-12-01 | Initial release | ✅ Deployed |

---

**Deployment completed successfully! 🚀**
