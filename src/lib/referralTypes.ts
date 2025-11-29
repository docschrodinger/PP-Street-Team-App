// Types for Referral & Recruit System

export interface ReferralStats {
  total_referred: number;
  pending_approval: number;
  approved: number;
  active: number; // Have signed at least 1 venue
  total_bonus_earned: number;
  pending_bonus: number;
}

export interface Recruit {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo_url?: string;
  onboarding_status: string;
  approved_at?: string;
  created_at: string;
  
  // Performance
  live_venue_count: number;
  total_earnings: number;
  tier: string;
  
  // Referral earnings
  your_bonus_from_recruit: number;
}

export interface ReferralBonus {
  id: string;
  referrer_id: string;
  recruit_id: string;
  bonus_type: 'signup' | 'first_venue' | 'override';
  amount: number;
  earned_at: string;
  paid_at?: string;
  month_number?: number; // For override bonuses (1-6)
  
  // Joined data
  recruit_name?: string;
}

export const BONUS_AMOUNTS = {
  signup: 50, // $50 when recruit completes onboarding
  first_venue: 100, // $100 when recruit signs first venue
  override_percentage: 5 // 5% of recruit's earnings for 6 months
} as const;

export const REFERRAL_LINK_BASE = 'https://patronpass.com/join';

export function generateReferralCode(userId: string): string {
  // Generate a unique, short code from user ID
  // In production, you might want to use a more sophisticated algorithm
  const hash = btoa(userId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
  return hash;
}

export function getReferralLink(referralCode: string): string {
  return `${REFERRAL_LINK_BASE}/${referralCode}`;
}

export const SHARE_MESSAGES = {
  default: (firstName: string, link: string) => 
    `Hey! I'm a Patron Pass Ambassador and loving it. Want to earn recurring income by signing venues? Use my link to apply: ${link}`,
  
  sms: (firstName: string, link: string) =>
    `🚀 Join me as a Patron Pass Ambassador! Earn $100+/mo per venue you sign. Apply here: ${link}`,
  
  instagram: (firstName: string, link: string) =>
    `💰 Build your venue portfolio, earn recurring income\n🎯 I'm earning with @PatronPass\n🔗 Apply: ${link}\n#SideHustle #PassiveIncome #NightlifeJobs`,
  
  whatsapp: (firstName: string, link: string) =>
    `Hey! 👋\n\nI just became a Patron Pass Ambassador and I'm building a portfolio of venues that pay me every month.\n\nYou'd be great at this. Want to learn more?\n\n${link}`,
  
  email: (firstName: string, link: string) => ({
    subject: `${firstName} invited you to join Patron Pass`,
    body: `Hey!\n\nI'm working with Patron Pass as an ambassador, and I think you'd crush it.\n\nHere's what I'm doing:\n- Signing venues to a membership platform\n- Earning $100/mo per venue (recurring)\n- Building a portfolio that pays me every month\n- Top performers get stock options\n\nInterested? Apply here: ${link}\n\nLet me know if you have questions!\n\n- ${firstName}`
  })
} as const;
