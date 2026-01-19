# Performance Optimization Guide

## Overview
This document outlines performance targets, optimization strategies, and monitoring baselines for the URP platform.

## Performance Targets

### Response Time Targets
- **Auth endpoints**: < 200ms (p95)
- **Search endpoints**: < 500ms (p95)
- **CRUD operations**: < 300ms (p95)
- **Report generation**: < 2s (p95)
- **Payment processing**: < 1s (p95)

### Throughput Targets
- **Concurrent users**: 100+ simultaneous users
- **Requests per second**: 500+ RPS
- **Database connections**: Pool of 20 connections

## Database Optimization

### Indexes Implemented

```sql
-- Core indexes for performance
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_listings_org_id_status ON listings(org_id, status);
CREATE INDEX idx_listings_published_at ON listings(published_at);
CREATE INDEX idx_assets_org_id ON assets(org_id);
CREATE INDEX idx_space_nodes_asset_id ON space_nodes(asset_id);
CREATE INDEX idx_rentable_items_org_id ON rentable_items(org_id);
CREATE INDEX idx_bookings_org_id_status ON bookings(org_id, status);
CREATE INDEX idx_agreements_org_id_status ON agreements(org_id, status);
CREATE INDEX idx_invoices_org_id_status ON invoices(org_id, status);
CREATE INDEX idx_payments_org_id_status ON payments(org_id, status);
CREATE INDEX idx_ledger_org_id_created_at ON ledger_entries(org_id, created_at);
CREATE INDEX idx_tickets_org_id_status ON tickets(org_id, status);
CREATE INDEX idx_audit_logs_org_id_created_at ON audit_logs(org_id, created_at);

-- Full-text search indexes
CREATE INDEX idx_listings_search ON listings USING GIN(to_tsvector('english', title || ' ' || description));
```

### Query Optimization Guidelines
1. Always include `org_id` in WHERE clauses for multi-tenant queries
2. Use pagination (limit/offset or cursor-based) for all list endpoints
3. Avoid N+1 queries - use Prisma's `include` strategically
4. Use `select` to limit returned fields when possible
5. Monitor slow queries using PostgreSQL's `pg_stat_statements`

## Caching Strategy

### Redis Cache Configuration
- **TTL for search results**: 60 seconds
- **TTL for listing details**: 300 seconds (5 minutes)
- **TTL for reports**: 600 seconds (10 minutes)
- **TTL for user sessions**: 3600 seconds (1 hour)

### Cache Invalidation Rules
- **Listings**: Invalidate on create/update/delete/publish/unpublish
- **Agreements**: Invalidate on status change
- **Invoices**: Invalidate on create/void/payment
- **Reports**: Invalidate on any finance/ops mutation

### Cache Keys Pattern
```
urp:cache:{resource}:{id}:{org_id}
urp:cache:search:{query_hash}
urp:cache:report:{type}:{org_id}:{date_range}
```

## Load Testing

### Test Scenarios
1. **Baseline Load**: 50 concurrent users, 5 minutes
2. **Peak Load**: 100 concurrent users, 10 minutes
3. **Stress Test**: Ramp up to 200 users over 15 minutes
4. **Spike Test**: Sudden jump from 10 to 100 users

### Load Testing Script
```bash
# Using Apache Bench for simple load test
ab -n 1000 -c 50 -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/listings

# Using k6 for advanced scenarios (see scripts/load-test.js)
k6 run scripts/load-test.js
```

## Monitoring Baseline

### Key Metrics to Monitor
- **Response Time**: p50, p95, p99 latencies
- **Error Rate**: 4xx and 5xx responses per minute
- **Throughput**: Requests per second
- **Database**: Connection pool usage, query duration
- **Cache**: Hit rate, miss rate, eviction rate
- **Memory**: Heap usage, GC frequency
- **CPU**: Usage percentage

### Alerting Thresholds
- Response time p95 > 1s: Warning
- Response time p95 > 2s: Critical
- Error rate > 1%: Warning
- Error rate > 5%: Critical
- Database connections > 80%: Warning
- Cache hit rate < 70%: Warning

## Performance Testing Scripts

Run performance benchmarks:
```bash
# Search endpoint benchmark
pnpm run benchmark:search

# CRUD operations benchmark
pnpm run benchmark:crud

# Full load test
pnpm run load-test
```

## Optimization Checklist
- [x] Database indexes created for all foreign keys
- [x] Full-text search indexes for listings
- [x] Pagination implemented on all list endpoints
- [x] Cache interceptor implemented
- [ ] Redis caching integrated (currently in-memory)
- [ ] Query plan analysis completed
- [ ] Load testing scripts created
- [ ] Monitoring dashboards configured
- [ ] Performance baselines documented

## Next Steps
1. Replace in-memory cache with Redis
2. Create k6 load testing scripts
3. Set up monitoring dashboards (Grafana/Prometheus)
4. Run performance tests and document baselines
5. Optimize slow queries identified in testing
