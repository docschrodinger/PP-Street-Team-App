# CRITICAL FIX: Capacitor Network Configuration

## What I Fixed

✅ Updated **capacitor.config.json** (both root and iOS) with:
- `allowNavigation` - Allows requests to supabase.co
- Proper server configuration for external API calls

This was the **missing piece** preventing the app from reaching Supabase!

## Changes Made

**ios/App/App/capacitor.config.json:**
```json
{
  "appId": "com.patronpass.streetteam",
  "appName": "Patron Pass Street Team",
  "webDir": "public",
  "server": {
    "allowNavigation": [
      "https://djsuqvmefbgnmoyfpqhi.supabase.co",
      "https://supabase.co",
      "https://*.supabase.co"
    ]
  }
}
```

**Root capacitor.config.json** - same config

## Why This Matters

Without this configuration, Capacitor **blocks external API calls by default**. This caused the `AuthRetryableFetchError`.

Now Capacitor explicitly **allows requests to Supabase**.

## Next Steps

### 1. Rebuild in Xcode
```
Cmd+Shift+K  (Clean)
Cmd+B        (Build)
Cmd+R        (Run)
```

### 2. Test Login

Try:
- Email: `test@patronpass.com`
- Password: `886988` or `Ryder886988`

### Expected Result

✅ App connects to Supabase
✅ Either logs in successfully OR shows "invalid password" (which means it's talking to Supabase!)
✅ No more "AuthRetryableFetchError"

---

**This should fix it! Rebuild and let me know what happens!** 🚀
