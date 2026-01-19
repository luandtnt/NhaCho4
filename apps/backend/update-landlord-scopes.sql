UPDATE users 
SET scopes = '["listings:write", "assets:write", "agreements:write", "pricing_policy:*", "invoice:*", "payment:*", "ledger:*"]'::jsonb 
WHERE email = 'landlord@example.com';
