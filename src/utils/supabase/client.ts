import { createClient } from '@supabase/supabase-js'
import { supabaseInfo } from './info'

// This is the standard Supabase client for the Patron Pass Street Team app.
// It uses the project URL and anon key from the auto-generated info.tsx file.
//
// IMPORTANT: This client is automatically configured to use Capacitor's native
// HTTP plugin when the app is running on a mobile device. This is handled
// by the `plugins.CapacitorHttp.enabled = true` setting in `capacitor.config.json`.
// DO NOT add any custom `fetch` implementations here.

export const supabase = createClient(
  supabaseInfo.url,
  supabaseInfo.anonKey
)
 * -----------------------------------------------------------------------------
 * TABLE: street_venue_leads
 * -----------------------------------------------------------------------------
 * Venue/business leads captured by street team (core business data)
 *
 * Fields used:
 *   - id (UUID, PK)
 *   - created_by_user_id (UUID, FK to street_users) - agent who added it
 *   - city (VARCHAR)
 *   - venue_name (VARCHAR)
 *   - address (VARCHAR)
 *   - venue_type (VARCHAR) - 'restaurant' | 'bar' | 'café' | 'bakery' | 'brewery' | 'nightclub'
 *   - contact_name (VARCHAR, nullable)
 *   - contact_role (VARCHAR, nullable)
 *   - contact_phone (VARCHAR, nullable)
 *   - contact_email (VARCHAR, nullable)
 *   - relationship_strength (INTEGER, 0-5) - agent's relationship rating
 *   - lead_source (VARCHAR) - 'cold_walk_in' | 'friend_intro' | 'referral' | 'event' | 'quick_lead'
 *   - heat_score (INTEGER, 0-100) - calculated lead quality score
 *   - status (VARCHAR) - 'new' | 'contacted' | 'follow_up' | 'demo_scheduled' | 'verbal_yes' | 'signed_pending' | 'live'
 *   - notes (TEXT, nullable) - agent notes
 *   - assigned_captain_id (UUID, nullable FK to street_users) - for captain assignment
 *   - approved_by (UUID, nullable FK to street_users) - HQ admin approval
 *   - approved_at (TIMESTAMP, nullable)
 *   - first_membership_date (TIMESTAMP, nullable) - when venue went live
 *   - patron_pass_business_id (UUID, nullable) - link to main business table (future)
 *   - created_at (TIMESTAMP)
 *
 * Reads: Dashboard (stats), LeadPipeline (kanban), LeadDetails, EarningsScreen, Leaderboard
 * Writes: AddLeadForm (create), LeadDetails (update status)
 *
 * // HQ admin: Mark leads as approved, assign to captains, mark as live
 * // Integration: Sync 'signed_pending' and 'live' leads to website_partnership_inquiries
 *
 * -----------------------------------------------------------------------------
 * TABLE: street_venue_photos
 * -----------------------------------------------------------------------------
 * Photos captured during venue visits (exterior, business cards, selfies)
 *
 * Fields used:
 *   - id (UUID, PK)
 *   - venue_lead_id (UUID, nullable FK to street_venue_leads)
 *   - run_id (UUID, nullable FK to street_runs)
 *   - url (VARCHAR) - Supabase Storage URL
 *   - type (VARCHAR) - 'exterior' | 'business_card' | 'owner_selfie' | 'other'
 *   - created_at (TIMESTAMP)
 *
 * Reads: LeadDetails (future)
 * Writes: LeadDetails (future photo upload feature)
 *
 * NOTE: Photo upload not yet implemented in UI
 *
 * -----------------------------------------------------------------------------
 * TABLE: street_missions
 * -----------------------------------------------------------------------------
 * Gamified missions/challenges (daily, weekly, special)
 *
 * Fields used:
 *   - id (UUID, PK)
 *   - title (VARCHAR) - mission name
 *   - description (TEXT) - what to do
 *   - type (VARCHAR) - 'daily' | 'weekly' | 'one_off'
 *   - scope (VARCHAR) - 'global' | 'city'
 *   - city (VARCHAR, nullable) - if scope='city', which city
 *   - xp_reward (INTEGER) - XP awarded on completion
 *   - point_reward (INTEGER) - bonus points (unused currently)
 *   - required_count (INTEGER) - e.g., "add 3 leads"
 *   - valid_from (TIMESTAMP) - mission start date
 *   - valid_to (TIMESTAMP) - mission end date
 *   - created_by (UUID, nullable FK to street_users) - HQ admin who created it
 *   - created_at (TIMESTAMP)
 *
 * Reads: Dashboard (preview), MissionsScreen (list)
 * Writes: setup.ts (seed initial missions)
 *
 * // HQ admin: Create missions from admin dashboard (future)
 *
 * -----------------------------------------------------------------------------
 * TABLE: street_mission_progress
 * -----------------------------------------------------------------------------
 * User progress on missions
 *
 * Fields used:
 *   - id (UUID, PK)
 *   - mission_id (UUID, FK to street_missions)
 *   - user_id (UUID, FK to street_users)
 *   - current_count (INTEGER) - progress counter
 *   - is_completed (BOOLEAN) - true when current_count >= required_count
 *   - completed_at (TIMESTAMP, nullable)
 *   - xp_awarded (BOOLEAN) - true after user claims reward
 *
 * Reads: MissionsScreen (shows progress)
 * Writes: missionService (auto-updates on actions), MissionsScreen (claim)
 *
 * -----------------------------------------------------------------------------
 * TABLE: street_xp_events
 * -----------------------------------------------------------------------------
 * Audit log of all XP gains (immutable ledger)
 *
 * Fields used:
 *   - id (UUID, PK)
 *   - user_id (UUID, FK to street_users)
 *   - source (VARCHAR) - 'mission' | 'run_completed' | 'venue_status_change' | 'manual_bonus'
 *   - source_id (UUID, nullable) - FK to related record (mission/run/lead)
 *   - xp_amount (INTEGER) - XP gained
 *   - points_amount (INTEGER) - bonus points (unused currently)
 *   - created_at (TIMESTAMP)
 *
 * Reads: xpService (sums for total_xp calculation)
 * Writes: xpService (logs every XP event)
 *
 * NOTE: This is append-only. street_users.total_xp is the aggregate.
 *
 * -----------------------------------------------------------------------------
 * TABLE: street_ranks
 * -----------------------------------------------------------------------------
 * Rank tiers and XP thresholds (reference data)
 *
 * Fields used:
 *   - id (UUID, PK)
 *   - name (VARCHAR) - 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Black Key'
 *   - min_xp (INTEGER) - XP required to reach this rank
 *   - perks_description (TEXT) - what this rank unlocks
 *   - order_index (INTEGER) - sort order
 *
 * Reads: RankSystemScreen (displays ladder), xpService (calculates rank), EarningsScreen (commission rate)
 * Writes: setup.ts (seed initial ranks)
 *
 * // HQ admin: Update rank perks descriptions or add new tiers (rare)
 *
 * -----------------------------------------------------------------------------
 * TABLE: street_notifications
 * -----------------------------------------------------------------------------
 * In-app notifications for users
 *
 * Fields used:
 *   - id (UUID, PK)
 *   - user_id (UUID, FK to street_users)
 *   - title (VARCHAR)
 *   - body (TEXT)
 *   - type (VARCHAR) - 'mission' | 'lead_update' | 'admin_broadcast'
 *   - is_read (BOOLEAN)
 *   - created_at (TIMESTAMP)
 *
 * Reads: Dashboard (unread count), NotificationsScreen (inbox)
 * Writes: notificationService (future), manual admin messages
 *
 * -----------------------------------------------------------------------------
 * OPTIONAL TABLE: street_account_deletion_requests
 * -----------------------------------------------------------------------------
 * User requests to delete their account (GDPR compliance)
 *
 * If this table doesn't exist, run:
 *
 * CREATE TABLE IF NOT EXISTS street_account_deletion_requests (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES street_users(id) ON DELETE CASCADE,
 *   reason TEXT,
 *   requested_at TIMESTAMP DEFAULT NOW(),
 *   processed_by UUID REFERENCES street_users(id),
 *   processed_at TIMESTAMP,
 *   status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
 * );
 *
 * Reads: None (admin only)
 * Writes: SettingsScreen (user request)
 *
 * =============================================================================
 * USAGE
 * =============================================================================
 *
 * Import this client in any component/service:
 *
 *   import { createClient } from '@/utils/supabase/client';
 *   const supabase = createClient();
 *
 * Or use the named export:
 *
 *   import { supabase } from '@/utils/supabase/client';
 *
 * Then use normally:
 *
 *   const { data, error } = await supabase
 *     .from('street_users')
 *     .select('*')
 *     .eq('id', userId)
 *     .single();
 *
 * Auth:
 *   await supabase.auth.signInWithPassword({ email, password });
 *   await supabase.auth.signOut();
 *
 * =============================================================================
 * ENVIRONMENT SETUP
 * =============================================================================
 *
 * The Supabase URL and anon key are currently imported from:
 *   /utils/supabase/info.tsx
 *
 * To point at your production Patron Pass project:
 *   1. Update projectId and publicAnonKey in /utils/supabase/info.tsx
 *   2. Ensure all street_* tables exist in that project
 *   3. Ensure RLS policies allow authenticated users to read/write their own data
 *
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = `https://${projectId}.supabase.co`;
  supabaseClient = createSupabaseClient(supabaseUrl, publicAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  
  return supabaseClient;
}

// Named export for convenience
export const supabase = createClient();

export type Database = {
  public: {
    Tables: {
      street_users: {
        Row: {
          id: string;
          email: string;
          role: 'ambassador' | 'city_captain' | 'hq_admin';
          full_name: string;
          city: string;
          instagram_handle: string | null;
          phone: string;
          status: 'pending' | 'active' | 'suspended';
          created_at: string;
          total_xp: number;
          current_rank: string;
          avatar_url: string | null;
        };
      };
      street_applications: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          email: string;
          phone: string;
          city: string;
          instagram_handle: string | null;
          experience_tags: string[];
          why_join: string;
          status: 'submitted' | 'reviewing' | 'approved' | 'rejected';
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
      };
      street_contract_acceptances: {
        Row: {
          id: string;
          user_id: string;
          agreement_version: string;
          accepted_at: string;
          ip_address: string | null;
          device_info: string | null;
          typed_signature: string;
        };
      };
      street_runs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          city: string;
          neighborhood: string;
          start_time: string;
          end_time: string | null;
          planned_venue_count: number;
          actual_venue_count: number;
          notes_summary: string | null;
          status: 'planned' | 'active' | 'completed';
          created_at: string;
        };
      };
      street_venue_leads: {
        Row: {
          id: string;
          created_by_user_id: string;
          city: string;
          venue_name: string;
          address: string;
          venue_type: string;
          contact_name: string | null;
          contact_role: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          relationship_strength: number;
          lead_source: string;
          heat_score: number;
          status: 'new' | 'contacted' | 'follow_up' | 'demo_scheduled' | 'verbal_yes' | 'signed_pending' | 'live';
          notes: string | null;
          assigned_captain_id: string | null;
          approved_by: string | null;
          approved_at: string | null;
          first_membership_date: string | null;
          patron_pass_business_id: string | null;
          created_at: string;
        };
      };
      street_venue_photos: {
        Row: {
          id: string;
          venue_lead_id: string | null;
          run_id: string | null;
          url: string;
          type: 'exterior' | 'business_card' | 'owner_selfie' | 'other';
          created_at: string;
        };
      };
      street_missions: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: 'daily' | 'weekly' | 'one_off';
          scope: 'global' | 'city';
          city: string | null;
          xp_reward: number;
          point_reward: number;
          required_count: number;
          valid_from: string;
          valid_to: string;
          created_by: string | null;
          created_at: string;
        };
      };
      street_mission_progress: {
        Row: {
          id: string;
          mission_id: string;
          user_id: string;
          current_count: number;
          is_completed: boolean;
          completed_at: string | null;
          xp_awarded: boolean;
        };
      };
      street_xp_events: {
        Row: {
          id: string;
          user_id: string;
          source: 'mission' | 'run_completed' | 'venue_status_change' | 'manual_bonus';
          source_id: string | null;
          xp_amount: number;
          points_amount: number;
          created_at: string;
        };
      };
      street_ranks: {
        Row: {
          id: string;
          name: string;
          min_xp: number;
          perks_description: string;
          order_index: number;
        };
      };
      street_notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: 'mission' | 'lead_update' | 'admin_broadcast';
          is_read: boolean;
          created_at: string;
        };
      };
    };
  };
};
