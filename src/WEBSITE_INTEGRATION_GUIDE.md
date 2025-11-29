# Patron Pass Website Integration Guide

## 🔗 Overview

This guide explains how the **Street Team app** integrates with your main **Patron Pass website** at `https://patron-pass.vercel.app/`.

The integration is **100% safe and non-destructive** to your existing website tables. It only reads from website tables and writes to new `street_*` tables.

---

## 📊 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  EXISTING WEBSITE TABLES (Read-Only from Street Team)      │
│  ├── website_partnership_inquiries                         │
│  ├── website_businesses                                    │
│  ├── website_business_subscriptions                        │
│  └── website_users                                         │
│                                                             │
│  STREET TEAM TABLES (Read/Write)                           │
│  ├── street_users                                          │
│  ├── street_venue_leads ─┐                                 │
│  ├── street_runs         │                                 │
│  └── street_xp_events    │                                 │
│                          │                                 │
│  INTEGRATION COLUMNS:    │                                 │
│  ├── website_inquiry_id ─┴─► links to website CRM         │
│  ├── patron_pass_business_id ─► links to business account │
│  ├── actual_monthly_revenue ─► real billing amount        │
│  └── billing_subscription_id ─► active subscription       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup Instructions

### Step 1: Run Integration SQL

In your Supabase SQL Editor, run the script at `/INTEGRATION_SETUP.sql`:

```bash
# This adds:
# - Integration columns to street_venue_leads
# - Optional columns to website_partnership_inquiries
# - Unified view (hq_unified_leads)
# - Auto-sync trigger
```

**What it does:**
- ✅ Adds 4 new columns to `street_venue_leads`
- ✅ Optionally adds 2 columns to `website_partnership_inquiries` (if they don't exist)
- ✅ Creates read-only views for HQ admins
- ✅ Sets up auto-sync trigger when leads go live

**What it DOESN'T do:**
- ❌ Never modifies existing website data
- ❌ Never deletes anything
- ❌ Never changes RLS policies on website tables

---

## 🔄 Sync Points

### 1. Lead CRM Sync

**How it works:**
- When a street team agent moves a lead to **"Signed Pending"** or **"Live"** status
- The app automatically creates/updates a record in `website_partnership_inquiries`
- The inquiry is marked with `source: 'street_team'` for tracking

**Code location:** `/lib/integrationService.ts` → `syncLeadToWebsiteCRM()`

**Triggered by:**
- `/components/LeadDetailsScreen.tsx` → Status change to signed/live
- Database trigger → `sync_lead_to_website()` function

**Example:**
```typescript
import { syncLeadToWebsiteCRM } from '@/lib/integrationService';

// Automatically called when lead status changes
const result = await syncLeadToWebsiteCRM(lead);

if (result.success) {
  console.log('Lead synced to website CRM!');
  console.log('Website inquiry ID:', result.websiteInquiryId);
}
```

**Data mapped:**
```
Street Team Lead → Website Inquiry
─────────────────────────────────
venue_name       → venue_name
contact_name     → contact_name
contact_role     → contact_role
email            → email
phone            → phone
city             → city
state            → state
status           → status ('active' or 'pending_activation')
user_id          → street_team_agent_id
id               → street_team_lead_id
```

---

### 2. Revenue Tracking

**How it works:**
- Street team uses estimated $150/month per venue
- Once a venue activates, link it to the actual billing subscription
- Commission calculations use real revenue instead of estimates

**Code location:** `/lib/integrationService.ts` → `linkLeadToRevenue()` & `getAccurateEarnings()`

**Example:**
```typescript
import { getAccurateEarnings } from '@/lib/integrationService';

const earnings = await getAccurateEarnings(userId, commissionRate);

console.log('Estimated:', earnings.estimatedMonthly);  // Based on $150
console.log('Actual:', earnings.actualMonthly);        // Based on real billing
console.log('Live venues:', earnings.liveVenues);
console.log('With billing data:', earnings.venuesWithBilling);
```

**Linking process:**
1. Street lead goes "live"
2. HQ admin creates actual business account in website
3. HQ admin links: `street_venue_leads.patron_pass_business_id = business.id`
4. System auto-fetches billing subscription amount
5. Earnings calculations now use real revenue

---

### 3. SSO / Unified Auth

**How it works:**
- Users can have accounts in both systems (street team + website)
- Same Supabase Auth user ID links both profiles
- Check access with `checkUnifiedAccess()`

**Code location:** `/lib/integrationService.ts` → `checkUnifiedAccess()`

**Example:**
```typescript
import { checkUnifiedAccess } from '@/lib/integrationService';

const access = await checkUnifiedAccess(userId);

if (access.hasStreetTeamAccess) {
  console.log('User is a street team member');
}

if (access.hasWebsiteAccess) {
  console.log('User also has website account');
}

console.log('All roles:', access.roles);
// Example: ['street_city_captain', 'website_business_owner']
```

**Use cases:**
- Street team agent becomes a business owner
- HQ admin manages both systems
- Cross-platform activity tracking

---

### 4. Admin Dashboard

**Component:** `/components/HQAdminDashboard.tsx`

**Features:**
- ✅ View all leads across all agents
- ✅ Filter by city, status, agent
- ✅ See pending applications
- ✅ Bulk sync leads to website CRM
- ✅ Performance metrics (conversion rate, revenue, etc.)
- ✅ Agent leaderboards

**HQ Admin Functions:**
```typescript
import {
  getPendingApplications,
  getAllLeadsForHQ,
  getPerformanceMetrics,
  bulkSyncLeadsToWebsite
} from '@/lib/integrationService';

// Get pending applications
const { applications, count } = await getPendingApplications();

// Get all leads with filters
const { leads } = await getAllLeadsForHQ({
  city: 'Hudson Valley',
  status: 'live',
  agentId: 'user-id-here'
});

// Get performance metrics
const metrics = await getPerformanceMetrics('month');
console.log('Conversion rate:', metrics.averageConversionRate);

// Bulk sync to website
const result = await bulkSyncLeadsToWebsite();
console.log('Synced:', result.syncedCount);
```

---

## 📋 Database Schema Changes

### New Columns in `street_venue_leads`

```sql
-- Links to website CRM
website_inquiry_id UUID REFERENCES website_partnership_inquiries(id)

-- Links to actual business account
patron_pass_business_id UUID REFERENCES website_businesses(id)

-- Real revenue from billing
actual_monthly_revenue DECIMAL(10,2)

-- Active subscription
billing_subscription_id UUID REFERENCES website_business_subscriptions(id)
```

### New Columns in `website_partnership_inquiries` (Optional)

```sql
-- Links back to street team lead
street_team_lead_id UUID REFERENCES street_venue_leads(id)

-- Street team agent who brought the lead
street_team_agent_id UUID REFERENCES street_users(id)
```

---

## 🎯 Workflows

### Workflow 1: New Lead → Live Venue → Accurate Earnings

```
1. Agent adds lead in Street Team app
   └─ Creates record in street_venue_leads

2. Agent progresses lead through pipeline
   └─ new → contacted → follow_up → demo → verbal_yes

3. Agent marks lead as "Signed Pending"
   └─ Auto-syncs to website_partnership_inquiries
   └─ HQ gets notification in website admin panel

4. HQ admin approves and activates business in website
   └─ Creates website_businesses record
   └─ Creates website_business_subscriptions record

5. HQ links business to street lead
   └─ Updates street_venue_leads.patron_pass_business_id

6. System auto-calculates accurate earnings
   └─ Uses actual billing amount instead of $150 estimate
   └─ Agent sees real commission in earnings screen
```

### Workflow 2: HQ Admin Dashboard

```
1. HQ admin opens /components/HQAdminDashboard.tsx

2. Views real-time metrics:
   ├─ Total leads across all agents
   ├─ Live venues
   ├─ Active agents
   ├─ Total monthly revenue
   └─ Average conversion rate

3. Filters leads:
   ├─ By city
   ├─ By status
   └─ By agent

4. Reviews pending applications
   └─ Approve/reject new agents

5. Bulk syncs leads to website
   └─ One-click sync of all signed/live leads
```

---

## 🛡️ Safety Features

### Non-Destructive Guarantees

1. **Read-Only Website Access**
   - Integration service only READS from website tables
   - Only WRITES to website_partnership_inquiries (INSERT/UPDATE, no DELETE)

2. **Null-Safe Foreign Keys**
   - All foreign keys use `ON DELETE SET NULL`
   - Deleting a website record won't break street team data

3. **Optional Columns**
   - New columns are nullable
   - Existing rows not affected by schema changes

4. **RLS Preserved**
   - No changes to existing RLS policies
   - Street team has its own separate policies

5. **Rollback Friendly**
   - All changes can be rolled back by dropping columns
   - No data loss risk

### Testing Safely

```sql
-- Test in development first
-- 1. Create test leads in street team
-- 2. Move to "live" status
-- 3. Check website_partnership_inquiries
-- 4. Verify data is correct
-- 5. If issues, simply:
DROP TRIGGER IF EXISTS trigger_sync_lead_to_website ON street_venue_leads;
-- This stops auto-sync, doesn't affect existing data
```

---

## 🔍 Unified View

**View name:** `hq_unified_leads`

This read-only view combines all data:

```sql
SELECT * FROM hq_unified_leads
WHERE agent_city = 'Hudson Valley'
  AND street_status = 'live';
```

**Columns include:**
- Street team data (venue, contact, agent)
- Website CRM data (inquiry status, created date)
- Business data (business name, ID)
- Revenue data (estimated vs actual)

**Use in admin dashboards, reports, analytics.**

---

## 🧪 Testing Checklist

After running integration setup:

- [ ] Create a test lead in street team app
- [ ] Move lead to "signed_pending" status
- [ ] Check `website_partnership_inquiries` table
- [ ] Verify inquiry was created with correct data
- [ ] Check `street_venue_leads.website_inquiry_id` is populated
- [ ] Create test business in website admin
- [ ] Link business ID to street lead
- [ ] Verify earnings calculation uses real revenue
- [ ] Test HQ admin dashboard
- [ ] Test bulk sync function
- [ ] Verify no existing website data was modified

---

## 📞 Support

**Issues with integration?**

1. Check SQL console for errors
2. Verify all foreign key tables exist
3. Check RLS policies allow authenticated users
4. Review integration service logs in browser console

**Need to disable integration?**

```sql
-- Stop auto-sync
DROP TRIGGER IF EXISTS trigger_sync_lead_to_website ON street_venue_leads;

-- Remove integration columns (safe, doesn't affect website tables)
ALTER TABLE street_venue_leads
  DROP COLUMN IF EXISTS website_inquiry_id,
  DROP COLUMN IF EXISTS patron_pass_business_id,
  DROP COLUMN IF EXISTS actual_monthly_revenue,
  DROP COLUMN IF EXISTS billing_subscription_id;
```

---

## 🎉 Summary

✅ **Safe:** No destructive changes to existing data  
✅ **Automated:** Leads auto-sync when ready  
✅ **Accurate:** Real revenue tracking instead of estimates  
✅ **Unified:** Single source of truth for HQ admins  
✅ **Flexible:** Can be enabled/disabled without data loss  

Your Street Team app and website are now fully integrated! 🚀
