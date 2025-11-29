-- ============================================================================
-- DISABLE RLS FOR TESTING ONLY
-- ============================================================================
-- 
-- ⚠️ WARNING: This disables Row Level Security on all street_* tables.
-- Only use this for LOCAL TESTING. DO NOT run this in production!
--
-- This allows you to test the app without setting up complex RLS policies.
-- Once you're ready for production, re-enable RLS and set up proper policies.
-- ============================================================================

-- Disable RLS on all street team tables
ALTER TABLE street_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_contract_acceptances DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_venue_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_venue_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_mission_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_xp_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_ranks DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_notifications DISABLE ROW LEVEL SECURITY;

-- Only disable if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'street_account_deletion_requests') THEN
    ALTER TABLE street_account_deletion_requests DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'street_%'
ORDER BY tablename;

-- You should see rls_enabled = false for all tables

-- ============================================================================
-- TO RE-ENABLE RLS FOR PRODUCTION
-- ============================================================================
-- When you're ready to deploy, run this to re-enable RLS:
/*
ALTER TABLE street_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_contract_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_venue_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_venue_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Then set up proper RLS policies from /DATABASE_SCHEMA_AND_ARCHITECTURE.md
*/

-- ============================================================================
-- DONE
-- ============================================================================
-- RLS is now disabled for testing. You can now:
-- 1. Create test users via the app's signup flow
-- 2. Add leads, complete runs, etc. without RLS blocking
-- 3. Test the full app functionality
--
-- Remember: Re-enable RLS before deploying to production!
-- ============================================================================
