-- Check and add 10,000 credits to InstantEmail API key: user_afb28add-aeb2-4025-89ec-b20263527a33
-- Run this in the Supabase SQL Editor

-- Step 1: Check if the API key exists
SELECT 
  'Checking if API key exists...' as step,
  COUNT(*) as key_count
FROM api_users 
WHERE api_key = 'user_afb28add-aeb2-4025-89ec-b20263527a33';

-- Step 2: Show current credits
SELECT 
  'Current credits for API key:' as step,
  api_key,
  user_email,
  credits as current_credits
FROM api_users 
WHERE api_key = 'user_afb28add-aeb2-4025-89ec-b20263527a33';

-- Step 3: Add 10,000 credits
UPDATE api_users 
SET credits = credits + 10000
WHERE api_key = 'user_afb28add-aeb2-4025-89ec-b20263527a33';

-- Step 4: Verify the update and show new balance
SELECT 
  'Updated credits for API key:' as step,
  api_key,
  user_email,
  credits as new_credits
FROM api_users 
WHERE api_key = 'user_afb28add-aeb2-4025-89ec-b20263527a33';

-- Step 5: Show all API keys for this user (if we can identify the user)
SELECT 
  'All API keys for this user:' as step,
  api_key,
  user_email,
  credits,
  created_at
FROM api_users 
WHERE api_key = 'user_afb28add-aeb2-4025-89ec-b20263527a33'
   OR user_email = (
     SELECT user_email 
     FROM api_users 
     WHERE api_key = 'user_afb28add-aeb2-4025-89ec-b20263527a33'
   );

-- Step 6: Success confirmation
SELECT '✅ Successfully processed credits update for API key: user_afb28add-aeb2-4025-89ec-b20263527a33' as status; 