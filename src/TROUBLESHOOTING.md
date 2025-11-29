# Troubleshooting Guide - Patron Pass Street Team

## 🔍 Common Issues & Solutions

---

## Setup Issues

### ❌ "relation does not exist" error when running SQL

**Error message:**
```
ERROR: 42P01: relation "website_partnership_inquiries" does not exist
```

**Cause:** You're trying to run the full integration setup, but your Supabase project doesn't have the website tables yet.

**Solution:**
1. Use the lite setup instead: `/INTEGRATION_SETUP_LITE.sql`
2. See guide: `/SETUP_WITHOUT_WEBSITE.md`
3. Everything will work perfectly without website tables!

---

### ❌ "Table doesn't exist" error in app

**Error message:**
```
relation "street_venue_leads" does not exist
```

**Cause:** You haven't created the base street team tables yet.

**Solution:**
1. Open `/DATABASE_SCHEMA_AND_ARCHITECTURE.md`
2. Find the "Complete SQL Schema" section
3. Copy all CREATE TABLE statements
4. Run in Supabase SQL Editor

Or use the quick start script in `/QUICK_START.md`.

---

### ❌ "Row violates row-level security policy"

**Error message:**
```
new row violates row-level security policy for table "street_venue_leads"
```

**Cause:** RLS (Row Level Security) is enabled but policies aren't set up correctly.

**Solution Option 1 - Disable RLS for testing:**
```sql
-- ONLY FOR TESTING/DEVELOPMENT
ALTER TABLE street_venue_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE street_missions DISABLE ROW LEVEL SECURITY;
-- Add for other tables as needed
```

**Solution Option 2 - Add proper RLS policies:**
See `/DATABASE_SCHEMA_AND_ARCHITECTURE.md` - Row Level Security section

---

## Auth Issues

### ❌ Can't login / "Invalid credentials"

**Possible causes:**
1. **User doesn't exist** in Supabase Auth
2. **Wrong password**
3. **User exists in Auth but not in street_users table**

**Solution:**

**Check if user exists:**
```sql
-- In Supabase SQL Editor
SELECT * FROM auth.users WHERE email = 'your-email@example.com';
```

**If no rows:** Create user in Supabase Dashboard → Authentication → Users

**If user exists, check street_users:**
```sql
SELECT * FROM street_users WHERE email = 'your-email@example.com';
```

**If no rows:** User needs to be in street_users table. Run:
```sql
INSERT INTO street_users (
  id, email, role, full_name, status
) VALUES (
  'auth-user-id-here',
  'your-email@example.com',
  'city_captain',
  'Your Name',
  'active'
);
```

---

### ❌ Login works but app shows "Needs contract"

**Cause:** User exists but hasn't accepted the street team contract.

**Solution:**
```sql
INSERT INTO street_contract_acceptances (
  user_id,
  agreement_version,
  accepted_at,
  typed_signature
) VALUES (
  'your-user-id',
  'v1.0',
  NOW(),
  'Your Name'
);
```

---

### ❌ Login works but shows onboarding screen every time

**Cause:** `onboarded` flag not set in street_users.

**Solution:**
```sql
UPDATE street_users
SET preferences = jsonb_set(
  COALESCE(preferences, '{}'::jsonb),
  '{onboarded}',
  'true'
)
WHERE email = 'your-email@example.com';
```

---

## Feature Issues

### ❌ XP not awarding / Rank not updating

**Possible causes:**
1. XP events not being created
2. Rank thresholds not seeded
3. Console errors blocking execution

**Solution:**

**Check XP events:**
```sql
SELECT * FROM street_xp_events 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 10;
```

**Check ranks table:**
```sql
SELECT * FROM street_ranks ORDER BY min_xp;
```

**Should show:** Bronze (0), Silver (500), Gold (1500), Platinum (3500), Diamond (7000), Black Key (15000)

**If empty, seed ranks:**
```sql
-- See /DATABASE_SCHEMA_AND_ARCHITECTURE.md for rank seed data
```

**Check console for errors:**
- Open browser DevTools (F12)
- Look for red errors when performing actions

---

### ❌ Rank-up modal doesn't show

**Possible causes:**
1. Not enough XP to trigger rank-up
2. Event listener not set up
3. Modal component error

**Solution:**

**Check current XP:**
```sql
SELECT 
  full_name,
  total_xp,
  current_rank
FROM street_users
WHERE email = 'your-email@example.com';
```

**Force trigger for testing:**
Open browser console (F12) and paste:
```javascript
window.dispatchEvent(new CustomEvent('rank-up', {
  detail: {
    previousRank: 'Bronze',
    newRank: 'Silver',
    totalXP: 500
  }
}));
```

**Check for console errors:**
- Look for errors mentioning "RankUpModal"
- Check Motion/Framer Motion is installed

---

### ❌ Missions not tracking progress

**Possible causes:**
1. Missions not seeded in database
2. Mission service not being called
3. Refresh needed to see updates

**Solution:**

**Check missions exist:**
```sql
SELECT * FROM street_missions 
WHERE status = 'active'
ORDER BY created_at DESC;
```

**Check mission progress:**
```sql
SELECT * FROM street_mission_progress
WHERE user_id = 'your-user-id'
ORDER BY updated_at DESC;
```

**Force refresh mission progress:**
The app should call `updateMissionProgress()` after lead actions. Check browser console for any errors.

---

### ❌ Leaderboard shows no data

**Possible causes:**
1. No XP events in database
2. Wrong city filter
3. RLS blocking query

**Solution:**

**Check if XP events exist:**
```sql
SELECT 
  u.full_name,
  u.current_rank,
  u.total_xp,
  u.city
FROM street_users u
WHERE u.total_xp > 0
ORDER BY u.total_xp DESC
LIMIT 10;
```

**Check city filter:**
Make sure you're viewing the right city or switch to "All Cities"

---

## Integration Issues

### ❌ "Skipping website sync" in console

**Message:**
```
⏭️ Skipping website sync - website tables not yet set up
```

**Cause:** This is **not an error**! It means you haven't set up website integration yet.

**Solution:**
- If you don't need website integration: Ignore this message, everything works fine
- If you want website integration: See `/SETUP_WITHOUT_WEBSITE.md` or `/WEBSITE_INTEGRATION_GUIDE.md`

---

### ❌ Lead sync fails silently

**Possible causes:**
1. Website tables don't exist
2. RLS policy blocking insert
3. Foreign key constraint

**Solution:**

**Check website tables exist:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'website_partnership_inquiries',
  'website_businesses'
);
```

**Check RLS on website tables:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'website_partnership_inquiries';
```

If `rowsecurity = true`, add policy:
```sql
CREATE POLICY "Allow authenticated inserts"
ON website_partnership_inquiries
FOR INSERT
TO authenticated
WITH CHECK (true);
```

**Check console logs:**
Open browser console when moving lead to "Live" status - look for error details

---

### ❌ HQ Admin Dashboard blank/empty

**Possible causes:**
1. User doesn't have hq_admin role
2. Integration view doesn't exist
3. No leads in database

**Solution:**

**Check user role:**
```sql
SELECT email, role FROM street_users 
WHERE email = 'your-email@example.com';
```

**If not hq_admin:**
```sql
UPDATE street_users
SET role = 'hq_admin'
WHERE email = 'your-email@example.com';
```

**Check view exists:**
```sql
SELECT * FROM hq_unified_leads_lite LIMIT 5;
```

**If error:** Run `/INTEGRATION_SETUP_LITE.sql`

**Check leads exist:**
```sql
SELECT COUNT(*) FROM street_venue_leads;
```

---

## Performance Issues

### ❌ App is slow / Queries take forever

**Possible causes:**
1. Missing indexes
2. Too much data without pagination
3. N+1 query problem

**Solution:**

**Add indexes:**
```sql
-- See /INTEGRATION_SETUP_LITE.sql for all recommended indexes

-- Most important ones:
CREATE INDEX IF NOT EXISTS idx_street_leads_user 
  ON street_venue_leads(user_id);

CREATE INDEX IF NOT EXISTS idx_street_leads_status 
  ON street_venue_leads(status);

CREATE INDEX IF NOT EXISTS idx_xp_events_user 
  ON street_xp_events(user_id);
```

**Check slow queries:**
Enable slow query logging in Supabase dashboard

**Optimize queries:**
Add `.limit()` to large queries

---

## UI Issues

### ❌ Confetti doesn't show

**Possible causes:**
1. Motion library not loaded
2. Z-index conflict
3. Modal rendered behind other elements

**Solution:**

**Check Motion installed:**
```javascript
// In browser console
import { motion } from 'motion/react';
console.log(motion); // Should not be undefined
```

**Check z-index:**
RankUpModal should have `z-50` or higher. Check for conflicting z-index values.

**Force show modal:**
```javascript
// In console
window.dispatchEvent(new CustomEvent('rank-up', {
  detail: { previousRank: 'Bronze', newRank: 'Silver', totalXP: 500 }
}));
```

---

### ❌ Bottom nav disappears

**Possible causes:**
1. Screen state issue
2. CSS problem
3. Component unmounted

**Solution:**

**Check current screen:**
```javascript
// Add console.log in App.tsx to debug
console.log('Current screen:', currentScreen);
```

**Check showBottomNav condition:**
Make sure the screen you're on should show bottom nav

---

### ❌ Styles look broken / Not loading

**Possible causes:**
1. Tailwind not compiling
2. Missing CSS import
3. Browser cache

**Solution:**

**Clear browser cache:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**Check globals.css imported:**
Verify `/styles/globals.css` is imported in your app

**Check Tailwind classes:**
Make sure you're not using Tailwind v3 syntax with v4

---

## Database Issues

### ❌ "duplicate key value violates unique constraint"

**Error message:**
```
duplicate key value violates unique constraint "street_users_pkey"
```

**Cause:** Trying to insert a record with an ID that already exists.

**Solution:**

**For users:** Check if user already exists before inserting
```sql
SELECT * FROM street_users WHERE id = 'user-id';
```

**For leads:** Let database generate ID with `gen_random_uuid()`

---

### ❌ Foreign key constraint violation

**Error message:**
```
violates foreign key constraint "street_venue_leads_user_id_fkey"
```

**Cause:** Trying to create a lead with a user_id that doesn't exist.

**Solution:**

**Check user exists:**
```sql
SELECT id, email FROM street_users WHERE id = 'user-id-here';
```

**If missing:** Create the user first, then create the lead

---

## Need More Help?

### 📚 Documentation
- **Setup:** `/QUICK_START.md`
- **Database:** `/DATABASE_SCHEMA_AND_ARCHITECTURE.md`
- **Integration:** `/WEBSITE_INTEGRATION_GUIDE.md` or `/SETUP_WITHOUT_WEBSITE.md`
- **Features:** `/WHATS_NEW.md`

### 🔍 Debugging Tips
1. **Always check browser console** (F12) for errors
2. **Check Supabase logs** in dashboard
3. **Run SQL queries** to verify data
4. **Check RLS policies** if getting permission errors
5. **Verify tables exist** before querying them

### 🐛 Still Stuck?
1. Check all console errors
2. Verify database schema matches docs
3. Ensure Supabase credentials are correct
4. Try disabling RLS temporarily for testing
5. Check if issue is in frontend or backend

---

**Most issues are related to:**
1. ✅ Missing database tables → Run schema SQL
2. ✅ RLS policies blocking queries → Disable for testing
3. ✅ Missing website tables → Use lite integration setup
4. ✅ User not in street_users table → Insert user record
5. ✅ Browser cache → Hard refresh

**Happy debugging!** 🔧
