-- Create email_batches table
CREATE TABLE IF NOT EXISTS email_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  download_link TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE email_batches ENABLE ROW LEVEL SECURITY;

-- Create policy for all users to select email batches (since this is for system-wide batch tracking)
CREATE POLICY "Allow select on email_batches" ON email_batches
  FOR SELECT USING (true);

-- Create policy for all users to insert email batches
CREATE POLICY "Allow insert on email_batches" ON email_batches
  FOR INSERT WITH CHECK (true);

-- Create policy for all users to update email batches
CREATE POLICY "Allow update on email_batches" ON email_batches
  FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_batches_batch_id ON email_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_email_batches_status ON email_batches(status);
CREATE INDEX IF NOT EXISTS idx_email_batches_submitted_at ON email_batches(submitted_at); 