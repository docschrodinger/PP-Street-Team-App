import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { 
  ArrowLeft, 
  Award, 
  MapPin, 
  Mail, 
  Phone, 
  Instagram,
  Settings,
  LogOut,
  Trophy,
  Flame,
  Target,
  TrendingUp,
  DollarSign,
  Copy,
  CheckCircle2,
  Zap,
  Share2
} from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { calculateStreak } from '../lib/streakService';
import { getCommissionRateByRank } from '../lib/xpService';
import type { StreetUser } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ProfileScreenProps {
  user: StreetUser;
  onBack: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export function ProfileScreen({ user, onBack, onSettings, onLogout }: ProfileScreenProps) {
  const [stats, setStats] = useState({
    streak: 0,
    longestStreak: 0,
    liveVenues: 0,
    totalLeads: 0,
    conversionRate: 0,
    estimatedMonthlyEarnings: 0,
    totalMissionsCompleted: 0,
    position: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const referralCode = `PATRON-${user.id.slice(0, 8).toUpperCase()}`;

  useEffect(() => {
    loadProfileStats();
  }, [user.id]);

  async function loadProfileStats() {
    const supabase = createClient();

    try {
      const [
        streakData,
        liveVenues,
        allLeads,
        completedMissions,
        allUsers,
      ] = await Promise.all([
        calculateStreak(user.id),
        supabase
          .from('street_venue_leads')
          .select('id')
          .eq('created_by_user_id', user.id)
          .eq('status', 'live'),
        supabase
          .from('street_venue_leads')
          .select('id')
          .eq('created_by_user_id', user.id),
        supabase
          .from('street_mission_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_completed', true),
        supabase
          .from('street_users')
          .select('total_xp')
          .eq('status', 'active')
          .order('total_xp', { ascending: false }),
      ]);

      const liveCount = liveVenues.data?.length || 0;
      const totalCount = allLeads.data?.length || 0;
      const conversionRate = totalCount > 0 ? (liveCount / totalCount) * 100 : 0;

      // Calculate earnings
      const commissionRate = getCommissionRateByRank(user.current_rank);
      const ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE = 150;
      const estimatedMonthlyEarnings = liveCount * ESTIMATED_MONTHLY_PLATFORM_FEE_PER_VENUE * commissionRate;

      // Find user's position
      const position = (allUsers.data?.findIndex(u => u.total_xp <= user.total_xp) || -1) + 1;

      setStats({
        streak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        liveVenues: liveCount,
        totalLeads: totalCount,
        conversionRate,
        estimatedMonthlyEarnings,
        totalMissionsCompleted: completedMissions.data?.length || 0,
        position,
      });
    } catch (error) {
      console.error('Error loading profile stats:', error);
    } finally {
      setLoading(false);
    }
  }

  function copyReferralCode() {
    navigator.clipboard.writeText(referralCode);
    setCopiedReferral(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopiedReferral(false), 2000);
  }

  function shareProfile() {
    const text = `Join me on Patron Pass Street Team! Use my code: ${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Patron Pass Street Team',
        text,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Share text copied!');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block border-4 border-[#8A4FFF] p-6 mb-4 bg-[#151515] animate-pulse">
            <Award className="w-12 h-12 text-[#8A4FFF]" />
          </div>
          <p className="text-[#A0A0A0] uppercase tracking-widest text-sm">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#8A4FFF]" />

      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <h3 className="text-[#F6F2EE] flex-1">Profile</h3>
          <button
            onClick={onSettings}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <Settings className="w-5 h-5 text-[#F6F2EE]" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-24">
        
        {/* Profile header - Hero style */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative"
        >
          {/* Background card */}
          <div className="p-6 bg-gradient-to-br from-[#8A4FFF] to-[#7A3FEF] border-4 border-[#F6F2EE] relative overflow-hidden"
            style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)' }}
          >
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF7A59] opacity-20 rotate-45" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#FFD700] opacity-20 rounded-full" />

            <div className="relative z-10 text-center">
              {/* Avatar */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-block mb-4"
              >
                <div className="w-24 h-24 bg-[#FF7A59] border-4 border-[#F6F2EE] flex items-center justify-center relative"
                  style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)' }}
                >
                  <span className="text-5xl font-bold text-[#F6F2EE]">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                  {/* Rank badge */}
                  <div className="absolute -bottom-2 -right-2 px-2 py-1 bg-[#FFD700] border-2 border-[#F6F2EE]">
                    <Award className="w-4 h-4 text-[#050505]" />
                  </div>
                </div>
              </motion.div>

              {/* Name & Rank */}
              <h2 className="text-[#F6F2EE] mb-2">{user.full_name}</h2>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#151515] border-3 border-[#FFD700]">
                <Award className="w-5 h-5 text-[#FFD700]" />
                <span className="text-[#FFD700] uppercase tracking-wider font-bold">{user.current_rank}</span>
              </div>

              {/* Position */}
              {stats.position > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-3"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#050505]/50 border-2 border-[#F6F2EE]">
                    <TrendingUp className="w-4 h-4 text-[#F6F2EE]" />
                    <span className="text-[#F6F2EE] text-sm">
                      Ranked #{stats.position}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Key Stats Grid - Asymmetric */}
        <div className="grid grid-cols-6 gap-3">
          {/* XP - Takes 2 columns */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="col-span-2 p-4 bg-[#151515] border-3 border-[#8A4FFF] text-center"
          >
            <Trophy className="w-6 h-6 text-[#8A4FFF] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#8A4FFF] mb-1">{user.total_xp.toLocaleString()}</p>
            <p className="text-[#A0A0A0] text-xs uppercase tracking-wide">Total XP</p>
          </motion.div>

          {/* Live Venues - Takes 2 columns */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="col-span-2 p-4 bg-[#151515] border-3 border-[#00FF00] text-center"
          >
            <Target className="w-6 h-6 text-[#00FF00] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#00FF00] mb-1">{stats.liveVenues}</p>
            <p className="text-[#A0A0A0] text-xs uppercase tracking-wide">Live Venues</p>
          </motion.div>

          {/* Streak - Takes 2 columns */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="col-span-2 p-4 bg-[#151515] border-3 border-[#FF7A59] text-center"
          >
            <Flame className="w-6 h-6 text-[#FF7A59] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#FF7A59] mb-1">{stats.streak}</p>
            <p className="text-[#A0A0A0] text-xs uppercase tracking-wide">Day Streak</p>
          </motion.div>

          {/* Missions - Takes 3 columns */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="col-span-3 p-4 bg-[#151515] border-2 border-[#F6F2EE] text-center"
          >
            <p className="text-xl font-bold text-[#8A4FFF] mb-1">{stats.totalMissionsCompleted}</p>
            <p className="text-[#A0A0A0] text-xs uppercase tracking-wide">Missions Done</p>
          </motion.div>

          {/* Conversion - Takes 3 columns */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="col-span-3 p-4 bg-[#151515] border-2 border-[#F6F2EE] text-center"
          >
            <p className="text-xl font-bold text-[#FF7A59] mb-1">{stats.conversionRate.toFixed(0)}%</p>
            <p className="text-[#A0A0A0] text-xs uppercase tracking-wide">Conversion</p>
          </motion.div>
        </div>

        {/* Earnings Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="p-5 bg-gradient-to-br from-[#FF7A59] to-[#EE6A49] border-4 border-[#F6F2EE]"
          style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.8)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-[#F6F2EE]" />
              <span className="text-[#F6F2EE] uppercase tracking-wide font-bold">Monthly Rev</span>
            </div>
            <Zap className="w-5 h-5 text-[#FFD700]" />
          </div>
          <h1 className="text-[#F6F2EE] mb-2">
            ${Math.floor(stats.estimatedMonthlyEarnings)}
          </h1>
          <p className="text-[#F6F2EE] text-sm opacity-90">
            {getCommissionRateByRank(user.current_rank) * 100}% commission rate • {user.current_rank} rank
          </p>
        </motion.div>

        {/* Referral Code */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="p-5 bg-[#151515] border-3 border-[#F6F2EE]"
        >
          <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#8A4FFF]" />
            Referral Code
          </h4>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 p-3 bg-[#050505] border-2 border-[#8A4FFF] font-mono text-[#8A4FFF] text-center font-bold">
              {referralCode}
            </div>
            <button
              onClick={copyReferralCode}
              className="p-3 border-2 border-[#F6F2EE] hover:bg-[#8A4FFF] transition-all active:scale-95"
            >
              {copiedReferral ? (
                <CheckCircle2 className="w-5 h-5 text-[#00FF00]" />
              ) : (
                <Copy className="w-5 h-5 text-[#F6F2EE]" />
              )}
            </button>
          </div>
          <Button
            onClick={shareProfile}
            variant="outline"
            className="w-full border-2 border-[#8A4FFF] text-[#8A4FFF] hover:bg-[#8A4FFF] hover:text-[#F6F2EE] uppercase text-xs tracking-wider"
          >
            Share Referral
          </Button>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="space-y-3"
        >
          <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm">Contact</h4>
          
          <div className="p-4 bg-[#151515] border-2 border-[#F6F2EE] flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#8A4FFF]" />
            <span className="text-[#F6F2EE]">{user.city}</span>
          </div>

          <div className="p-4 bg-[#151515] border-2 border-[#F6F2EE] flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#8A4FFF]" />
            <span className="text-[#F6F2EE] text-sm break-all">{user.email}</span>
          </div>

          {user.phone && (
            <div className="p-4 bg-[#151515] border-2 border-[#F6F2EE] flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#8A4FFF]" />
              <span className="text-[#F6F2EE]">{user.phone}</span>
            </div>
          )}

          {user.instagram_handle && (
            <div className="p-4 bg-[#151515] border-2 border-[#F6F2EE] flex items-center gap-3">
              <Instagram className="w-5 h-5 text-[#8A4FFF]" />
              <span className="text-[#F6F2EE]">{user.instagram_handle}</span>
            </div>
          )}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full h-14 border-3 border-[#FF4444] text-[#FF4444] hover:bg-[#FF4444] hover:text-[#F6F2EE] uppercase tracking-wider font-bold transition-all"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
