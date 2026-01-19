-- Check users and their parties
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  p.id as party_id,
  p.party_type,
  p.name as party_name
FROM users u
LEFT JOIN parties p ON p.org_id = u.org_id AND (
  (u.role = 'Landlord' AND p.party_type = 'Landlord' AND (p.metadata->>'user_id')::uuid = u.id)
  OR
  (u.role = 'Tenant' AND p.party_type = 'Tenant' AND (p.metadata->>'user_id')::uuid = u.id)
)
WHERE u.email LIKE 'landlord%@example.com' OR u.email LIKE 'tenant%@example.com'
ORDER BY u.email;

-- Check rentable items with landlord_party_id
SELECT 
  ri.id,
  ri.code,
  ri.landlord_party_id,
  p.name as landlord_name,
  u.email as landlord_email
FROM rentable_items ri
LEFT JOIN parties p ON p.id = ri.landlord_party_id
LEFT JOIN users u ON u.id = (p.metadata->>'user_id')::uuid
WHERE ri.code LIKE 'HOTEL-%' OR ri.code LIKE 'HOMESTAY-%'
ORDER BY ri.code
LIMIT 20;

-- Check listings with landlord_party_id
SELECT 
  l.id,
  l.title,
  l.landlord_party_id,
  p.name as landlord_name,
  u.email as landlord_email
FROM listings l
LEFT JOIN parties p ON p.id = l.landlord_party_id
LEFT JOIN users u ON u.id = (p.metadata->>'user_id')::uuid
ORDER BY l.created_at DESC
LIMIT 20;

-- Count items per landlord
SELECT 
  u.email,
  COUNT(ri.id) as item_count
FROM users u
LEFT JOIN parties p ON p.org_id = u.org_id AND p.party_type = 'Landlord' AND p.metadata->>'user_id' = u.id::text
LEFT JOIN rentable_items ri ON ri.landlord_party_id = p.id
WHERE u.role = 'Landlord'
GROUP BY u.email
ORDER BY u.email;
