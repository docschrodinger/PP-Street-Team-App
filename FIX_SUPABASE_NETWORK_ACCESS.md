# Fix: AuthRetryableFetchError - Supabase Network Access

## Problem

The app loaded but couldn't reach Supabase. Error:
```
AuthRetryableFetchError (status: 0)
```

This happens when the iOS app is blocked from making network requests to Supabase.

## Solution Applied

✅ **Added ATS (App Transport Security) configuration** to `Info.plist`

This allows the app to connect to `supabase.co` domain over HTTPS.

## Next Steps

### 1. Rebuild in Xcode
```
Cmd+Shift+K  (Clean Build Folder)
Cmd+B        (Build)
Cmd+R        (Run on iPhone)
```

### 2. Test Login
The app should now be able to connect to Supabase!

Try logging in with:
- Email: `test@patronpass.com`
- Password: `886988` or `Ryder886988`

## What Was Added

In `Info.plist`, added:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSExceptionDomains</key>
  <dict>
    <key>supabase.co</key>
    <dict>
      <key>NSIncludesSubdomains</key>
      <true/>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <false/>
      <key>NSExceptionMinimumTLSVersion</key>
      <string>TLSv1.2</string>
    </dict>
  </dict>
</dict>
```

This tells iOS to trust supabase.co and allow network connections to it.

## Expected Result

✅ App loads without errors
✅ Can reach Supabase
✅ Login should work
✅ App should show main dashboard
