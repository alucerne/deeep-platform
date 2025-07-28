-- Add 1,000 credits to adam@audiencelab.io
UPDATE api_users 
SET credits = credits + 1000 
WHERE user_email = 'adam@audiencelab.io';

-- Verify the update
SELECT user_email, credits, created_at 
FROM api_users 
WHERE user_email = 'adam@audiencelab.io'; 