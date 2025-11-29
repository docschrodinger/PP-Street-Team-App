# Critical Issue #2: Firebase Cloud Messaging (FCM) Push Notifications - Testing & Configuration

## Status: MUST TEST & VERIFY BEFORE LAUNCH

---

## What is FCM?

Firebase Cloud Messaging is Google's service for sending push notifications to iOS apps. The Patron Pass Street Team app uses it to notify users of:
- Mission completions
- Rank-ups
- New leads assigned
- Admin broadcasts

---

## Verification Checklist

### ✅ Step 1: Confirm Firebase Project Setup

**In your Firebase Console (https://console.firebase.google.com):**

1. [ ] Navigate to your Firebase project
2. [ ] Go to **Project Settings** (gear icon, top left)
3. [ ] Click **Cloud Messaging** tab
4. [ ] Verify you see:
   - [ ] **Server API Key** (legacy, but needed for some integrations)
   - [ ] **Sender ID** (numeric ID, e.g., 123456789)
5. [ ] Save these values - you'll need them

### ✅ Step 2: Confirm FCM_SERVER_KEY Secret is Set in Supabase

**In your Supabase Dashboard:**

1. [ ] Go to **Project Settings** (bottom left)
2. [ ] Click **Secrets** tab
3. [ ] Look for `FCM_SERVER_KEY` secret
4. [ ] If it exists, value should start with `"AAAA..."`
5. [ ] If it's missing or empty, add it:
   - Name: `FCM_SERVER_KEY`
   - Value: [Your Firebase Server API Key]
   - Click **Add Secret**

**If the secret was just added, you MUST redeploy your Edge Functions:**

```bash
npx supabase functions deploy send-push-notification --project-ref djsuqvmefbgnmoyfpqhi
```

### ✅ Step 3: Test Sending a Push Notification from the Backend

**Create a test script to send a push notification:**

Run this SQL in your Supabase SQL Editor to test FCM:

```sql
-- Test: Send a push notification via the Edge Function
SELECT
  http_post(
    url := 'https://djsuqvmefbgnmoyfpqhi.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'user_id', '[Test User ID Here]',
      'title', 'Test Notification',
      'message', 'This is a test push notification from the backend'
    )
  ) as response;
```

**Replace:**
- `[Test User ID Here]` with the ID of a test user
- `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key

**Expected result:**
- Status: `200` (success)
- Message: Should appear on the device immediately (if app is open) or in notification center (if app is closed)

### ✅ Step 4: Manual End-to-End Test on Device

**Do this test on a physical iPhone:**

1. **Install the app** on a test iPhone
2. **Log in** with a test user account
3. **Open the app** and wait for push notification permission dialog
4. **Tap "Allow"** to enable notifications
5. **Verify the device token was saved:**
   - In Supabase Dashboard, go to **street_users** table
   - Find the test user
   - Check the `push_token` column
   - Should contain a long string starting with `"ExponentPushToken..."`  or similar FCM token

6. **Send a test notification** from the backend (using the SQL script above)
7. **Verify it appears:**
   - If app is OPEN: Toast notification appears
   - If app is CLOSED: Notification appears in iOS Notification Center
8. **Tap the notification:**
   - App opens
   - User is navigated to the correct screen (if deep link is set)

---

## Troubleshooting

### Issue: Device Token is `NULL` in `street_users`

**Problem:** App didn't successfully capture or save the device token.

**Solution:**
1. Check iOS logs in Xcode: `PushNotifications: Error requesting permissions`
2. Make sure the user denied notification permission - go to **Settings > Patron Pass > Notifications > Allow Notifications** and toggle it ON
3. Reopen the app
4. Device token should now be captured

### Issue: Notification Doesn't Appear

**Problem:** Notification is sent but doesn't show on device.

**Solution:**
1. Check FCM_SERVER_KEY secret is correct
2. Check device token is valid (not null)
3. Check app is not muted (iOS Settings > Notifications > Patron Pass > Allow Notifications)
4. Check notification permission wasn't revoked
5. Test by checking Supabase logs for Edge Function errors:
   - Go to **Functions > send-push-notification > Logs**
   - Look for error messages

### Issue: Notification Appears But Deep Link Doesn't Work

**Problem:** User taps notification but app doesn't navigate.

**Solution:**
1. Check the `deep_link` field in the notification payload
2. Verify the deep link format matches the app's routing (e.g., `lead-details/123`)
3. Check `App.tsx` for the deep link event listener
4. Test with a simple deep link like `dashboard`

### Issue: App Crashes When Receiving Notification

**Problem:** App crashes when a push notification arrives.

**Solution:**
1. Check logs in Xcode for crash reports
2. Likely a JSON parsing error in the notification handler
3. Verify the notification payload structure in `send-push-notification` Edge Function

---

## Push Notification Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PUSH NOTIFICATION FLOW                    │
└─────────────────────────────────────────────────────────────┘

1. USER ACTION
   ┌─────────────────┐
   │ User completes  │
   │ mission in app  │
   └────────┬────────┘
            │
            ▼
2. TRIGGER EVENT
   ┌──────────────────────────────┐
   │ Database trigger fires       │
   │ handle_mission_complete()    │
   └────────┬─────────────────────┘
            │
            ▼
3. BACKEND CALL
   ┌──────────────────────────────┐
   │ Call Edge Function:          │
   │ send-push-notification       │
   └────────┬─────────────────────┘
            │
            ▼
4. FIREBASE FCM
   ┌──────────────────────────────┐
   │ Send to Firebase             │
   │ Use FCM_SERVER_KEY           │
   │ Target device token          │
   └────────┬─────────────────────┘
            │
            ▼
5. iOS RECEIVES
   ┌──────────────────────────────┐
   │ Push arrives on device       │
   │ If app OPEN:                 │
   │   → Toast notification       │
   │ If app CLOSED:               │
   │   → Notification Center      │
   └────────┬─────────────────────┘
            │
            ▼
6. USER TAPS
   ┌──────────────────────────────┐
   │ User taps notification       │
   │ App opens                    │
   │ Deep link navigates user     │
   │ to relevant screen           │
   └──────────────────────────────┘
```

---

## Critical Test Cases

### Test 1: Mission Completion Notification
- [ ] User completes a mission in the app
- [ ] Within 5 seconds, a push notification appears
- [ ] Notification says: "Mission Accomplished! You earned [XP] XP"
- [ ] Tapping notification navigates to Missions screen

### Test 2: Rank-Up Notification
- [ ] User reaches a new rank
- [ ] Push notification appears: "Promotion Alert! You've reached [Rank]"
- [ ] Tapping notification shows rank details

### Test 3: Admin Broadcast Notification
- [ ] HQ Admin sends a message to all users
- [ ] All users receive notification
- [ ] Notification includes admin message text

### Test 4: Notification While App is Closed
- [ ] Close the app completely (swipe up to kill it)
- [ ] Send a test notification from backend
- [ ] Notification appears in iOS Notification Center
- [ ] Tap it to reopen app

---

## Sign-Off Checklist

Before marking this as COMPLETE:

- [ ] Firebase project is created and FCM is enabled
- [ ] FCM_SERVER_KEY is set in Supabase secrets
- [ ] Device token is captured and saved in `street_users.push_token`
- [ ] Test notification can be sent via Edge Function
- [ ] Test notification appears on device (app open and closed)
- [ ] Deep linking from notification works correctly
- [ ] All 4 test cases above pass

---

## What Happens If FCM Doesn't Work?

🚨 **CRITICAL IMPACT:**

- Users won't know when they complete missions or rank up
- Admins can't broadcast important messages
- User engagement drops significantly
- Users feel the app is unresponsive

**This MUST be fully working before launch.**

---

## Next Steps

1. **Today:** Run through the verification checklist
2. **Today:** Send a test notification and verify it works
3. **Before Launch:** Run all 4 test cases
4. **Before Launch:** Get sign-off from QA that notifications work reliably

If you encounter any issues, check the troubleshooting section above or contact Firebase support.
