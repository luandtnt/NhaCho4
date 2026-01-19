# Deployment Guide

## Overview
This guide covers deployment procedures for staging and production environments.

## Prerequisites

### Infrastructure Requirements
- **Compute**: 2 vCPU, 4GB RAM minimum (backend)
- **Database**: PostgreSQL 14+ with 20GB storage
- **Cache**: Redis 6+ with 2GB memory
- **Storage**: MinIO or S3-compatible storage with 50GB
- **Load Balancer**: Nginx or cloud load balancer with SSL/TLS

### Required Secrets
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/urp_prod

# JWT
JWT_SECRET=<256-bit-random-key>
JWT_REFRESH_SECRET=<256-bit-random-key>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Webhook
WEBHOOK_SECRET=<256-bit-random-key>

# Redis
REDIS_URL=redis://host:6379

# MinIO/S3
MINIO_ENDPOINT=https://s3.amazonaws.com
MINIO_ACCESS_KEY=<access-key>
MINIO_SECRET_KEY=<secret-key>
MINIO_BUCKET=urp-prod

# Application
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://app.urp.com
```

## Deployment Environments

### Development
- **URL**: http://localhost:3000
- **Database**: Local PostgreSQL (docker-compose)
- **Purpose**: Local development and testing

### Staging
- **URL**: https://staging-api.urp.com
- **Database**: Staging PostgreSQL (isolated)
- **Purpose**: Pre-production testing and QA

### Production
- **URL**: https://api.urp.com
- **Database**: Production PostgreSQL (replicated)
- **Purpose**: Live production environment

## Deployment Process

### 1. Pre-Deployment Checklist
- [ ] All tests passing (M1-M6)
- [ ] Code reviewed and approved
- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup completed
- [ ] Rollback plan ready
- [ ] Stakeholders notified

### 2. Database Migration
```bash
# Backup database first
pg_dump -h $DB_HOST -U $DB_USER -d urp_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
pnpm -C apps/backend prisma migrate deploy

# Verify migration
pnpm -C apps/backend prisma migrate status
```

### 3. Build Application
```bash
# Install dependencies
pnpm install --frozen-lockfile

# Generate Prisma client
pnpm -C apps/backend prisma generate

# Build backend
pnpm -C apps/backend build

# Build frontend
pnpm -C apps/frontend build
```

### 4. Deploy Backend
```bash
# Using PM2 (recommended)
pm2 start apps/backend/dist/main.js --name urp-backend

# Or using Docker
docker build -t urp-backend:latest -f apps/backend/Dockerfile .
docker run -d -p 3000:3000 --env-file .env.prod urp-backend:latest

# Or using systemd
sudo systemctl restart urp-backend
```

### 5. Deploy Frontend
```bash
# Copy build to web server
rsync -avz apps/frontend/dist/ user@server:/var/www/urp/

# Or deploy to CDN (e.g., Cloudflare, Vercel)
vercel deploy --prod
```

### 6. Post-Deployment Verification
```bash
# Run smoke tests
pnpm run smoke-test:prod

# Check health endpoint
curl https://api.urp.com/health

# Verify database connection
curl https://api.urp.com/api/v1/health/db

# Check API documentation
curl https://api.urp.com/api/docs
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm build
      - run: ./scripts/deploy-staging.sh

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm build
      - run: ./scripts/deploy-production.sh
```

## Rollback Procedures

### Quick Rollback (Application)
```bash
# Using PM2
pm2 list
pm2 restart urp-backend@previous

# Using Docker
docker ps
docker stop urp-backend-current
docker start urp-backend-previous

# Using systemd
sudo systemctl stop urp-backend
# Restore previous version files
sudo systemctl start urp-backend
```

### Database Rollback
```bash
# Restore from backup
psql -h $DB_HOST -U $DB_USER -d urp_prod < backup_20260105_120000.sql

# Or rollback specific migration
pnpm -C apps/backend prisma migrate resolve --rolled-back <migration-name>
```

### Rollback Decision Matrix
| Issue | Severity | Action | Rollback? |
|-------|----------|--------|-----------|
| Minor UI bug | Low | Fix forward | No |
| API 500 errors | High | Rollback immediately | Yes |
| Database corruption | Critical | Rollback + restore DB | Yes |
| Performance degradation | Medium | Monitor, fix forward | Maybe |
| Security vulnerability | Critical | Rollback + patch | Yes |

## Backup and Restore

### Automated Backup Schedule
- **Database**: Daily at 2 AM UTC, retained for 30 days
- **Files**: Daily at 3 AM UTC, retained for 30 days
- **Configuration**: On every change, retained for 90 days

### Backup Script
```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/urp"

# Backup database
pg_dump -h $DB_HOST -U $DB_USER -d urp_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup files (MinIO)
mc mirror minio/urp-prod $BACKUP_DIR/files_$DATE/

# Backup configuration
cp .env.prod $BACKUP_DIR/config_$DATE.env

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Restore Procedure
```bash
# Restore database
gunzip < /backups/urp/db_20260105_020000.sql.gz | psql -h $DB_HOST -U $DB_USER -d urp_prod

# Restore files
mc mirror /backups/urp/files_20260105_030000/ minio/urp-prod

# Verify restore
pnpm run smoke-test
```

## Smoke Tests

### Critical Path Tests
```bash
# scripts/smoke-test.sh
#!/bin/bash

API_URL=${1:-https://api.urp.com}
TOKEN=$(curl -s -X POST $API_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"landlord@example.com","password":"Password123!"}' \
  | jq -r '.access_token')

# Test 1: Health check
echo "Testing health endpoint..."
curl -f $API_URL/health || exit 1

# Test 2: Auth
echo "Testing authentication..."
[ -n "$TOKEN" ] || exit 1

# Test 3: Listings
echo "Testing listings endpoint..."
curl -f -H "Authorization: Bearer $TOKEN" $API_URL/api/v1/listings || exit 1

# Test 4: Search
echo "Testing search endpoint..."
curl -f $API_URL/api/v1/search/listings?q=apartment || exit 1

# Test 5: Database
echo "Testing database connection..."
curl -f $API_URL/api/v1/health/db || exit 1

echo "All smoke tests passed!"
```

## Monitoring and Alerting

### Health Endpoints
- `GET /health` - Basic health check
- `GET /api/v1/health/db` - Database connectivity
- `GET /api/v1/health/redis` - Redis connectivity
- `GET /api/v1/health/storage` - MinIO/S3 connectivity

### Monitoring Setup
```bash
# Install monitoring agent (example: Prometheus)
docker run -d -p 9090:9090 \
  -v ./prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Install Grafana for dashboards
docker run -d -p 3001:3000 grafana/grafana
```

### Alert Rules
- Response time > 2s for 5 minutes → Page on-call
- Error rate > 5% for 2 minutes → Page on-call
- Database connections > 90% → Warning
- Disk usage > 85% → Warning
- Memory usage > 90% → Warning

## Scaling Strategies

### Horizontal Scaling
```bash
# Add more backend instances
pm2 scale urp-backend +2

# Or with Docker Swarm
docker service scale urp-backend=5

# Or with Kubernetes
kubectl scale deployment urp-backend --replicas=5
```

### Database Scaling
- **Read replicas**: For read-heavy workloads
- **Connection pooling**: PgBouncer for connection management
- **Partitioning**: For large tables (audit_logs, ledger_entries)

### Cache Scaling
- **Redis Cluster**: For high availability
- **Redis Sentinel**: For automatic failover

## Security Hardening

### Production Security Checklist
- [x] HTTPS enforced (SSL/TLS certificates)
- [x] CORS configured with whitelist
- [x] Rate limiting enabled
- [x] Firewall rules configured
- [x] Database access restricted to backend only
- [x] Secrets stored in environment variables
- [x] Regular security audits scheduled
- [ ] WAF (Web Application Firewall) configured
- [ ] DDoS protection enabled
- [ ] Intrusion detection system configured

## Troubleshooting

### Common Issues

**Issue**: Application won't start
```bash
# Check logs
pm2 logs urp-backend
# or
docker logs urp-backend

# Check environment variables
env | grep DATABASE_URL

# Check database connection
psql $DATABASE_URL -c "SELECT 1"
```

**Issue**: High memory usage
```bash
# Check memory usage
pm2 monit

# Restart with memory limit
pm2 restart urp-backend --max-memory-restart 1G
```

**Issue**: Database connection pool exhausted
```bash
# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"

# Increase pool size in .env
DATABASE_POOL_SIZE=30
```

## Maintenance Windows

### Scheduled Maintenance
- **Frequency**: Monthly, first Sunday at 2 AM UTC
- **Duration**: 2 hours maximum
- **Notification**: 7 days advance notice
- **Procedure**:
  1. Enable maintenance mode
  2. Backup database
  3. Apply updates
  4. Run migrations
  5. Smoke tests
  6. Disable maintenance mode

## Support and Escalation

### On-Call Rotation
- **Primary**: DevOps engineer
- **Secondary**: Backend lead
- **Escalation**: CTO

### Incident Response
1. Acknowledge incident (< 5 minutes)
2. Assess severity and impact
3. Communicate to stakeholders
4. Implement fix or rollback
5. Verify resolution
6. Post-mortem within 48 hours

## Next Steps
1. Set up CI/CD pipeline in GitHub Actions
2. Configure monitoring and alerting
3. Test rollback procedures
4. Document runbooks for common issues
5. Schedule regular disaster recovery drills
