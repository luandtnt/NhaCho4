-- Create vouchers table
CREATE TABLE "vouchers" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "org_id" TEXT NOT NULL,
  "code" TEXT UNIQUE NOT NULL,
  "voucher_type" TEXT NOT NULL, -- PERCENTAGE, FIXED_AMOUNT, FREE_NIGHTS
  "discount_value" DECIMAL(10,2) NOT NULL,
  "min_booking_value" DECIMAL(10,2) DEFAULT 0,
  "max_discount" DECIMAL(10,2),
  "valid_from" TIMESTAMP(3) NOT NULL,
  "valid_until" TIMESTAMP(3) NOT NULL,
  "usage_limit" INTEGER,
  "usage_count" INTEGER DEFAULT 0,
  "applicable_to" JSONB DEFAULT '{}',
  "status" TEXT DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vouchers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

-- Create voucher usage tracking table
CREATE TABLE "voucher_usages" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "voucher_id" TEXT NOT NULL,
  "booking_id" TEXT NOT NULL,
  "discount_amount" DECIMAL(10,2) NOT NULL,
  "used_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "voucher_usages_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE CASCADE,
  CONSTRAINT "voucher_usages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "vouchers_code_idx" ON "vouchers"("code");
CREATE INDEX "vouchers_org_status_idx" ON "vouchers"("org_id", "status");
CREATE INDEX "vouchers_valid_dates_idx" ON "vouchers"("valid_from", "valid_until");
CREATE INDEX "voucher_usages_voucher_id_idx" ON "voucher_usages"("voucher_id");
CREATE INDEX "voucher_usages_booking_id_idx" ON "voucher_usages"("booking_id");

-- Add voucher_code column to bookings table
ALTER TABLE "bookings" ADD COLUMN "voucher_code" TEXT;
ALTER TABLE "bookings" ADD COLUMN "voucher_discount" DECIMAL(10,2) DEFAULT 0;

-- Create index for voucher lookups in bookings
CREATE INDEX "bookings_voucher_code_idx" ON "bookings"("voucher_code");
