-- Fix stuck batch: req_1753681421305_ijdvnrm55
-- Run this in the Supabase SQL Editor

-- First, let's see the current status
SELECT 
  'Current Status' as info_type,
  request_id,
  user_email,
  status,
  array_length(submitted_emails, 1) as email_count,
  submitted_at,
  created_at
FROM instant_email_batches 
WHERE request_id = 'req_1753681421305_ijdvnrm55';

-- Check if there are any results (should be 0 if stuck)
SELECT 
  'Results Count' as info_type,
  COUNT(*) as total_results
FROM instant_email_results 
WHERE request_id = 'req_1753681421305_ijdvnrm55';

-- If you want to force complete the batch for testing, uncomment this:
-- UPDATE instant_email_batches 
-- SET status = 'complete' 
-- WHERE request_id = 'req_1753681421305_ijdvnrm55';

-- After updating, check the status again:
-- SELECT 
--   'Updated Status' as info_type,
--   request_id,
--   user_email,
--   status,
--   array_length(submitted_emails, 1) as email_count,
--   submitted_at,
--   created_at
-- FROM instant_email_batches 
-- WHERE request_id = 'req_1753681421305_ijdvnrm55'; 