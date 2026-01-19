# Pricing Policy System Migration

**Date**: January 16, 2026  
**Version**: 1.0  
**Status**: Ready to apply

---

## Overview

This migration creates the complete Pricing Policy System with:
- Pricing policy templates with versioning
- Audit trail for policy changes
- Immutable price snapshots for bookings
- Integration with rentable_items

---

## Tables Created

### 1. `pricing_policies`
Main table for pricing policy templates.

**Key Features**:
- Versioning support (version, effective_from, effective_to)
- Geographic scope (province, district)
- Multiple pricing modes (FIXED, TIERED, DYNAMIC)
- Type-specific pricing in JSONB
- Superseded_by for version chain

### 2. `pricing_policy_versions`
Audit trail for all policy changes.

**Key Features**:
- Full policy snapshot at each version
- Change tracking (who, when, why, what)
- Unique constraint on (policy_id, version)

### 3. `booking_price_snapshots`
Immutable price snapshots for bookings.

**Key Features**:
- Full calculation breakdown in JSONB
- Denormalized totals for quick access
- Links to policy version used
- Never changes after creation

### 4. Updates to `rentable_items`
Added columns:
- `pricing_policy_id` - Reference to policy
- `pricing_policy_version` - Version when assigned
- `pricing_override` - Override specific fields
- `pricing_snapshot_at` - When pricing was snapshotted

---

## How to Apply

### Option 1: Using Prisma (Recommended)
```bash
cd apps/backend
npx prisma migrate dev --name pricing_policies
```

### Option 2: Manual SQL
```bash
psql -U urp -d urp_dev -f apps/backend/prisma/migrations/20260116_pricing_policies/migration.sql
```

---

## How to Rollback

```bash
psql -U urp -d urp_dev -f apps/backend/prisma/migrations/20260116_pricing_policies/rollback.sql
```

---

## Verification

After applying, verify tables exist:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pricing_policies', 'pricing_policy_versions', 'booking_price_snapshots');

-- Check rentable_items columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'rentable_items' 
AND column_name LIKE 'pricing%';

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('pricing_policies', 'pricing_policy_versions', 'booking_price_snapshots', 'rentable_items')
AND indexname LIKE '%pricing%';
```

---

## Data Migration

After schema migration, run data migration script:

```bash
cd apps/backend
npm run migrate:pricing-policies
```

This will:
1. Create default policies for existing items
2. Link existing items to appropriate policies
3. Snapshot current pricing

---

## Dependencies

- Requires `organizations` table
- Requires `users` table
- Requires `bookings` table
- Requires `rentable_items` table

---

## Breaking Changes

None. This is additive only.

Existing pricing columns in `rentable_items` are kept for:
- Backward compatibility
- Denormalized data for performance
- Snapshot at time of policy assignment

---

## Next Steps

1. Apply migration
2. Update Prisma schema
3. Generate Prisma client
4. Implement services & APIs
5. Run data migration
6. Update frontend

---

## Notes

- All price snapshots are immutable
- Policy updates create new versions
- Bookings always use snapshots, never live policy
- Geographic scope is optional (NULL = applies everywhere)
