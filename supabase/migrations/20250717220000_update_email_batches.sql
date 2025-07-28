-- Update email_batches table to add missing columns
ALTER TABLE email_batches 
ADD COLUMN IF NOT EXISTS api_user_id UUID REFERENCES api_users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS submitted_emails TEXT[],
ADD COLUMN IF NOT EXISTS download_url TEXT;

-- Update existing rows to have a default api_user_id (for existing data)
UPDATE email_batches 
SET api_user_id = (SELECT id FROM api_users LIMIT 1)
WHERE api_user_id IS NULL;

-- Make api_user_id NOT NULL after setting default values
ALTER TABLE email_batches ALTER COLUMN api_user_id SET NOT NULL;

-- Update status constraint to include 'failed'
ALTER TABLE email_batches DROP CONSTRAINT IF EXISTS email_batches_status_check;
ALTER TABLE email_batches ADD CONSTRAINT email_batches_status_check 
CHECK (status IN ('processing', 'complete', 'failed')); 