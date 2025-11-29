import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { OnboardingWelcome } from '../onboarding/OnboardingWelcome';
import { CheckCircle2, AlertCircle, User } from 'lucide-react';
import { motion } from 'motion/react';

interface ReferralSignupPageProps {
  referralCode: string; // From URL param
  onStartOnboarding: (referralCode: string) => void;
}

export function ReferralSignupPage({ referralCode, onStartOnboarding }: ReferralSignupPageProps) {
  const [referrer, setReferrer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReferrer();
  }, [referralCode]);

  async function loadReferrer() {
    setLoading(true);
    setError(null);

    // Look up referrer by referral code
    const { data, error: fetchError } = await supabase
      .from('street_users')
      .select('id, first_name, last_name, profile_photo_url, live_venue_count, tier')
      .eq('referral_code', referralCode)
      .single();

    if (fetchError || !data) {
      setError('Invalid referral link');
      setLoading(false);
      return;
    }

    setReferrer(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="inline-block p-6 bg-[#151515] border-4 border-[#8A4FFF] mb-4 animate-pulse">
            <User className="w-12 h-12 text-[#8A4FFF]" />
          </div>
          <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !referrer) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className="p-8 bg-[#151515] border-4 border-[#FF4444]">
            <div className="text-center mb-6">
              <div className="inline-block p-6 bg-[#FF4444] border-4 border-[#F6F2EE] mb-4">
                <AlertCircle className="w-12 h-12 text-[#F6F2EE]" />
              </div>
              <h3 className="text-[#F6F2EE] mb-2">Invalid Referral Link</h3>
              <p className="text-[#A0A0A0] text-sm">
                This referral link is not valid or has expired.
              </p>
            </div>

            <button
              onClick={() => window.location.href = 'https://patronpass.com/join'}
              className="w-full p-4 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE] font-bold uppercase tracking-wider transition-all"
            >
              Apply Without Referral
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Referrer Info Banner */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b-4 border-[#F6F2EE] bg-gradient-to-r from-[#8A4FFF] to-[#7A3FEF] px-6 py-6"
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <CheckCircle2 className="w-6 h-6 text-[#00FF00]" />
            <p className="text-[#00FF00] text-sm font-bold uppercase tracking-wider">
              Valid Referral Link
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Referrer avatar */}
            <div className="w-16 h-16 bg-[#F6F2EE] border-3 border-[#050505] flex items-center justify-center flex-shrink-0">
              {referrer.profile_photo_url ? (
                <img src={referrer.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#8A4FFF] text-xl font-bold">
                  {referrer.first_name[0]}{referrer.last_name[0]}
                </span>
              )}
            </div>

            {/* Referrer info */}
            <div className="flex-1">
              <p className="text-[#F6F2EE] mb-1">
                <span className="font-bold">{referrer.first_name} {referrer.last_name}</span> invited you!
              </p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 border-2 border-[#F6F2EE] text-xs uppercase font-bold ${
                  referrer.tier === 'diamond' ? 'bg-[#FFD700] text-[#050505]' :
                  referrer.tier === 'platinum' ? 'bg-[#E5E4E2] text-[#050505]' :
                  referrer.tier === 'gold' ? 'bg-[#FFD700] text-[#050505]' :
                  referrer.tier === 'silver' ? 'bg-[#C0C0C0] text-[#050505]' :
                  'bg-[#CD7F32] text-[#F6F2EE]'
                }`}>
                  {referrer.tier || 'Bronze'}
                </span>
                <span className="text-[#F6F2EE] text-sm">
                  • {referrer.live_venue_count || 0} venues
                </span>
              </div>
            </div>
          </div>

          {/* Bonus info */}
          <div className="mt-4 p-3 bg-[#050505]/30 border-2 border-[#FFD700]">
            <p className="text-[#FFD700] text-sm">
              💰 <strong>{referrer.first_name}</strong> will earn bonuses when you succeed! 
              You'll both benefit from this partnership.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Onboarding welcome with referral context */}
      <OnboardingWelcome
        onStart={() => onStartOnboarding(referralCode)}
        onSignIn={() => {/* Handle sign in */}}
      />

      {/* Additional benefits section */}
      <div className="px-6 py-12 max-w-md mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-[#151515] border-3 border-[#8A4FFF]"
        >
          <h4 className="text-[#F6F2EE] font-bold mb-4 uppercase tracking-wider text-sm">
            Why Join Through {referrer.first_name}'s Link?
          </h4>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#8A4FFF] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#F6F2EE]" />
              </div>
              <div>
                <p className="text-[#F6F2EE] font-bold mb-1">Mentorship from {referrer.first_name}</p>
                <p className="text-[#A0A0A0]">
                  Get guidance from someone who's already succeeding
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#FF7A59] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#F6F2EE]" />
              </div>
              <div>
                <p className="text-[#F6F2EE] font-bold mb-1">Shared Success</p>
                <p className="text-[#A0A0A0]">
                  {referrer.first_name} benefits when you win, so they're motivated to help you
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#FFD700] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-[#050505]" />
              </div>
              <div>
                <p className="text-[#F6F2EE] font-bold mb-1">Proven System</p>
                <p className="text-[#A0A0A0]">
                  Learn from {referrer.first_name}'s experience signing {referrer.live_venue_count} venues
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <div className="mt-6 p-4 bg-[#0A0A0A] border-2 border-[#F6F2EE]">
          <p className="text-[#A0A0A0] text-xs text-center">
            By joining through this link, {referrer.first_name} will be notified and can help you get started. 
            This doesn't cost you anything - all the same benefits apply!
          </p>
        </div>
      </div>
    </div>
  );
}
