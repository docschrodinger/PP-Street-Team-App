import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface StreetUser {
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
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [streetUser, setStreetUser] = useState<StreetUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsContract, setNeedsContract] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadStreetUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadStreetUser(session.user.id);
      } else {
        setStreetUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadStreetUser(userId: string) {
    const supabase = createClient();
    
    console.log('Loading street user for ID:', userId);
    const { data: streetUserData, error: userError } = await supabase
      .from('street_users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Street user query result:', { streetUserData, userError });

    if (userError) {
      console.error('Error loading street user:', {
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code,
        fullError: userError
      });
      setLoading(false);
      return;
    }

    if (streetUserData) {
      setStreetUser(streetUserData as StreetUser);

      // Check if user needs to sign contract
      const { data: contractData, error: contractError } = await supabase
        .from('street_contract_acceptances')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Contract query result:', { contractData, contractError });

      setNeedsContract(!contractData && streetUserData.status === 'pending');
      
      // Check if user has seen onboarding
      const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${userId}`);
      setNeedsOnboarding(!hasSeenOnboarding && !contractData);
    }

    setLoading(false);
  }

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    console.log('Calling Supabase signInWithPassword...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('Supabase auth response - data:', data, 'error:', error);
    return { data, error };
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setStreetUser(null);
  };

  const markOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_seen_${user.id}`, 'true');
      setNeedsOnboarding(false);
    }
  };

  return {
    user,
    streetUser,
    loading,
    needsContract,
    needsOnboarding,
    signIn,
    signOut,
    markOnboardingComplete,
  };
}
