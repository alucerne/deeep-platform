-- Email Activity Stats View - Fixed Version
-- Run this in your Supabase SQL Editor

-- Create the view
CREATE OR REPLACE VIEW email_activity_stats AS
SELECT 
    request_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE last_seen >= NOW() - INTERVAL '1 day') AS last_24h,
    COUNT(*) FILTER (WHERE last_seen >= NOW() - INTERVAL '3 days') AS last_3d,
    COUNT(*) FILTER (WHERE last_seen >= NOW() - INTERVAL '7 days') AS last_7d,
    COUNT(*) FILTER (WHERE last_seen >= NOW() - INTERVAL '14 days') AS last_14d,
    COUNT(*) FILTER (WHERE last_seen >= NOW() - INTERVAL '30 days') AS last_30d,
    COUNT(*) FILTER (WHERE last_seen < NOW() - INTERVAL '30 days') AS over_30d
FROM instant_email_results
GROUP BY request_id;

-- Test the view
SELECT 'Testing email_activity_stats view:' as info;
SELECT * FROM email_activity_stats 
WHERE request_id = 'req_1753668661539_rsw24qic6';

-- Show all results
SELECT 'All results:' as info;
SELECT * FROM email_activity_stats 
ORDER BY total DESC; 