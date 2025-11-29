// Types for Messages from HQ system

export interface HQMessage {
  id: string;
  title: string;
  body: string;
  priority: 'normal' | 'urgent';
  target_type: 'all' | 'tier' | 'individual';
  target_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  target_user_id?: string;
  sent_by_admin_id: string;
  sent_at: string;
  scheduled_for?: string;
  
  // Joined data
  admin_name?: string;
  
  // Read status for current user
  is_read?: boolean;
  read_at?: string;
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface ComposeMessageData {
  title: string;
  body: string;
  priority: 'normal' | 'urgent';
  target_type: 'all' | 'tier' | 'individual';
  target_tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  target_user_id?: string;
  scheduled_for?: string;
}

export const PRIORITY_LABELS = {
  normal: 'Normal',
  urgent: 'Urgent'
} as const;

export const TARGET_TYPE_LABELS = {
  all: 'All Ambassadors',
  tier: 'Specific Tier',
  individual: 'Individual Ambassador'
} as const;

export const TIER_LABELS = {
  bronze: 'Bronze (0-15 venues)',
  silver: 'Silver (16-30 venues)',
  gold: 'Gold (31-75 venues)',
  platinum: 'Platinum (76-150 venues)',
  diamond: 'Diamond (150+ venues)'
} as const;
