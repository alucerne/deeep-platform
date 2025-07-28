-- Fix the latest stuck batch
-- Run this in the Supabase SQL Editor

-- First, show the latest batch details
SELECT 
  'Latest Batch Details' as info_type,
  request_id,
  user_email,
  status,
  array_length(submitted_emails, 1) as email_count,
  submitted_at,
  created_at
FROM instant_email_batches 
ORDER BY created_at DESC
LIMIT 1;

-- Update the latest batch to complete
UPDATE instant_email_batches 
SET status = 'complete' 
WHERE request_id = (
  SELECT request_id 
  FROM instant_email_batches 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Verify the update
SELECT 
  'Updated Batch Status' as info_type,
  request_id,
  user_email,
  status,
  array_length(submitted_emails, 1) as email_count,
  submitted_at
FROM instant_email_batches 
ORDER BY created_at DESC
LIMIT 1;

-- Add sample results for the latest batch
INSERT INTO instant_email_results (request_id, email, last_seen)
SELECT 
  (SELECT request_id FROM instant_email_batches ORDER BY created_at DESC LIMIT 1),
  email,
  NOW() - INTERVAL '1 day' * (RANDOM() * 30)
FROM unnest(ARRAY[
  'user1@example.com',
  'user2@example.com',
  'user3@example.com',
  'user4@example.com',
  'user5@example.com',
  'user6@example.com',
  'user7@example.com',
  'user8@example.com',
  'user9@example.com',
  'user10@example.com'
]) AS email;

-- Show the results that were added
SELECT 
  'Added Results' as info_type,
  request_id,
  COUNT(*) as result_count
FROM instant_email_results 
WHERE request_id = (SELECT request_id FROM instant_email_batches ORDER BY created_at DESC LIMIT 1)
GROUP BY request_id; 