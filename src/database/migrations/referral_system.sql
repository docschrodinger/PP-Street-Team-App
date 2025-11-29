-- Referral & Recruit System
-- Run this migration to add referral tracking

-- Add referral columns to street_users table
ALTER TABLE street_users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE street_users ADD COLUMN IF NOT EXISTS referred_by_code TEXT;
ALTER TABLE street_users ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES street_users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_street_users_referral_code ON street_users(referral_code);
CREATE INDEX IF NOT EXISTS idx_street_users_referred_by ON street_users(referred_by_user_id);

-- Table: street_referral_bonuses
-- Tracks all bonuses earned through referrals
CREATE TABLE IF NOT EXISTS street_referral_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  referrer_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
  recruit_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
  
  bonus_type TEXT NOT NULL CHECK (bonus_type IN ('signup', 'first_venue', 'override')),
  amount DECIMAL(10,2) NOT NULL,
  
  -- For override bonuses (monthly for 6 months)
  month_number INTEGER, -- 1-6 for override bonuses
  
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ, -- NULL = pending, set when paid out
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_street_referral_bonuses_referrer ON street_referral_bonuses(referrer_id);
CREATE INDEX idx_street_referral_bonuses_recruit ON street_referral_bonuses(recruit_id);
CREATE INDEX idx_street_referral_bonuses_type ON street_referral_bonuses(bonus_type);
CREATE INDEX idx_street_referral_bonuses_paid ON street_referral_bonuses(paid_at);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character code (letters and numbers)
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM street_users WHERE referral_code = code) INTO exists;
    
    -- If doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code when user is created
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_referral_code
BEFORE INSERT ON street_users
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

-- Function to award signup bonus
CREATE OR REPLACE FUNCTION award_signup_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- When user is approved (onboarding_status changes to 'approved')
  -- Award $50 signup bonus to their referrer
  IF NEW.onboarding_status = 'approved' 
     AND (OLD.onboarding_status IS NULL OR OLD.onboarding_status != 'approved')
     AND NEW.referred_by_user_id IS NOT NULL THEN
    
    INSERT INTO street_referral_bonuses (
      referrer_id,
      recruit_id,
      bonus_type,
      amount
    ) VALUES (
      NEW.referred_by_user_id,
      NEW.id,
      'signup',
      50.00
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_signup_bonus
AFTER UPDATE ON street_users
FOR EACH ROW
EXECUTE FUNCTION award_signup_bonus();

-- Function to award first venue bonus
CREATE OR REPLACE FUNCTION award_first_venue_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- When user signs their first venue (live_venue_count goes from 0 to 1)
  -- Award $100 first venue bonus to their referrer
  IF NEW.live_venue_count = 1 
     AND (OLD.live_venue_count = 0 OR OLD.live_venue_count IS NULL) THEN
    
    -- Get referrer
    DECLARE
      referrer_id UUID;
    BEGIN
      SELECT referred_by_user_id INTO referrer_id
      FROM street_users
      WHERE id = NEW.id;
      
      IF referrer_id IS NOT NULL THEN
        INSERT INTO street_referral_bonuses (
          referrer_id,
          recruit_id,
          bonus_type,
          amount
        ) VALUES (
          referrer_id,
          NEW.id,
          'first_venue',
          100.00
        );
      END IF;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_first_venue_bonus
AFTER UPDATE ON street_users
FOR EACH ROW
EXECUTE FUNCTION award_first_venue_bonus();

-- Function to calculate referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(referrer_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_referred', (
      SELECT COUNT(*) FROM street_users WHERE referred_by_user_id = referrer_id_param
    ),
    'pending_approval', (
      SELECT COUNT(*) FROM street_users 
      WHERE referred_by_user_id = referrer_id_param 
      AND onboarding_status = 'pending_approval'
    ),
    'approved', (
      SELECT COUNT(*) FROM street_users 
      WHERE referred_by_user_id = referrer_id_param 
      AND onboarding_status = 'approved'
    ),
    'active', (
      SELECT COUNT(*) FROM street_users 
      WHERE referred_by_user_id = referrer_id_param 
      AND live_venue_count > 0
    ),
    'total_bonus_earned', (
      SELECT COALESCE(SUM(amount), 0) FROM street_referral_bonuses 
      WHERE referrer_id = referrer_id_param 
      AND paid_at IS NOT NULL
    ),
    'pending_bonus', (
      SELECT COALESCE(SUM(amount), 0) FROM street_referral_bonuses 
      WHERE referrer_id = referrer_id_param 
      AND paid_at IS NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT get_referral_stats('user-uuid-here');

-- RLS Policies
ALTER TABLE street_referral_bonuses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referral bonuses
CREATE POLICY "Users can view their own referral bonuses"
ON street_referral_bonuses
FOR SELECT
USING (referrer_id = auth.uid() OR recruit_id = auth.uid());

-- Policy: System can insert bonuses (via triggers)
CREATE POLICY "System can insert bonuses"
ON street_referral_bonuses
FOR INSERT
WITH CHECK (true);

-- Policy: Admins can update paid_at (mark as paid)
CREATE POLICY "Admins can mark bonuses as paid"
ON street_referral_bonuses
FOR UPDATE
USING (true); -- Add admin check here

-- View: Referral leaderboard
CREATE OR REPLACE VIEW street_referral_leaderboard AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.profile_photo_url,
  COUNT(DISTINCT r.id) as total_recruits,
  COUNT(DISTINCT CASE WHEN r.onboarding_status = 'approved' THEN r.id END) as approved_recruits,
  COUNT(DISTINCT CASE WHEN r.live_venue_count > 0 THEN r.id END) as active_recruits,
  COALESCE(SUM(b.amount), 0) as total_bonus_earned
FROM street_users u
LEFT JOIN street_users r ON r.referred_by_user_id = u.id
LEFT JOIN street_referral_bonuses b ON b.referrer_id = u.id AND b.paid_at IS NOT NULL
WHERE u.onboarding_status = 'approved'
GROUP BY u.id, u.first_name, u.last_name, u.profile_photo_url
HAVING COUNT(DISTINCT r.id) > 0
ORDER BY total_recruits DESC, total_bonus_earned DESC;

-- Monthly override commission calculation (to be run by cron job)
-- This calculates 5% of each recruit's monthly earnings for 6 months

CREATE OR REPLACE FUNCTION calculate_monthly_override_bonuses(target_month DATE)
RETURNS void AS $$
DECLARE
  recruit RECORD;
  referrer_id UUID;
  months_since_signup INTEGER;
  recruit_earnings DECIMAL(10,2);
  override_amount DECIMAL(10,2);
BEGIN
  -- Loop through all approved users who have a referrer
  FOR recruit IN 
    SELECT * FROM street_users 
    WHERE referred_by_user_id IS NOT NULL 
    AND onboarding_status = 'approved'
  LOOP
    -- Calculate months since they were approved
    months_since_signup := EXTRACT(MONTH FROM AGE(target_month, recruit.approved_at::DATE));
    
    -- Only award override for first 6 months
    IF months_since_signup >= 1 AND months_since_signup <= 6 THEN
      
      -- Calculate recruit's earnings for the target month
      -- This is a simplified example - you'll need to adjust based on your actual earnings calculation
      recruit_earnings := (
        SELECT COALESCE(SUM(
          CASE 
            WHEN recruit.tier = 'bronze' THEN 96.00
            WHEN recruit.tier = 'silver' THEN 120.00
            WHEN recruit.tier = 'gold' THEN 144.00
            WHEN recruit.tier = 'platinum' THEN 192.00
            WHEN recruit.tier = 'diamond' THEN 192.00
            ELSE 96.00
          END * recruit.live_venue_count
        ), 0)
      );
      
      -- Calculate 5% override
      override_amount := recruit_earnings * 0.05;
      
      -- Insert override bonus if amount > 0
      IF override_amount > 0 THEN
        INSERT INTO street_referral_bonuses (
          referrer_id,
          recruit_id,
          bonus_type,
          amount,
          month_number
        ) VALUES (
          recruit.referred_by_user_id,
          recruit.id,
          'override',
          override_amount,
          months_since_signup
        )
        ON CONFLICT DO NOTHING; -- Prevent duplicates
      END IF;
      
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Example: Calculate override bonuses for current month
-- SELECT calculate_monthly_override_bonuses(CURRENT_DATE);

-- Add comment
COMMENT ON TABLE street_referral_bonuses IS 'Tracks all referral bonuses earned by ambassadors';
COMMENT ON FUNCTION get_referral_stats IS 'Returns referral statistics for a user';
COMMENT ON FUNCTION calculate_monthly_override_bonuses IS 'Calculates monthly 5% override commissions for recruiters';
COMMENT ON VIEW street_referral_leaderboard IS 'Top recruiters by number of recruits';
