-- Create email_batches table
CREATE TABLE IF NOT EXISTS email_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_user_id UUID NOT NULL REFERENCES api_users(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  submitted_emails TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'complete', 'failed')),
  download_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE email_batches ENABLE ROW LEVEL SECURITY;

-- Create policies for email_batches table
CREATE POLICY "Allow select on email_batches" ON email_batches FOR SELECT USING (true);
CREATE POLICY "Allow insert on email_batches" ON email_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on email_batches" ON email_batches FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_batches_api_user_id ON email_batches(api_user_id);
CREATE INDEX IF NOT EXISTS idx_email_batches_request_id ON email_batches(request_id);
CREATE INDEX IF NOT EXISTS idx_email_batches_status ON email_batches(status);
CREATE INDEX IF NOT EXISTS idx_email_batches_created_at ON email_batches(created_at); 