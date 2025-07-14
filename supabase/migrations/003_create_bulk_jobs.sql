-- Create bulk_jobs table
CREATE TABLE IF NOT EXISTS bulk_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  batch_id TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  num_valid_items INTEGER NOT NULL,
  remaining_credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'complete')),
  download_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE bulk_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own bulk jobs
CREATE POLICY "Users can view own bulk jobs" ON bulk_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own bulk jobs
CREATE POLICY "Users can insert own bulk jobs" ON bulk_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own bulk jobs
CREATE POLICY "Users can update own bulk jobs" ON bulk_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_user_id ON bulk_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_batch_id ON bulk_jobs(batch_id);
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_status ON bulk_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_submitted_at ON bulk_jobs(submitted_at); 