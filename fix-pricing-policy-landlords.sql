-- Fix pricing policies to distribute among landlords
-- Each landlord gets ~4-5 policies

-- Get landlord party IDs
-- landlord@example.com: 03d393a9-8420-4746-b070-89acf2b8b720
-- landlord1@example.com: 433cf455-a666-4d2b-8f8f-dc03af73dda7
-- landlord2@example.com: 805b3bf8-ec10-4093-b9ac-25384154d950
-- landlord3@example.com: fb4fc427-4cef-4fac-9fb4-03695be67040
-- landlord4@example.com: fdffd6ec-7445-47cf-aa70-0f8a8c2365e0

-- Distribute 21 policies among 5 landlords (4-5 each)
-- Landlord 0: policies 1-5
-- Landlord 1: policies 6-9
-- Landlord 2: policies 10-13
-- Landlord 3: policies 14-17
-- Landlord 4: policies 18-21

WITH numbered_policies AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM pricing_policies
),
landlord_mapping AS (
  SELECT 
    id,
    CASE 
      WHEN rn <= 5 THEN '03d393a9-8420-4746-b070-89acf2b8b720'  -- landlord@example.com
      WHEN rn <= 9 THEN '433cf455-a666-4d2b-8f8f-dc03af73dda7'   -- landlord1@example.com
      WHEN rn <= 13 THEN '805b3bf8-ec10-4093-b9ac-25384154d950'  -- landlord2@example.com
      WHEN rn <= 17 THEN 'fb4fc427-4cef-4fac-9fb4-03695be67040'  -- landlord3@example.com
      ELSE 'fdffd6ec-7445-47cf-aa70-0f8a8c2365e0'                -- landlord4@example.com
    END as new_landlord_id
  FROM numbered_policies
)
UPDATE pricing_policies p
SET landlord_party_id = lm.new_landlord_id
FROM landlord_mapping lm
WHERE p.id = lm.id;

-- Verify distribution
SELECT 
  p.party_type,
  p.name,
  p.email,
  COUNT(pp.id) as policy_count
FROM parties p
LEFT JOIN pricing_policies pp ON pp.landlord_party_id = p.id
WHERE p.party_type = 'LANDLORD'
GROUP BY p.id, p.party_type, p.name, p.email
ORDER BY p.email;
