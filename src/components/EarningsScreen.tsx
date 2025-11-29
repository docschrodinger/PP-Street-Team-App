import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, DollarSign, TrendingUp, Clock, Award, Zap, Target, CheckCircle2 } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { getCommissionRateByRank } from '../lib/xpService';
import type { StreetUser } from '../lib/types';
import { motion } from 'motion/react';

interface EarningsScreenProps {
  user: StreetUser;
  onBack: () => void;
}

export function EarningsScreen({ user, onBack }: EarningsScreenProps) {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarningsData();
  }, [user.id]);

  async function loadEarningsData() {
    // Get all signed_pending and live venues
    const { data } = await supabase
      .from('street_venue_leads')
      .select('*')
      .eq('created_by_user_id', user.id)
      .in('status', ['signed_pending', 'live'])
      .order('created_at', { ascending: false });

    setVenues(data || []);
    setLoading(false);
  }

  const commissionRate = getCommissionRateByRank(user.current_rank);
  const liveVenues = venues.filter(v => v.status === 'live');
  const pendingVenues = venues.filter(v => v.status === 'signed_pending');

  // ESTIMATED EARNINGS CALCULATION
  // This is a simple estimate based on average platform fee per venue
  // In production, actual revenue would come from the main Patron Pass billing system
  const ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE = 150; // Configurable estimate
  
  const estimatedMonthly = liveVenues.length * ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE * commissionRate;
  const potentialMonthly = (liveVenues.length + pendingVenues.length) * ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE * commissionRate;
  const totalPending = pendingVenues.length * ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE * commissionRate;
  const estimatedAnnual = estimatedMonthly * 12;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block border-4 border-[#8A4FFF] p-6 mb-4 bg-[#151515] animate-pulse">
            <DollarSign className="w-12 h-12 text-[#8A4FFF]" />
          </div>
          <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading Earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Animated gradient accent */}
      <motion.div 
        animate={{ 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-[#8A4FFF] to-[#FF7A59]"
        style={{ backgroundSize: '200% 100%' }}
      />

      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <h3 className="text-[#F6F2EE] flex-1 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#FFD700]" />
            Earnings & Rev-Share
          </h3>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#050505] border-2 border-[#FFD700]">
            <span className="text-[#FFD700] font-bold text-sm">
              {(commissionRate * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Hero Summary */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-6 py-6 bg-gradient-to-br from-[#8A4FFF] to-[#7A3FEF] border-b-4 border-[#F6F2EE] relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FFD700] opacity-20 rotate-45" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#FF7A59] opacity-20 rounded-full" />

        <div className="relative z-10">
          <p className="text-[#F6F2EE] text-xs uppercase tracking-widest mb-3 opacity-90">
            Monthly Recurring Revenue
          </p>
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-[#F6F2EE] mb-4"
          >
            ${Math.floor(estimatedMonthly)}
            <span className="text-2xl opacity-75">/mo</span>
          </motion.h1>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#050505]/50 border-2 border-[#F6F2EE]">
              <p className="text-[#F6F2EE] text-xs uppercase tracking-wide mb-1 opacity-75">Annual</p>
              <p className="text-[#FFD700] font-bold text-lg">${Math.floor(estimatedAnnual)}</p>
            </div>
            <div className="p-3 bg-[#050505]/50 border-2 border-[#F6F2EE]">
              <p className="text-[#F6F2EE] text-xs uppercase tracking-wide mb-1 opacity-75">Potential</p>
              <p className="text-[#FF7A59] font-bold text-lg">${Math.floor(potentialMonthly)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-24">
        
        {/* Commission Rate Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-5 bg-[#151515] border-3 border-[#F6F2EE]"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#8A4FFF]" />
                Your Commission Rate
              </h4>
              <p className="text-[#A0A0A0] text-xs">
                Based on {user.current_rank} rank
              </p>
            </div>
            <div className="text-right">
              <motion.p 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl font-bold text-[#8A4FFF]"
              >
                {(commissionRate * 100)}%
              </motion.p>
            </div>
          </div>
          <p className="text-[#A0A0A0] text-sm">
            Upgrade your rank to unlock higher commission rates and longer rev-share periods.
          </p>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-5 bg-[#151515] border-3 border-[#8A4FFF]"
        >
          <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#8A4FFF]" />
            How Rev-Share Works
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#8A4FFF] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0">
                <span className="text-[#F6F2EE] font-bold">1</span>
              </div>
              <div>
                <p className="text-[#F6F2EE] font-bold mb-1">Sign Venues</p>
                <p className="text-[#A0A0A0] text-sm">
                  You earn {(commissionRate * 100)}% of platform fees from venues you sign
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#8A4FFF] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0">
                <span className="text-[#F6F2EE] font-bold">2</span>
              </div>
              <div>
                <p className="text-[#F6F2EE] font-bold mb-1">Recurring Revenue</p>
                <p className="text-[#A0A0A0] text-sm">
                  Earn monthly as long as venues stay active on the platform
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#8A4FFF] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0">
                <span className="text-[#F6F2EE] font-bold">3</span>
              </div>
              <div>
                <p className="text-[#F6F2EE] font-bold mb-1">Get Paid</p>
                <p className="text-[#A0A0A0] text-sm">
                  Payments made monthly, net 30 days via direct deposit
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#FFD700] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-[#050505]" />
              </div>
              <div>
                <p className="text-[#FFD700] font-bold mb-1">Rank Up for More</p>
                <p className="text-[#A0A0A0] text-sm">
                  Higher ranks = higher commission rates & longer rev-share periods
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Venue Breakdown */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#8A4FFF]" />
            Active Venues
          </h4>

          {venues.length === 0 ? (
            <div className="text-center py-12 bg-[#151515] border-3 border-[#F6F2EE]">
              <DollarSign className="w-16 h-16 text-[#A0A0A0] mx-auto mb-4" />
              <p className="text-[#A0A0A0] mb-2">No venues generating revenue yet</p>
              <p className="text-[#8A4FFF] text-sm">Start signing venues to build your income!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {venues.map((venue, index) => {
                const isLive = venue.status === 'live';
                const monthlyEarnings = ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE * commissionRate;
                
                return (
                  <motion.div
                    key={venue.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + (index * 0.05) }}
                    className={`p-4 border-3 ${
                      isLive ? 'bg-[#151515] border-[#00FF00]' : 'bg-[#0A0A0A] border-[#FFD700]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[#F6F2EE] font-bold">{venue.venue_name}</h4>
                          {isLive ? (
                            <div className="px-2 py-0.5 bg-[#00FF00] border-2 border-[#F6F2EE]">
                              <span className="text-[#050505] text-xs font-bold uppercase">Live</span>
                            </div>
                          ) : (
                            <div className="px-2 py-0.5 bg-[#FFD700] border-2 border-[#F6F2EE]">
                              <span className="text-[#050505] text-xs font-bold uppercase">Pending</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[#A0A0A0] text-xs">{venue.address}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`font-bold ${isLive ? 'text-[#00FF00]' : 'text-[#FFD700]'}`}>
                          ${Math.floor(monthlyEarnings)}
                        </p>
                        <p className="text-[#A0A0A0] text-xs">/month</p>
                      </div>
                    </div>

                    {/* Days since creation */}
                    <div className="flex items-center gap-2 text-xs text-[#A0A0A0] mt-2">
                      <Clock className="w-3 h-3" />
                      <span>
                        Added {Math.floor((Date.now() - new Date(venue.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-[#0A0A0A] border-2 border-[#F6F2EE]"
        >
          <p className="text-[#A0A0A0] text-xs">
            <strong className="text-[#F6F2EE]">Note:</strong> Earnings shown are estimates based on average platform fees. 
            Actual earnings may vary based on venue subscription tier and activity. 
            Final payments calculated from actual billing data.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
