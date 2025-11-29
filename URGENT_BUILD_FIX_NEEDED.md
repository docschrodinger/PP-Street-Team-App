# URGENT: Build Failures Due to File Corruption - Need Lovable to Fix

**Status:** Build failing due to corrupted/mixed-up source files

**Errors:**
1. `src/components/LeaderboardScreen.tsx` - Missing export declaration
2. Multiple components have wrong content mixed in
3. `xpService.ts` was overwritten with App.tsx code (already fixed)

---

## What Happened

During code modifications, some files got corrupted with mixed content from other files. The build now fails.

---

## URGENT TASK FOR LOVABLE

**Fix the following files that are corrupted:**

1. **src/components/LeaderboardScreen.tsx**
   - Must export `export function LeaderboardScreen()` component
   - File should contain the leaderboard UI with real-time subscription
   - Currently: Missing proper export

2. **src/App.tsx**
   - Verify it's the main App component
   - Must export the default App function
   - Currently: Status unknown (possible corruption)

3. **Verify all other component files**
   - Dashboard.tsx ✓ (appears OK)
   - ProfileScreen.tsx ✓ (appears OK)
   - EarningsScreen.tsx ✓ (appears OK - updated to use earningsConfigService)

---

## How to Verify & Fix

1. **For each file**, check:
   - Does it have the correct `export` statement?
   - Does it contain code from a different component?

2. **If corrupted:**
   - Restore the file from a backup (if available)
   - Or recreate it with proper exports and imports

3. **Test build:**
   - Run `npm run build`
   - If successful, you'll see `✓ Built successfully`

---

## Quick Test

After fixing, run:
```bash
cd "/Users/thecaptain/Desktop/Patron Pass Street Team App (1)"
npm run build
```

If it succeeds, the app is ready to sync to iOS.

---

**Priority:** HIGH - Build is currently broken. Need this fixed before proceeding with iOS build.
