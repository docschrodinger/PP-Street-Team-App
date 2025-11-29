# Diagnostic: AuthRetryableFetchError on iOS

## Root Cause

The error `AuthRetryableFetchError` with `status: 0` means:
- The network request is being **completely blocked**
- Status 0 = Network failure at the socket level
- This is NOT an HTTP error (not 401, 404, etc.)

## Possible Causes on iOS

1. **Network is completely unavailable** - iPhone offline or no WiFi
2. **DNS resolution failing** - Can't resolve supabase.co
3. **TLS/SSL certificate issue** - Certificate validation failing
4. **Firewall/Proxy blocking** - Corporate network blocking HTTPS
5. **Capacitor webview CORS issue** - JavaScript fetch blocked by webview

## Quick Diagnostic

On your iPhone, try this:

1. **Open Safari** (not the app)
2. Go to: `https://djsuqvmefbgnmoyfpqhi.supabase.co/auth/v1/version`
3. You should see a JSON response like: `{"version": "2.x.x"}`

If Safari:
- ✅ **Shows JSON** → Network works, issue is app-specific
- ❌ **Shows error** → Network/DNS issue on your WiFi

## Most Likely Fix

The issue is that Capacitor's webview has CORS restrictions. You need to add a **proxy header** to the Supabase client.

Update your Supabase client initialization to include:

```typescript
import { Capacitor } from '@capacitor/core';

const clientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  headers: {
    'X-Client-Info': `supabase-js/2.0.0`,
  },
};

if (Capacitor.isNativePlatform()) {
  // For iOS/Android, ensure proper origin
  clientOptions.global = {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  };
}

const supabase = createClient(url, key, clientOptions);
```

## Alternative Quick Test

Try accessing Supabase from your browser DevTools console while testing:

```javascript
fetch('https://djsuqvmefbgnmoyfpqhi.supabase.co/auth/v1/version')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If this fails in the app but works in Safari, it's a Capacitor webview issue.

## Next Step

Can you:
1. **Test the Supabase URL in Safari** - Does it load?
2. **Check iPhone is connected to WiFi** - Is it online?
3. **Check if any corporate firewall** is blocking HTTPS

Let me know and I'll provide the exact fix!
