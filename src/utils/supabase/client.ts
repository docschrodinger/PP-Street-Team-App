import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

/**
 * Supabase Client Configuration
 * 
 * Custom fetch wrapper for debugging network issues
 */

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

// Custom fetch with detailed logging
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  console.log('🌐 Supabase fetch START:', input);

  try {
    // Test basic fetch first
    console.log('🧪 Testing basic fetch to google.com...');
    try {
      const testResponse = await fetch('https://www.google.com', { method: 'HEAD' });
      console.log('✅ Google fetch works:', testResponse.status);
    } catch (testError) {
      console.error('❌ Google fetch FAILED:', testError);
      console.error('❌ This means the simulator has NO network access');
    }
    
    const response = await fetch(input, init);
    console.log('✅ Supabase fetch SUCCESS:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorBody = await response.clone().text();
      console.error('❌ Supabase response error body:', errorBody);
    }
    
    return response;
  } catch (error) {
    console.error('💥 Supabase fetch EXCEPTION:', error);
    console.error('💥 Error type:', typeof error);
    console.error('💥 Error constructor:', error?.constructor?.name);
    console.error('💥 Error message:', (error as any)?.message);
    console.error('💥 Error stack:', (error as any)?.stack);
    throw error;
  }
};

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = `https://${projectId}.supabase.co`;
  
  console.log('🔧 Creating Supabase client:', supabaseUrl);
  console.log('🔧 localStorage available:', typeof window !== 'undefined' && !!window.localStorage);
  
  supabaseClient = createSupabaseClient(supabaseUrl, publicAnonKey, {
    auth: {
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: customFetch,
      headers: {
        'X-Client-Info': 'patron-pass-capacitor-ios',
      },
    },
  });
  
  console.log('✅ Supabase client created');
  
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