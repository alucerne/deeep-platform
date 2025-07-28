-- Add 1,000 credits to adam@audiencelab.io for testing
-- Run this SQL in your Supabase SQL Editor

-- First, let's check the current state of the user
SELECT 
    id,
    user_email,
    api_key,
    credits,
    created_at
FROM api_users 
WHERE user_email = 'adam@audiencelab.io';

-- Update the credits (add 1,000 to current balance)
UPDATE api_users 
SET credits = credits + 1000 
WHERE user_email = 'adam@audiencelab.io';

-- Verify the update was successful
SELECT 
    id,
    user_email,
    api_key,
    credits,
    created_at
FROM api_users 
WHERE user_email = 'adam@audiencelab.io';

-- Optional: Check all users with their credit balances
SELECT 
    user_email,
    api_key,
    credits,
    created_at
FROM api_users 
ORDER BY created_at DESC; 