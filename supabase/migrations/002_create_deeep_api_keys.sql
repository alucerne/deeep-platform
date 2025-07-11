-- Create deeep_api_keys table
CREATE TABLE IF NOT EXISTS deeep_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  api_key TEXT NOT NULL,
  customer_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE deeep_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own API keys
CREATE POLICY "Users can view own API keys" ON deeep_api_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own API keys
CREATE POLICY "Users can insert own API keys" ON deeep_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own API keys
CREATE POLICY "Users can update own API keys" ON deeep_api_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own API keys
CREATE POLICY "Users can delete own API keys" ON deeep_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deeep_api_keys_user_id ON deeep_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_deeep_api_keys_email ON deeep_api_keys(email);
CREATE INDEX IF NOT EXISTS idx_deeep_api_keys_api_key ON deeep_api_keys(api_key); 