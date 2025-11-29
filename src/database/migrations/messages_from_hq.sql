-- Messages from HQ System
-- Run this migration to add the messaging tables

-- Table: street_team_messages
-- Stores all messages sent from admin to ambassadors
CREATE TABLE IF NOT EXISTS street_team_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Message content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  
  -- Targeting
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'tier', 'individual')),
  target_tier TEXT CHECK (target_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  target_user_id UUID REFERENCES street_users(id) ON DELETE CASCADE,
  
  -- Metadata
  sent_by_admin_id UUID NOT NULL, -- References admin user (from your website auth)
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ, -- NULL = send immediately, otherwise schedule for future
  
  -- Indexes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_street_team_messages_sent_at ON street_team_messages(sent_at DESC);
CREATE INDEX idx_street_team_messages_target_type ON street_team_messages(target_type);
CREATE INDEX idx_street_team_messages_target_tier ON street_team_messages(target_tier);

-- Table: street_team_message_reads
-- Tracks which users have read which messages
CREATE TABLE IF NOT EXISTS street_team_message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES street_team_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure each user can only read a message once
  UNIQUE(message_id, user_id)
);

-- Indexes for faster queries
CREATE INDEX idx_street_team_message_reads_user_id ON street_team_message_reads(user_id);
CREATE INDEX idx_street_team_message_reads_message_id ON street_team_message_reads(message_id);

-- Add push_token column to street_users if not exists
-- This stores the push notification token for each user
ALTER TABLE street_users ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  user_tier TEXT;
  unread_count INTEGER;
BEGIN
  -- Get user's tier
  SELECT tier INTO user_tier FROM street_users WHERE id = user_id_param;
  
  -- Count messages that:
  -- 1. Target 'all'
  -- 2. Target this user's tier
  -- 3. Target this user specifically
  -- AND haven't been read by this user
  SELECT COUNT(*)
  INTO unread_count
  FROM street_team_messages m
  WHERE (
    m.target_type = 'all'
    OR (m.target_type = 'tier' AND m.target_tier = user_tier)
    OR (m.target_type = 'individual' AND m.target_user_id = user_id_param)
  )
  AND m.sent_at <= NOW() -- Only count messages that have been sent
  AND NOT EXISTS (
    SELECT 1 FROM street_team_message_reads r
    WHERE r.message_id = m.id AND r.user_id = user_id_param
  );
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT get_unread_message_count('user-uuid-here');

-- RLS (Row Level Security) Policies
-- Enable RLS on messages table
ALTER TABLE street_team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_team_message_reads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages targeted to them
CREATE POLICY "Users can view their targeted messages"
ON street_team_messages
FOR SELECT
USING (
  target_type = 'all'
  OR (
    target_type = 'tier' 
    AND target_tier IN (
      SELECT tier FROM street_users WHERE id = auth.uid()
    )
  )
  OR (
    target_type = 'individual' 
    AND target_user_id = auth.uid()
  )
);

-- Policy: Admins can insert messages
CREATE POLICY "Admins can insert messages"
ON street_team_messages
FOR INSERT
WITH CHECK (true); -- Add your admin check here

-- Policy: Users can insert their own read records
CREATE POLICY "Users can mark messages as read"
ON street_team_message_reads
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: Users can view their own read records
CREATE POLICY "Users can view their read records"
ON street_team_message_reads
FOR SELECT
USING (user_id = auth.uid());

-- Sample messages to insert after migration (optional)
-- INSERT INTO street_team_messages (title, body, priority, target_type, sent_by_admin_id)
-- VALUES 
--   ('🎉 Welcome to Patron Pass!', 'We''re excited to have you on the team! Check out the Resources tab to watch training videos and learn how to sign your first venue.', 'normal', 'all', 'admin-uuid-here'),
--   ('💡 Pro Tip: Best Time to Visit Venues', 'Our top performers visit venues Tuesday-Thursday between 2-4pm. Owners are available and not stressed during this time. Try it this week!', 'normal', 'all', 'admin-uuid-here');

COMMENT ON TABLE street_team_messages IS 'Messages sent from HQ to street team ambassadors';
COMMENT ON TABLE street_team_message_reads IS 'Tracks which users have read which messages';
COMMENT ON FUNCTION get_unread_message_count IS 'Returns count of unread messages for a user';
