/**
 * XP SERVICE
 * 
 * Centralized service for managing XP events, rank calculations, and progression.
 * All XP awards should go through this service to ensure consistency.
 * 
 * Usage:
 *   import { awardXP, calculateRank } from '@/lib/xpService';
 *   
 *   await awardXP({
 *     userId: user.id,
 *     amount: 25,
 *     source: 'venue_status_change',
 *     sourceId: leadId
 *   });
 */

import { createClient } from '../utils/supabase/client';
import type { XPSource } from './types';

interface AwardXPParams {
  userId: string;
  amount: number;
  source: XPSource;
  sourceId?: string | null;
  pointsAmount?: number;
}

interface AwardXPResult {
  success: boolean;
  newTotalXP: number;
  previousRank: string;
  newRank: string;
  rankUp: boolean;
  error?: string;
}

/**
 * Award XP to a user and automatically update their rank
 * 
 * This function:
 * 1. Logs an XP event in street_xp_events
 * 2. Recalculates total_xp from all events
 * 3. Determines the new rank based on total_xp
 * 4. Updates street_users with new total_xp and current_rank
 * 5. Returns whether the user ranked up
 */
export async function awardXP({
  userId,
  amount,
  source,
  sourceId = null,
  pointsAmount = 0,
}: AwardXPParams): Promise<AwardXPResult> {
  try {
    const supabase = createClient();

    // Get current user state
    const { data: currentUser, error: userError } = await supabase
      .from('street_users')
      .select('total_xp, current_rank')
      .eq('id', userId)
      .single();

    if (userError || !currentUser) {
      return {
        success: false,
        newTotalXP: 0,
        previousRank: 'Bronze',
        newRank: 'Bronze',
        rankUp: false,
        error: 'User not found',
      };
    }

    const previousRank = currentUser.current_rank;

    // Log XP event
    const { error: eventError } = await supabase
      .from('street_xp_events')
      .insert({
        user_id: userId,
        source,
        source_id: sourceId,
        xp_amount: amount,
        points_amount: pointsAmount,
      });

    if (eventError) {
      console.error('Error logging XP event:', eventError);
      return {
        success: false,
        newTotalXP: currentUser.total_xp,
        previousRank,
        newRank: previousRank,
        rankUp: false,
        error: 'Failed to log XP event',
      };
    }

    // Recalculate total XP from all events
    const { data: xpEvents, error: sumError } = await supabase
      .from('street_xp_events')
      .select('xp_amount')
      .eq('user_id', userId);

    if (sumError) {
      console.error('Error calculating total XP:', sumError);
      return {
        success: false,
        newTotalXP: currentUser.total_xp,
        previousRank,
        newRank: previousRank,
        rankUp: false,
        error: 'Failed to calculate total XP',
      };
    }

    const newTotalXP = xpEvents?.reduce((sum, event) => sum + event.xp_amount, 0) || 0;

    // Calculate new rank
    const newRank = await calculateRank(newTotalXP);

    // Update user
    const { error: updateError } = await supabase
      .from('street_users')
      .update({
        total_xp: newTotalXP,
        current_rank: newRank,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user XP/rank:', updateError);
      return {
        success: false,
        newTotalXP,
        previousRank,
        newRank: previousRank,
        rankUp: false,
        error: 'Failed to update user',
      };
    }

    const rankUp = previousRank !== newRank;

    // Dispatch rank-up event if rank changed
    if (rankUp && typeof window !== 'undefined') {
      const event = new CustomEvent('rank-up', {
        detail: {
          previousRank,
          newRank,
          totalXP: newTotalXP,
        },
      });
      window.dispatchEvent(event);
    }

    return {
      success: true,
      newTotalXP,
      previousRank,
      newRank,
      rankUp,
    };
  } catch (error) {
    console.error('Unexpected error in awardXP:', error);
    return {
      success: false,
      newTotalXP: 0,
      previousRank: 'Bronze',
      newRank: 'Bronze',
      rankUp: false,
      error: 'Unexpected error',
    };
  }
}

/**
 * Calculate which rank a user should have based on their total XP
 */
export async function calculateRank(totalXP: number): Promise<string> {
  try {
    const supabase = createClient();
    
    const { data: ranks, error } = await supabase
      .from('street_ranks')
      .select('name, min_xp')
      .order('min_xp', { ascending: false });

    if (error || !ranks || ranks.length === 0) {
      console.error('Error fetching ranks:', error);
      return 'Bronze';
    }

    // Find the highest rank the user qualifies for
    for (const rank of ranks) {
      if (totalXP >= rank.min_xp) {
        return rank.name;
      }
    }

    // Default to Bronze if no ranks match
    return 'Bronze';
  } catch (error) {
    console.error('Unexpected error calculating rank:', error);
    return 'Bronze';
  }
}

/**
 * Get all ranks sorted by order
 */
export async function getAllRanks() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('street_ranks')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching ranks:', error);
    return [];
  }

  return data || [];
}

/**
 * Get commission rate for a given rank
 */
export function getCommissionRateByRank(rankName: string): number {
  const rates: Record<string, number> = {
    'Bronze': 0.15,
    'Silver': 0.15,
    'Gold': 0.20,
    'Platinum': 0.25,
    'Diamond': 0.30,
    'Black Key': 0.30,
  };

  return rates[rankName] || 0.15;
}

/**
 * Get XP required to reach next rank
 */
export async function getXPToNextRank(currentXP: number, currentRank: string) {
  const ranks = await getAllRanks();
  const currentRankIndex = ranks.findIndex((r: any) => r.name === currentRank);
  
  if (currentRankIndex === -1 || currentRankIndex === ranks.length - 1) {
    // At max rank
    return {
      nextRank: null,
      xpRequired: null,
      xpRemaining: null,
    };
  }

  const nextRank = ranks[currentRankIndex + 1] as any;
  
  return {
    nextRank: nextRank.name,
    xpRequired: nextRank.min_xp,
    xpRemaining: nextRank.min_xp - currentXP,
  };
}
