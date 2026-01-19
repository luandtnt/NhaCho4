-- Check user to party mapping
SELECT 
  u.email,
  u.id as user_id,
  u.role,
  p.id as party_id,
  p.name as party_name,
  p.metadata
FROM users u
LEFT JOIN parties p ON p.org_id = u.org_id AND p.party_type = u.role
WHERE u.email LIKE '%@example.com'
ORDER BY u.email
LIMIT 20;

-- Check rentable items with landlord_party_id
SELECT 
  ri.code,
  ri.landlord_party_id,
  ri.property_category
FROM rentable_items ri
ORDER BY ri.code
LIMIT 20;
