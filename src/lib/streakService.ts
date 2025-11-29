/**
 * STREAK SERVICE
 * 
 * Calculates user activity streaks based on consecutive days with actions.
 * A day counts if user has ANY activity: runs, leads added, missions completed, etc.
 */

import { createClient } from '../utils/supabase/client';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isActiveToday: boolean;
}

/**
 * Calculate user's current streak and longest streak
 * 
 * Streak logic:
 * - Counts consecutive days with ANY activity
 * - Activity = run started, lead added, mission completed, XP earned
 * - Breaks if a full day is skipped (allows until 11:59pm to continue)
 * - Today counts even if activity just started
 */
export async function calculateStreak(userId: string): Promise<StreakData> {
  const supabase = createClient();

  try {
    // Get all activity dates for this user (from multiple sources)
    const activityDates = new Set<string>();

    // 1. Get dates from street_runs
    const { data: runs } = await supabase
      .from('street_runs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    runs?.forEach(run => {
      const date = new Date(run.created_at).toISOString().split('T')[0];
      activityDates.add(date);
    });

    // 2. Get dates from street_venue_leads
    const { data: leads } = await supabase
      .from('street_venue_leads')
      .select('created_at')
      .eq('created_by_user_id', userId)
      .order('created_at', { ascending: false });

    leads?.forEach(lead => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      activityDates.add(date);
    });

    // 3. Get dates from street_xp_events
    const { data: xpEvents } = await supabase
      .from('street_xp_events')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    xpEvents?.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      activityDates.add(date);
    });

    // Convert to sorted array (most recent first)
    const sortedDates = Array.from(activityDates).sort().reverse();

    if (sortedDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        isActiveToday: false,
      };
    }

    // Calculate current streak
    const today = new Date().toISOString().split('T')[0];
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date(today);
    const isActiveToday = sortedDates[0] === today;

    // Count backwards from today to find current streak
    for (let i = 0; i < sortedDates.length; i++) {
      const activityDate = sortedDates[i];
      const expectedDate = checkDate.toISOString().split('T')[0];

      if (activityDate === expectedDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Streak broken
        break;
      }
    }

    // Calculate longest streak by scanning all dates
    let previousDate: Date | null = null;
    tempStreak = 1;

    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr);

      if (previousDate) {
        const dayDiff = Math.floor(
          (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dayDiff === 1) {
          // Consecutive day
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          // Streak broken, reset
          tempStreak = 1;
        }
      } else {
        longestStreak = 1;
      }

      previousDate = currentDate;
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      lastActivityDate: sortedDates[0],
      isActiveToday,
    };
  } catch (error) {
    console.error('Error calculating streak:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      isActiveToday: false,
    };
  }
}

/**
 * Record activity to maintain streak (optional - streaks are calculated on-demand)
 * This function can be called after key actions to ensure real-time updates
 */
export async function recordActivity(userId: string, activityType: string): Promise<void> {
  // Activity is automatically tracked via XP events, leads, runs, etc.
  // This is just a placeholder for future real-time streak updates
  console.log(`Activity recorded for user ${userId}: ${activityType}`);
}
