-- Check status of new upload vs dashboard
-- Run this in the Supabase SQL Editor

-- Show the most recent batch (your new upload)
SELECT 
  'Most Recent Upload' as info_type,
  request_id,
  user_email,
  status,
  array_length(submitted_emails, 1) as email_count,
  submitted_at,
  created_at
FROM instant_email_batches 
ORDER BY created_at DESC
LIMIT 1;

-- Show all batches from today
SELECT 
  'Todays Uploads' as info_type,
  request_id,
  user_email,
  status,
  array_length(submitted_emails, 1) as email_count,
  submitted_at,
  created_at
FROM instant_email_batches 
WHERE DATE(submitted_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Check if there are results for the most recent batch
SELECT 
  'Results for Most Recent Batch' as info_type,
  request_id,
  COUNT(*) as result_count
FROM instant_email_results 
WHERE request_id = (
  SELECT request_id 
  FROM instant_email_batches 
  ORDER BY created_at DESC 
  LIMIT 1
)
GROUP BY request_id;

-- Show sample results (first 5) for the most recent batch
SELECT 
  'Sample Results' as info_type,
  email,
  last_seen,
  created_at
FROM instant_email_results 
WHERE request_id = (
  SELECT request_id 
  FROM instant_email_batches 
  ORDER BY created_at DESC 
  LIMIT 1
)
ORDER BY created_at DESC
LIMIT 5;

-- Status summary - compare with dashboard
SELECT 
  'Status Summary' as info_type,
  status,
  COUNT(*) as batch_count,
  SUM(array_length(submitted_emails, 1)) as total_emails
FROM instant_email_batches 
GROUP BY status
ORDER BY batch_count DESC; 