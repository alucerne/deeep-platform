-- Add 10,000 credits to InstantEmail API key: user_99f986e5-6ecc-475a-980a-e6200f84f272
-- Run this in the Supabase SQL Editor

-- First, check current credits
SELECT 
  api_key,
  user_email,
  credits as current_credits
FROM api_users 
WHERE api_key = 'user_99f986e5-6ecc-475a-980a-e6200f84f272';

-- Add 10,000 credits
UPDATE api_users 
SET credits = credits + 10000
WHERE api_key = 'user_99f986e5-6ecc-475a-980a-e6200f84f272';

-- Verify the update
SELECT 
  api_key,
  user_email,
  credits as new_credits
FROM api_users 
WHERE api_key = 'user_99f986e5-6ecc-475a-980a-e6200f84f272';

-- Show success message
SELECT 'Successfully added 10,000 credits to API key: user_99f986e5-6ecc-475a-980a-e6200f84f272' as status; 