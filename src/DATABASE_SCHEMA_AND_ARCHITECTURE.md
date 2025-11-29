# Patron Pass Street Team - Complete Database Schema & Architecture

**Generated:** November 28, 2025  
**App Version:** 1.0.0 (Production-Ready MVP)

---

## 📊 Complete SQL Schema

### 1. `street_users` - Core user profiles

```sql
CREATE TABLE street_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL UNIQUE,
  role VARCHAR NOT NULL CHECK (role IN ('ambassador', 'city_captain', 'hq_admin')),
  full_name VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  instagram_handle VARCHAR,
  phone VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMP DEFAULT NOW(),
  total_xp INTEGER DEFAULT 0,
  current_rank VARCHAR DEFAULT 'Bronze',
  avatar_url VARCHAR,
  preferences JSONB DEFAULT '{"email_notifications": true, "push_notifications": true}'::jsonb
);

CREATE INDEX idx_street_users_city ON street_users(city);
CREATE INDEX idx_street_users_status ON street_users(status);
CREATE INDEX idx_street_users_rank ON street_users(current_rank);
```

**Sample Data:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alex@example.com",
  "role": "ambassador",
  "full_name": "Alex Rivera",
  "city": "Austin",
  "instagram_handle": "@alexrivera",
  "phone": "+1-512-555-0123",
  "status": "active",
  "created_at": "2025-11-15T10:30:00Z",
  "total_xp": 3250,
  "current_rank": "Gold",
  "avatar_url": "https://avatars.example.com/alex.jpg",
  "preferences": {
    "email_notifications": true,
    "push_notifications": true
  }
}
```

---

### 2. `street_applications` - New applicants

```sql
CREATE TABLE street_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  instagram_handle VARCHAR,
  experience_tags VARCHAR[] DEFAULT '{}',
  why_join TEXT NOT NULL,
  status VARCHAR DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES street_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_street_applications_status ON street_applications(status);
CREATE INDEX idx_street_applications_city ON street_applications(city);
```

**Sample Data:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": null,
  "full_name": "Jordan Smith",
  "email": "jordan@example.com",
  "phone": "+1-512-555-0199",
  "city": "Austin",
  "instagram_handle": "@jordansmith",
  "experience_tags": ["nightlife", "sales", "hospitality"],
  "why_join": "I've been part of Austin's nightlife scene for 5 years and have connections with over 20 venue owners. I'm passionate about building relationships and want to help local businesses thrive.",
  "status": "submitted",
  "reviewed_by": null,
  "reviewed_at": null,
  "created_at": "2025-11-28T14:22:00Z"
}
```

---

### 3. `street_contract_acceptances` - Digital signatures

```sql
CREATE TABLE street_contract_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
  agreement_version VARCHAR NOT NULL,
  accepted_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR,
  device_info VARCHAR,
  typed_signature VARCHAR NOT NULL
);

CREATE UNIQUE INDEX idx_street_contracts_user ON street_contract_acceptances(user_id);
```

**Sample Data:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "agreement_version": "v1.0",
  "accepted_at": "2025-11-15T10:45:00Z",
  "ip_address": "192.168.1.100",
  "device_info": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
  "typed_signature": "Alex Rivera"
}
```

---

### 4. `street_runs` - Street team shifts

```sql
CREATE TABLE street_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  neighborhood VARCHAR NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  planned_venue_count INTEGER DEFAULT 0,
  actual_venue_count INTEGER DEFAULT 0,
  notes_summary TEXT,
  status VARCHAR DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_street_runs_user_id ON street_runs(user_id);
CREATE INDEX idx_street_runs_status ON street_runs(status);
CREATE INDEX idx_street_runs_start_time ON street_runs(start_time DESC);
```

**Sample Data:**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Downtown Bar Crawl",
  "city": "Austin",
  "neighborhood": "6th Street",
  "start_time": "2025-11-27T19:00:00Z",
  "end_time": "2025-11-27T23:30:00Z",
  "planned_venue_count": 8,
  "actual_venue_count": 12,
  "notes_summary": "Hit all planned spots plus 4 bonus venues. Great response from bar managers on 6th Street.",
  "status": "completed",
  "created_at": "2025-11-27T18:45:00Z"
}
```

**XP Award:** Completing a run = `50 + (actual_venue_count * 10)` XP  
Example: 12 venues = 50 + 120 = **170 XP**

---

### 5. `street_venue_leads` - Core business data

```sql
CREATE TABLE street_venue_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
  city VARCHAR NOT NULL,
  venue_name VARCHAR NOT NULL,
  address VARCHAR NOT NULL,
  venue_type VARCHAR NOT NULL CHECK (venue_type IN ('restaurant', 'bar', 'café', 'bakery', 'brewery', 'nightclub')),
  contact_name VARCHAR,
  contact_role VARCHAR,
  contact_phone VARCHAR,
  contact_email VARCHAR,
  relationship_strength INTEGER DEFAULT 0 CHECK (relationship_strength BETWEEN 0 AND 5),
  lead_source VARCHAR NOT NULL CHECK (lead_source IN ('cold_walk_in', 'friend_intro', 'referral', 'event', 'quick_lead')),
  heat_score INTEGER DEFAULT 50 CHECK (heat_score BETWEEN 0 AND 100),
  status VARCHAR DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'follow_up', 'demo_scheduled', 'verbal_yes', 'signed_pending', 'live')),
  notes TEXT,
  assigned_captain_id UUID REFERENCES street_users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES street_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  first_membership_date TIMESTAMP,
  patron_pass_business_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_street_venue_leads_user ON street_venue_leads(created_by_user_id);
CREATE INDEX idx_street_venue_leads_status ON street_venue_leads(status);
CREATE INDEX idx_street_venue_leads_city ON street_venue_leads(city);
CREATE INDEX idx_street_venue_leads_created_at ON street_venue_leads(created_at DESC);
```

**Sample Data:**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "created_by_user_id": "550e8400-e29b-41d4-a716-446655440000",
  "city": "Austin",
  "venue_name": "The Purple Flamingo",
  "address": "415 E 6th St, Austin, TX 78701",
  "venue_type": "bar",
  "contact_name": "Maria Santos",
  "contact_role": "General Manager",
  "contact_phone": "+1-512-555-0777",
  "contact_email": "maria@purpleflamingo.com",
  "relationship_strength": 4,
  "lead_source": "friend_intro",
  "heat_score": 85,
  "status": "verbal_yes",
  "notes": "Maria is very interested - she loves the Patron Pass concept. Her crowd is young professionals 25-35. She wants to see a demo next week.",
  "assigned_captain_id": "aa0e8400-e29b-41d4-a716-446655440099",
  "approved_by": null,
  "approved_at": null,
  "first_membership_date": null,
  "patron_pass_business_id": null,
  "created_at": "2025-11-26T16:20:00Z"
}
```

**Status Pipeline & XP Awards:**
| Status | XP Award | Description |
|--------|----------|-------------|
| `new` | +0 XP | Initial capture |
| `contacted` | +10 XP | First follow-up made |
| `follow_up` | +15 XP | Scheduled second contact |
| `demo_scheduled` | +25 XP | Demo/meeting booked |
| `verbal_yes` | +50 XP | Verbal commitment received |
| `signed_pending` | +100 XP | Contract signed, pending HQ approval |
| `live` | +200 XP | Venue is now a Patron Pass partner |

**Total XP for full pipeline:** 400 XP

---

### 6. `street_venue_photos` - Photo uploads

```sql
CREATE TABLE street_venue_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_lead_id UUID REFERENCES street_venue_leads(id) ON DELETE CASCADE,
  run_id UUID REFERENCES street_runs(id) ON DELETE CASCADE,
  url VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('exterior', 'business_card', 'owner_selfie', 'other')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_street_venue_photos_lead ON street_venue_photos(venue_lead_id);
CREATE INDEX idx_street_venue_photos_run ON street_venue_photos(run_id);
```

**Sample Data:**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "venue_lead_id": "990e8400-e29b-41d4-a716-446655440004",
  "run_id": null,
  "url": "https://storage.supabase.co/v1/object/public/street_photos/exterior_purple_flamingo.jpg",
  "type": "exterior",
  "created_at": "2025-11-26T16:25:00Z"
}
```

**Note:** Photo upload UI not yet implemented in app (table exists, feature coming soon).

---

### 7. `street_missions` - Gamified challenges

```sql
CREATE TABLE street_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('daily', 'weekly', 'one_off')),
  scope VARCHAR NOT NULL CHECK (scope IN ('global', 'city')),
  city VARCHAR,
  xp_reward INTEGER NOT NULL,
  point_reward INTEGER DEFAULT 0,
  required_count INTEGER NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP NOT NULL,
  created_by UUID REFERENCES street_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_street_missions_type ON street_missions(type);
CREATE INDEX idx_street_missions_scope ON street_missions(scope);
CREATE INDEX idx_street_missions_valid_dates ON street_missions(valid_from, valid_to);
```

**Sample Data:**
```json
[
  {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "title": "Lead Hunter",
    "description": "Add 3 new venue leads this week",
    "type": "weekly",
    "scope": "global",
    "city": null,
    "xp_reward": 100,
    "point_reward": 0,
    "required_count": 3,
    "valid_from": "2025-11-25T00:00:00Z",
    "valid_to": "2025-12-01T23:59:59Z",
    "created_by": "hq_admin_id",
    "created_at": "2025-11-25T00:00:00Z"
  },
  {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "title": "Austin Hustle",
    "description": "Move 2 leads to Signed Pending status in Austin",
    "type": "weekly",
    "scope": "city",
    "city": "Austin",
    "xp_reward": 250,
    "point_reward": 0,
    "required_count": 2,
    "valid_from": "2025-11-25T00:00:00Z",
    "valid_to": "2025-12-01T23:59:59Z",
    "created_by": "hq_admin_id",
    "created_at": "2025-11-25T00:00:00Z"
  },
  {
    "id": "dd0e8400-e29b-41d4-a716-446655440008",
    "title": "Daily Grind",
    "description": "Complete 1 street run today",
    "type": "daily",
    "scope": "global",
    "city": null,
    "xp_reward": 50,
    "point_reward": 0,
    "required_count": 1,
    "valid_from": "2025-11-28T00:00:00Z",
    "valid_to": "2025-11-28T23:59:59Z",
    "created_by": "hq_admin_id",
    "created_at": "2025-11-28T00:00:00Z"
  }
]
```

---

### 8. `street_mission_progress` - User mission tracking

```sql
CREATE TABLE street_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES street_missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  xp_awarded BOOLEAN DEFAULT false,
  UNIQUE(mission_id, user_id)
);

CREATE INDEX idx_street_mission_progress_user ON street_mission_progress(user_id);
CREATE INDEX idx_street_mission_progress_mission ON street_mission_progress(mission_id);
```

**Sample Data:**
```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440009",
  "mission_id": "bb0e8400-e29b-41d4-a716-446655440006",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "current_count": 3,
  "is_completed": true,
  "completed_at": "2025-11-27T18:30:00Z",
  "xp_awarded": true
}
```

---

### 9. `street_xp_events` - XP audit log (immutable)

```sql
CREATE TABLE street_xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
  source VARCHAR NOT NULL CHECK (source IN ('mission', 'run_completed', 'venue_status_change', 'manual_bonus')),
  source_id UUID,
  xp_amount INTEGER NOT NULL,
  points_amount INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_street_xp_events_user ON street_xp_events(user_id);
CREATE INDEX idx_street_xp_events_created_at ON street_xp_events(created_at DESC);
```

**Sample Data:**
```json
[
  {
    "id": "ff0e8400-e29b-41d4-a716-446655440010",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "source": "venue_status_change",
    "source_id": "990e8400-e29b-41d4-a716-446655440004",
    "xp_amount": 50,
    "points_amount": 0,
    "created_at": "2025-11-26T17:15:00Z"
  },
  {
    "id": "010e8400-e29b-41d4-a716-446655440011",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "source": "run_completed",
    "source_id": "880e8400-e29b-41d4-a716-446655440003",
    "xp_amount": 170,
    "points_amount": 0,
    "created_at": "2025-11-27T23:35:00Z"
  },
  {
    "id": "020e8400-e29b-41d4-a716-446655440012",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "source": "mission",
    "source_id": "bb0e8400-e29b-41d4-a716-446655440006",
    "xp_amount": 100,
    "points_amount": 0,
    "created_at": "2025-11-28T09:20:00Z"
  }
]
```

**Important:** This table is **append-only**. `street_users.total_xp` is calculated by summing all `xp_amount` values for a user.

---

### 10. `street_ranks` - Rank tiers (reference data)

```sql
CREATE TABLE street_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  min_xp INTEGER NOT NULL,
  perks_description TEXT NOT NULL,
  order_index INTEGER NOT NULL UNIQUE
);

CREATE INDEX idx_street_ranks_min_xp ON street_ranks(min_xp DESC);
```

**Complete Rank Data:**
```json
[
  {
    "id": "rank_bronze",
    "name": "Bronze",
    "min_xp": 0,
    "perks_description": "Entry level - 15% commission on live venues",
    "order_index": 1
  },
  {
    "id": "rank_silver",
    "name": "Silver",
    "min_xp": 1000,
    "perks_description": "Proven performer - 15% commission",
    "order_index": 2
  },
  {
    "id": "rank_gold",
    "name": "Gold",
    "min_xp": 2500,
    "perks_description": "Elite closer - 20% commission + priority support",
    "order_index": 3
  },
  {
    "id": "rank_platinum",
    "name": "Platinum",
    "min_xp": 5000,
    "perks_description": "Top 10% - 25% commission + custom missions",
    "order_index": 4
  },
  {
    "id": "rank_diamond",
    "name": "Diamond",
    "min_xp": 10000,
    "perks_description": "Top 5% - 30% commission + exclusive events",
    "order_index": 5
  },
  {
    "id": "rank_black_key",
    "name": "Black Key",
    "min_xp": 25000,
    "perks_description": "Legendary - 30% commission + leadership opportunities",
    "order_index": 6
  }
]
```

**Commission Rates:**
- Bronze/Silver: **15%**
- Gold: **20%**
- Platinum: **25%**
- Diamond/Black Key: **30%**

---

### 11. `street_notifications` - In-app inbox

```sql
CREATE TABLE street_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('mission', 'lead_update', 'admin_broadcast')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_street_notifications_user ON street_notifications(user_id);
CREATE INDEX idx_street_notifications_read ON street_notifications(user_id, is_read);
CREATE INDEX idx_street_notifications_created_at ON street_notifications(created_at DESC);
```

**Sample Data:**
```json
[
  {
    "id": "030e8400-e29b-41d4-a716-446655440013",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Mission Completed! 🎉",
    "body": "You completed 'Lead Hunter' and earned 100 XP. Claim your reward now!",
    "type": "mission",
    "is_read": false,
    "created_at": "2025-11-27T18:31:00Z"
  },
  {
    "id": "040e8400-e29b-41d4-a716-446655440014",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Lead Updated",
    "body": "The Purple Flamingo has been assigned to City Captain Sarah",
    "type": "lead_update",
    "is_read": true,
    "created_at": "2025-11-27T10:15:00Z"
  },
  {
    "id": "050e8400-e29b-41d4-a716-446655440015",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Weekly Leaderboard Results",
    "body": "You placed #3 in Austin this week with 12 new leads. Keep pushing!",
    "type": "admin_broadcast",
    "is_read": false,
    "created_at": "2025-11-25T09:00:00Z"
  }
]
```

---

### 12. `street_account_deletion_requests` - GDPR compliance (OPTIONAL)

```sql
CREATE TABLE street_account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
  reason TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_by UUID REFERENCES street_users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_street_deletion_requests_status ON street_account_deletion_requests(status);
CREATE INDEX idx_street_deletion_requests_user ON street_account_deletion_requests(user_id);
```

**Sample Data:**
```json
{
  "id": "060e8400-e29b-41d4-a716-446655440016",
  "user_id": "770e8400-e29b-41d4-a716-446655440099",
  "reason": "Moving to a different city and no longer active in nightlife",
  "requested_at": "2025-11-28T15:00:00Z",
  "processed_by": null,
  "processed_at": null,
  "status": "pending"
}
```

**Note:** If this table doesn't exist, the app gracefully logs the request to console and shows a message to the user. The table is optional but recommended for production.

---

## 🔐 Enum Definitions

All enum types used in the database:

```typescript
// User & Application
export type UserRole = 'ambassador' | 'city_captain' | 'hq_admin';
export type UserStatus = 'pending' | 'active' | 'suspended';
export type ApplicationStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected';

// Runs & Leads
export type RunStatus = 'planned' | 'active' | 'completed';
export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'demo_scheduled' | 'verbal_yes' | 'signed_pending' | 'live';
export type VenueType = 'restaurant' | 'bar' | 'café' | 'bakery' | 'brewery' | 'nightclub';
export type LeadSource = 'cold_walk_in' | 'friend_intro' | 'referral' | 'event' | 'quick_lead';
export type PhotoType = 'exterior' | 'business_card' | 'owner_selfie' | 'other';

// Gamification
export type MissionType = 'daily' | 'weekly' | 'one_off';
export type MissionScope = 'global' | 'city';
export type XPSource = 'mission' | 'run_completed' | 'venue_status_change' | 'manual_bonus';
export type NotificationType = 'mission' | 'lead_update' | 'admin_broadcast';
export type RankName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Black Key';
```

---

## 🗺️ User Flow Diagrams

### Flow 1: New User Application → Onboarding

```
┌─────────────────────┐
│ User visits app URL │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Welcome Screen     │ (Branding splash)
└──────────┬──────────┘
           │ Tap "Apply Now"
           ▼
┌─────────────────────┐
│ Application Form    │ → Inserts into street_applications
│ - Name, email, etc. │   (status: 'submitted')
│ - Why join text     │
└──────────┬──────────┘
           │ Submit
           ▼
┌─────────────────────┐
│ Thank You Screen    │ "We'll review your application!"
└─────────────────────┘

=== ADMIN SIDE (Main Website Dashboard) ===

┌─────────────────────┐
│ HQ Admin reviews    │ → Updates street_applications
│ application         │   (status: 'approved')
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Create auth.users   │ → supabase.auth.admin.createUser()
│ account             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Insert street_users │ → role: 'ambassador', status: 'pending'
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Email user with     │ "Welcome! Here are your login credentials"
│ credentials         │
└─────────────────────┘

=== USER SIDE (App) ===

┌─────────────────────┐
│ User logs in        │ → supabase.auth.signInWithPassword()
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Contract Screen     │ → Inserts into street_contract_acceptances
│ - Read ICA          │
│ - Type signature    │
└──────────┬──────────┘
           │ Accept
           ▼
┌─────────────────────┐
│ Onboarding Tour     │ Interactive tutorial (4 steps)
└──────────┬──────────┘
           │ Complete
           ▼
┌─────────────────────┐
│ Dashboard           │ User is now active!
└─────────────────────┘
```

---

### Flow 2: Add Venue Lead → Earn XP

```
┌─────────────────────┐
│ Dashboard           │
└──────────┬──────────┘
           │ Tap "Add Lead"
           ▼
┌─────────────────────┐
│ Add Lead Form       │
│ - Venue name        │
│ - Address           │
│ - Contact info      │
│ - Relationship (1-5)│
│ - Lead source       │
└──────────┬──────────┘
           │ Submit
           ▼
┌─────────────────────────────────────┐
│ Database Writes:                    │
│ 1. INSERT into street_venue_leads   │
│    (status: 'new')                  │
│ 2. awardXP(25, 'venue_status_change') │
│    → INSERT into street_xp_events   │
│    → UPDATE street_users.total_xp   │
│    → UPDATE street_users.current_rank│
│ 3. updateMissionProgress('lead_added')│
│    → UPDATE street_mission_progress │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Toast Notification  │ "Lead saved – +25 XP earned!"
│                     │ (+ "🎉 Promoted to Gold!" if rank up)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Lead Pipeline       │ Lead appears in "New" column
└─────────────────────┘
```

---

### Flow 3: Lead Pipeline Progression

```
┌─────────────────────┐
│ Lead Pipeline       │ Kanban view
└──────────┬──────────┘
           │ Tap lead card
           ▼
┌─────────────────────┐
│ Lead Details Screen │
│ - Venue info        │
│ - Contact details   │
│ - Notes             │
│ - Current status    │
└──────────┬──────────┘
           │ Tap "Update Status"
           ▼
┌─────────────────────┐
│ Status Dropdown     │ Select next stage:
│ ☑ New               │ contacted (+10 XP)
│ ☐ Contacted         │ follow_up (+15 XP)
│ ☐ Follow Up         │ demo_scheduled (+25 XP)
│ ☐ Demo Scheduled    │ verbal_yes (+50 XP)
│ ☐ Verbal Yes        │ signed_pending (+100 XP)
│ ☐ Signed Pending    │ live (+200 XP)
│ ☐ Live              │
└──────────┬──────────┘
           │ Select "Verbal Yes"
           ▼
┌─────────────────────────────────────┐
│ Database Writes:                    │
│ 1. UPDATE street_venue_leads        │
│    SET status = 'verbal_yes'        │
│ 2. awardXP(50, 'venue_status_change', leadId) │
│    → Logs XP event + updates user   │
│ 3. updateMissionProgress('lead_to_verbal_yes') │
│    → Increments relevant missions   │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Toast Notification  │ "Lead updated – +50 XP earned!"
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Lead Pipeline       │ Lead moves to "Verbal Yes" column
└─────────────────────┘
```

---

### Flow 4: Complete Mission → Claim Reward

```
┌─────────────────────┐
│ Missions Screen     │ Shows available missions
└──────────┬──────────┘
           │ User performs actions...
           │ (adds leads, completes runs, etc.)
           ▼
┌─────────────────────────────────────┐
│ Background Process (missionService) │
│ - Monitors user actions             │
│ - Updates street_mission_progress   │
│   current_count: 0 → 1 → 2 → 3      │
│ - Sets is_completed = true when     │
│   current_count >= required_count   │
│ - Inserts notification              │
└──────────┬──────────────────────────┘
           │ Mission completed
           ▼
┌─────────────────────┐
│ Notification        │ "Mission Completed! 🎉"
│                     │ "You completed 'Lead Hunter' and
│                     │  earned 100 XP. Claim your reward!"
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Missions Screen     │ "CLAIM REWARD" button appears
└──────────┬──────────┘
           │ User taps "Claim"
           ▼
┌─────────────────────────────────────┐
│ Database Writes:                    │
│ 1. awardXP(100, 'mission', missionId) │
│    → Logs XP + updates user         │
│ 2. UPDATE street_mission_progress   │
│    SET xp_awarded = true            │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Toast Notification  │ "Mission claimed – +100 XP earned!"
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Dashboard           │ Updated total XP shown
└─────────────────────┘
```

---

## 📝 All User Actions That Trigger Database Writes

### 1. **Application Submit** (ApplicationForm)
```typescript
INSERT INTO street_applications (
  full_name, email, phone, city, instagram_handle,
  experience_tags, why_join, status
) VALUES (..., 'submitted');
```

---

### 2. **Contract Acceptance** (ContractScreen)
```typescript
INSERT INTO street_contract_acceptances (
  user_id, agreement_version, typed_signature,
  ip_address, device_info, accepted_at
) VALUES (...);
```

---

### 3. **Start Street Run** (StartRunScreen)
```typescript
INSERT INTO street_runs (
  user_id, title, city, neighborhood,
  start_time, planned_venue_count, status
) VALUES (..., 'active');
```

---

### 4. **End Street Run** (ActiveRunScreen)
```typescript
// Step 1: Update run
UPDATE street_runs
SET end_time = NOW(),
    actual_venue_count = 12,
    status = 'completed',
    notes_summary = '...'
WHERE id = runId;

// Step 2: Award XP
xpAmount = 50 + (actual_venue_count * 10); // e.g., 170 XP
await awardXP({
  userId,
  amount: xpAmount,
  source: 'run_completed',
  sourceId: runId
});

// Step 3: Update missions
await updateMissionProgress(userId, 'run_completed');
```

**Triggered Functions:**
- `awardXP()` → Inserts `street_xp_events` + updates `street_users.total_xp` + recalculates rank
- `updateMissionProgress()` → Updates `street_mission_progress` + creates notification if completed

---

### 5. **Add Venue Lead** (AddLeadForm)
```typescript
// Step 1: Insert lead
INSERT INTO street_venue_leads (
  created_by_user_id, city, venue_name, address,
  venue_type, contact_name, contact_role,
  contact_phone, contact_email, relationship_strength,
  lead_source, heat_score, status, notes
) VALUES (..., 'new');

// Step 2: Award XP
await awardXP({
  userId,
  amount: 25,
  source: 'venue_status_change',
  sourceId: leadId
});

// Step 3: Update missions
await updateMissionProgress(userId, 'lead_added');
```

---

### 6. **Update Lead Status** (LeadDetailsScreen)
```typescript
// Step 1: Update lead
UPDATE street_venue_leads
SET status = 'verbal_yes'
WHERE id = leadId;

// Step 2: Award XP (based on new status)
const xpMap = {
  'contacted': 10,
  'follow_up': 15,
  'demo_scheduled': 25,
  'verbal_yes': 50,
  'signed_pending': 100,
  'live': 200
};
await awardXP({
  userId,
  amount: xpMap[newStatus],
  source: 'venue_status_change',
  sourceId: leadId
});

// Step 3: Update missions
await updateMissionProgress(userId, `lead_to_${newStatus}`);

// Step 4: If status = 'live', set first_membership_date
if (newStatus === 'live') {
  UPDATE street_venue_leads
  SET first_membership_date = NOW()
  WHERE id = leadId AND first_membership_date IS NULL;
}
```

---

### 7. **Claim Mission Reward** (MissionsScreen)
```typescript
// Validate mission is completed and not already claimed
const { data: progress } = await supabase
  .from('street_mission_progress')
  .select('*, mission:street_missions(*)')
  .eq('mission_id', missionId)
  .eq('user_id', userId)
  .single();

if (!progress.is_completed || progress.xp_awarded) {
  return; // Already claimed or not completed
}

// Award XP
await awardXP({
  userId,
  amount: progress.mission.xp_reward,
  source: 'mission',
  sourceId: missionId
});

// Mark as claimed
UPDATE street_mission_progress
SET xp_awarded = true
WHERE mission_id = missionId AND user_id = userId;
```

---

### 8. **Mark Notification as Read** (NotificationsScreen)
```typescript
UPDATE street_notifications
SET is_read = true
WHERE id = notificationId;
```

---

### 9. **Update User Preferences** (SettingsScreen)
```typescript
UPDATE street_users
SET preferences = jsonb_set(
  preferences,
  '{push_notifications}',
  'false'::jsonb
)
WHERE id = userId;
```

---

### 10. **Request Account Deletion** (SettingsScreen)
```typescript
INSERT INTO street_account_deletion_requests (
  user_id, reason, status
) VALUES (userId, 'User provided reason...', 'pending');
```

---

### 11. **Change Password** (SettingsScreen)
```typescript
await supabase.auth.updateUser({
  password: newPassword
});
```

---

### 12. **Logout** (ProfileScreen / SettingsScreen)
```typescript
await supabase.auth.signOut();
```

---

## 🎮 XP System - Complete Reference

### XP Sources & Amounts

| Action | XP Amount | Source Type | Source ID |
|--------|-----------|-------------|-----------|
| Add new lead | +25 XP | `venue_status_change` | `lead_id` |
| Lead → Contacted | +10 XP | `venue_status_change` | `lead_id` |
| Lead → Follow Up | +15 XP | `venue_status_change` | `lead_id` |
| Lead → Demo Scheduled | +25 XP | `venue_status_change` | `lead_id` |
| Lead → Verbal Yes | +50 XP | `venue_status_change` | `lead_id` |
| Lead → Signed Pending | +100 XP | `venue_status_change` | `lead_id` |
| Lead → Live | +200 XP | `venue_status_change` | `lead_id` |
| Complete street run | 50 + (venues × 10) XP | `run_completed` | `run_id` |
| Complete mission | Varies (50-250 XP) | `mission` | `mission_id` |
| Manual HQ bonus | Varies | `manual_bonus` | `null` |

### Rank Progression

| Rank | Min XP | Commission Rate | Perks |
|------|--------|-----------------|-------|
| **Bronze** | 0 | 15% | Entry level |
| **Silver** | 1,000 | 15% | Proven performer |
| **Gold** | 2,500 | 20% | Elite closer + priority support |
| **Platinum** | 5,000 | 25% | Top 10% + custom missions |
| **Diamond** | 10,000 | 30% | Top 5% + exclusive events |
| **Black Key** | 25,000 | 30% | Legendary + leadership opportunities |

### Example Progression Path

**Week 1: Bronze → Silver**
- Add 10 leads (+250 XP)
- Move 5 leads to "Contacted" (+50 XP)
- Move 3 leads to "Follow Up" (+45 XP)
- Complete 3 runs with 20 total venues (+750 XP)
- **Total: 1,095 XP → Promoted to Silver**

**Month 1: Silver → Gold**
- Add 20 more leads (+500 XP)
- Move 10 leads through pipeline to "Demo Scheduled" (+400 XP)
- Get 2 leads to "Verbal Yes" (+100 XP)
- Complete 8 runs with 50 total venues (+1,100 XP)
- Complete 3 weekly missions (+300 XP)
- **Total: 3,495 XP → Promoted to Gold**

---

## 💰 Earnings System

### Calculation Formula

```typescript
// Fetch user's live and signed_pending venues
const { data: venues } = await supabase
  .from('street_venue_leads')
  .select('*')
  .eq('created_by_user_id', userId)
  .in('status', ['signed_pending', 'live']);

// Constants
const ESTIMATED_MONTHLY_FEE_PER_VENUE = 150; // Prototype estimate

// Get commission rate for user's rank
const commissionRate = getCommissionRate(user.current_rank); // 0.15 to 0.30

// Calculate earnings
const liveVenues = venues.filter(v => v.status === 'live');
const pendingVenues = venues.filter(v => v.status === 'signed_pending');

const thisMonthEarnings = liveVenues.length * ESTIMATED_MONTHLY_FEE_PER_VENUE * commissionRate;
const pendingEarnings = pendingVenues.length * ESTIMATED_MONTHLY_FEE_PER_VENUE * commissionRate;
```

### Example Calculation

**User:** Alex Rivera  
**Rank:** Gold (20% commission)  
**Live Venues:** 8  
**Signed Pending:** 3  

**This Month:**
```
8 venues × $150 × 0.20 = $240
```

**Pending:**
```
3 venues × $150 × 0.20 = $90
```

**Total Potential:** $330/month

---

## 🔗 Integration Points with Main Website

### 1. Application Approval Flow

**Website Admin Dashboard:**
```sql
-- View pending applications
SELECT * FROM street_applications
WHERE status = 'submitted'
ORDER BY created_at DESC;

-- Approve application
UPDATE street_applications
SET status = 'approved',
    reviewed_by = 'hq_admin_id',
    reviewed_at = NOW()
WHERE id = application_id;

-- Create auth account (via Supabase Admin API)
-- Then insert into street_users
INSERT INTO street_users (
  id, email, role, full_name, city, phone, status
) VALUES (auth_user_id, ..., 'ambassador', ..., 'active');
```

---

### 2. Lead Management Sync

**Sync Strategy:**

When a street team lead reaches `signed_pending` or `live` status, sync it to the main CRM table `website_partnership_inquiries`:

```sql
-- Webhook trigger on street_venue_leads status change
CREATE OR REPLACE FUNCTION sync_street_lead_to_crm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('signed_pending', 'live') AND
     (OLD.status IS NULL OR OLD.status NOT IN ('signed_pending', 'live')) THEN
    
    INSERT INTO website_partnership_inquiries (
      business_name,
      address,
      contact_name,
      contact_phone,
      contact_email,
      source,
      attributed_to_user_id,
      street_lead_id,
      status,
      created_at
    ) VALUES (
      NEW.venue_name,
      NEW.address,
      NEW.contact_name,
      NEW.contact_phone,
      NEW.contact_email,
      'street_team',
      NEW.created_by_user_id,
      NEW.id,
      CASE WHEN NEW.status = 'live' THEN 'active' ELSE 'pending' END,
      NEW.created_at
    )
    ON CONFLICT (street_lead_id) DO UPDATE
    SET status = CASE WHEN NEW.status = 'live' THEN 'active' ELSE 'pending' END,
        updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_street_lead_after_update
AFTER UPDATE OF status ON street_venue_leads
FOR EACH ROW
EXECUTE FUNCTION sync_street_lead_to_crm();
```

---

### 3. Revenue Attribution

**Link to Main Billing System:**

```sql
-- When a venue goes live, link to main business table
UPDATE street_venue_leads
SET patron_pass_business_id = main_business_id
WHERE id = lead_id;

-- Then query actual revenue for earnings reports
SELECT
  svl.id,
  svl.venue_name,
  svl.created_by_user_id,
  b.monthly_revenue,
  su.current_rank,
  b.monthly_revenue * get_commission_rate(su.current_rank) as agent_commission
FROM street_venue_leads svl
JOIN businesses b ON b.id = svl.patron_pass_business_id
JOIN street_users su ON su.id = svl.created_by_user_id
WHERE svl.status = 'live'
  AND b.status = 'active';
```

---

### 4. Admin Features (HQ Dashboard)

**Recommended Admin Views:**

```sql
-- 1. Application Queue
SELECT * FROM street_applications WHERE status = 'submitted';

-- 2. Lead Pipeline Overview
SELECT
  status,
  COUNT(*) as count,
  COUNT(DISTINCT created_by_user_id) as unique_agents
FROM street_venue_leads
GROUP BY status
ORDER BY CASE status
  WHEN 'new' THEN 1
  WHEN 'contacted' THEN 2
  WHEN 'follow_up' THEN 3
  WHEN 'demo_scheduled' THEN 4
  WHEN 'verbal_yes' THEN 5
  WHEN 'signed_pending' THEN 6
  WHEN 'live' THEN 7
END;

-- 3. Top Performers
SELECT
  su.full_name,
  su.city,
  su.current_rank,
  su.total_xp,
  COUNT(svl.id) FILTER (WHERE svl.status = 'live') as live_venues,
  COUNT(svl.id) as total_leads
FROM street_users su
LEFT JOIN street_venue_leads svl ON svl.created_by_user_id = su.id
WHERE su.role = 'ambassador' AND su.status = 'active'
GROUP BY su.id
ORDER BY su.total_xp DESC
LIMIT 20;

-- 4. City Performance
SELECT
  city,
  COUNT(DISTINCT id) FILTER (WHERE role = 'ambassador') as active_agents,
  COUNT(DISTINCT svl.id) as total_leads,
  COUNT(DISTINCT svl.id) FILTER (WHERE svl.status = 'live') as live_venues
FROM street_users su
LEFT JOIN street_venue_leads svl ON svl.created_by_user_id = su.id
GROUP BY city
ORDER BY live_venues DESC;
```

---

## 🚦 RLS (Row Level Security) Policies

**Recommended RLS setup for production:**

```sql
-- Enable RLS on all tables
ALTER TABLE street_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_contract_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_venue_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_venue_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE street_account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- street_users: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON street_users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON street_users FOR UPDATE
  USING (auth.uid() = id);

-- street_applications: Anyone can insert (pre-auth), admins can view all
CREATE POLICY "Anyone can submit application"
  ON street_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view applications"
  ON street_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM street_users
      WHERE id = auth.uid() AND role = 'hq_admin'
    )
  );

-- street_contract_acceptances: Users can insert their own, read their own
CREATE POLICY "Users can sign contract"
  ON street_contract_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own contract"
  ON street_contract_acceptances FOR SELECT
  USING (auth.uid() = user_id);

-- street_runs: Users can CRUD their own runs
CREATE POLICY "Users can manage own runs"
  ON street_runs FOR ALL
  USING (auth.uid() = user_id);

-- street_venue_leads: Users can CRUD their own leads, captains can view city leads
CREATE POLICY "Users can manage own leads"
  ON street_venue_leads FOR ALL
  USING (auth.uid() = created_by_user_id);

CREATE POLICY "City captains can view city leads"
  ON street_venue_leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM street_users
      WHERE id = auth.uid()
        AND role = 'city_captain'
        AND city = street_venue_leads.city
    )
  );

-- street_missions: Public read (for all authenticated users)
CREATE POLICY "Authenticated users can view missions"
  ON street_missions FOR SELECT
  USING (auth.role() = 'authenticated');

-- street_mission_progress: Users can view/update their own progress
CREATE POLICY "Users can manage own mission progress"
  ON street_mission_progress FOR ALL
  USING (auth.uid() = user_id);

-- street_xp_events: Users can view their own events (insert via service only)
CREATE POLICY "Users can view own XP events"
  ON street_xp_events FOR SELECT
  USING (auth.uid() = user_id);

-- street_ranks: Public read
CREATE POLICY "Anyone can view ranks"
  ON street_ranks FOR SELECT
  USING (true);

-- street_notifications: Users can view/update their own notifications
CREATE POLICY "Users can manage own notifications"
  ON street_notifications FOR ALL
  USING (auth.uid() = user_id);

-- street_account_deletion_requests: Users can insert/view their own requests
CREATE POLICY "Users can request account deletion"
  ON street_account_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own deletion requests"
  ON street_account_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🎯 Summary of Key Points

### User Roles
- **ambassador** - Field agents who capture leads and complete street runs
- **city_captain** - Regional managers who oversee ambassadors in a city
- **hq_admin** - HQ staff who approve applications, manage missions, review leads

### Application Lifecycle
1. User fills out application → `street_applications` (`status: 'submitted'`)
2. HQ admin reviews → Updates status to `'approved'`
3. HQ admin creates auth account → Inserts `street_users` (`status: 'pending'`)
4. User logs in → Signs contract → `street_contract_acceptances`
5. User completes onboarding → Account is now active

### Lead Pipeline Statuses
`new` → `contacted` → `follow_up` → `demo_scheduled` → `verbal_yes` → `signed_pending` → `live`

Each status change awards XP (10 → 15 → 25 → 50 → 100 → 200)

### Gamification Architecture
- **XP Events** logged in `street_xp_events` (immutable audit log)
- **Total XP** calculated by summing all events, stored in `street_users.total_xp`
- **Rank** auto-calculated by `xpService` based on XP thresholds
- **Missions** tracked in `street_mission_progress`, auto-updated by `missionService`
- **Rewards** claimed by user, awards XP via `awardXP()` function

### Earnings Model (Prototype)
- Estimated at $150/month per live venue (configurable constant)
- Commission rate determined by rank (15%–30%)
- Displayed as "This Month" (live venues) and "Pending" (signed pending venues)
- **Production:** Replace with actual revenue from main billing system

---

## 📞 Questions or Issues?

If you need clarification on any part of this schema, please ask! This document is intended to be the **single source of truth** for the Street Team app's database architecture and should answer all questions about:

✅ Table structures and relationships  
✅ Enum types and valid values  
✅ Sample data formats  
✅ User flows and state transitions  
✅ XP/rank/mission logic  
✅ Database write triggers  
✅ Integration points with main website  

**Next Steps:**
1. Review this schema against your existing Patron Pass Supabase project
2. Create any missing tables using the SQL snippets provided
3. Update `/utils/supabase/info.tsx` with your production credentials
4. Run the seed script to populate ranks and initial missions
5. Test the full flow from application → login → add lead → earn XP → rank up

---

**Document Version:** 1.0  
**Last Updated:** November 28, 2025  
**Maintained By:** Patron Pass Development Team
