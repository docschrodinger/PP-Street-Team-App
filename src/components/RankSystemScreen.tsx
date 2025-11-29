import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Award, Sparkles, Crown, Lock, TrendingUp, DollarSign, Zap, CheckCircle2 } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import type { StreetUser } from '../hooks/useAuth';
import { motion } from 'motion/react';

interface RankSystemScreenProps {
  user: StreetUser;
  onBack: () => void;
}

const RANK_COLORS: Record<string, { primary: string; secondary: string; icon: any }> = {
  'Bronze': { primary: '#CD7F32', secondary: '#8B4513', icon: Award },
  'Silver': { primary: '#C0C0C0', secondary: '#A0A0A0', icon: Award },
  'Gold': { primary: '#FFD700', secondary: '#FFA500', icon: Award },
  'Platinum': { primary: '#E5E4E2', secondary: '#C0C0C0', icon: Award },
  'Diamond': { primary: '#B9F2FF', secondary: '#00CED1', icon: Sparkles },
  'Black Key': { primary: '#FFD700', secondary: '#FF7A59', icon: Crown },
};

export function RankSystemScreen({ user, onBack }: RankSystemScreenProps) {
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanks();
  }, []);

  async function loadRanks() {
    const supabase = createClient();
    const { data } = await supabase
      .from('street_ranks')
      .select('*')
      .order('order_index', { ascending: true });

    setRanks(data || []);
    setLoading(false);
  }

  const currentRankIndex = ranks.findIndex(r => r.name === user.current_rank);
  const nextRank = ranks[currentRankIndex + 1];
  const currentRankData = ranks[currentRankIndex];
  const xpToNext = nextRank ? nextRank.min_xp - user.total_xp : 0;
  const xpInCurrentRank = currentRankData ? user.total_xp - currentRankData.min_xp : 0;
  const xpNeededForNext = nextRank && currentRankData ? nextRank.min_xp - currentRankData.min_xp : 1;
  const progressPercent = Math.min((xpInCurrentRank / xpNeededForNext) * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block border-4 border-[#8A4FFF] p-6 mb-4 bg-[#151515] animate-pulse">
            <Award className="w-12 h-12 text-[#8A4FFF]" />
          </div>
          <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading Ranks...</p>
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
            <Award className="w-6 h-6 text-[#FFD700]" />
            Rank System
          </h3>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#050505] border-2 border-[#8A4FFF]">
            <TrendingUp className="w-4 h-4 text-[#8A4FFF]" />
            <span className="text-[#8A4FFF] font-bold text-sm">
              {currentRankIndex + 1}/{ranks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Current Status Hero */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-6 py-6 bg-gradient-to-br from-[#8A4FFF] to-[#7A3FEF] border-b-4 border-[#F6F2EE] relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF7A59] opacity-20 rotate-45" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#FFD700] opacity-20 rounded-full" />

        <div className="relative z-10">
          <p className="text-[#F6F2EE] text-xs uppercase tracking-widest mb-3 opacity-90">
            Your Current Rank
          </p>
          <div className="flex items-center gap-4 mb-4">
            <motion.div 
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 bg-[#FFD700] border-4 border-[#F6F2EE] flex items-center justify-center"
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}
            >
              <Award className="w-10 h-10 text-[#050505]" />
            </motion.div>
            <div className="flex-1">
              <h1 className="text-[#F6F2EE] mb-1">{user.current_rank}</h1>
              <p className="text-[#F6F2EE] opacity-90">{user.total_xp.toLocaleString()} XP</p>
            </div>
          </div>

          {nextRank ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#F6F2EE] text-sm opacity-90">
                  Next: {nextRank.name}
                </span>
                <span className="text-[#FFD700] font-bold text-sm">
                  {xpToNext.toLocaleString()} XP to go
                </span>
              </div>
              <div className="h-4 bg-[#050505] border-2 border-[#F6F2EE] overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF7A59]"
                />
                {progressPercent > 0 && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#F6F2EE]">
                    {Math.round(progressPercent)}%
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#050505]/50 border-2 border-[#FFD700]">
              <p className="text-[#FFD700] font-bold text-center">
                🏆 Maximum Rank Achieved! 🏆
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Rank Ladder */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 pb-24">
        {ranks.map((rank, index) => {
          const isCurrent = rank.name === user.current_rank;
          const isPast = index < currentRankIndex;
          const isFuture = index > currentRankIndex;
          const isBlackKey = rank.name === 'Black Key';
          const rankColor = RANK_COLORS[rank.name] || RANK_COLORS['Bronze'];
          const Icon = rankColor.icon;

          return (
            <motion.div
              key={rank.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`relative overflow-hidden ${
                isBlackKey
                  ? 'p-6 bg-gradient-to-br from-[#050505] via-[#1A1A1A] to-[#050505] border-4 border-[#FFD700]'
                  : isCurrent
                  ? 'p-5 bg-[#151515] border-4 border-[#8A4FFF]'
                  : isPast
                  ? 'p-5 bg-[#151515] border-3 border-[#00FF00]'
                  : 'p-5 bg-[#0A0A0A] border-3 border-[#F6F2EE]'
              } ${isFuture ? 'opacity-60' : ''}`}
              style={isCurrent ? { boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)' } : {}}
            >
              {/* Background pattern for Black Key */}
              {isBlackKey && (
                <motion.div
                  animate={{ 
                    backgroundPosition: ['0% 0%', '100% 100%']
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 215, 0, 0.3) 10px, rgba(255, 215, 0, 0.3) 20px)',
                    backgroundSize: '200% 200%'
                  }}
                />
              )}

              {/* Sparkles for Black Key */}
              {isBlackKey && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute top-4 right-4"
                >
                  <Sparkles className="w-6 h-6 text-[#FFD700]" />
                </motion.div>
              )}

              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-4">
                  {/* Rank Icon */}
                  <div
                    className="w-16 h-16 border-3 border-[#F6F2EE] flex items-center justify-center relative"
                    style={{ 
                      backgroundColor: isFuture ? '#050505' : rankColor.primary,
                      boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    {isFuture ? (
                      <Lock className="w-8 h-8 text-[#A0A0A0]" />
                    ) : (
                      <Icon className={`w-8 h-8 ${isBlackKey ? 'text-[#050505]' : 'text-[#F6F2EE]'}`} />
                    )}
                    {isPast && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#00FF00] border-2 border-[#F6F2EE] flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-[#050505]" />
                      </div>
                    )}
                  </div>

                  {/* Rank Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className={`font-bold uppercase tracking-wide ${
                          isBlackKey ? 'text-[#FFD700]' :
                          isCurrent ? 'text-[#8A4FFF]' :
                          isPast ? 'text-[#00FF00]' :
                          'text-[#A0A0A0]'
                        }`}
                      >
                        {rank.name}
                      </h4>
                      {isCurrent && (
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="px-3 py-1 bg-[#8A4FFF] border-2 border-[#F6F2EE]"
                        >
                          <span className="text-[#F6F2EE] text-xs uppercase tracking-wider font-bold">
                            Current
                          </span>
                        </motion.div>
                      )}
                      {isPast && (
                        <div className="px-2 py-1 bg-[#00FF00] border-2 border-[#F6F2EE]">
                          <span className="text-[#050505] text-xs uppercase tracking-wider font-bold">
                            Unlocked
                          </span>
                        </div>
                      )}
                      {isFuture && (
                        <div className="px-2 py-1 bg-transparent border-2 border-[#A0A0A0]">
                          <span className="text-[#A0A0A0] text-xs uppercase tracking-wider">
                            Locked
                          </span>
                        </div>
                      )}
                    </div>
                    <p className={`text-sm mb-3 ${isFuture ? 'text-[#A0A0A0]' : 'text-[#F6F2EE]'}`}>
                      {rank.description || `Reach ${rank.min_xp.toLocaleString()} XP to unlock`}
                    </p>

                    {/* Requirements */}
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className={`w-4 h-4 ${isFuture ? 'text-[#A0A0A0]' : 'text-[#8A4FFF]'}`} />
                      <span className={`text-xs ${isFuture ? 'text-[#A0A0A0]' : 'text-[#F6F2EE]'}`}>
                        {rank.min_xp.toLocaleString()} XP Required
                      </span>
                    </div>

                    {/* Perks Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-2 border-2 ${
                        isFuture ? 'bg-[#050505] border-[#A0A0A0]' : 'bg-[#050505] border-[#F6F2EE]'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className={`w-3 h-3 ${isFuture ? 'text-[#A0A0A0]' : 'text-[#FFD700]'}`} />
                          <span className={`text-xs uppercase tracking-wider ${
                            isFuture ? 'text-[#A0A0A0]' : 'text-[#A0A0A0]'
                          }`}>
                            Commission
                          </span>
                        </div>
                        <p className={`font-bold ${isFuture ? 'text-[#A0A0A0]' : 'text-[#FFD700]'}`}>
                          {rank.commission_rate * 100}%
                        </p>
                      </div>

                      <div className={`p-2 border-2 ${
                        isFuture ? 'bg-[#050505] border-[#A0A0A0]' : 'bg-[#050505] border-[#F6F2EE]'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className={`w-3 h-3 ${isFuture ? 'text-[#A0A0A0]' : 'text-[#8A4FFF]'}`} />
                          <span className={`text-xs uppercase tracking-wider ${
                            isFuture ? 'text-[#A0A0A0]' : 'text-[#A0A0A0]'
                          }`}>
                            Rev Share
                          </span>
                        </div>
                        <p className={`font-bold ${isFuture ? 'text-[#A0A0A0]' : 'text-[#8A4FFF]'}`}>
                          {rank.max_rev_share_months}mo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional perks */}
                {rank.perks && rank.perks.length > 0 && (
                  <div className={`pt-3 border-t-2 ${isFuture ? 'border-[#A0A0A0]/30' : 'border-[#F6F2EE]/30'}`}>
                    <p className={`text-xs uppercase tracking-wider mb-2 ${
                      isFuture ? 'text-[#A0A0A0]' : 'text-[#A0A0A0]'
                    }`}>
                      Perks
                    </p>
                    <ul className="space-y-1">
                      {rank.perks.map((perk: string, i: number) => (
                        <li key={i} className={`text-xs flex items-start gap-2 ${
                          isFuture ? 'text-[#A0A0A0]' : 'text-[#F6F2EE]'
                        }`}>
                          <span className={isFuture ? 'text-[#A0A0A0]' : 'text-[#8A4FFF]'}>•</span>
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
