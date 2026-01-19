-- Add is_featured column to listings table
ALTER TABLE "listings" ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- Add index for featured listings queries
CREATE INDEX "listings_is_featured_status_idx" ON "listings"("is_featured", "status");

-- Add view_count column for analytics
ALTER TABLE "listings" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;

-- Add last_viewed_at for tracking
ALTER TABLE "listings" ADD COLUMN "last_viewed_at" TIMESTAMP(3);
