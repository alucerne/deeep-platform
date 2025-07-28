-- Check database constraints and table structure
-- Run this in the Supabase SQL Editor

-- 1. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'instant_email_results'
ORDER BY ordinal_position;

-- 2. Check for unique constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'instant_email_results';

-- 3. Check for indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'instant_email_results';

-- 4. Check current row count
SELECT 
  'Current Row Count' as info_type,
  COUNT(*) as total_rows
FROM instant_email_results;

-- 5. Check results by request_id
SELECT 
  'Results by Request ID' as info_type,
  request_id,
  COUNT(*) as result_count
FROM instant_email_results 
GROUP BY request_id
ORDER BY result_count DESC;

-- 6. Check for any RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'instant_email_results'; 