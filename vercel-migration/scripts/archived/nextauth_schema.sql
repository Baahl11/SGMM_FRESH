-- NextAuth.js Required Tables for Supabase
-- These tables are required by the NextAuth Supabase adapter

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "sessionToken" TEXT UNIQUE NOT NULL,
    "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Add additional fields to auth.users if needed
-- Note: auth.users is managed by Supabase Auth, but we can add custom fields

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts("userId");
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, "providerAccountId");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions("sessionToken");
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);

-- Enable RLS on NextAuth tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- verification_tokens doesn't need RLS as it's temporary

-- Create RLS policies for NextAuth tables
-- Users can only access their own accounts and sessions
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = "userId");

CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid() = "userId");

-- Allow NextAuth service to manage these tables (bypass RLS)
CREATE POLICY "Service role can manage accounts" ON accounts FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role can manage sessions" ON sessions FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Create triggers for updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();