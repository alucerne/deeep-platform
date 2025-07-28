-- Complete Email Activity Stats Setup and Testing
-- Run this entire script in your Supabase SQL Editor

-- ===========================================
-- STEP 1: Create the email_activity_stats view
-- ===========================================

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

-- Note: RLS is not supported on views in PostgreSQL
-- The view inherits permissions from the underlying table

-- ===========================================
-- STEP 2: Test the view with sample data
-- ===========================================

-- Check what request_ids exist in the data
SELECT 'Available request_ids:' as info;
SELECT DISTINCT request_id, COUNT(*) as email_count
FROM instant_email_results 
GROUP BY request_id
ORDER BY email_count DESC;

-- Test the view with a specific request_id (using one from our test data)
SELECT 'Testing view with specific request_id:' as info;
SELECT * FROM email_activity_stats 
WHERE request_id = 'req_1753668661539_rsw24qic6';

-- Show all results from the view
SELECT 'All results from email_activity_stats view:' as info;
SELECT * FROM email_activity_stats 
ORDER BY total DESC;

-- ===========================================
-- STEP 3: Validation and verification
-- ===========================================

-- Verify the counts add up correctly
SELECT 'Validation check - ensuring counts are consistent:' as info;
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
    END as validation,
    -- Show the calculation
    (last_30d + over_30d) as calculated_total
FROM email_activity_stats
ORDER BY total DESC;

-- ===========================================
-- STEP 4: Sample queries for analytics
-- ===========================================

-- Get summary statistics across all batches
SELECT 'Summary statistics across all batches:' as info;
SELECT 
    COUNT(DISTINCT request_id) as total_batches,
    SUM(total) as total_emails,
    AVG(total) as avg_emails_per_batch,
    SUM(last_24h) as emails_last_24h,
    SUM(last_7d) as emails_last_7d,
    SUM(last_30d) as emails_last_30d,
    SUM(over_30d) as emails_over_30d
FROM email_activity_stats;

-- Get activity trends by time period
SELECT 'Activity trends by time period:' as info;
SELECT 
    'Last 24h' as period,
    SUM(last_24h) as email_count
FROM email_activity_stats
UNION ALL
SELECT 
    'Last 3 days' as period,
    SUM(last_3d) as email_count
FROM email_activity_stats
UNION ALL
SELECT 
    'Last 7 days' as period,
    SUM(last_7d) as email_count
FROM email_activity_stats
UNION ALL
SELECT 
    'Last 14 days' as period,
    SUM(last_14d) as email_count
FROM email_activity_stats
UNION ALL
SELECT 
    'Last 30 days' as period,
    SUM(last_30d) as email_count
FROM email_activity_stats
UNION ALL
SELECT 
    'Over 30 days' as period,
    SUM(over_30d) as email_count
FROM email_activity_stats
ORDER BY email_count DESC; 