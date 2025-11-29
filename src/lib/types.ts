/**
 * PATRON PASS STREET TEAM - TYPE DEFINITIONS
 * 
 * These types match the Supabase database schema.
 * Kept in sync with /utils/supabase/client.ts Database type.
 */

export type UserRole = 'ambassador' | 'city_captain' | 'hq_admin';
export type UserStatus = 'pending' | 'active' | 'suspended';
export type ApplicationStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected';
export type RunStatus = 'planned' | 'active' | 'completed';
export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'demo_scheduled' | 'verbal_yes' | 'signed_pending' | 'live';
export type VenueType = 'restaurant' | 'bar' | 'café' | 'bakery' | 'brewery' | 'nightclub';
export type LeadSource = 'cold_walk_in' | 'friend_intro' | 'referral' | 'event' | 'quick_lead';
export type PhotoType = 'exterior' | 'business_card' | 'owner_selfie' | 'other';
export type MissionType = 'daily' | 'weekly' | 'one_off';
export type MissionScope = 'global' | 'city';
export type XPSource = 'mission' | 'run_completed' | 'venue_status_change' | 'manual_bonus';
export type NotificationType = 'mission' | 'lead_update' | 'admin_broadcast';
export type RankName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Black Key';

export interface StreetUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  city: string;
  instagram_handle: string | null;
  phone: string;
  status: UserStatus;
  created_at: string;
  total_xp: number;
  current_rank: RankName;
  avatar_url: string | null;
  preferences?: {
    email_notifications?: boolean;
    push_notifications?: boolean;
  };
}

export interface StreetApplication {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  instagram_handle: string | null;
  experience_tags: string[];
  why_join: string;
  status: ApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface StreetContractAcceptance {
  id: string;
  user_id: string;
  agreement_version: string;
  accepted_at: string;
  ip_address: string | null;
  device_info: string | null;
  typed_signature: string;
}

export interface StreetRun {
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
  status: RunStatus;
  created_at: string;
}

export interface StreetVenueLead {
  id: string;
  created_by_user_id: string;
  city: string;
  venue_name: string;
  address: string;
  venue_type: VenueType;
  contact_name: string | null;
  contact_role: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  relationship_strength: number;
  lead_source: LeadSource;
  heat_score: number;
  status: LeadStatus;
  notes: string | null;
  assigned_captain_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  first_membership_date: string | null;
  patron_pass_business_id: string | null;
  created_at: string;
}

export interface StreetVenuePhoto {
  id: string;
  venue_lead_id: string | null;
  run_id: string | null;
  url: string;
  type: PhotoType;
  created_at: string;
}

export interface StreetMission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  scope: MissionScope;
  city: string | null;
  xp_reward: number;
  point_reward: number;
  required_count: number;
  valid_from: string;
  valid_to: string;
  created_by: string | null;
  created_at: string;
}

export interface StreetMissionProgress {
  id: string;
  mission_id: string;
  user_id: string;
  current_count: number;
  is_completed: boolean;
  completed_at: string | null;
  xp_awarded: boolean;
}

export interface StreetXPEvent {
  id: string;
  user_id: string;
  source: XPSource;
  source_id: string | null;
  xp_amount: number;
  points_amount: number;
  created_at: string;
}

export interface StreetRank {
  id: string;
  name: RankName;
  min_xp: number;
  perks_description: string;
  order_index: number;
}

export interface StreetNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface StreetAccountDeletionRequest {
  id: string;
  user_id: string;
  reason: string | null;
  requested_at: string;
  processed_by: string | null;
  processed_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

// Supabase Database type (matches /utils/supabase/client.ts)
export interface Database {
  public: {
    Tables: {
      street_users: {
        Row: StreetUser;
        Insert: Omit<StreetUser, 'created_at'>;
        Update: Partial<Omit<StreetUser, 'id' | 'created_at'>>;
      };
      street_applications: {
        Row: StreetApplication;
        Insert: Omit<StreetApplication, 'id' | 'created_at'>;
        Update: Partial<Omit<StreetApplication, 'id' | 'created_at'>>;
      };
      street_contract_acceptances: {
        Row: StreetContractAcceptance;
        Insert: Omit<StreetContractAcceptance, 'id'>;
        Update: Partial<Omit<StreetContractAcceptance, 'id'>>;
      };
      street_runs: {
        Row: StreetRun;
        Insert: Omit<StreetRun, 'id' | 'created_at'>;
        Update: Partial<Omit<StreetRun, 'id' | 'created_at'>>;
      };
      street_venue_leads: {
        Row: StreetVenueLead;
        Insert: Omit<StreetVenueLead, 'id' | 'created_at'>;
        Update: Partial<Omit<StreetVenueLead, 'id' | 'created_at'>>;
      };
      street_venue_photos: {
        Row: StreetVenuePhoto;
        Insert: Omit<StreetVenuePhoto, 'id' | 'created_at'>;
        Update: Partial<Omit<StreetVenuePhoto, 'id' | 'created_at'>>;
      };
      street_missions: {
        Row: StreetMission;
        Insert: Omit<StreetMission, 'id' | 'created_at'>;
        Update: Partial<Omit<StreetMission, 'id' | 'created_at'>>;
      };
      street_mission_progress: {
        Row: StreetMissionProgress;
        Insert: Omit<StreetMissionProgress, 'id'>;
        Update: Partial<Omit<StreetMissionProgress, 'id'>>;
      };
      street_xp_events: {
        Row: StreetXPEvent;
        Insert: Omit<StreetXPEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<StreetXPEvent, 'id' | 'created_at'>>;
      };
      street_ranks: {
        Row: StreetRank;
        Insert: Omit<StreetRank, 'id'>;
        Update: Partial<Omit<StreetRank, 'id'>>;
      };
      street_notifications: {
        Row: StreetNotification;
        Insert: Omit<StreetNotification, 'id' | 'created_at'>;
        Update: Partial<Omit<StreetNotification, 'id' | 'created_at'>>;
      };
      street_account_deletion_requests: {
        Row: StreetAccountDeletionRequest;
        Insert: Omit<StreetAccountDeletionRequest, 'id' | 'requested_at'>;
        Update: Partial<Omit<StreetAccountDeletionRequest, 'id' | 'requested_at'>>;
      };
    };
  };
}
