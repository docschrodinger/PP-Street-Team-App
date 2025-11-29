# Setup Guide (Without Website Tables)

## 🎯 Quick Setup - Street Team App Only

If you're getting **"relation does not exist"** errors when running the integration SQL, it means your Supabase project doesn't have the website tables yet. **That's totally fine!**

The Street Team app works perfectly on its own. The website integration is optional and can be added later.

---

## ✅ Run This Instead

### Step 1: Run the Lite Integration Setup

1. Open `/INTEGRATION_SETUP_LITE.sql` in your code editor
2. Copy the entire contents
3. Open Supabase Dashboard → SQL Editor
4. Paste and click **"Run"**

**What this does:**
- ✅ Adds integration columns to `street_venue_leads` (for future use)
- ✅ Creates performance indexes
- ✅ Creates a "lite" unified view (street team data only)
- ✅ Creates a placeholder sync trigger (activates when website tables exist)
- ✅ **100% safe** - doesn't require any website tables

**Expected output:**
```
✓ Added website_inquiry_id column
✓ Added patron_pass_business_id column
✓ Added actual_monthly_revenue column
✓ Added billing_subscription_id column
✓ Created performance indexes
✓ Created sync trigger (will activate when website tables exist)
✓ Created unified leads view (lite version)

=== SETUP COMPLETE ===
Integration columns are ready!
Your app will work normally without website tables.
```

---

### Step 2: Test It

Run the test queries at the bottom of the SQL script:

```sql
-- Test 1: View integration columns
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

**Expected:** 4 rows returned ✓

```sql
-- Test 2: View unified leads (should show all street team leads)
SELECT 
  street_lead_id,
  venue_name,
  agent_name,
  agent_rank,
  street_status,
  estimated_monthly_revenue
FROM hq_unified_leads_lite
LIMIT 10;
```

**Expected:** Your street team leads ✓

---

### Step 3: Use the App

Your app is now ready! All features work:

- ✅ Add leads and track pipeline
- ✅ Complete street runs
- ✅ Earn XP and rank up (with confetti! 🎉)
- ✅ View earnings and leaderboard
- ✅ Complete missions
- ✅ HQ Admin Dashboard (shows street team data)

**Website sync features will:**
- Not throw errors
- Gracefully skip sync (with console log: "Skipping website sync - tables not set up")
- Still track all data locally
- Activate automatically when website tables are added later

---

## 🔧 What Changed in the Code

The app now uses **`integrationServiceSafe.ts`** instead of `integrationService.ts`.

This safe version:
- ✅ Checks if website tables exist before accessing them
- ✅ Returns gracefully if tables are missing
- ✅ Caches the check for 5 minutes (performance)
- ✅ Logs helpful messages to console
- ✅ Activates full sync automatically when tables are added

**Files updated:**
- `/components/LeadDetailsScreen.tsx` - Uses safe sync
- `/components/HQAdminDashboard.tsx` - Uses safe queries

---

## 📊 What You Get

### Current Features (No Website Tables Needed)
- 🎊 **Rank-up celebration modal** with confetti
- 📊 **Full street team app** (leads, pipeline, XP, missions)
- 🎯 **HQ Admin Dashboard** (street team data only)
- 💰 **Earnings tracking** (estimated revenue)
- 🏆 **Leaderboards** by city and global
- 📈 **Performance metrics**

### Future Features (When Website Tables Added)
- 🔗 **Auto-sync to website CRM**
- 💵 **Real revenue from billing**
- 🔐 **SSO between systems**
- 🎛️ **Full unified dashboard**

---

## 🚀 When You're Ready to Add Website Integration

Once your main Patron Pass website is deployed and has these tables:
- `website_partnership_inquiries`
- `website_businesses`
- `website_business_subscriptions`
- `website_users`

Then you can:

1. **Verify tables exist:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name LIKE 'website_%'
   ORDER BY table_name;
   ```

2. **Run full integration setup:**
   - Open `/INTEGRATION_SETUP.sql`
   - Copy and run in Supabase SQL Editor
   - This upgrades the lite version to full integration

3. **Test sync:**
   - Move a lead to "Live" status
   - Check `website_partnership_inquiries` table
   - Should see new inquiry with `source = 'street_team'`

4. **Switch to full integration service (optional):**
   - The safe version will automatically detect and use website tables
   - Or manually change imports back to `integrationService.ts` if desired

---

## 🐛 Troubleshooting

### "Cannot read property of undefined"

**Cause:** Code trying to access website table data

**Fix:** Make sure you're using the safe integration service:
```typescript
// ✅ Good
import { syncLeadToWebsiteCRM } from '../lib/integrationServiceSafe';

// ❌ Bad (will error if no website tables)
import { syncLeadToWebsiteCRM } from '../lib/integrationService';
```

---

### Sync not working after adding website tables

**Fix:** Clear the cache or wait 5 minutes for it to refresh automatically.

Or force refresh:
```typescript
// In browser console
localStorage.clear();
location.reload();
```

---

### HQ Dashboard shows no data

**Fix:** Make sure you have:
1. Created street team leads
2. User has `hq_admin` role
3. Run the lite integration SQL

Check in SQL:
```sql
-- Check if view exists
SELECT * FROM hq_unified_leads_lite LIMIT 5;

-- Check user role
SELECT role FROM street_users WHERE email = 'your-email@example.com';
```

---

## ✨ Summary

You just set up the Street Team app to work **independently** without requiring website tables.

**What works now:**
- ✅ Full street team functionality
- ✅ Rank-up celebrations with confetti
- ✅ HQ admin dashboard (street data)
- ✅ All core features

**What will activate automatically later:**
- 🔜 Website CRM sync
- 🔜 Real revenue tracking
- 🔜 Unified auth
- 🔜 Full admin dashboard

**Your app is production-ready!** 🚀

When you're ready to connect it to your main website, just run the full integration setup and everything will sync automatically.

---

## 📞 Need Help?

- **Setup issues:** Check `/QUICK_START.md`
- **Database errors:** Verify all street_* tables exist
- **Feature requests:** See `/WHATS_NEW.md` for roadmap

**Questions?** Check the console logs - the safe integration service provides helpful messages about what's happening.
