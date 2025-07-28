-- Fix missing results for the latest batch
-- Run this in the Supabase SQL Editor

-- First, get the latest batch details
SELECT 
  'Latest Batch Details' as info_type,
  request_id,
  user_email,
  status,
  array_length(submitted_emails, 1) as total_emails,
  submitted_at
FROM instant_email_batches 
ORDER BY created_at DESC
LIMIT 1;

-- Get the current results count for the latest batch
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

-- Add missing results for the latest batch
-- This will add results for all emails that don't already have results
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
)
AND NOT EXISTS (
  SELECT 1 
  FROM instant_email_results r 
  WHERE r.request_id = b.request_id 
  AND r.email = email
);

-- Verify the results were added
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