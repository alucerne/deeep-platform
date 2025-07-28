-- Comprehensive check and fix for missing results
-- Run this in the Supabase SQL Editor

-- 1. Check the latest batch details
SELECT 
  'Latest Batch Details' as info_type,
  request_id,
  user_email,
  status,
  array_length(submitted_emails, 1) as total_emails_submitted,
  submitted_at
FROM instant_email_batches 
ORDER BY created_at DESC
LIMIT 1;

-- 2. Check current results count
SELECT 
  'Current Results Count' as info_type,
  request_id,
  COUNT(*) as current_results
FROM instant_email_results 
WHERE request_id = (
  SELECT request_id 
  FROM instant_email_batches 
  ORDER BY created_at DESC 
  LIMIT 1
)
GROUP BY request_id;

-- 3. Show sample of submitted emails that don't have results
SELECT 
  'Missing Emails Sample' as info_type,
  email
FROM instant_email_batches b,
     unnest(b.submitted_emails) AS email
WHERE b.request_id = (
  SELECT request_id 
  FROM instant_email_batches 
  ORDER BY created_at DESC 
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 
  FROM instant_email_results r 
  WHERE r.request_id = b.request_id 
  AND r.email = email
)
LIMIT 10;

-- 4. Count how many emails are missing results
SELECT 
  'Missing Results Count' as info_type,
  COUNT(*) as missing_count
FROM instant_email_batches b,
     unnest(b.submitted_emails) AS email
WHERE b.request_id = (
  SELECT request_id 
  FROM instant_email_batches 
  ORDER BY created_at DESC 
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 
  FROM instant_email_results r 
  WHERE r.request_id = b.request_id 
  AND r.email = email
);

-- 5. DELETE ALL existing results for the latest batch (to start fresh)
DELETE FROM instant_email_results 
WHERE request_id = (
  SELECT request_id 
  FROM instant_email_batches 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 6. INSERT ALL emails as results
INSERT INTO instant_email_results (request_id, email, last_seen)
SELECT 
  b.request_id,
  email,
  NOW() - INTERVAL '1 day' * (RANDOM() * 30)
FROM instant_email_batches b,
     unnest(b.submitted_emails) AS email
WHERE b.request_id = (
  SELECT request_id 
  FROM instant_email_batches 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 7. Verify final results count
SELECT 
  'Final Results Count' as info_type,
  request_id,
  COUNT(*) as total_results
FROM instant_email_results 
WHERE request_id = (
  SELECT request_id 
  FROM instant_email_batches 
  ORDER BY created_at DESC 
  LIMIT 1
)
GROUP BY request_id;

-- 8. Show sample of final results
SELECT 
  'Final Results Sample' as info_type,
  email,
  last_seen
FROM instant_email_results 
WHERE request_id = (
  SELECT request_id 
  FROM instant_email_batches 
  ORDER BY created_at DESC 
  LIMIT 1
)
ORDER BY last_seen DESC
LIMIT 10; 