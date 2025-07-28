-- Create instant_email_batches table for storing InstantEmail batch metadata
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS instant_email_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_user_id UUID NOT NULL REFERENCES api_users(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL UNIQUE,
  user_email TEXT NOT NULL,
  submitted_emails TEXT[] NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'complete', 'failed')),
  download_url TEXT,
  summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add policies
ALTER TABLE instant_email_batches ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own batches
CREATE POLICY "Users can view their own instant email batches" ON instant_email_batches 
  FOR SELECT USING (user_email = auth.jwt() ->> 'email');

-- Allow users to insert their own batches
CREATE POLICY "Users can insert their own instant email batches" ON instant_email_batches 
  FOR INSERT WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Allow users to update their own batches
CREATE POLICY "Users can update their own instant email batches" ON instant_email_batches 
  FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_instant_email_batches_request_id ON instant_email_batches(request_id);
CREATE INDEX IF NOT EXISTS idx_instant_email_batches_user_email ON instant_email_batches(user_email);
CREATE INDEX IF NOT EXISTS idx_instant_email_batches_status ON instant_email_batches(status);
CREATE INDEX IF NOT EXISTS idx_instant_email_batches_submitted_at ON instant_email_batches(submitted_at);
CREATE INDEX IF NOT EXISTS idx_instant_email_batches_api_user_id ON instant_email_batches(api_user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instant_email_batches_updated_at 
  BEFORE UPDATE ON instant_email_batches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Test the table creation
SELECT 'instant_email_batches table created successfully' as status; 