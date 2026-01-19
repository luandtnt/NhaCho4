# Troubleshooting Guide

## Common Issues and Solutions

### Application Issues

#### Issue: Application won't start
**Symptoms**: Backend fails to start, error messages in console

**Solutions**:
```bash
# Check if port is already in use
netstat -ano | findstr :3000

# Check environment variables
echo $env:DATABASE_URL
echo $env:JWT_SECRET

# Check database connection
psql $env:DATABASE_URL -c "SELECT 1"

# Check logs
pm2 logs urp-backend
# or
docker logs urp-backend

# Verify dependencies installed
pnpm install

# Regenerate Prisma client
pnpm -C apps/backend prisma generate
```

#### Issue: "Cannot find module" errors
**Symptoms**: Module not found errors during startup

**Solutions**:
```bash
# Clean install
Remove-Item -Recurse -Force node_modules
Remove-Item pnpm-lock.yaml
pnpm install

# Regenerate Prisma client
pnpm -C apps/backend prisma generate

# Rebuild application
pnpm -C apps/backend build
```

#### Issue: High memory usage
**Symptoms**: Application consuming excessive memory, slow performance

**Solutions**:
```bash
# Check memory usage
pm2 monit

# Restart with memory limit
pm2 restart urp-backend --max-memory-restart 1G

# Check for memory leaks
node --inspect apps/backend/dist/main.js

# Increase Node.js memory limit
$env:NODE_OPTIONS="--max-old-space-size=4096"
```

### Database Issues

#### Issue: Database connection failed
**Symptoms**: "Connection refused" or "Connection timeout" errors

**Solutions**:
```bash
# Check if PostgreSQL is running
docker ps | findstr postgres

# Start PostgreSQL
docker compose up -d postgres

# Test connection
psql -h localhost -U urp_user -d urp_dev -c "SELECT 1"

# Check connection string
echo $env:DATABASE_URL

# Verify credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/urp_dev
```

#### Issue: Migration failed
**Symptoms**: Migration errors, schema mismatch

**Solutions**:
```bash
# Check migration status
pnpm -C apps/backend prisma migrate status

# Reset database (CAUTION: deletes all data)
pnpm -C apps/backend prisma migrate reset

# Apply migrations manually
pnpm -C apps/backend prisma migrate deploy

# Resolve failed migration
pnpm -C apps/backend prisma migrate resolve --applied <migration-name>
```

#### Issue: Database connection pool exhausted
**Symptoms**: "Too many connections" errors

**Solutions**:
```bash
# Check active connections
psql $env:DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname='urp_dev'"

# Kill idle connections
psql $env:DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='urp_dev' AND state='idle' AND state_change < now() - interval '5 minutes'"

# Increase connection pool size in .env
# DATABASE_POOL_SIZE=30

# Use connection pooler (PgBouncer)
# DATABASE_URL=postgresql://user:password@localhost:6432/urp_dev
```

#### Issue: Slow queries
**Symptoms**: API endpoints taking too long to respond

**Solutions**:
```bash
# Enable query logging
# In postgresql.conf:
# log_statement = 'all'
# log_duration = on

# Check slow queries
psql $env:DATABASE_URL -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10"

# Analyze query plan
psql $env:DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM listings WHERE org_id = '...' AND status = 'PUBLISHED'"

# Create missing indexes
# See docs/PERFORMANCE.md for recommended indexes
```

### Authentication Issues

#### Issue: "Unauthorized" errors
**Symptoms**: 401 Unauthorized responses

**Solutions**:
```bash
# Check if token is valid
# Decode JWT at https://jwt.io

# Verify JWT_SECRET matches
echo $env:JWT_SECRET

# Check token expiration
# Access tokens expire after 15 minutes

# Refresh token
curl -X POST http://localhost:3000/api/v1/auth/refresh `
  -H "Content-Type: application/json" `
  -d '{"refresh_token":"..."}'

# Re-login
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"landlord@example.com","password":"Password123!"}'
```

#### Issue: "Forbidden" errors
**Symptoms**: 403 Forbidden responses

**Solutions**:
```bash
# Check user role
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/auth/me

# Verify RBAC permissions
# See docs/ARCHITECTURE.md for permission matrix

# Check org_id scope
# Ensure user belongs to correct organization

# Review audit logs
psql $env:DATABASE_URL -c "SELECT * FROM audit_logs WHERE actor_id = '...' ORDER BY created_at DESC LIMIT 10"
```

### Payment Issues

#### Issue: Payment webhook not working
**Symptoms**: Payments stuck in PENDING status

**Solutions**:
```bash
# Check webhook secret
echo $env:WEBHOOK_SECRET

# Verify webhook signature
# See apps/backend/src/modules/finance/payment/payment.service.ts

# Check webhook logs
psql $env:DATABASE_URL -c "SELECT * FROM audit_logs WHERE action = 'webhook_received' ORDER BY created_at DESC LIMIT 10"

# Manually trigger webhook (testing only)
curl -X POST http://localhost:3000/api/v1/payments/webhook/vnpay `
  -H "Content-Type: application/json" `
  -H "X-Webhook-Signature: ..." `
  -d '{"event":"payment.succeeded","payment_id":"..."}'
```

#### Issue: Idempotency key conflict
**Symptoms**: 409 Conflict errors on payment creation

**Solutions**:
```bash
# Check existing payment with same idempotency key
psql $env:DATABASE_URL -c "SELECT * FROM payments WHERE idempotency_key = '...'"

# Use different idempotency key
# Or verify amount matches existing payment

# Clear old idempotency keys (if needed)
psql $env:DATABASE_URL -c "DELETE FROM payments WHERE idempotency_key = '...' AND status = 'FAILED'"
```

### Cache Issues

#### Issue: Stale data returned
**Symptoms**: API returns outdated information

**Solutions**:
```bash
# Clear cache manually
# (Currently in-memory, restart application)
pm2 restart urp-backend

# Or implement cache invalidation
# See apps/backend/src/common/interceptors/cache.interceptor.ts

# Disable cache temporarily
# Remove CacheInterceptor from app.module.ts
```

#### Issue: Redis connection failed
**Symptoms**: Cache not working, Redis errors

**Solutions**:
```bash
# Check if Redis is running
docker ps | findstr redis

# Start Redis
docker compose up -d redis

# Test connection
redis-cli ping

# Check Redis URL
echo $env:REDIS_URL

# Clear Redis cache
redis-cli FLUSHALL
```

### File Storage Issues

#### Issue: File upload failed
**Symptoms**: 500 errors on file upload

**Solutions**:
```bash
# Check if MinIO is running
docker ps | findstr minio

# Start MinIO
docker compose up -d minio

# Test connection
curl http://localhost:9000/minio/health/live

# Check credentials
echo $env:MINIO_ACCESS_KEY
echo $env:MINIO_SECRET_KEY

# Verify bucket exists
# Access MinIO console at http://localhost:9001
```

### Performance Issues

#### Issue: Slow API responses
**Symptoms**: High latency, timeouts

**Solutions**:
```bash
# Run performance benchmark
.\scripts\benchmark-search.ps1

# Check database indexes
psql $env:DATABASE_URL -c "\d+ listings"

# Monitor database performance
psql $env:DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state = 'active'"

# Check application logs for slow queries
pm2 logs urp-backend | Select-String "slow query"

# Increase cache TTL
# See apps/backend/src/common/interceptors/cache.interceptor.ts
```

#### Issue: High CPU usage
**Symptoms**: CPU at 100%, slow performance

**Solutions**:
```bash
# Check CPU usage
pm2 monit

# Profile application
node --prof apps/backend/dist/main.js

# Check for infinite loops or heavy computations
# Review recent code changes

# Scale horizontally
pm2 scale urp-backend +2
```

### Test Issues

#### Issue: Tests failing
**Symptoms**: Test suite not passing

**Solutions**:
```bash
# Run tests with verbose output
pnpm -C apps/backend test --verbose

# Run specific test file
pnpm -C apps/backend test ticket.service.spec.ts

# Check test database
echo $env:DATABASE_URL_TEST

# Reset test database
pnpm -C apps/backend prisma migrate reset --force

# Clear test cache
pnpm -C apps/backend test --clearCache
```

#### Issue: E2E tests timing out
**Symptoms**: E2E tests fail with timeout errors

**Solutions**:
```bash
# Increase timeout
# In test file: jest.setTimeout(30000)

# Check if backend is running
curl http://localhost:3000/health

# Start backend for E2E tests
pnpm -C apps/backend dev

# Run E2E tests
pnpm -C apps/backend test:e2e
```

## Debugging Tips

### Enable Debug Logging
```bash
# Set log level to debug
$env:LOG_LEVEL="debug"

# Restart application
pm2 restart urp-backend
```

### Check Application Health
```bash
# Health endpoint
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/api/v1/health/db

# Redis health
curl http://localhost:3000/api/v1/health/redis
```

### Inspect Database State
```bash
# Connect to database
psql $env:DATABASE_URL

# Check table counts
SELECT 'users' as table, count(*) FROM users
UNION ALL
SELECT 'listings', count(*) FROM listings
UNION ALL
SELECT 'agreements', count(*) FROM agreements;

# Check recent audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;

# Check active sessions
SELECT * FROM refresh_tokens WHERE revoked = false;
```

### Monitor Application
```bash
# Real-time logs
pm2 logs urp-backend --lines 100

# Monitor metrics
pm2 monit

# Check process status
pm2 status
```

## Getting Help

### Before Asking for Help
1. Check this troubleshooting guide
2. Review error messages and stack traces
3. Check application logs
4. Verify environment variables
5. Test with minimal reproduction case

### Information to Provide
- Error message and stack trace
- Steps to reproduce
- Environment (dev/staging/prod)
- Recent changes or deployments
- Relevant logs
- Database state (if applicable)

### Support Channels
- **GitHub Issues**: For bugs and feature requests
- **Slack**: #urp-support channel
- **Email**: support@urp.com
- **On-call**: For production emergencies

## Preventive Measures

### Regular Maintenance
- [ ] Run database backups daily
- [ ] Monitor disk space weekly
- [ ] Review error logs weekly
- [ ] Update dependencies monthly
- [ ] Run security audits monthly
- [ ] Review performance metrics weekly

### Best Practices
- Always test in staging before production
- Use feature flags for risky changes
- Monitor error rates after deployments
- Keep documentation up to date
- Review audit logs regularly
- Maintain runbooks for common issues
