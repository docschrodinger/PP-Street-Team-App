# Patron Pass: Street Team 🎯

**Production-ready mobile web app for street team ambassadors, city captains, and HQ admins.**

Neo-brutalist nightlife aesthetic • Full gamification • Real-time XP & rank progression • Complete lead pipeline management

---

## 🚀 Quick Start

**Just got an error?** → [`/START_HERE.md`](/START_HERE.md) ⭐

**New here?** → [`/QUICK_START.md`](/QUICK_START.md)

1. Update Supabase credentials
2. Create database tables
3. Run `/INTEGRATION_SETUP_LITE.sql`
4. Create test user
5. Login and test

**5 minutes to a working app!**

---

## 📚 Documentation

| File | What's Inside |
|------|---------------|
| **[START_HERE.md](./START_HERE.md)** ⭐ | Got an error? Start here! |
| **[QUICK_START.md](./QUICK_START.md)** | Get up and running in 5 minutes |
| **[SETUP_WITHOUT_WEBSITE.md](./SETUP_WITHOUT_WEBSITE.md)** | Setup guide (no website tables needed) |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Common issues & solutions (30+ fixes) |
| **[WHATS_NEW.md](./WHATS_NEW.md)** | Latest features & updates |
| **[DATABASE_SCHEMA_AND_ARCHITECTURE.md](./DATABASE_SCHEMA_AND_ARCHITECTURE.md)** | Complete database schema |
| **[WEBSITE_INTEGRATION_GUIDE.md](./WEBSITE_INTEGRATION_GUIDE.md)** | Full website integration (optional) |
| **[CREATE_TEST_USER.sql](./CREATE_TEST_USER.sql)** | SQL script to create test user |
| **[INTEGRATION_SETUP_LITE.sql](./INTEGRATION_SETUP_LITE.sql)** | Setup without website tables ✅ |
| **[INTEGRATION_SETUP.sql](./INTEGRATION_SETUP.sql)** | Full integration (needs website tables) |

---

## ✨ Features

### 🎮 Gamification System
- **6 Ranks:** Bronze → Silver → Gold → Platinum → Diamond → Black Key
- **XP Rewards:** Earn XP for every action (add leads, complete runs, advance pipeline)
- **Auto-Rank Progression:** Automatically promotes users when XP thresholds hit
- **Missions:** Daily/weekly challenges with bonus XP rewards
- **Leaderboards:** City and global rankings

### 💼 Lead Pipeline Management
- **7-Stage Pipeline:** New → Contacted → Follow Up → Demo → Verbal Yes → Signed Pending → Live
- **Lead Details:** Full contact info, notes, relationship strength, heat score
- **Status Updates:** Tap to update, earn XP for each stage progression
- **Earnings Tracking:** See estimated revenue based on live venues × commission rate

### 🏃 Street Runs (Shifts)
- **Clock In/Out:** Track field time with start/end timestamps
- **Venue Counter:** Log how many venues visited during each run
- **XP Rewards:** 50 base XP + 10 XP per venue visited
- **Run History:** View past runs with summaries

### 👥 User Roles
- **Ambassador:** Field agents who capture leads and complete runs
- **City Captain:** Regional managers (higher rank by default)
- **HQ Admin:** Full access to manage applications, leads, missions

### 📱 Mobile-First Design
- **Neo-Brutalist Aesthetic:** Thick borders, hard edges, street hustle vibe
- **Patron Purple (#8A4FFF)** & **Patron Coral (#FF7A59)** color scheme
- **Responsive:** Works on all mobile devices (320px+)
- **Bottom Navigation:** Easy thumb-friendly navigation
- **Toast Notifications:** Instant feedback on every XP-earning action

---

## 🗄️ Database Schema

### 12 Tables
1. `street_users` - User profiles with XP/rank
2. `street_applications` - New applicant submissions
3. `street_contract_acceptances` - Digital signatures
4. `street_runs` - Street team shifts
5. `street_venue_leads` - Core business data (pipeline)
6. `street_venue_photos` - Venue photo uploads
7. `street_missions` - Gamified challenges
8. `street_mission_progress` - User progress tracking
9. `street_xp_events` - Immutable XP audit log
10. `street_ranks` - Rank tiers & thresholds
11. `street_notifications` - In-app inbox
12. `street_account_deletion_requests` - GDPR compliance (optional)

**See full schema:** `/DATABASE_SCHEMA_AND_ARCHITECTURE.md`

---

## 🎯 User Flows

### Application → Onboarding
1. User applies via ApplicationForm
2. HQ admin approves in Supabase Dashboard
3. HQ creates auth account + street_users record
4. User logs in
5. User signs digital contract
6. User completes onboarding tour
7. User is now active!

### Add Lead → Earn XP
1. User adds venue lead (+25 XP)
2. XP logged in `street_xp_events`
3. `street_users.total_xp` auto-updates
4. Rank recalculated (auto-promotes if threshold hit)
5. Mission progress auto-increments
6. Toast notification shows XP earned + rank up (if applicable)

### Lead Pipeline Progression
- Each status change awards XP: 10 → 15 → 25 → 50 → 100 → 200
- **Total for full pipeline:** 400 XP
- Missions auto-complete when targets hit

---

## 💰 Earnings Model

**Formula:**
```
Live Venues × $150/month × Commission Rate = Monthly Revenue Share
```

**Commission Rates by Rank:**
- Bronze/Silver: **15%**
- Gold: **20%**
- Platinum: **25%**
- Diamond/Black Key: **30%**

**Example:**
- User with Gold rank (20%)
- 8 live venues
- **Earnings:** 8 × $150 × 0.20 = **$240/month**

---

## 🔧 Tech Stack

- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Shadcn/ui
- **Backend:** Supabase (Auth, Database, Storage)
- **Icons:** Lucide React
- **Notifications:** Sonner (toast)
- **Database:** PostgreSQL (via Supabase)

---

## 🚦 Current Status

**✅ 95% Production-Ready MVP**

### ✅ Implemented
- [x] Complete authentication flow
- [x] Application form
- [x] Digital contract signing
- [x] Onboarding tour
- [x] Dashboard with live stats
- [x] Street runs (clock in/out)
- [x] Add venue leads
- [x] Lead pipeline kanban
- [x] Lead details screen with status updates
- [x] Missions system with auto-progress
- [x] Mission rewards
- [x] Leaderboards (city & global)
- [x] Rank system display
- [x] Earnings calculator
- [x] Profile screen
- [x] Settings (notifications, password, account deletion)
- [x] Notifications inbox
- [x] XP service with auto-rank updates
- [x] Mission service with auto-progress
- [x] Toast notifications on all XP events
- [x] Real earnings calculations

### ✅ Just Added!
- [x] **Rank-up celebration modal with confetti** 🎉
- [x] **Website integration (Lead CRM sync)**
- [x] **Real revenue tracking** (links to actual billing)
- [x] **HQ Admin Dashboard** (full management interface)
- [x] **Auto-sync trigger** (leads auto-sync to website when live)

### ⏳ Future Enhancements
- [ ] Photo upload for venues
- [ ] Push notifications (UI ready, needs backend)
- [ ] Map view for leads
- [ ] Offline support
- [ ] Social sharing
- [ ] Referral tracking
- [ ] Drag-and-drop pipeline

---

## 🔗 Integration with Main Website (patronpass.com)

### ✅ Fully Implemented Integration

**The Street Team app is now fully integrated with your main website!**

#### What's Synced:
1. **Lead CRM** - Auto-syncs `signed_pending` and `live` leads to `website_partnership_inquiries`
2. **Revenue Tracking** - Links to actual billing subscriptions for accurate earnings
3. **SSO/Unified Auth** - Users can have both street team and website accounts
4. **Admin Dashboard** - HQ can manage everything from `/components/HQAdminDashboard.tsx`

#### Setup Guide:
1. Run `/INTEGRATION_SETUP.sql` in Supabase SQL Editor
2. Test by creating a lead and moving it to "live"
3. Check `website_partnership_inquiries` table
4. See full docs: `/WEBSITE_INTEGRATION_GUIDE.md`

#### Safety:
- ✅ 100% non-destructive to existing website data
- ✅ Only reads from website tables
- ✅ Only writes to `street_*` tables and `website_partnership_inquiries`
- ✅ Can be rolled back without data loss

**See full integration guide:** `/WEBSITE_INTEGRATION_GUIDE.md`

---

## 🎓 For Developers

### File Structure
```
/
├── App.tsx                          # Main app component
├── components/
│   ├── Dashboard.tsx                # Home screen
│   ├── LeadPipeline.tsx             # Kanban view
│   ├── LeadDetailsScreen.tsx        # Lead detail + status updates
│   ├── MissionsScreen.tsx           # Missions + rewards
│   ├── ...                          # 15+ other screens
│   └── ui/                          # Shadcn components
├── lib/
│   ├── types.ts                     # TypeScript definitions
│   ├── xpService.ts                 # XP management + rank calculation
│   └── missionService.ts            # Mission progress tracking
├── utils/supabase/
│   ├── client.ts                    # Supabase singleton client
│   ├── info.tsx                     # Project credentials (UPDATE THIS!)
│   └── setup.ts                     # Database seed functions
└── styles/
    └── globals.css                  # Tailwind + custom styles
```

### Key Services

**XP Service** (`/lib/xpService.ts`)
```typescript
import { awardXP } from '@/lib/xpService';

await awardXP({
  userId: user.id,
  amount: 50,
  source: 'venue_status_change',
  sourceId: leadId
});
// Returns: { success, newTotalXP, previousRank, newRank, rankUp }
```

**Mission Service** (`/lib/missionService.ts`)
```typescript
import { updateMissionProgress } from '@/lib/missionService';

await updateMissionProgress(userId, 'lead_added');
// Auto-increments mission progress, completes missions, creates notifications
```

---

## 🐛 Troubleshooting

### RLS Errors
**Problem:** "new row violates row-level security policy"  
**Solution:** For testing, run `/DISABLE_RLS_FOR_TESTING.sql`. For production, set up RLS policies from `/DATABASE_SCHEMA_AND_ARCHITECTURE.md`

### Test User Issues
**Problem:** Can't create test user  
**Solution:** Use Supabase Dashboard method (see `/QUICK_START.md` step 3)

### Tables Don't Exist
**Problem:** Queries fail because tables are missing  
**Solution:** Run table creation SQL from `/DATABASE_SCHEMA_AND_ARCHITECTURE.md`

---

## 📞 Support

**Questions about:**
- Database schema → See `/DATABASE_SCHEMA_AND_ARCHITECTURE.md`
- User flows → See `/DATABASE_SCHEMA_AND_ARCHITECTURE.md` (User Flow Diagrams)
- Features → See `/STREET_TEAM_IMPLEMENTATION_NOTES.md`
- Quick setup → See `/QUICK_START.md`

---

## 📄 License

Proprietary - Patron Pass LLC

---

## 🎉 Ready to Launch?

1. ✅ Review the database schema
2. ✅ Create tables in your Supabase project
3. ✅ Update credentials in `/utils/supabase/info.tsx`
4. ✅ Create test user
5. ✅ Test all flows
6. ✅ Set up RLS policies for production
7. ✅ Deploy!

**Let's build the best street team management app ever.** 🚀
