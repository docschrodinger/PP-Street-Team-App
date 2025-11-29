import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Target, Clock, Trophy, Zap, CheckCircle2, Gift, Flame, Star, Award } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { claimMissionReward } from '../lib/missionService';
import type { StreetUser } from '../lib/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface MissionsScreenProps {
  user: StreetUser;
  onBack: () => void;
}

export function MissionsScreen({ user, onBack }: MissionsScreenProps) {
  const [missions, setMissions] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly' | 'special'>('daily');
  const [loading, setLoading] = useState(true);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);

  useEffect(() => {
    loadMissions();
  }, [user.id]);

  async function loadMissions() {
    const today = new Date().toISOString();

    const { data } = await supabase
      .from('street_missions')
      .select(`
        *,
        street_mission_progress(*)
      `)
      .or(`scope.eq.global,city.eq.${user.city}`)
      .lte('valid_from', today)
      .gte('valid_to', today);

    setMissions(data || []);
    setLoading(false);
  }

  async function claimMission(missionId: string) {
    setClaimingMissionId(missionId);
    const result = await claimMissionReward(user.id, missionId);

    if (result.success) {
      toast.success(`Mission claimed!`, {
        description: `+${result.xpAwarded} XP earned! 🎯`,
      });
      await loadMissions();
    } else {
      toast.error(result.error || 'Failed to claim mission');
    }
    setClaimingMissionId(null);
  }

  const filteredMissions = missions.filter(m => m.type === selectedTab);
  
  // Calculate totals
  const totalAvailable = filteredMissions.length;
  const totalCompleted = filteredMissions.filter(m => m.street_mission_progress?.[0]?.is_completed).length;
  const totalXPAvailable = filteredMissions.reduce((sum, m) => sum + m.xp_reward, 0);
  const totalXPEarned = filteredMissions.reduce((sum, m) => {
    const progress = m.street_mission_progress?.[0];
    return sum + (progress?.xp_awarded || 0);
  }, 0);

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
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#8A4FFF]"
        style={{ backgroundSize: '200% 100%' }}
      />

      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <h3 className="text-[#F6F2EE] flex-1 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#8A4FFF]" />
            Missions
          </h3>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#050505] border-2 border-[#8A4FFF]">
            <Trophy className="w-4 h-4 text-[#FFD700]" />
            <span className="text-[#8A4FFF] font-bold text-sm">
              {totalCompleted}/{totalAvailable}
            </span>
          </div>
        </div>

        {/* XP Summary */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 bg-[#050505] border-2 border-[#8A4FFF] text-center">
            <p className="text-xl font-bold text-[#8A4FFF]">{totalXPEarned}</p>
            <p className="text-[#A0A0A0] text-xs uppercase">XP Earned</p>
          </div>
          <div className="p-3 bg-[#050505] border-2 border-[#FF7A59] text-center">
            <p className="text-xl font-bold text-[#FF7A59]">{totalXPAvailable - totalXPEarned}</p>
            <p className="text-[#A0A0A0] text-xs uppercase">Available</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['daily', 'weekly', 'special'] as const).map(tab => {
            const count = missions.filter(m => m.type === tab).length;
            return (
              <motion.button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 py-3 border-3 uppercase text-sm tracking-wider transition-all relative ${
                  selectedTab === tab
                    ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                    : 'bg-transparent border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
                }`}
                style={selectedTab === tab ? { boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)' } : {}}
              >
                {tab}
                {count > 0 && (
                  <span className={`ml-2 ${selectedTab === tab ? 'text-[#FFD700]' : 'text-[#8A4FFF]'}`}>
                    ({count})
                  </span>
                )}
                {selectedTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF7A59]"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block p-6 bg-[#151515] border-3 border-[#8A4FFF] mb-4"
            >
              <Target className="w-12 h-12 text-[#8A4FFF]" />
            </motion.div>
            <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading missions...</p>
          </div>
        ) : filteredMissions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="inline-block p-8 bg-[#151515] border-4 border-[#F6F2EE] mb-4">
              <Target className="w-16 h-16 text-[#A0A0A0]" />
            </div>
            <p className="text-[#A0A0A0] mb-2">No {selectedTab} missions available</p>
            <p className="text-[#8A4FFF] text-sm">Check back tomorrow for new challenges!</p>
          </motion.div>
        ) : (
          <div className="space-y-4 pb-6">
            <AnimatePresence mode="popLayout">
              {filteredMissions.map((mission, index) => {
                const progress = mission.street_mission_progress?.[0];
                const currentCount = progress?.current_count || 0;
                const isCompleted = progress?.is_completed || false;
                const isClaimed = progress?.xp_awarded || false;
                const progressPercent = Math.min((currentCount / mission.required_count) * 100, 100);
                const canClaim = isCompleted && !isClaimed;

                return (
                  <motion.div
                    key={mission.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative p-5 border-4 overflow-hidden ${
                      isClaimed ? 'bg-[#050505] border-[#A0A0A0] opacity-75' :
                      canClaim ? 'bg-gradient-to-br from-[#8A4FFF] to-[#7A3FEF] border-[#FFD700]' :
                      'bg-[#151515] border-[#F6F2EE] hover:border-[#8A4FFF]'
                    } transition-all cursor-pointer`}
                    style={canClaim ? { boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)' } : {}}
                  >
                    {/* Background pattern for completed */}
                    {canClaim && (
                      <motion.div
                        animate={{ 
                          backgroundPosition: ['0% 0%', '100% 100%']
                        }}
                        transition={{ 
                          duration: 3, 
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

                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-2 border-2 ${
                              isClaimed ? 'bg-[#050505] border-[#A0A0A0]' :
                              canClaim ? 'bg-[#FFD700] border-[#F6F2EE]' :
                              'bg-[#8A4FFF] border-[#F6F2EE]'
                            }`}>
                              {isClaimed ? (
                                <CheckCircle2 className="w-5 h-5 text-[#00FF00]" />
                              ) : canClaim ? (
                                <Gift className="w-5 h-5 text-[#050505]" />
                              ) : (
                                <Target className="w-5 h-5 text-[#F6F2EE]" />
                              )}
                            </div>
                            {mission.type === 'daily' && (
                              <div className="px-2 py-1 bg-[#FF7A59] border-2 border-[#F6F2EE]">
                                <Clock className="w-3 h-3 text-[#F6F2EE]" />
                              </div>
                            )}
                            {mission.type === 'special' && (
                              <div className="px-2 py-1 bg-[#FFD700] border-2 border-[#F6F2EE]">
                                <Star className="w-3 h-3 text-[#050505]" />
                              </div>
                            )}
                          </div>
                          <h4 className={`font-bold mb-1 ${
                            canClaim ? 'text-[#F6F2EE]' : 'text-[#F6F2EE]'
                          }`}>
                            {mission.title}
                          </h4>
                          <p className={`text-sm ${
                            isClaimed ? 'text-[#A0A0A0]' :
                            canClaim ? 'text-[#F6F2EE] opacity-90' :
                            'text-[#A0A0A0]'
                          }`}>
                            {mission.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          {isClaimed ? (
                            <div className="flex items-center gap-1 text-[#00FF00]">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-bold">Claimed</span>
                            </div>
                          ) : canClaim ? (
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <div className="px-3 py-2 bg-[#FFD700] border-2 border-[#F6F2EE]">
                                <span className="text-[#050505] font-bold text-lg">+{mission.xp_reward} XP</span>
                              </div>
                            </motion.div>
                          ) : (
                            <span className="text-[#8A4FFF] font-bold text-sm">+{mission.xp_reward} XP</span>
                          )}
                        </div>
                      </div>

                      {/* Progress */}
                      {!isClaimed && (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs ${
                              canClaim ? 'text-[#F6F2EE]' : 'text-[#A0A0A0]'
                            }`}>
                              Progress
                            </span>
                            <span className={`text-sm font-bold ${
                              canClaim ? 'text-[#FFD700]' : 'text-[#F6F2EE]'
                            }`}>
                              {currentCount} / {mission.required_count}
                            </span>
                          </div>
                          <div className={`h-3 border-2 overflow-hidden relative ${
                            canClaim ? 'bg-[#050505] border-[#F6F2EE]' : 'bg-[#050505] border-[#F6F2EE]'
                          }`}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              className={`h-full ${
                                canClaim ? 'bg-[#FFD700]' : 'bg-gradient-to-r from-[#8A4FFF] to-[#FF7A59]'
                              }`}
                            />
                            {progressPercent >= 100 && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="absolute right-1 top-1/2 -translate-y-1/2"
                              >
                                <Zap className="w-4 h-4 text-[#FFD700]" />
                              </motion.div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Claim button */}
                      {canClaim && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4"
                        >
                          <Button
                            onClick={() => claimMission(mission.id)}
                            disabled={claimingMissionId === mission.id}
                            className="w-full h-12 bg-[#FFD700] hover:bg-[#FFA500] border-3 border-[#F6F2EE] text-[#050505] uppercase tracking-wider font-bold transition-all relative overflow-hidden group"
                          >
                            {claimingMissionId === mission.id ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Zap className="w-5 h-5" />
                              </motion.div>
                            ) : (
                              <>
                                <Trophy className="w-5 h-5 mr-2" />
                                Claim Reward
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-40 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}

                      {/* Claimed badge */}
                      {isClaimed && (
                        <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-[#00FF00]/10 border-2 border-[#00FF00]">
                          <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
                          <span className="text-[#00FF00] text-sm font-bold uppercase">Completed & Claimed</span>
                        </div>
                      )}
                    </div>

                    {/* Sparkles on claimable */}
                    {canClaim && (
                      <>
                        <motion.div
                          animate={{ 
                            y: [-5, -15, -5],
                            opacity: [1, 0, 1]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: 0
                          }}
                          className="absolute top-2 right-2"
                        >
                          <Star className="w-4 h-4 text-[#FFD700]" fill="#FFD700" />
                        </motion.div>
                        <motion.div
                          animate={{ 
                            y: [-5, -15, -5],
                            opacity: [1, 0, 1]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: 0.5
                          }}
                          className="absolute top-4 right-8"
                        >
                          <Star className="w-3 h-3 text-[#FFD700]" fill="#FFD700" />
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
