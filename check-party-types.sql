-- Check distinct party types
SELECT DISTINCT party_type FROM parties;

-- Check parties with their types
SELECT 
  id,
  name,
  party_type,
  email,
  metadata
FROM parties
WHERE email LIKE '%@example.com'
ORDER BY email
LIMIT 20;
