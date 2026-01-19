-- Add landlord_party_id to rentable_items
ALTER TABLE "rentable_items" ADD COLUMN "landlord_party_id" TEXT;

-- Add landlord_party_id to listings
ALTER TABLE "listings" ADD COLUMN "landlord_party_id" TEXT;

-- Add foreign key constraints
ALTER TABLE "rentable_items" ADD CONSTRAINT "rentable_items_landlord_party_id_fkey" 
  FOREIGN KEY ("landlord_party_id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "listings" ADD CONSTRAINT "listings_landlord_party_id_fkey" 
  FOREIGN KEY ("landlord_party_id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for better query performance
CREATE INDEX "rentable_items_landlord_party_id_idx" ON "rentable_items"("landlord_party_id");
CREATE INDEX "listings_landlord_party_id_idx" ON "listings"("landlord_party_id");
