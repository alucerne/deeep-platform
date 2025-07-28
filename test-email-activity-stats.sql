-- Test script for email_activity_stats view
-- Run this in your Supabase SQL Editor

-- First, let's see what request_ids we have in the instant_email_results table
SELECT DISTINCT request_id, COUNT(*) as email_count
FROM instant_email_results 
GROUP BY request_id
ORDER BY email_count DESC;

-- Test the view with a specific request_id
-- Replace 'req_xyz' with an actual request_id from your data
SELECT * FROM email_activity_stats 
WHERE request_id = 'req_1753668661539_rsw24qic6';

-- Test with all request_ids
SELECT * FROM email_activity_stats 
ORDER BY total DESC;

-- Verify the counts add up correctly
SELECT 
    request_id,
    total,
    last_24h,
    last_3d,
    last_7d,
    last_14d,
    last_30d,
    over_30d,
    -- Verify total = last_30d + over_30d
    CASE 
        WHEN total = (last_30d + over_30d) THEN '✅ Valid'
        ELSE '❌ Invalid - counts do not match'
    END as validation
FROM email_activity_stats
ORDER BY total DESC; 