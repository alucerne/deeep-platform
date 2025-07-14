-- Add api_key column to bulk_jobs table
ALTER TABLE bulk_jobs ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Add index for better performance when querying by API key
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_api_key ON bulk_jobs(api_key); 