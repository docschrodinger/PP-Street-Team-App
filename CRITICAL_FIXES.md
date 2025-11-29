# 🔧 CRITICAL FIXES – EXACT CODE CHANGES NEEDED

## FIX #1: vite.config.ts – Add base Path

**File:** `/Users/thecaptain/Desktop/Patron Pass Street Team App (1)/vite.config.ts`

**What to change:**
Around line 50-55, find:
```typescript
    build: {
      target: 'esnext',
      outDir: 'build',
    },
```

**Replace with:**
```typescript
    build: {
      target: 'esnext',
      outDir: 'build',
      base: "./",
    },
```

**Why:** Makes asset paths relative instead of absolute. Without this, CSS and JS files won't load inside the iOS webview.

---

## FIX #2: Info.plist – Add Camera Permission

**File:** `ios/App/App/Info.plist`

**Find the closing `</dict>` tag** at the very end of the file (around line 70).

**Add these lines BEFORE `</dict>`:**

```xml
	<key>NSCameraUsageDescription</key>
	<string>Take photos of venues and patron interactions during street team activities to document engagement and track your progress.</string>
	<key>NSPhotoLibraryUsageDescription</key>
	<string>Select and upload photos from your library to document street team activities and patron events.</string>
```

**Result:** Info.plist should end with:
```xml
	<key>NSPhotoLibraryUsageDescription</key>
	<string>Select and upload photos from your library...</string>
</dict>
</plist>
```

**Why:** App uses camera in code, so iOS requires explicit permission descriptions.

---

## FIX #3: App Icons – Complete Icon Set

### Quick Version (Using Online Tool)

1. Go to **[IconKitchen](https://www.iconkitchen.app/)**
2. Upload your current `AppIcon-512@2x.png` (the one in Assets.xcassets)
3. Download the iOS app icon set
4. You'll get a zip file with all sizes
5. In Xcode, select `Assets.xcassets` → `AppIcon.appiconset`
6. Delete all files in that folder
7. Copy/paste the new files from the downloaded zip
8. Copy the new `Contents.json` file
9. Paste into `AppIcon.appiconset` folder

### Verify in Xcode:
- Open Xcode
- Select **App** target → **Assets**
- Click **AppIcon**
- Should see a filled grid with all sizes (not empty boxes)

**Why:** App Store requires multiple icon sizes for different devices.

---

## FIX #4: SettingsScreen.tsx – Link Privacy Policy & Terms

**File:** `src/components/SettingsScreen.tsx`

**At the top of the file, add this import:**
```typescript
import { Browser } from '@capacitor/browser';
```

**Then, find these empty button definitions** (around line 250-290):

```typescript
<button className="w-full p-4 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors text-left">
  <div className="flex items-center justify-between">
    <span className="text-[#F6F2EE]">Privacy Policy</span>
    <ExternalLink className="w-4 h-4 text-[#A0A0A0]" />
  </div>
</button>

<button className="w-full p-4 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors text-left">
  <div className="flex items-center justify-between">
    <span className="text-[#F6F2EE]">Terms of Service</span>
    <ExternalLink className="w-4 h-4 text-[#A0A0A0]" />
  </div>
</button>
```

**Add these functions before the `return (` statement:**

```typescript
async function openPrivacyPolicy() {
  try {
    await Browser.open({ url: 'https://patronpass.com/privacy' });
  } catch {
    window.open('https://patronpass.com/privacy', '_blank');
  }
}

async function openTermsOfService() {
  try {
    await Browser.open({ url: 'https://patronpass.com/terms' });
  } catch {
    window.open('https://patronpass.com/terms', '_blank');
  }
}

async function openHelpSupport() {
  try {
    await Browser.open({ url: 'https://patronpass.com/support' });
  } catch {
    window.open('https://patronpass.com/support', '_blank');
  }
}

async function openContactUs() {
  const email = 'support@patronpass.com';
  window.location.href = `mailto:${email}`;
}
```

**Replace the empty buttons with:**

```typescript
<button 
  onClick={openPrivacyPolicy}
  className="w-full p-4 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors text-left"
>
  <div className="flex items-center justify-between">
    <span className="text-[#F6F2EE]">Privacy Policy</span>
    <ExternalLink className="w-4 h-4 text-[#A0A0A0]" />
  </div>
</button>

<button 
  onClick={openTermsOfService}
  className="w-full p-4 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors text-left"
>
  <div className="flex items-center justify-between">
    <span className="text-[#F6F2EE]">Terms of Service</span>
    <ExternalLink className="w-4 h-4 text-[#A0A0A0]" />
  </div>
</button>

<button 
  onClick={openHelpSupport}
  className="w-full p-4 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors text-left"
>
  <div className="flex items-center justify-between">
    <span className="text-[#F6F2EE]">Help & Support</span>
    <ExternalLink className="w-4 h-4 text-[#A0A0A0]" />
  </div>
</button>

<button 
  onClick={openContactUs}
  className="w-full p-4 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors text-left"
>
  <div className="flex items-center justify-between">
    <span className="text-[#F6F2EE]">Contact Us</span>
    <Mail className="w-4 h-4 text-[#A0A0A0]" />
  </div>
</button>
```

**Why:** App Store requires working links to Privacy Policy and Terms.

---

## FIX #5: Create Privacy Policy & Terms Documents

### Step 1: Create Privacy Policy

**Option A (Free – Google Docs):**
1. Go to [Google Docs](https://docs.google.com)
2. Create new document
3. Copy this template and customize:

```
PRIVACY POLICY
Last Updated: November 2025

1. INTRODUCTION
Patron Pass Street Team App ("App") is committed to protecting your privacy.
This Privacy Policy explains what information we collect and how we use it.

2. INFORMATION WE COLLECT
We collect the following information when you use the App:
- Email address and name (for account creation)
- Phone number (for contact)
- City/location (for team assignments)
- Photos of venues (for activity documentation)
- Contract signatures (for legal compliance)
- Device identifiers (for security)

3. HOW WE USE YOUR INFORMATION
We use this information to:
- Create and manage your account
- Assign you to street team runs and cities
- Track leads and venue visits
- Calculate rankings and compensation
- Send you important updates
- Comply with legal requirements

4. DATA SHARING
We do NOT share your personal data with third parties, except:
- Service providers (Supabase for data storage)
- Legal authorities if required by law
- Your data is not sold or used for marketing

5. DATA RETENTION
- Account data: Retained while you're active + 7 years (for legal/tax)
- Photos: Retained for 2 years
- Payment records: Retained for 7 years

6. YOUR RIGHTS
You have the right to:
- Access your data
- Request deletion of your account (30-day process)
- Opt out of notifications
- Receive a copy of your data

7. SECURITY
We protect your data with:
- Encrypted transmission (HTTPS)
- Secure database storage
- Limited access controls

8. CONTACT US
Questions about privacy?
Email: privacy@patronpass.com

--- END OF PRIVACY POLICY ---
```

**Option B (Paid – Faster):**
- Use [Termly](https://termly.io/) ($12/month) - generates both Privacy Policy + Terms
- Use [iubenda](https://www.iubenda.com/) ($20/year) - covers privacy regulations

### Step 2: Create Terms of Service

```
TERMS OF SERVICE
Last Updated: November 2025

1. AGREEMENT
By using the Patron Pass Street Team App, you agree to these Terms of Service.

2. USE LICENSE
You are granted a limited, non-exclusive, non-transferable license to use 
the App for street team activities only. You may not:
- Reverse engineer the App
- Copy or modify the code
- Use it for unauthorized purposes
- Share your account with others

3. INDEPENDENT CONTRACTOR
By using the App, you understand you are an independent contractor, not 
an employee. Compensation is based on completed activities as outlined 
in the Independent Contractor Agreement.

4. PAYMENT TERMS
- Compensation is calculated based on activities logged in the App
- Payments are made monthly (net 30 days)
- Subject to venue payment receipt and contractual conditions

5. LIMITATION OF LIABILITY
We are not liable for:
- Loss of data or income
- App downtime or technical issues
- Any indirect or consequential damages
Maximum liability: Amount paid in last 30 days

6. DISPUTE RESOLUTION
Any disputes will be resolved through:
1. Good faith negotiation
2. Mediation if negotiation fails
3. Binding arbitration if mediation fails

7. MODIFICATIONS
We may modify these terms at any time. Continued use of the App 
constitutes acceptance of modifications.

8. CONTACT
Questions about these terms?
Email: legal@patronpass.com

--- END OF TERMS OF SERVICE ---
```

### Step 3: Host the Documents

**Option A (Google Sites – Free):**
1. Go to [Google Sites](https://sites.google.com)
2. Create new site
3. Add pages for "Privacy Policy" and "Terms of Service"
4. Copy/paste the content from above
5. Get shareable links
6. Use those links in the app

**Option B (Notion – Free):**
1. Create public Notion pages
2. Share links publicly
3. Use those URLs in the app

**Option C (GitHub Pages – Free):**
1. Create repo: `patronpass.com` or similar
2. Add markdown files: `privacy.md`, `terms.md`
3. Enable GitHub Pages
4. Links will be: `https://yourname.github.io/privacy.md`

### Step 4: Update URLs in App

Change the hardcoded URLs in SettingsScreen.tsx to match:

```typescript
async function openPrivacyPolicy() {
  try {
    await Browser.open({ url: 'https://your-domain.com/privacy' }); // ← Update this
  } catch {
    window.open('https://your-domain.com/privacy', '_blank');
  }
}
```

**Why:** App Store requires these URLs and will reject if they're broken or point to placeholder pages.

---

## FIX #6: Build Number Increment

**When to do this:** Right before uploading to TestFlight or App Store

**In Xcode:**
1. Select **App** target (left sidebar)
2. Open **Build Settings**
3. Search for "Current Project Version"
4. Change value from `1` to `2` (then `3`, `4`, etc. for future builds)
5. Build and upload

**Why:** Apple rejects builds with duplicate build numbers.

---

## VERIFICATION STEPS

After making these fixes, run:

```bash
# Build the web app
npm run build

# Sync to iOS
cap sync ios

# Try building in Xcode (Cmd + B)
# Should complete without errors
```

**In iOS app, verify:**
1. App launches and shows content (not blank screen)
2. Can navigate all screens
3. Camera permission prompt appears with your custom text
4. Privacy Policy button opens to your policy document
5. Terms button opens to your terms document
6. No console errors in Xcode

---

## TIMELINE

| Task | Duration | Priority |
|------|----------|----------|
| Fix vite.config.ts | 5 min | 🔴 Critical |
| Add Info.plist keys | 5 min | 🔴 Critical |
| Generate app icons | 20 min | 🔴 Critical |
| Create privacy policy | 30 min | 🔴 Critical |
| Update SettingsScreen | 15 min | 🔴 Critical |
| Test build | 10 min | 🟡 High |
| Upload to TestFlight | 15 min | 🟡 High |
| **Total** | **~1.5 hours** | |

---

## QUESTIONS?

If you get stuck on any of these, look for:
- `vite.config.ts` in project root
- `Info.plist` in `ios/App/App/`
- `SettingsScreen.tsx` in `src/components/`
- `AppIcon.appiconset` in `ios/App/App/Assets.xcassets/`

All paths are relative to the project root: `/Users/thecaptain/Desktop/Patron Pass Street Team App (1)/`
