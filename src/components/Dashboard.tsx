import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import {
  Play,
  Target,
  TrendingUp,
  MapPin,
  Bell,
  Flame,
  Award,
  DollarSign,
  Zap,
  ChevronRight,
  Clock,
  TrendingDown
} from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { calculateStreak } from '../lib/streakService';
import { getCommissionRateByRank } from '../lib/xpService';
import type { StreetUser } from '../hooks/useAuth';
import { motion } from 'motion/react';

interface DashboardProps {
  user: StreetUser;
  onNavigate: (screen: string) => void;
}

interface DashboardStats {
  streak: number;
  longestStreak: number;
  isActiveToday: boolean;
  venuesThisWeek: number;
  venuesThisMonth: number;
  venuesPending: number;
  venuesLive: number;
  estimatedMonthlyEarnings: number;
  todayMissions: any[];
  activeMissions: any[];
  recentRuns: any[];
  unreadNotifications: number;
  totalLeads: number;
  weekProgress: number;
}

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    streak: 0,
    longestStreak: 0,
    isActiveToday: false,
    venuesThisWeek: 0,
    venuesThisMonth: 0,
    venuesPending: 0,
    venuesLive: 0,
    estimatedMonthlyEarnings: 0,
    todayMissions: [],
    activeMissions: [],
    recentRuns: [],
    unreadNotifications: 0,
    totalLeads: 0,
    weekProgress: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  async function loadDashboardData() {
    const supabase = createClient();

    try {
      // Parallel data fetching for performance
      const [
        streakData,
        weekVenues,
        monthVenues,
        pendingVenues,
        liveVenues,
        allLeads,
        missions,
        runs,
        notifications,
      ] = await Promise.all([
        calculateStreak(user.id),
        supabase
          .from('street_venue_leads')
          .select('*')
          .eq('created_by_user_id', user.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('street_venue_leads')
          .select('*')
          .eq('created_by_user_id', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('street_venue_leads')
          .select('*')
          .eq('created_by_user_id', user.id)
          .eq('status', 'signed_pending'),
        supabase
          .from('street_venue_leads')
          .select('*')
          .eq('created_by_user_id', user.id)
          .eq('status', 'live'),
        supabase
          .from('street_venue_leads')
          .select('*')
          .eq('created_by_user_id', user.id),
        supabase
          .from('street_missions')
          .select('*, street_mission_progress!left(*)')
          .or(`scope.eq.global,city.eq.${user.city}`)
          .lte('valid_from', new Date().toISOString())
          .gte('valid_to', new Date().toISOString())
          .limit(5),
        supabase
          .from('street_runs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('street_notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false),
      ]);

      // Calculate estimated earnings
      const commissionRate = getCommissionRateByRank(user.current_rank);
      const ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE = 150;
      const estimatedMonthlyEarnings = (liveVenues.data?.length || 0) * ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE * commissionRate;

      // Filter active missions (not completed)
      const activeMissions = missions.data?.filter((m: any) => {
        const progress = m.street_mission_progress?.[0];
        return !progress?.is_completed;
      }) || [];

      // Calculate week progress (0-100% based on goal)
      const weeklyGoal = 10; // venues per week
      const weekProgress = Math.min(((weekVenues.data?.length || 0) / weeklyGoal) * 100, 100);

      setStats({
        streak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        isActiveToday: streakData.isActiveToday,
        venuesThisWeek: weekVenues.data?.length || 0,
        venuesThisMonth: monthVenues.data?.length || 0,
        venuesPending: pendingVenues.data?.length || 0,
        venuesLive: liveVenues.data?.length || 0,
        estimatedMonthlyEarnings,
        todayMissions: missions.data?.slice(0, 2) || [],
        activeMissions,
        recentRuns: runs.data || [],
        unreadNotifications: notifications.data?.length || 0,
        totalLeads: allLeads.data?.length || 0,
        weekProgress,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const safeTotalXP = typeof user.total_xp === 'number' ? user.total_xp : 0;
  const safeCurrentRank = user.current_rank || 'Bronze';
  const nextRankXP = getNextRankXP(safeCurrentRank);
  const currentRankMinXP = getCurrentRankMinXP(safeCurrentRank);
  const xpInCurrentRank = Math.max(safeTotalXP - currentRankMinXP, 0);
  const xpNeededForNextRank = Math.max(nextRankXP - currentRankMinXP, 1);
  const progressPercent = Math.min((xpInCurrentRank / xpNeededForNextRank) * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <div className="inline-block border-4 border-[#8A4FFF] p-6 mb-4 bg-[#151515] animate-pulse">
            <Zap className="w-12 h-12 text-[#8A4FFF]" />
          </div>
          <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] relative overflow-hidden">
      {/* Gradient accent top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#8A4FFF]" />

      {/* Header with notifications */}
      <div className="relative border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-[#8A4FFF]" />
              <h4 className="text-[#A0A0A0] uppercase tracking-widest text-xs">
                {user.city}
              </h4>
            </div>
            <h2 className="text-[#F6F2EE]">{user.full_name}</h2>
          </div>
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-3 border-3 border-[#F6F2EE] hover:bg-[#8A4FFF] hover:border-[#8A4FFF] transition-all active:scale-95"
          >
            <Bell className="w-5 h-5 text-[#F6F2EE]" />
            {stats.unreadNotifications > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#FF7A59] border-2 border-[#151515] flex items-center justify-center"
              >
                <span className="text-xs text-[#F6F2EE] font-bold">
                  {stats.unreadNotifications}
                </span>
              </motion.div>
            )}
          </button>
        </div>

        {/* Rank progress bar */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#8A4FFF]" />
              <span className="text-[#F6F2EE] uppercase text-sm tracking-wide font-bold">
                {safeCurrentRank}
              </span>
            </div>
            <span className="text-[#A0A0A0] text-xs">
              {safeTotalXP.toLocaleString()} / {nextRankXP.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2 bg-[#050505] border-2 border-[#F6F2EE] overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#8A4FFF] to-[#FF7A59]"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-24">
        
        {/* HERO: Earnings & Streak - Asymmetric Layout */}
        <div className="grid grid-cols-5 gap-3">
          {/* Earnings - Takes 3 columns */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => onNavigate('earnings')}
            className="col-span-3 p-5 bg-gradient-to-br from-[#8A4FFF] to-[#7A3FEF] border-4 border-[#F6F2EE] relative overflow-hidden cursor-pointer active:scale-98 transition-transform"
            style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)' }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-[#F6F2EE]" />
                <span className="text-[#F6F2EE] text-xs uppercase tracking-widest opacity-90">
                  Monthly Rev
                </span>
              </div>
              <h1 className="text-[#F6F2EE] mb-1">
                ${Math.floor(stats.estimatedMonthlyEarnings)}
              </h1>
              <p className="text-[#F6F2EE] text-xs opacity-75">
                {stats.venuesLive} live venues
              </p>
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#FF7A59] opacity-20 rotate-45" />
          </motion.div>

          {/* Streak - Takes 2 columns */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-2 p-5 bg-[#151515] border-4 border-[#FF7A59] relative overflow-hidden"
            style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className={`p-3 border-2 mb-2 ${stats.isActiveToday ? 'bg-[#FF7A59] border-[#F6F2EE] animate-pulse' : 'bg-transparent border-[#FF7A59]'}`}>
                <Flame className={`w-8 h-8 ${stats.isActiveToday ? 'text-[#F6F2EE]' : 'text-[#FF7A59]'}`} />
              </div>
              <h3 className="text-[#F6F2EE] mb-0">{stats.streak}</h3>
              <p className="text-[#A0A0A0] text-xs uppercase tracking-wide">Day Streak</p>
              {!stats.isActiveToday && stats.streak > 0 && (
                <p className="text-[#FF7A59] text-xs mt-1">⚠️ Log activity today!</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Week Progress Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-[#151515] border-3 border-[#F6F2EE]"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#8A4FFF]" />
              <span className="text-[#F6F2EE] text-sm uppercase tracking-wide font-bold">
                This Week's Grind
              </span>
            </div>
            <span className="text-[#A0A0A0] text-xs">
              {stats.venuesThisWeek} / 10 venues
            </span>
          </div>
          <div className="h-3 bg-[#050505] border-2 border-[#F6F2EE] overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.weekProgress}%` }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="h-full bg-[#8A4FFF]"
            />
            {stats.weekProgress >= 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <Zap className="w-4 h-4 text-[#FFD700]" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="p-3 bg-[#151515] border-2 border-[#F6F2EE] text-center"
          >
            <p className="text-xl font-bold text-[#8A4FFF]">{stats.venuesThisMonth}</p>
            <p className="text-[#A0A0A0] text-xs uppercase mt-1">Month</p>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="p-3 bg-[#151515] border-2 border-[#F6F2EE] text-center"
          >
            <p className="text-xl font-bold text-[#FF7A59]">{stats.venuesPending}</p>
            <p className="text-[#A0A0A0] text-xs uppercase mt-1">Pending</p>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-3 bg-[#151515] border-2 border-[#F6F2EE] text-center"
          >
            <p className="text-xl font-bold text-[#8A4FFF]">{stats.venuesLive}</p>
            <p className="text-[#A0A0A0] text-xs uppercase mt-1">Live</p>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="p-3 bg-[#151515] border-2 border-[#F6F2EE] text-center"
          >
            <p className="text-xl font-bold text-[#A0A0A0]">{stats.totalLeads}</p>
            <p className="text-[#A0A0A0] text-xs uppercase mt-1">Total</p>
          </motion.div>
        </div>

        {/* Active Missions */}
        {stats.activeMissions.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[#F6F2EE] flex items-center gap-2">
                <Target className="w-5 h-5 text-[#8A4FFF]" />
                ACTIVE MISSIONS
              </h4>
              <button
                onClick={() => onNavigate('missions')}
                className="text-[#8A4FFF] text-xs uppercase tracking-wider hover:text-[#FF7A59] transition-colors flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {stats.activeMissions.slice(0, 2).map((mission: any, idx: number) => {
                const progress = mission.street_mission_progress?.[0];
                const currentCount = progress?.current_count || 0;
                const progressPercent = Math.min((currentCount / mission.required_count) * 100, 100);
                
                return (
                  <motion.div
                    key={mission.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + (idx * 0.1) }}
                    className="p-4 bg-[#151515] border-3 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors cursor-pointer"
                    onClick={() => onNavigate('missions')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-[#F6F2EE] font-bold mb-1">{mission.title}</p>
                        <p className="text-[#A0A0A0] text-xs">
                          {currentCount} / {mission.required_count} • {mission.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[#8A4FFF] font-bold text-sm">+{mission.xp_reward} XP</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#050505] border-2 border-[#F6F2EE] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5, delay: 0.8 + (idx * 0.1) }}
                        className="h-full bg-[#8A4FFF]"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Start Run CTA - Elevated */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={() => onNavigate('start-run')}
            className="w-full h-16 bg-[#8A4FFF] hover:bg-[#7A3FEF] text-[#F6F2EE] border-4 border-[#F6F2EE] uppercase tracking-wider flex items-center justify-center gap-3 relative overflow-hidden group"
            style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
            <Play className="w-6 h-6" />
            <span className="text-base font-bold">Start New Run</span>
            <Zap className="w-5 h-5 text-[#FFD700]" />
          </Button>
        </motion.div>

        {/* Recent Activity */}
        {stats.recentRuns.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <h4 className="text-[#F6F2EE] mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#A0A0A0]" />
              RECENT RUNS
            </h4>
            <div className="space-y-2">
              {stats.recentRuns.map((run: any, idx: number) => (
                <motion.div
                  key={run.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1 + (idx * 0.05) }}
                  className="p-3 bg-[#151515] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#F6F2EE] text-sm font-bold mb-1">{run.title || 'Street Run'}</p>
                      <p className="text-[#A0A0A0] text-xs">
                        {run.neighborhood || 'Downtown'} • {run.actual_venue_count || 0} venues
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#A0A0A0]" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Action Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button
            onClick={() => onNavigate('pipeline')}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 border-3 border-[#F6F2EE] text-[#F6F2EE] hover:bg-[#151515] hover:border-[#8A4FFF] bg-transparent transition-all"
          >
            <MapPin className="w-6 h-6" />
            <span className="text-xs uppercase tracking-wide font-bold">Lead Pipeline</span>
          </Button>
          <Button
            onClick={() => onNavigate('leaderboard')}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 border-3 border-[#F6F2EE] text-[#F6F2EE] hover:bg-[#151515] hover:border-[#8A4FFF] bg-transparent transition-all"
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs uppercase tracking-wide font-bold">Leaderboard</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function getNextRankXP(currentRank: string): number {
  const rankXP: Record<string, number> = {
    'Bronze': 1000,
    'Silver': 2500,
    'Gold': 5000,
    'Platinum': 10000,
    'Diamond': 25000,
    'Black Key': 99999,
  };
  return rankXP[currentRank] || 1000;
}

function getCurrentRankMinXP(currentRank: string): number {
  const rankMinXP: Record<string, number> = {
    'Bronze': 0,
    'Silver': 1000,
    'Gold': 2500,
    'Platinum': 5000,
    'Diamond': 10000,
    'Black Key': 25000,
  };
  return rankMinXP[currentRank] || 0;
}
