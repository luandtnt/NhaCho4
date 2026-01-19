-- Add landlord_party_id to pricing_policies table
ALTER TABLE "pricing_policies" ADD COLUMN "landlord_party_id" TEXT;

-- Add foreign key constraint
ALTER TABLE "pricing_policies" ADD CONSTRAINT "pricing_policies_landlord_party_id_fkey" 
  FOREIGN KEY ("landlord_party_id") REFERENCES "parties"("id") ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX "pricing_policies_landlord_party_id_idx" ON "pricing_policies"("landlord_party_id");

-- Update existing pricing policies with landlord_party_id from their rentable_items
UPDATE pricing_policies pp
SET landlord_party_id = (
  SELECT DISTINCT ri.landlord_party_id
  FROM rentable_items ri
  WHERE ri.pricing_policy_id = pp.id
  AND ri.landlord_party_id IS NOT NULL
  LIMIT 1
);
