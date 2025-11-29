# CRITICAL ISSUES - QUICK REFERENCE CARD

**Print this and keep it handy while fixing the issues.**

---

## Critical Issue #1: RLS Policies
**Priority:** 🔴 CRITICAL - Must fix before ANY users access the app

**What:** Ensure Row-Level Security is enabled and configured  
**Where:** Supabase Dashboard → Database → Tables (toggle RLS ON)  
**Action:** 
1. Read: `CRITICAL_ISSUE_1_RLS_VERIFICATION.md`
2. Run SQL script in Supabase SQL Editor
3. Execute verification query
4. Test 3 manual test cases

**How to Know It Works:**
- User A cannot see User B's leads (query returns 0 rows)
- User A can see own leads (query returns their leads)
- HQ Admin can see all leads (query returns everything)

**Expected Time:** 30 minutes

---

## Critical Issue #2: FCM Push Notifications
**Priority:** 🔴 CRITICAL - Must work before launch

**What:** Test Firebase Cloud Messaging integration  
**Where:** Firebase Console + Supabase  
**Action:**
1. Read: `CRITICAL_ISSUE_2_FCM_TESTING.md`
2. Verify Firebase project and FCM_SERVER_KEY
3. Send test notification
4. Verify it appears on device (app open and closed)

**How to Know It Works:**
- Device token is saved in `street_users.push_token`
- Test notification appears within 5 seconds
- Tapping notification navigates to correct screen

**Expected Time:** 1-2 hours (including device testing)

---

## Critical Issue #3: Earnings Configuration
**Priority:** 🔴 CRITICAL - Must be database-driven

**What:** Move earnings from hardcoded to database-driven config  
**Where:** Supabase + `earningsConfigService.ts` (NEW FILE CREATED ✅)  
**Action:**
1. Read: `CRITICAL_ISSUE_3_EARNINGS_CONFIG.md`
2. Run SQL to create `street_earnings_config` table
3. Test in app (change database values, refresh app)

**How to Know It Works:**
- Change `monthly_platform_fee_per_venue` in database
- App Earnings screen shows new estimated values
- Commission rates update when changed

**Expected Time:** 30 minutes

---

## Files You Need

| File | Purpose | Action |
|------|---------|--------|
| `CRITICAL_ISSUE_1_RLS_VERIFICATION.md` | RLS documentation + SQL script | Read & Execute |
| `CRITICAL_ISSUE_2_FCM_TESTING.md` | FCM testing guide | Read & Test |
| `CRITICAL_ISSUE_3_EARNINGS_CONFIG.md` | Earnings config documentation + SQL | Read & Execute |
| `src/lib/earningsConfigService.ts` | New service file (CREATED) | Already done ✅ |
| `src/components/EarningsScreen.tsx` | Updated to use config service | Already updated ✅ |
| `CRITICAL_ISSUES_RESOLUTION_SUMMARY.md` | Overview of all 3 issues | Read for reference |

---

## SQL Commands Quick Copy-Paste

### Issue #1: RLS SQL
```sql
-- Go to CRITICAL_ISSUE_1_RLS_VERIFICATION.md
-- Copy entire SQL script and paste into Supabase SQL Editor
-- Then run verification query at the end
```

### Issue #2: FCM Test
```sql
-- Use the test SQL in CRITICAL_ISSUE_2_FCM_TESTING.md
-- Replace [Test User ID] and [ANON KEY] with your values
```

### Issue #3: Earnings Config
```sql
-- Go to CRITICAL_ISSUE_3_EARNINGS_CONFIG.md
-- Copy entire SQL script and paste into Supabase SQL Editor
```

---

## Testing Checklist

### RLS Verification
- [ ] RLS enabled on all street_* tables
- [ ] User A cannot query User B's data
- [ ] User A can query own data
- [ ] Admin can query all data

### FCM Testing
- [ ] Device token saved in database
- [ ] Test notification sent successfully
- [ ] Notification appears on device (app open)
- [ ] Notification appears in notification center (app closed)
- [ ] Tapping notification navigates correctly

### Earnings Config
- [ ] Table created in Supabase
- [ ] Default values inserted
- [ ] App shows earnings estimates
- [ ] Change platform fee in database → app updates
- [ ] Change commission rate → app updates

---

## If Something Doesn't Work

| Problem | Solution |
|---------|----------|
| SQL script won't run | Check syntax, ensure you're in correct database |
| RLS test fails | Double-check policy is created, RLS is ON |
| FCM token is NULL | User rejected notification permission, enable in Settings |
| Push notification doesn't appear | Check FCM_SERVER_KEY is set, test notification may not have correct format |
| Earnings estimates don't change | Clear app cache, hard reload, or wait 5 minutes for config cache to refresh |

---

## Critical Timeline

| When | What |
|------|------|
| TODAY | Fix all 3 critical issues |
| TOMORROW | Test end-to-end on physical device |
| BEFORE LAUNCH | Get final QA sign-off |
| LAUNCH | Deploy to App Store with confidence 🚀 |

---

## Success Criteria

✅ All RLS policies applied and tested  
✅ Push notifications work (open app and closed app)  
✅ Earnings configuration can be updated via database  
✅ All manual test cases pass  
✅ QA sign-off obtained  

**When all 3 are done, you're ready to launch!**

---

**Print this card and keep it next to your computer while fixing the issues.**
