-- Check parties for landlord3 and landlord4
SELECT 
  u.email,
  u.id as user_id,
  u.role,
  p.id as party_id,
  p.party_type,
  p.email as party_email,
  p.name as party_name
FROM users u
LEFT JOIN parties p ON p.email = u.email AND p.org_id = u.org_id
WHERE u.email IN ('landlord3@example.com', 'landlord4@example.com')
ORDER BY u.email;

-- Check all LANDLORD parties
SELECT 
  id,
  party_type,
  name,
  email
FROM parties
WHERE party_type = 'LANDLORD'
ORDER BY email
LIMIT 10;
