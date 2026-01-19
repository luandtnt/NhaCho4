-- Count items per landlord party
SELECT 
  p.id as party_id,
  p.name as landlord_name,
  COUNT(ri.id) as item_count
FROM parties p
LEFT JOIN rentable_items ri ON ri.landlord_party_id = p.id
WHERE p.party_type = 'Landlord'
GROUP BY p.id, p.name
ORDER BY p.name;

-- Check if landlord_party_id is set
SELECT 
  COUNT(*) as total_items,
  COUNT(landlord_party_id) as items_with_landlord,
  COUNT(*) - COUNT(landlord_party_id) as items_without_landlord
FROM rentable_items;

-- Sample rentable items
SELECT 
  id,
  code,
  landlord_party_id,
  property_category
FROM rentable_items
ORDER BY created_at
LIMIT 10;
