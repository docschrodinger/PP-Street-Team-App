import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import type { StreetUser } from '../lib/types';
import type { ReferralStats, Recruit, ReferralBonus } from '../lib/referralTypes';
import { generateReferralCode, getReferralLink, BONUS_AMOUNTS, SHARE_MESSAGES } from '../lib/referralTypes';
import { ArrowLeft, Copy, Share2, QrCode, DollarSign, Users, CheckCircle2, Clock, TrendingUp, MessageCircle, Mail, Instagram } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import QRCodeStyling from 'qr-code-styling';

interface ReferralScreenProps {
  user: StreetUser;
  onBack: () => void;
}

export function ReferralScreen({ user, onBack }: ReferralScreenProps) {
  const [stats, setStats] = useState<ReferralStats>({
    total_referred: 0,
    pending_approval: 0,
    approved: 0,
    active: 0,
    total_bonus_earned: 0,
    pending_bonus: 0
  });
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [bonuses, setBonuses] = useState<ReferralBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralCode = user.referral_code || generateReferralCode(user.id);
  const referralLink = getReferralLink(referralCode);

  useEffect(() => {
    loadReferralData();
    ensureReferralCode();
  }, [user.id]);

  async function ensureReferralCode() {
    if (!user.referral_code) {
      const code = generateReferralCode(user.id);
      await supabase
        .from('street_users')
        .update({ referral_code: code })
        .eq('id', user.id);
    }
  }

  async function loadReferralData() {
    setLoading(true);

    // Load recruits
    const { data: recruitsData } = await supabase
      .from('street_users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        profile_photo_url,
        onboarding_status,
        approved_at,
        created_at,
        tier,
        live_venue_count
      `)
      .eq('referred_by_user_id', user.id)
      .order('created_at', { ascending: false });

    // Load bonuses
    const { data: bonusesData } = await supabase
      .from('street_referral_bonuses')
      .select(`
        *,
        recruit:street_users!recruit_id(first_name, last_name)
      `)
      .eq('referrer_id', user.id)
      .order('earned_at', { ascending: false });

    // Calculate stats
    const totalReferred = recruitsData?.length || 0;
    const pendingApproval = recruitsData?.filter(r => r.onboarding_status === 'pending_approval').length || 0;
    const approved = recruitsData?.filter(r => r.onboarding_status === 'approved' && r.approved_at).length || 0;
    const active = recruitsData?.filter(r => r.live_venue_count > 0).length || 0;
    
    const totalBonusEarned = bonusesData?.reduce((sum, b) => sum + (b.paid_at ? parseFloat(b.amount) : 0), 0) || 0;
    const pendingBonus = bonusesData?.reduce((sum, b) => sum + (!b.paid_at ? parseFloat(b.amount) : 0), 0) || 0;

    setStats({
      total_referred: totalReferred,
      pending_approval: pendingApproval,
      approved,
      active,
      total_bonus_earned: totalBonusEarned,
      pending_bonus: pendingBonus
    });

    // Transform recruits data
    const transformedRecruits: Recruit[] = (recruitsData || []).map(r => ({
      ...r,
      total_earnings: 0, // Calculate from their actual earnings
      your_bonus_from_recruit: bonusesData
        ?.filter(b => b.recruit_id === r.id)
        .reduce((sum, b) => sum + parseFloat(b.amount), 0) || 0
    }));

    setRecruits(transformedRecruits);
    setBonuses(bonusesData || []);
    setLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink(platform: 'sms' | 'whatsapp' | 'instagram' | 'email' | 'generic') {
    const message = SHARE_MESSAGES[platform === 'generic' ? 'default' : platform](user.first_name, referralLink);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'sms':
        shareUrl = `sms:?body=${encodeURIComponent(message as string)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message as string)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, so copy to clipboard
        await navigator.clipboard.writeText(message as string);
        alert('Caption copied! Open Instagram and paste into a new post.');
        return;
      case 'email':
        const emailMsg = message as { subject: string; body: string };
        shareUrl = `mailto:?subject=${encodeURIComponent(emailMsg.subject)}&body=${encodeURIComponent(emailMsg.body)}`;
        break;
      case 'generic':
        if (navigator.share) {
          await navigator.share({
            title: 'Join Patron Pass',
            text: message as string,
            url: referralLink
          });
          return;
        } else {
          await copyLink();
          return;
        }
    }
    
    window.open(shareUrl, '_blank');
  }

  function generateQRCode() {
    const qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      data: referralLink,
      dotsOptions: {
        color: '#8A4FFF',
        type: 'square'
      },
      backgroundOptions: {
        color: '#F6F2EE'
      },
      cornersSquareOptions: {
        color: '#050505',
        type: 'square'
      },
      cornersDotOptions: {
        color: '#FF7A59',
        type: 'square'
      }
    });

    const canvas = document.getElementById('qr-code-canvas');
    if (canvas) {
      canvas.innerHTML = '';
      qrCode.append(canvas);
    }
  }

  useEffect(() => {
    if (showQR) {
      generateQRCode();
    }
  }, [showQR]);

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8A4FFF] via-[#FF7A59] to-[#FFD700]" />

      {/* Header */}
      <div className="border-b-4 border-[#F6F2EE] bg-[#151515] px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#8A4FFF] transition-colors border-2 border-[#F6F2EE] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-[#F6F2EE]" />
          </button>
          <div className="flex-1">
            <h3 className="text-[#F6F2EE]">Refer & Earn</h3>
            <p className="text-[#8A4FFF] text-sm mt-1">
              Recruit ambassadors, earn bonuses
            </p>
          </div>
          <Users className="w-6 h-6 text-[#8A4FFF]" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Earnings Overview */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 bg-gradient-to-br from-[#8A4FFF] to-[#7A3FEF] border-4 border-[#F6F2EE]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#FFD700] border-2 border-[#F6F2EE] flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#050505]" />
              </div>
              <div>
                <h4 className="text-[#F6F2EE] uppercase tracking-wider text-sm">Total Bonus Earned</h4>
                <p className="text-[#FFD700] text-3xl font-bold">${stats.total_bonus_earned.toFixed(0)}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t-2 border-[#F6F2EE]/20">
              <p className="text-[#F6F2EE] text-sm mb-1">Pending Payout</p>
              <p className="text-[#FFD700] text-xl font-bold">${stats.pending_bonus.toFixed(0)}</p>
            </div>
          </motion.div>

          {/* Referral Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#151515] border-3 border-[#F6F2EE]">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-[#8A4FFF]" />
                <span className="text-[#A0A0A0] text-sm">Total Referred</span>
              </div>
              <p className="text-[#F6F2EE] text-2xl font-bold">{stats.total_referred}</p>
            </div>

            <div className="p-4 bg-[#151515] border-3 border-[#F6F2EE]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#00FF00]" />
                <span className="text-[#A0A0A0] text-sm">Approved</span>
              </div>
              <p className="text-[#F6F2EE] text-2xl font-bold">{stats.approved}</p>
            </div>

            <div className="p-4 bg-[#151515] border-3 border-[#F6F2EE]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-[#FF7A59]" />
                <span className="text-[#A0A0A0] text-sm">Pending</span>
              </div>
              <p className="text-[#F6F2EE] text-2xl font-bold">{stats.pending_approval}</p>
            </div>

            <div className="p-4 bg-[#151515] border-3 border-[#F6F2EE]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-[#FFD700]" />
                <span className="text-[#A0A0A0] text-sm">Active</span>
              </div>
              <p className="text-[#F6F2EE] text-2xl font-bold">{stats.active}</p>
            </div>
          </div>

          {/* Bonus Structure Info */}
          <div className="p-5 bg-[#151515] border-3 border-[#8A4FFF]">
            <h4 className="text-[#F6F2EE] font-bold mb-3 uppercase tracking-wider text-sm">
              💰 How You Earn
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#8A4FFF] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#F6F2EE] text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-[#F6F2EE] font-bold">${BONUS_AMOUNTS.signup} Signup Bonus</p>
                  <p className="text-[#A0A0A0] text-xs">When they complete onboarding</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#FF7A59] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#F6F2EE] text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="text-[#F6F2EE] font-bold">${BONUS_AMOUNTS.first_venue} First Venue Bonus</p>
                  <p className="text-[#A0A0A0] text-xs">When they sign their first venue</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#FFD700] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#050505] text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="text-[#F6F2EE] font-bold">{BONUS_AMOUNTS.override_percentage}% Override Commission</p>
                  <p className="text-[#A0A0A0] text-xs">5% of their earnings for 6 months</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="p-5 bg-[#151515] border-3 border-[#F6F2EE]">
            <h4 className="text-[#F6F2EE] font-bold mb-3 uppercase tracking-wider text-sm">
              Your Referral Link
            </h4>
            
            {/* Link display */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 p-3 bg-[#050505] border-2 border-[#8A4FFF] overflow-x-auto">
                <code className="text-[#8A4FFF] text-sm whitespace-nowrap">
                  {referralLink}
                </code>
              </div>
              <Button
                onClick={copyLink}
                className="h-auto px-4 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] text-[#F6F2EE]"
              >
                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => shareLink('sms')}
                className="p-3 bg-[#050505] border-2 border-[#F6F2EE] hover:border-[#8A4FFF] transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#8A4FFF]" />
                  <span className="text-[#F6F2EE] text-sm font-bold">SMS</span>
                </div>
              </button>

              <button
                onClick={() => shareLink('whatsapp')}
                className="p-3 bg-[#050505] border-2 border-[#F6F2EE] hover:border-[#00FF00] transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#00FF00]" />
                  <span className="text-[#F6F2EE] text-sm font-bold">WhatsApp</span>
                </div>
              </button>

              <button
                onClick={() => shareLink('instagram')}
                className="p-3 bg-[#050505] border-2 border-[#F6F2EE] hover:border-[#FF7A59] transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-[#FF7A59]" />
                  <span className="text-[#F6F2EE] text-sm font-bold">Instagram</span>
                </div>
              </button>

              <button
                onClick={() => shareLink('email')}
                className="p-3 bg-[#050505] border-2 border-[#F6F2EE] hover:border-[#FFD700] transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-[#F6F2EE] text-sm font-bold">Email</span>
                </div>
              </button>
            </div>

            {/* QR Code button */}
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full p-3 bg-[#8A4FFF] hover:bg-[#7A3FEF] border-3 border-[#F6F2EE] transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-[#F6F2EE]" />
                <span className="text-[#F6F2EE] font-bold">
                  {showQR ? 'Hide' : 'Show'} QR Code
                </span>
              </div>
            </button>

            {/* QR Code display */}
            {showQR && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 p-4 bg-[#F6F2EE] border-3 border-[#050505]"
              >
                <div id="qr-code-canvas" className="flex justify-center" />
                <p className="text-[#050505] text-center text-xs mt-2">
                  Scan to apply with your referral link
                </p>
              </motion.div>
            )}
          </div>

          {/* Your Team */}
          {recruits.length > 0 && (
            <div>
              <h4 className="text-[#F6F2EE] font-bold mb-3 uppercase tracking-wider text-sm">
                Your Team ({recruits.length})
              </h4>
              
              <div className="space-y-3">
                {recruits.map(recruit => (
                  <div
                    key={recruit.id}
                    className={`p-4 border-3 ${
                      recruit.onboarding_status === 'approved'
                        ? 'bg-[#151515] border-[#00FF00]'
                        : recruit.onboarding_status === 'pending_approval'
                        ? 'bg-[#151515] border-[#FF7A59]'
                        : 'bg-[#0A0A0A] border-[#666]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-[#8A4FFF] border-2 border-[#F6F2EE] flex items-center justify-center flex-shrink-0">
                        {recruit.profile_photo_url ? (
                          <img src={recruit.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#F6F2EE] font-bold">
                            {recruit.first_name[0]}{recruit.last_name[0]}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[#F6F2EE] font-bold">
                          {recruit.first_name} {recruit.last_name}
                        </p>
                        <p className="text-[#A0A0A0] text-sm">
                          {recruit.onboarding_status === 'approved' && (
                            <>✅ Approved • {recruit.live_venue_count} venues</>
                          )}
                          {recruit.onboarding_status === 'pending_approval' && (
                            <>⏳ Pending approval</>
                          )}
                          {recruit.onboarding_status !== 'approved' && recruit.onboarding_status !== 'pending_approval' && (
                            <>🔄 In training</>
                          )}
                        </p>
                        <p className="text-[#FFD700] text-sm mt-1">
                          Your bonus: ${recruit.your_bonus_from_recruit.toFixed(0)}
                        </p>
                      </div>

                      {/* Tier badge */}
                      {recruit.tier && (
                        <div className={`px-2 py-1 border-2 border-[#F6F2EE] text-xs uppercase ${
                          recruit.tier === 'diamond' ? 'bg-[#FFD700] text-[#050505]' :
                          recruit.tier === 'platinum' ? 'bg-[#E5E4E2] text-[#050505]' :
                          recruit.tier === 'gold' ? 'bg-[#FFD700] text-[#050505]' :
                          recruit.tier === 'silver' ? 'bg-[#C0C0C0] text-[#050505]' :
                          'bg-[#CD7F32] text-[#F6F2EE]'
                        }`}>
                          {recruit.tier}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {recruits.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="inline-block p-6 bg-[#151515] border-4 border-[#F6F2EE] mb-4">
                <Users className="w-12 h-12 text-[#A0A0A0]" />
              </div>
              <h4 className="text-[#F6F2EE] mb-2">No recruits yet</h4>
              <p className="text-[#A0A0A0] text-sm mb-4">
                Share your referral link to start earning bonuses!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
