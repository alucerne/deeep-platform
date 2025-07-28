-- Create instant_email_results table for storing InstantEmail API results
-- This is separate from the DEEEP system's email_batches table
CREATE TABLE IF NOT EXISTS instant_email_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  email TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add policies
ALTER TABLE instant_email_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select on instant_email_results" ON instant_email_results FOR SELECT USING (true);
CREATE POLICY "Allow insert on instant_email_results" ON instant_email_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on instant_email_results" ON instant_email_results FOR UPDATE USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_instant_email_results_request_id ON instant_email_results(request_id);
CREATE INDEX IF NOT EXISTS idx_instant_email_results_email ON instant_email_results(email);
CREATE INDEX IF NOT EXISTS idx_instant_email_results_created_at ON instant_email_results(created_at); 