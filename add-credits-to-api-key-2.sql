-- Add 10,000 credits to InstantEmail API key: user_afb28add-aeb2-4025-89ec-b20263527a33
-- Run this in the Supabase SQL Editor

-- First, check current credits
SELECT 
  api_key,
  user_email,
  credits as current_credits
FROM api_users 
WHERE api_key = 'user_afb28add-aeb2-4025-89ec-b20263527a33';

-- Add 10,000 credits
UPDATE api_users 
SET credits = credits + 10000
WHERE api_key = 'user_afb28add-aeb2-4025-89ec-b20263527a33';

-- Verify the update
SELECT 
  api_key,
  user_email,
  credits as new_credits
FROM api_users 
WHERE api_key = 'user_afb28add-aeb2-4025-89ec-b20263527a33';

-- Show success message
SELECT 'Successfully added 10,000 credits to API key: user_afb28add-aeb2-4025-89ec-b20263527a33' as status; 