-- Create api_users table
CREATE TABLE IF NOT EXISTS api_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE api_users ENABLE ROW LEVEL SECURITY;

-- Create policies for api_users table
CREATE POLICY "Allow select on api_users" ON api_users FOR SELECT USING (true);
CREATE POLICY "Allow insert on api_users" ON api_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on api_users" ON api_users FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_users_email ON api_users(user_email);
CREATE INDEX IF NOT EXISTS idx_api_users_api_key ON api_users(api_key); 