# Critical Issue #1: RLS (Row-Level Security) Verification & Configuration

## Status: MUST COMPLETE BEFORE LAUNCH

---

## What is RLS?

Row-Level Security (RLS) in PostgreSQL ensures that users can only access data they're authorized to see. Without it, any authenticated user could potentially query another user's leads, earnings, or personal data.

---

## How to Verify RLS is Enabled

### Step 1: Check RLS Status in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database > Tables**
3. For each critical table, check if RLS is **ON** (green toggle):
   - `street_users`
   - `street_venue_leads`
   - `street_mission_progress`
   - `street_runs`
   - `street_xp_events`
   - `street_notifications`

**If RLS is OFF, enable it immediately by clicking the toggle.**

### Step 2: Review RLS Policies

After enabling RLS, you need to add policies. Here are the required SQL statements to execute in your Supabase SQL Editor:

---

## RLS Policies SQL Script

**Run this in your Supabase SQL Editor (Database > SQL Editor > New Query)**

```sql
-- ============================================
-- STREET_USERS RLS POLICIES
-- ============================================

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON street_users;
DROP POLICY IF EXISTS "Users can update own profile" ON street_users;
DROP POLICY IF EXISTS "HQ Admins can view all users" ON street_users;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON street_users
FOR SELECT
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON street_users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: HQ Admins can view/update all users
CREATE POLICY "HQ Admins can manage all users"
ON street_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- ============================================
-- STREET_VENUE_LEADS RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own leads" ON street_venue_leads;
DROP POLICY IF EXISTS "Users can create leads" ON street_venue_leads;
DROP POLICY IF EXISTS "Users can update own leads" ON street_venue_leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON street_venue_leads;
DROP POLICY IF EXISTS "HQ Admins can view all leads" ON street_venue_leads;

-- Policy 1: Users can view leads they created
CREATE POLICY "Users can view own leads"
ON street_venue_leads
FOR SELECT
USING (
  created_by_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- Policy 2: Users can create leads
CREATE POLICY "Users can create leads"
ON street_venue_leads
FOR INSERT
WITH CHECK (created_by_user_id = auth.uid());

-- Policy 3: Users can update their own leads
CREATE POLICY "Users can update own leads"
ON street_venue_leads
FOR UPDATE
USING (created_by_user_id = auth.uid())
WITH CHECK (created_by_user_id = auth.uid());

-- Policy 4: Users can delete their own leads
CREATE POLICY "Users can delete own leads"
ON street_venue_leads
FOR DELETE
USING (created_by_user_id = auth.uid());

-- Policy 5: HQ Admins can manage all leads
CREATE POLICY "HQ Admins can manage all leads"
ON street_venue_leads
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- ============================================
-- STREET_MISSION_PROGRESS RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own mission progress" ON street_mission_progress;
DROP POLICY IF EXISTS "Users can update own mission progress" ON street_mission_progress;
DROP POLICY IF EXISTS "HQ Admins can view all mission progress" ON street_mission_progress;

-- Policy 1: Users can view their own mission progress
CREATE POLICY "Users can view own mission progress"
ON street_mission_progress
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- Policy 2: Users can update their own mission progress
CREATE POLICY "Users can update own mission progress"
ON street_mission_progress
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 3: HQ Admins can view/update all mission progress
CREATE POLICY "HQ Admins can manage all mission progress"
ON street_mission_progress
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- ============================================
-- STREET_RUNS RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own runs" ON street_runs;
DROP POLICY IF EXISTS "Users can create runs" ON street_runs;
DROP POLICY IF EXISTS "Users can update own runs" ON street_runs;
DROP POLICY IF EXISTS "HQ Admins can view all runs" ON street_runs;

-- Policy 1: Users can view their own runs
CREATE POLICY "Users can view own runs"
ON street_runs
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- Policy 2: Users can create runs
CREATE POLICY "Users can create runs"
ON street_runs
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own runs
CREATE POLICY "Users can update own runs"
ON street_runs
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 4: HQ Admins can manage all runs
CREATE POLICY "HQ Admins can manage all runs"
ON street_runs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- ============================================
-- STREET_XP_EVENTS RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own XP events" ON street_xp_events;
DROP POLICY IF EXISTS "System can create XP events" ON street_xp_events;
DROP POLICY IF EXISTS "HQ Admins can view all XP events" ON street_xp_events;

-- Policy 1: Users can view their own XP events
CREATE POLICY "Users can view own XP events"
ON street_xp_events
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- Policy 2: System/Backend can create XP events
CREATE POLICY "System can create XP events"
ON street_xp_events
FOR INSERT
WITH CHECK (user_id IS NOT NULL);

-- Policy 3: HQ Admins can view all XP events
CREATE POLICY "HQ Admins can view all XP events"
ON street_xp_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- ============================================
-- STREET_NOTIFICATIONS RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON street_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON street_notifications;
DROP POLICY IF EXISTS "HQ Admins can send notifications" ON street_notifications;

-- Policy 1: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON street_notifications
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- Policy 2: Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON street_notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 3: HQ Admins can send (insert) notifications
CREATE POLICY "HQ Admins can send notifications"
ON street_notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM street_users WHERE id = auth.uid() AND role = 'hq_admin'
  )
);

-- ============================================
-- STREET_RANKS (Read-Only for Users)
-- ============================================

DROP POLICY IF EXISTS "Users can view all ranks" ON street_ranks;

-- Policy: All authenticated users can view ranks (it's reference data)
CREATE POLICY "Users can view all ranks"
ON street_ranks
FOR SELECT
USING (true);

-- ============================================
-- STREET_MISSIONS (Read-Only for Users)
-- ============================================

DROP POLICY IF EXISTS "Users can view all missions" ON street_missions;

-- Policy: All authenticated users can view missions (it's reference data)
CREATE POLICY "Users can view all missions"
ON street_missions
FOR SELECT
USING (true);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'street_users',
  'street_venue_leads',
  'street_mission_progress',
  'street_runs',
  'street_xp_events',
  'street_notifications',
  'street_ranks',
  'street_missions'
)
ORDER BY tablename;
```

---

## Step 3: Test RLS Enforcement

After applying the policies, **test them immediately**:

### Test Case 1: User A cannot see User B's leads

1. In your app, log in as **User A** (ambassador)
2. Open browser DevTools → Network → Supabase query
3. Try to query: `SELECT * FROM street_venue_leads WHERE created_by_user_id = [User B's ID]`
4. **Expected:** Query returns 0 rows (access denied)
5. **If returns User B's data:** RLS is NOT working. Do NOT launch the app.

### Test Case 2: User A can see their own leads

1. Log in as **User A**
2. Query: `SELECT * FROM street_venue_leads WHERE created_by_user_id = [User A's ID]`
3. **Expected:** Returns User A's leads
4. **If returns 0 rows:** RLS is too restrictive. Fix the policy.

### Test Case 3: HQ Admin can see all leads

1. Log in as an **HQ Admin** user
2. Query: `SELECT * FROM street_venue_leads` (no WHERE clause)
3. **Expected:** Returns ALL leads from all users
4. **If returns only own leads:** Admin role is not configured correctly. Fix the policy.

---

## Step 4: Run the Final Verification Query

Copy and paste this query into your Supabase SQL Editor to confirm all tables have RLS enabled:

```sql
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'street_%'
ORDER BY tablename;
```

**Expected output:**
```
street_applications       | ENABLED ✅
street_contract_acceptances | ENABLED ✅
street_missions           | ENABLED ✅
street_mission_progress   | ENABLED ✅
street_notifications      | ENABLED ✅
street_ranks              | ENABLED ✅
street_runs               | ENABLED ✅
street_users              | ENABLED ✅
street_venue_leads        | ENABLED ✅
street_xp_events          | ENABLED ✅
```

If any show `DISABLED ❌`, enable RLS manually:

```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

---

## Summary

✅ **Do this IMMEDIATELY:**

1. Go to Supabase Dashboard → Database → Tables
2. Check that all critical tables have RLS toggle set to **ON**
3. Run the SQL script above in the SQL Editor
4. Run the verification query
5. Test the three test cases above
6. Confirm all tests pass before deploying

**If RLS is not working, DO NOT LAUNCH THE APP.**

This is a security-critical issue.

---

## What Happens If RLS Is Not Enabled?

🚨 **CRITICAL SECURITY RISK:**

- User A could query and see User B's leads, earnings, personal data
- Users could delete other users' leads
- Users could update other users' contact information
- Complete data breach

**This MUST be fixed before any user accesses the app.**
