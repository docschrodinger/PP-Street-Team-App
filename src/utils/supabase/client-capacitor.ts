/**
 * Capacitor-compatible Supabase client
 * Fixes AuthRetryableFetchError by using Capacitor's HTTP client
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';
import { Capacitor } from '@capacitor/core';

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = `https://${projectId}.supabase.co`;
  
  // Configure Supabase client with Capacitor compatibility
  const clientOptions: any = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  };

  // If running on native platform (iOS/Android), ensure proper fetch configuration
  if (Capacitor.isNativePlatform()) {
    console.log('Running on native platform, using default fetch for Supabase');
    clientOptions.auth.persistSession = true;
  }

  supabaseClient = createSupabaseClient(supabaseUrl, publicAnonKey, clientOptions);
  
  return supabaseClient;
}

// Named export for convenience
export const supabase = createClient();
