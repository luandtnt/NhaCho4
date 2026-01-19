-- Add landlord_party_id to assets table
ALTER TABLE "assets" ADD COLUMN "landlord_party_id" TEXT;

-- Add landlord_party_id to space_nodes table  
ALTER TABLE "space_nodes" ADD COLUMN "landlord_party_id" TEXT;

-- Add foreign key constraints
ALTER TABLE "assets" ADD CONSTRAINT "assets_landlord_party_id_fkey" 
  FOREIGN KEY ("landlord_party_id") REFERENCES "parties"("id") ON DELETE SET NULL;

ALTER TABLE "space_nodes" ADD CONSTRAINT "space_nodes_landlord_party_id_fkey"
  FOREIGN KEY ("landlord_party_id") REFERENCES "parties"("id") ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX "assets_landlord_party_id_idx" ON "assets"("landlord_party_id");
CREATE INDEX "space_nodes_landlord_party_id_idx" ON "space_nodes"("landlord_party_id");

-- Update existing assets with landlord_party_id from their rentable_items
UPDATE assets a
SET landlord_party_id = (
  SELECT DISTINCT ri.landlord_party_id
  FROM rentable_items ri
  JOIN space_nodes sn ON sn.id = ri.space_node_id
  WHERE sn.asset_id = a.id
  AND ri.landlord_party_id IS NOT NULL
  LIMIT 1
);

-- Update existing space_nodes with landlord_party_id from their asset
UPDATE space_nodes sn
SET landlord_party_id = (
  SELECT a.landlord_party_id
  FROM assets a
  WHERE a.id = sn.asset_id
);
