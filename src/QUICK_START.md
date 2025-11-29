# Quick Start Guide - Patron Pass Street Team

## 🚀 Getting Started in 5 Minutes

### 1. Update Supabase Config
Edit `/utils/supabase/info.tsx`:
```typescript
export const projectId = "your-project-id";
export const publicAnonKey = "your-anon-key";
```

### 2. Create Database Tables
Run this SQL in Supabase SQL Editor:
- Copy all table creation scripts from `/DATABASE_SCHEMA_AND_ARCHITECTURE.md` (section "Complete SQL Schema")
- Execute in your Supabase project

**Optional - Disable RLS for Testing:**
- For quick local testing, run `/DISABLE_RLS_FOR_TESTING.sql` to disable Row Level Security
- ⚠️ **DO NOT do this in production!** Re-enable RLS before deploying

### 3. Create Test User
**Easy Way - Supabase Dashboard:**
1. Go to **Authentication > Users**
2. Click **"Add User"**
3. Enter:
   - Email: `test@patronpass.com`
   - Password: `PatronPass2024!SecureTest#`
   - ✓ Auto Confirm User
4. Click **"Create user"**
5. Copy the **User ID**
6. Go to **SQL Editor** and paste (replace `USER_ID_HERE` with copied ID):

```sql
INSERT INTO street_users (
  id, email, role, full_name, city, instagram_handle,
  phone, status, total_xp, current_rank, preferences
) VALUES (
  'USER_ID_HERE',
  'test@patronpass.com',
  'city_captain',
  'Test Captain',
  'Hudson Valley',
  '@testcaptain',
  '+1-555-0100',
  'active',
  2500,
  'Gold',
  '{"email_notifications": true, "push_notifications": true}'::jsonb
);

INSERT INTO street_contract_acceptances (
  user_id, agreement_version, accepted_at, typed_signature
) VALUES (
  'USER_ID_HERE',
  'v1.0',
  NOW(),
  'Test Captain'
);
```

**OR use the full script:**
- Open `/CREATE_TEST_USER.sql`
- Follow instructions in that file

### 4. Set Up Integration (Recommended)

**If you DON'T have website tables yet:**
- Run `/INTEGRATION_SETUP_LITE.sql` in Supabase SQL Editor
- See guide: `/SETUP_WITHOUT_WEBSITE.md`
- App works perfectly without website integration!

**If you DO have website tables:**
- Run `/INTEGRATION_SETUP.sql` in Supabase SQL Editor
- See guide: `/WEBSITE_INTEGRATION_GUIDE.md`
- Enables full CRM sync and revenue tracking

**Both are 100% safe** - doesn't modify existing data!

### 5. Start the App
The app will automatically initialize the database (seed ranks & missions) on first load.

### 6. Login
- **Email:** `test@patronpass.com`
- **Password:** `PatronPass2024!SecureTest#`

---

## ✅ What to Test

After logging in, try these flows:

1. **Add a Lead**
   - Dashboard → "Add Lead" button
   - Fill in venue details
   - Watch XP toast notification appear

2. **Complete a Street Run**
   - Dashboard → "Start Run" button
   - Enter run details
   - Click "Clock In"
   - Add some leads during the run (optional)
   - End the run → Watch XP increase

3. **Update Lead Status**
   - Go to "Pipeline" tab
   - Tap any lead card
   - Change status from dropdown
   - Watch XP increase for each stage

4. **Check Missions**
   - Go to "Missions" tab
   - See progress update automatically as you add leads/complete runs
   - Claim rewards when missions complete

5. **View Leaderboard**
   - Go to "Leaderboard" tab
   - See rankings by city and globally

6. **Check Earnings**
   - Tap your avatar → "View Earnings"
   - See estimated revenue share based on your rank

7. **Test Rank-Up Modal**
   - Add multiple leads to gain XP
   - When you hit a rank threshold, enjoy the confetti celebration! 🎉

8. **Test Website Sync** (if integration enabled)
   - Move a lead to "Signed Pending" or "Live" status
   - Check `website_partnership_inquiries` table in Supabase
   - Verify the lead was auto-synced

---

## 🐛 Troubleshooting

### "Row violates row-level security policy"
- Make sure you've set up RLS policies (see `/DATABASE_SCHEMA_AND_ARCHITECTURE.md` - RLS section)
- For testing, you can temporarily disable RLS on tables

### "Test user already exists"
- That's fine! Just login with the credentials above

### "Table doesn't exist"
- Run the table creation SQL from `/DATABASE_SCHEMA_AND_ARCHITECTURE.md`

### "No ranks showing"
- The app auto-seeds ranks on first load
- Or run `initializeDatabase()` in browser console

---

## 📚 Full Documentation

- **Database Schema:** `/DATABASE_SCHEMA_AND_ARCHITECTURE.md`
- **Website Integration:** `/WEBSITE_INTEGRATION_GUIDE.md`
- **Integration Setup SQL:** `/INTEGRATION_SETUP.sql`
- **Implementation Notes:** `/STREET_TEAM_IMPLEMENTATION_NOTES.md`
- **Create Test User:** `/CREATE_TEST_USER.sql`

---

## 🎯 Next Steps

Once you've tested the app:

1. **Connect to Production Supabase** - Update credentials
2. **Set up RLS Policies** - Secure your data
3. **Run Integration Setup** - Connect with main website
4. **Create Real Users** - Remove test user, use application flow
5. **Access HQ Admin Dashboard** - `/components/HQAdminDashboard.tsx`
6. **Deploy** - Push to production

---

**Need Help?** Check the full docs or ask questions!
