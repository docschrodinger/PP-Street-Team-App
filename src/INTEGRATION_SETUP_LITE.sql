-- ============================================================================
-- PATRON PASS STREET TEAM - LITE INTEGRATION SETUP
-- ============================================================================
-- This is a simplified version that works WITHOUT website tables
-- Run this if you get "relation does not exist" errors
-- ============================================================================

-- Add website_inquiry_id (will link to website CRM when it exists)
ALTER TABLE street_venue_leads
  ADD COLUMN IF NOT EXISTS website_inquiry_id UUID;

-- Add patron_pass_business_id (will link to business account when it exists)
ALTER TABLE street_venue_leads
  ADD COLUMN IF NOT EXISTS patron_pass_business_id UUID;

-- Add actual_monthly_revenue (will store real billing amount)
ALTER TABLE street_venue_leads
  ADD COLUMN IF NOT EXISTS actual_monthly_revenue DECIMAL(10,2);

-- Add billing_subscription_id (will link to subscription when it exists)
ALTER TABLE street_venue_leads
  ADD COLUMN IF NOT EXISTS billing_subscription_id UUID;

-- Add column comments
COMMENT ON COLUMN street_venue_leads.website_inquiry_id IS 
  'Links to website_partnership_inquiries.id when synced to main website CRM';

COMMENT ON COLUMN street_venue_leads.patron_pass_business_id IS 
  'Links to website_businesses.id when venue becomes a Patron Pass customer';

COMMENT ON COLUMN street_venue_leads.actual_monthly_revenue IS 
  'Real monthly billing amount from subscription (replaces $150 estimate)';

COMMENT ON COLUMN street_venue_leads.billing_subscription_id IS 
  'Links to website_business_subscriptions.id for active billing';

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Index for finding leads that need to be synced
CREATE INDEX IF NOT EXISTS idx_street_leads_sync_status
  ON street_venue_leads(status)
  WHERE status IN ('signed_pending', 'live');

-- Index for website inquiry lookups
CREATE INDEX IF NOT EXISTS idx_street_leads_website_inquiry
  ON street_venue_leads(website_inquiry_id)
  WHERE website_inquiry_id IS NOT NULL;

-- Index for business account lookups
CREATE INDEX IF NOT EXISTS idx_street_leads_business
  ON street_venue_leads(patron_pass_business_id)
  WHERE patron_pass_business_id IS NOT NULL;

-- Index for revenue tracking
CREATE INDEX IF NOT EXISTS idx_street_leads_revenue
  ON street_venue_leads(actual_monthly_revenue)
  WHERE actual_monthly_revenue IS NOT NULL;

-- ============================================================================
-- Create placeholder sync function and trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_lead_to_website()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  website_table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'website_partnership_inquiries'
  ) INTO website_table_exists;

  IF NEW.status IN ('signed_pending', 'live') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('signed_pending', 'live'))
     AND NEW.website_inquiry_id IS NULL THEN
    
    IF website_table_exists THEN
      RAISE NOTICE 'Lead % ready for website sync (table exists)', NEW.id;
    ELSE
      RAISE NOTICE 'Lead % ready for website sync (waiting for website tables)', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_lead_to_website ON street_venue_leads;

CREATE TRIGGER trigger_sync_lead_to_website
  BEFORE UPDATE ON street_venue_leads
  FOR EACH ROW
  EXECUTE FUNCTION sync_lead_to_website();

-- ============================================================================
-- DONE!
-- ============================================================================
-- Integration columns and triggers are now ready.
-- 
-- NEXT STEP: To create the unified view, first run this query to see your schema:
--
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'street_venue_leads'
-- ORDER BY ordinal_position;
--
-- Then tell me which column links to street_users
-- ============================================================================
