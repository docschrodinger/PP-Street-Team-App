import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Trophy, TrendingUp, Award, Flame, Target, Zap, Crown, Medal } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { calculateStreak } from '../lib/streakService';
import type { StreetUser } from '../hooks/useAuth';
import { motion } from 'motion/react';

interface LeaderboardScreenProps {
  user: StreetUser;
  onBack: () => void;
}

type TimeFrame = 'all_time' | 'this_month' | 'this_week';

interface LeaderboardUser {
  id: string;
  full_name: string;
  city: string;
  total_xp: number;
  current_rank: string;
  avatar_url: string | null;
  venues_live: number;
  streak: number;
  position: number;
}

export function LeaderboardScreen({ user, onBack }: LeaderboardScreenProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all_time');
  const [loading, setLoading] = useState(true);
  const [userPosition, setUserPosition] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
    
    // Subscribe to real-time updates
    const supabase = createClient();
    const subscription = supabase
      .channel('public:street_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'street_users' }, (payload) => {
        loadLeaderboard();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [timeFrame]);

  async function loadLeaderboard() {
    const supabase = createClient();
    setLoading(true);

    try {
      // Get all users
      const { data: users, error } = await supabase
        .from('street_users')
        .select('*')
        .eq('status', 'active')
        .order('total_xp', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get live venues for each user
      const enrichedUsers = await Promise.all(
        (users || []).map(async (u, index) => {
          const { data: liveVenues } = await supabase
            .from('street_venue_leads')
            .select('id')
            .eq('created_by_user_id', u.id)
            .eq('status', 'live');

          // Get streak
          const streakData = await calculateStreak(u.id);

          return {
            id: u.id,
            full_name: u.full_name,
            city: u.city,
            total_xp: u.total_xp,
            current_rank: u.current_rank,
            avatar_url: u.avatar_url,
            venues_live: liveVenues?.length || 0,
            streak: streakData.currentStreak,
            position: index + 1,
          } as LeaderboardUser;
        })
      );

      setLeaderboard(enrichedUsers);
      
      // Find current user's position
      const myPosition = enrichedUsers.findIndex(u => u.id === user.id);
      setUserPosition(myPosition !== -1 ? myPosition + 1 : null);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const top3 = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

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
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <div className="flex-1">
            <h3 className="text-[#F6F2EE] flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#FFD700]" />
              Leaderboard
            </h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#050505] border-2 border-[#8A4FFF]">
            <TrendingUp className="w-4 h-4 text-[#8A4FFF]" />
            <span className="text-[#8A4FFF] font-bold text-sm">
              #{userPosition || '--'}
            </span>
          </div>
        </div>

        {/* Time frame selector */}
        <div className="flex gap-2">
          {[
            { id: 'all_time' as TimeFrame, label: 'All Time' },
            { id: 'this_month' as TimeFrame, label: 'This Month' },
            { id: 'this_week' as TimeFrame, label: 'This Week' },
          ].map(tf => (
            <motion.button
              key={tf.id}
              onClick={() => setTimeFrame(tf.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 py-2 border-3 uppercase text-xs tracking-wider transition-all ${
                timeFrame === tf.id
                  ? 'bg-[#8A4FFF] border-[#F6F2EE] text-[#F6F2EE]'
                  : 'bg-transparent border-[#F6F2EE] text-[#A0A0A0] hover:border-[#8A4FFF]'
              }`}
            >
              {tf.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block p-6 bg-[#151515] border-3 border-[#FFD700] mb-4"
            >
              <Trophy className="w-12 h-12 text-[#FFD700]" />
            </motion.div>
            <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading rankings...</p>
          </div>
        ) : (
          <>
            {/* Podium - Top 3 */}
            {top3.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
              >
                <h4 className="text-[#F6F2EE] mb-4 text-center uppercase tracking-wider flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5 text-[#FFD700]" />
                  Top Performers
                </h4>
                
                {/* Podium Layout */}
                <div className="flex items-end justify-center gap-2 mb-6">
                  {/* 2nd Place */}
                  {top3[1] && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex-1 flex flex-col items-center"
                    >
                      <PodiumCard user={top3[1]} position={2} />
                      <div className="w-full h-24 bg-gradient-to-b from-[#C0C0C0] to-[#A0A0A0] border-4 border-[#F6F2EE] flex items-center justify-center">
                        <span className="text-4xl font-bold text-[#F6F2EE]">2</span>
                      </div>
                    </motion.div>
                  )}

                  {/* 1st Place */}
                  {top3[0] && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex-1 flex flex-col items-center"
                    >
                      <PodiumCard user={top3[0]} position={1} />
                      <div className="w-full h-32 bg-gradient-to-b from-[#FFD700] to-[#FFA500] border-4 border-[#F6F2EE] flex items-center justify-center relative overflow-hidden">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                        />
                        <Crown className="absolute top-2 w-8 h-8 text-[#F6F2EE]" />
                        <span className="text-5xl font-bold text-[#F6F2EE] relative z-10">1</span>
                      </div>
                    </motion.div>
                  )}

                  {/* 3rd Place */}
                  {top3[2] && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex-1 flex flex-col items-center"
                    >
                      <PodiumCard user={top3[2]} position={3} />
                      <div className="w-full h-16 bg-gradient-to-b from-[#CD7F32] to-[#8B4513] border-4 border-[#F6F2EE] flex items-center justify-center">
                        <span className="text-3xl font-bold text-[#F6F2EE]">3</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Rest of leaderboard */}
            {restOfLeaderboard.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[#F6F2EE] mb-3 uppercase tracking-wider text-sm">Rankings</h4>
                {restOfLeaderboard.map((u, index) => {
                  const isCurrentUser = u.id === user.id;
                  const actualPosition = index + 4;
                  
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-4 border-3 transition-all ${
                        isCurrentUser
                          ? 'bg-[#8A4FFF] border-[#FF7A59]'
                          : 'bg-[#151515] border-[#F6F2EE] hover:border-[#8A4FFF]'
                      }`}
                      style={isCurrentUser ? { boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' } : {}}
                    >
                      <div className="flex items-center gap-4">
                        {/* Position */}
                        <div className={`w-10 h-10 border-2 flex items-center justify-center ${
                          isCurrentUser ? 'border-[#F6F2EE] bg-[#FF7A59]' : 'border-[#F6F2EE] bg-[#050505]'
                        }`}>
                          <span className={`font-bold ${
                            isCurrentUser ? 'text-[#F6F2EE]' : 'text-[#A0A0A0]'
                          }`}>
                            {actualPosition}
                          </span>
                        </div>

                        {/* Avatar */}
                        <div className={`w-12 h-12 border-3 flex items-center justify-center ${
                          isCurrentUser ? 'bg-[#FF7A59] border-[#F6F2EE]' : 'bg-[#8A4FFF] border-[#F6F2EE]'
                        }`}>
                          <span className="text-[#F6F2EE] font-bold text-lg">
                            {u.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-bold truncate ${
                              isCurrentUser ? 'text-[#F6F2EE]' : 'text-[#F6F2EE]'
                            }`}>
                              {u.full_name}
                              {isCurrentUser && <span className="ml-2 text-[#FFD700]">★</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`flex items-center gap-1 ${
                              isCurrentUser ? 'text-[#F6F2EE]' : 'text-[#A0A0A0]'
                            }`}>
                              <Award className="w-3 h-3" />
                              {u.current_rank}
                            </span>
                            {u.streak > 0 && (
                              <span className={`flex items-center gap-1 ${
                                isCurrentUser ? 'text-[#FFD700]' : 'text-[#FF7A59]'
                              }`}>
                                <Flame className="w-3 h-3" />
                                {u.streak}d
                              </span>
                            )}
                          </div>
                        </div>

                        {/* XP */}
                        <div className="text-right">
                          <p className={`font-bold ${
                            isCurrentUser ? 'text-[#FFD700]' : 'text-[#8A4FFF]'
                          }`}>
                            {(u?.total_xp || 0).toLocaleString()}
                          </p>
                          <p className={`text-xs ${
                            isCurrentUser ? 'text-[#F6F2EE]' : 'text-[#A0A0A0]'
                          }`}>
                            XP
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {leaderboard.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="inline-block p-8 bg-[#151515] border-4 border-[#F6F2EE] mb-4">
                  <Trophy className="w-16 h-16 text-[#A0A0A0]" />
                </div>
                <p className="text-[#A0A0A0]">No rankings yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Podium Card Component
function PodiumCard({ user, position }: { user: LeaderboardUser; position: number }) {
  const colors = {
    1: { bg: '#FFD700', border: '#FFA500', icon: Crown },
    2: { bg: '#C0C0C0', border: '#A0A0A0', icon: Medal },
    3: { bg: '#CD7F32', border: '#8B4513', icon: Medal },
  };

  const color = colors[position as keyof typeof colors];
  const Icon = color.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="w-full mb-3 p-3 bg-[#151515] border-4 border-[#F6F2EE] relative"
      style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}
    >
      {/* Position badge */}
      <div 
        className="absolute -top-3 -right-3 w-10 h-10 border-3 border-[#F6F2EE] flex items-center justify-center"
        style={{ backgroundColor: color.bg }}
      >
        <Icon className="w-5 h-5 text-[#F6F2EE]" />
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-2">
        <div 
          className="w-14 h-14 border-3 border-[#F6F2EE] flex items-center justify-center mb-2"
          style={{ backgroundColor: color.bg }}
        >
          <span className="text-[#F6F2EE] font-bold text-xl">
            {user.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <p className="text-[#F6F2EE] font-bold text-sm text-center truncate w-full">
          {user.full_name}
        </p>
      </div>

      {/* Stats */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#A0A0A0]">XP</span>
          <span className="text-[#8A4FFF] font-bold">{user.total_xp.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#A0A0A0]">Live</span>
          <span className="text-[#00FF00] font-bold">{user.venues_live}</span>
        </div>
        {user.streak > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A0A0A0] flex items-center gap-1">
              <Flame className="w-3 h-3" />
              Streak
            </span>
            <span className="text-[#FF7A59] font-bold">{user.streak}d</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
