# Website Integration Checklist

## 🎯 Pre-Integration Checklist

Before running the integration setup, ensure:

- [ ] Your main Patron Pass website is deployed at `patronpass.com` or `patron-pass.vercel.app`
- [ ] Both Street Team app and website use the **same Supabase project**
- [ ] The following website tables exist in Supabase:
  - [ ] `website_partnership_inquiries`
  - [ ] `website_businesses`
  - [ ] `website_business_subscriptions`
  - [ ] `website_users`
- [ ] You have admin access to Supabase SQL Editor
- [ ] You've backed up your database (optional but recommended)

---

## 📋 Integration Setup Steps

### Step 1: Verify Current Database State

Run this query in Supabase SQL Editor to check existing tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'website_%'
ORDER BY table_name;
```

**Expected results:**
- website_partnership_inquiries ✓
- website_businesses ✓
- website_business_subscriptions ✓
- website_users ✓

If any are missing, create them in your website database first.

---

### Step 2: Run Integration SQL Script

1. Open `/INTEGRATION_SETUP.sql` in your code editor
2. Copy the entire contents
3. Open Supabase Dashboard → SQL Editor
4. Paste the script
5. Click "Run"

**What this does:**
- [x] Adds 4 integration columns to `street_venue_leads`
- [x] Adds 2 optional columns to `website_partnership_inquiries`
- [x] Creates indexes for performance
- [x] Creates `hq_unified_leads` view
- [x] Creates auto-sync trigger function
- [x] Adds comments to document columns

**Expected output:** Query completed successfully

---

### Step 3: Verify Integration Setup

Run verification queries (included at bottom of INTEGRATION_SETUP.sql):

```sql
-- Check columns were added
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
```

**Expected:** 4 rows returned

```sql
-- Check unified view exists
SELECT COUNT(*) as total_leads FROM hq_unified_leads;
```

**Expected:** Number (could be 0 if no leads yet)

```sql
-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_lead_to_website';
```

**Expected:** 1 row returned

---

### Step 4: Test Auto-Sync with a Test Lead

1. **Create a test lead** in Street Team app:
   - Login to app
   - Add a new lead (any venue)
   - Note the venue name

2. **Progress lead to "Signed Pending":**
   - Go to Pipeline
   - Open the lead
   - Change status to "Signed Pending"
   - You should see toast: "Lead synced to website CRM! 🔗"

3. **Verify sync in database:**
   ```sql
   SELECT 
     id,
     venue_name,
     contact_name,
     status,
     source,
     street_team_lead_id,
     street_team_agent_id
   FROM website_partnership_inquiries
   WHERE source = 'street_team'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

**Expected:** Your test lead appears with:
- ✓ venue_name matches
- ✓ source = 'street_team'
- ✓ street_team_lead_id is populated
- ✓ street_team_agent_id matches your user ID

4. **Check bidirectional link:**
   ```sql
   SELECT 
     sl.id as lead_id,
     sl.venue_name,
     sl.status as street_status,
     sl.website_inquiry_id,
     wi.id as inquiry_id,
     wi.status as website_status
   FROM street_venue_leads sl
   LEFT JOIN website_partnership_inquiries wi ON sl.website_inquiry_id = wi.id
   WHERE sl.venue_name = 'YOUR_TEST_VENUE_NAME'
   LIMIT 1;
   ```

**Expected:** Both IDs match and link correctly

---

### Step 5: Test HQ Admin Dashboard

1. **Create HQ admin user** (if you don't have one):
   ```sql
   -- Update an existing street user to hq_admin role
   UPDATE street_users
   SET role = 'hq_admin'
   WHERE email = 'your-email@example.com';
   ```

2. **Login and access dashboard:**
   - Login to Street Team app
   - Go to Profile → Settings
   - Click "HQ Admin Dashboard"

3. **Verify dashboard features:**
   - [ ] See total metrics (leads, venues, agents, revenue)
   - [ ] See all leads in table
   - [ ] Filter by city works
   - [ ] Filter by status works
   - [ ] Pending applications section (if any exist)
   - [ ] "Sync to Website CRM" button works

4. **Test bulk sync:**
   - Click "Sync to Website CRM"
   - Wait for completion
   - Check toast notification
   - Verify in database that all signed/live leads are synced

---

### Step 6: Test Revenue Linking

1. **Create a test business** in your website (if you have this capability):
   - Use website admin panel
   - Create business account
   - Create billing subscription
   - Note the business ID and subscription ID

2. **Link to street lead manually:**
   ```sql
   UPDATE street_venue_leads
   SET 
     patron_pass_business_id = 'business-uuid-here',
     billing_subscription_id = 'subscription-uuid-here'
   WHERE venue_name = 'YOUR_TEST_VENUE_NAME';
   ```

3. **System will auto-fetch actual revenue:**
   - Integration service reads billing amount
   - Updates `actual_monthly_revenue`
   - Earnings calculations use real data

4. **Verify in app:**
   - Go to Earnings screen
   - Should show accurate revenue
   - Should distinguish between estimated vs actual

---

## ✅ Post-Integration Verification

### Database Health Check

```sql
-- 1. Check for orphaned records (should be 0)
SELECT COUNT(*) as orphaned_leads
FROM street_venue_leads
WHERE website_inquiry_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM website_partnership_inquiries 
    WHERE id = street_venue_leads.website_inquiry_id
  );

-- 2. Check sync coverage (% of signed/live leads synced)
SELECT 
  COUNT(*) as total_signed_live,
  COUNT(website_inquiry_id) as synced,
  ROUND(COUNT(website_inquiry_id) * 100.0 / COUNT(*), 2) as sync_percentage
FROM street_venue_leads
WHERE status IN ('signed_pending', 'live');

-- 3. Check revenue tracking coverage
SELECT 
  COUNT(*) as total_live,
  COUNT(actual_monthly_revenue) as with_real_revenue,
  COUNT(billing_subscription_id) as with_billing_link
FROM street_venue_leads
WHERE status = 'live';
```

### Application Functionality Check

- [ ] Can still create leads (no regressions)
- [ ] Can still update lead status
- [ ] XP still awards correctly
- [ ] Rank-up modal still triggers
- [ ] Earnings screen shows data
- [ ] Leaderboard works
- [ ] Missions track progress
- [ ] No console errors related to integration

---

## 🔧 Troubleshooting

### Issue: Trigger doesn't fire

**Symptoms:** Leads reach "signed_pending" but don't sync

**Fix:**
```sql
-- Check trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_lead_to_website';

-- If missing, recreate it from INTEGRATION_SETUP.sql
```

### Issue: Foreign key constraint error

**Symptoms:** "violates foreign key constraint" when syncing

**Fix:**
```sql
-- Make sure referenced tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN (
  'website_partnership_inquiries',
  'website_businesses',
  'website_business_subscriptions'
);

-- All 3 should exist
```

### Issue: RLS policy blocks sync

**Symptoms:** "new row violates row-level security policy"

**Fix:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'website_partnership_inquiries';

-- If rowsecurity = true, you need to add policy:
CREATE POLICY "Allow authenticated inserts"
ON website_partnership_inquiries
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Or temporarily disable RLS for testing:
ALTER TABLE website_partnership_inquiries DISABLE ROW LEVEL SECURITY;
```

### Issue: Sync happens but no toast notification

**Symptoms:** Database syncs but user doesn't see confirmation

**Check:**
- Is `syncLeadToWebsiteCRM()` being called in LeadDetailsScreen?
- Is the toast library (sonner) imported correctly?
- Are there any console errors?

### Issue: HQ Admin Dashboard doesn't load

**Symptoms:** Blank screen or error when accessing

**Fix:**
1. Check user role is 'hq_admin'
2. Check console for errors
3. Verify integration service functions are imported
4. Check RLS policies allow reading from required tables

---

## 🎉 Success Criteria

Your integration is successful when:

- [x] Test lead syncs to website CRM automatically
- [x] Bidirectional linking works (foreign keys populated)
- [x] HQ Admin Dashboard shows all data correctly
- [x] Bulk sync works without errors
- [x] No regressions in existing app functionality
- [x] Revenue tracking links to real billing data
- [x] Unified view returns data
- [x] Auto-sync trigger fires on status changes

---

## 📊 Monitoring & Maintenance

### Regular Health Checks

Run these queries weekly:

```sql
-- 1. Sync rate
SELECT 
  DATE(updated_at) as date,
  COUNT(*) as leads_synced
FROM street_venue_leads
WHERE website_inquiry_id IS NOT NULL
  AND updated_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(updated_at)
ORDER BY date DESC;

-- 2. Revenue tracking adoption
SELECT 
  COUNT(*) FILTER (WHERE actual_monthly_revenue IS NOT NULL) as with_real_revenue,
  COUNT(*) as total_live_venues,
  ROUND(
    COUNT(*) FILTER (WHERE actual_monthly_revenue IS NOT NULL) * 100.0 / COUNT(*),
    2
  ) as adoption_percentage
FROM street_venue_leads
WHERE status = 'live';

-- 3. Agent performance via unified view
SELECT 
  agent_name,
  agent_rank,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE street_status = 'live') as live_venues,
  SUM(COALESCE(actual_monthly_revenue, 150)) as monthly_revenue
FROM hq_unified_leads
GROUP BY agent_name, agent_rank
ORDER BY live_venues DESC
LIMIT 10;
```

### Performance Optimization

If queries are slow:

```sql
-- Add index on updated_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_street_leads_updated 
  ON street_venue_leads(updated_at);

-- Add composite index for common filters
CREATE INDEX IF NOT EXISTS idx_street_leads_status_city 
  ON street_venue_leads(status, city);
```

---

## 🔄 Rollback Plan

If you need to disable integration:

### Option 1: Disable auto-sync only (keep data)

```sql
-- Stop trigger from firing
DROP TRIGGER IF EXISTS trigger_sync_lead_to_website ON street_venue_leads;

-- Integration columns remain, manual sync still works
```

### Option 2: Full rollback (remove all integration)

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS trigger_sync_lead_to_website ON street_venue_leads;

-- Drop function
DROP FUNCTION IF EXISTS sync_lead_to_website();

-- Drop view
DROP VIEW IF EXISTS hq_unified_leads;

-- Remove columns from street_venue_leads
ALTER TABLE street_venue_leads
  DROP COLUMN IF EXISTS website_inquiry_id,
  DROP COLUMN IF EXISTS patron_pass_business_id,
  DROP COLUMN IF EXISTS actual_monthly_revenue,
  DROP COLUMN IF EXISTS billing_subscription_id;

-- Optionally remove from website table
ALTER TABLE website_partnership_inquiries
  DROP COLUMN IF EXISTS street_team_lead_id,
  DROP COLUMN IF EXISTS street_team_agent_id;
```

**Note:** This is completely safe and won't affect existing website data.

---

## 📞 Support & Next Steps

### Everything working? Great!

Next steps:
1. Train HQ admins on the dashboard
2. Educate street team on earnings tracking
3. Set up regular syncs (if not using auto-sync)
4. Monitor sync rates and revenue accuracy
5. Celebrate with the team! 🎉

### Need help?

- Review `/WEBSITE_INTEGRATION_GUIDE.md` for detailed docs
- Check `/DATABASE_SCHEMA_AND_ARCHITECTURE.md` for schema reference
- Test with `/TEST_RANK_UP.md` for modal functionality
- See `/RELEASE_NOTES.md` for what's new

---

**Happy integrating!** 🚀
