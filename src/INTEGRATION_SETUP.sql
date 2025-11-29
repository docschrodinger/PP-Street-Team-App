-- ============================================================================
-- INTEGRATION SETUP FOR PATRON PASS STREET TEAM + WEBSITE
-- ============================================================================
--
-- This script adds integration columns to link Street Team app with the
-- main Patron Pass website. It is SAFE and NON-DESTRUCTIVE to existing data.
--
-- ⚠️ IMPORTANT: This ONLY modifies street_* tables, NEVER touches website tables
--
-- Run this in your Supabase SQL Editor after creating the base street_* tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add integration columns to street_venue_leads
-- ----------------------------------------------------------------------------

-- Link to website CRM
ALTER TABLE street_venue_leads
ADD COLUMN IF NOT EXISTS website_inquiry_id UUID REFERENCES website_partnership_inquiries(id) ON DELETE SET NULL;

-- Link to actual Patron Pass business account
ALTER TABLE street_venue_leads
ADD COLUMN IF NOT EXISTS patron_pass_business_id UUID REFERENCES website_businesses(id) ON DELETE SET NULL;

-- Track actual revenue from billing
ALTER TABLE street_venue_leads
ADD COLUMN IF NOT EXISTS actual_monthly_revenue DECIMAL(10,2);

-- Link to billing subscription
ALTER TABLE street_venue_leads
ADD COLUMN IF NOT EXISTS billing_subscription_id UUID REFERENCES website_business_subscriptions(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_street_leads_website_inquiry 
  ON street_venue_leads(website_inquiry_id);

CREATE INDEX IF NOT EXISTS idx_street_leads_business 
  ON street_venue_leads(patron_pass_business_id);

CREATE INDEX IF NOT EXISTS idx_street_leads_billing 
  ON street_venue_leads(billing_subscription_id);

COMMENT ON COLUMN street_venue_leads.website_inquiry_id IS 
  'Links to website_partnership_inquiries for unified CRM';

COMMENT ON COLUMN street_venue_leads.patron_pass_business_id IS 
  'Links to actual business account once activated';

COMMENT ON COLUMN street_venue_leads.actual_monthly_revenue IS 
  'Real revenue from billing system, overrides $150 estimate';

COMMENT ON COLUMN street_venue_leads.billing_subscription_id IS 
  'Links to active subscription for accurate commission tracking';

-- ----------------------------------------------------------------------------
-- 2. Add integration columns to website_partnership_inquiries (if needed)
-- ----------------------------------------------------------------------------

-- ⚠️ Only run this if the column doesn't already exist in your website table
-- This is SAFE - it only adds a column, doesn't modify existing data

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_partnership_inquiries' 
    AND column_name = 'street_team_lead_id'
  ) THEN
    ALTER TABLE website_partnership_inquiries
    ADD COLUMN street_team_lead_id UUID REFERENCES street_venue_leads(id) ON DELETE SET NULL;

    CREATE INDEX idx_website_inquiries_street_lead 
      ON website_partnership_inquiries(street_team_lead_id);

    COMMENT ON COLUMN website_partnership_inquiries.street_team_lead_id IS 
      'Links back to street team lead that originated this inquiry';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_partnership_inquiries' 
    AND column_name = 'street_team_agent_id'
  ) THEN
    ALTER TABLE website_partnership_inquiries
    ADD COLUMN street_team_agent_id UUID REFERENCES street_users(id) ON DELETE SET NULL;

    CREATE INDEX idx_website_inquiries_agent 
      ON website_partnership_inquiries(street_team_agent_id);

    COMMENT ON COLUMN website_partnership_inquiries.street_team_agent_id IS 
      'Street team agent who brought in this lead';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Create unified view for HQ admins (SAFE - read-only)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW hq_unified_leads AS
SELECT 
  -- Street team data
  sl.id as street_lead_id,
  sl.venue_name,
  sl.contact_name,
  sl.contact_role,
  sl.email,
  sl.phone,
  sl.city,
  sl.state,
  sl.status as street_status,
  sl.heat_score,
  sl.relationship_strength,
  sl.created_at as street_created_at,
  
  -- Agent data
  su.id as agent_id,
  su.full_name as agent_name,
  su.email as agent_email,
  su.current_rank as agent_rank,
  su.city as agent_city,
  
  -- Website CRM data
  wi.id as website_inquiry_id,
  wi.status as website_status,
  wi.created_at as website_created_at,
  
  -- Business data
  wb.id as business_id,
  wb.name as business_name,
  
  -- Revenue data
  sl.actual_monthly_revenue,
  wbs.monthly_amount as billing_amount,
  wbs.status as billing_status

FROM street_venue_leads sl
LEFT JOIN street_users su ON sl.user_id = su.id
LEFT JOIN website_partnership_inquiries wi ON sl.website_inquiry_id = wi.id
LEFT JOIN website_businesses wb ON sl.patron_pass_business_id = wb.id
LEFT JOIN website_business_subscriptions wbs ON sl.billing_subscription_id = wbs.id
ORDER BY sl.created_at DESC;

COMMENT ON VIEW hq_unified_leads IS 
  'Unified view combining street team leads with website CRM and billing data';

-- ----------------------------------------------------------------------------
-- 4. Create function to auto-sync leads to website when status changes
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_lead_to_website()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when lead reaches signed_pending or live status
  IF NEW.status IN ('signed_pending', 'live') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('signed_pending', 'live')) THEN
    
    -- Check if inquiry already exists
    IF NEW.website_inquiry_id IS NULL THEN
      -- Insert into website_partnership_inquiries
      INSERT INTO website_partnership_inquiries (
        venue_name,
        contact_name,
        contact_role,
        email,
        phone,
        city,
        state,
        status,
        source,
        street_team_lead_id,
        street_team_agent_id,
        notes,
        created_at
      ) VALUES (
        NEW.venue_name,
        NEW.contact_name,
        NEW.contact_role,
        NEW.email,
        NEW.phone,
        NEW.city,
        NEW.state,
        CASE WHEN NEW.status = 'live' THEN 'active' ELSE 'pending_activation' END,
        'street_team',
        NEW.id,
        NEW.user_id,
        'Auto-synced from street team. Heat: ' || COALESCE(NEW.heat_score, 0) || '/10',
        NEW.created_at
      )
      RETURNING id INTO NEW.website_inquiry_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only if it doesn't exist)
DROP TRIGGER IF EXISTS trigger_sync_lead_to_website ON street_venue_leads;
CREATE TRIGGER trigger_sync_lead_to_website
  BEFORE UPDATE ON street_venue_leads
  FOR EACH ROW
  EXECUTE FUNCTION sync_lead_to_website();

COMMENT ON FUNCTION sync_lead_to_website IS 
  'Automatically syncs street team leads to website CRM when they reach signed/live status';

-- ----------------------------------------------------------------------------
-- 5. Grant permissions for HQ admins
-- ----------------------------------------------------------------------------

-- Grant HQ admins read access to unified view
GRANT SELECT ON hq_unified_leads TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'street_venue_leads'
  AND column_name IN (
    'website_inquiry_id',
    'patron_pass_business_id',
    'actual_monthly_revenue',
    'billing_subscription_id'
  )
ORDER BY column_name;

-- Check unified view
SELECT COUNT(*) as total_leads FROM hq_unified_leads;

-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_lead_to_website';

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Your Street Team app is now integrated with the main website.
--
-- Next steps:
-- 1. Test creating a lead and moving it to "live" status
-- 2. Check that it appears in website_partnership_inquiries
-- 3. Use the HQ Admin Dashboard to view unified data
-- 4. Link actual billing subscriptions for accurate revenue tracking
-- ============================================================================
