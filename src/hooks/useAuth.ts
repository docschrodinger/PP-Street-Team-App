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
  const [error, setError] = useState<string | null>(null);
  const [needsContract, setNeedsContract] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check current session
    console.log('useAuth: Checking initial session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('useAuth: Session check result:', { session: !!session, error });
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('useAuth: User found, loading street user data...');
        loadStreetUser(session.user.id);
      } else {
        console.log('useAuth: No active session, stopping loading');
        setLoading(false);
      }
    }).catch(err => {
      console.error('useAuth: Failed to get session:', err);
      setLoading(false);
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
    
    // Add 10-second timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 10000)
    );

    try {
      console.log('Loading street user for ID:', userId);
      
      const queryPromise = supabase
        .from('street_users')
        .select('*')
        .eq('id', userId)
        .single();

      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data: streetUserData, error: userError } = result as any;

      console.log('Street user query result:', { streetUserData, userError });

      if (userError) {
        console.error('Error loading street user:', {
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          code: userError.code,
          fullError: userError
        });
        setError(`Failed to load profile: ${userError.message}`);
        setLoading(false);
        return;
      }

      if (streetUserData) {
        setStreetUser(streetUserData as StreetUser);

        // Check if user needs to sign contract
        try {
          const contractQueryPromise = supabase
            .from('street_contract_acceptances')
            .select('*')
            .eq('user_id', userId)
            .single();

          const contractResult = await Promise.race([contractQueryPromise, timeoutPromise]);
          const { data: contractData, error: contractError } = contractResult as any;

          console.log('Contract query result:', { contractData, contractError });

          setNeedsContract(!contractData && streetUserData.status === 'pending');
          
          // Check if user has seen onboarding
          const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${userId}`);
          setNeedsOnboarding(!hasSeenOnboarding && !contractData);
        } catch (contractError) {
          console.error('Contract query timeout or error:', contractError);
          // Default to no contract needed if query fails
          setNeedsContract(false);
          setNeedsOnboarding(false);
        }
      }
    } catch (error: any) {
      console.error('Timeout or error loading street user:', error);
      setError(error?.message || 'Failed to load user data');
    } finally {
      // CRITICAL: Always stop loading, even on error
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    console.log('Calling Supabase signInWithPassword...');
    
    // Add 15-second timeout to prevent hanging on network failure
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network request timeout - please check your connection')), 15000)
    );
    
    try {
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const result = await Promise.race([authPromise, timeoutPromise]);
      const { data, error } = result as any;
      
      console.log('Supabase auth response - data:', data, 'error:', error);
      return { data, error };
    } catch (timeoutError: any) {
      console.error('Auth timeout or network error:', timeoutError);
      return { 
        data: { user: null, session: null }, 
        error: { message: timeoutError.message || 'Connection timeout' }
      };
    }
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
    error,
    needsContract,
    needsOnboarding,
    signIn,
    signOut,
    markOnboardingComplete,
  };
}
