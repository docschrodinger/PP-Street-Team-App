/**
 * MISSION SERVICE
 * 
 * Handles mission progress tracking and auto-updates based on user actions.
 * 
 * Usage:
 *   import { updateMissionProgress } from '@/lib/missionService';
 *   
 *   // After user adds a lead:
 *   await updateMissionProgress(userId, 'lead_added');
 */

import { supabase } from '../utils/supabase/client';
import type { StreetMission, StreetMissionProgress } from './types';

type MissionTrigger = 
  | 'lead_added'
  | 'run_completed'
  | 'lead_to_contacted'
  | 'lead_to_follow_up'
  | 'lead_to_demo'
  | 'lead_to_verbal_yes'
  | 'lead_to_signed_pending'
  | 'lead_to_live';

interface MissionProgressUpdate {
  missionId: string;
  newCount: number;
  completed: boolean;
}

/**
 * Update mission progress based on a user action
 * 
 * This checks all active missions that match the trigger type and increments
 * their progress counters.
 */
export async function updateMissionProgress(
  userId: string,
  trigger: MissionTrigger,
  count: number = 1
): Promise<MissionProgressUpdate[]> {
  try {
    // Get user's city for city-specific missions
    const { data: user } = await supabase
      .from('street_users')
      .select('city')
      .eq('id', userId)
      .single();

    if (!user) return [];

    // Get active missions that match this trigger
    const missions = await getRelevantMissions(user.city, trigger);
    
    if (missions.length === 0) return [];

    const updates: MissionProgressUpdate[] = [];

    for (const mission of missions) {
      // Get or create progress record
      let { data: progress } = await supabase
        .from('street_mission_progress')
        .select('*')
        .eq('mission_id', mission.id)
        .eq('user_id', userId)
        .single();

      if (!progress) {
        // Create new progress record
        const { data: newProgress, error } = await supabase
          .from('street_mission_progress')
          .insert({
            mission_id: mission.id,
            user_id: userId,
            current_count: 0,
            is_completed: false,
            completed_at: null,
            xp_awarded: false,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating mission progress:', error);
          continue;
        }

        progress = newProgress;
      }

      // Don't increment if already completed and claimed
      if (progress.is_completed && progress.xp_awarded) {
        continue;
      }

      // Increment count
      const newCount = progress.current_count + count;
      const isCompleted = newCount >= mission.required_count;

      const { error: updateError } = await supabase
        .from('street_mission_progress')
        .update({
          current_count: newCount,
          is_completed: isCompleted,
          completed_at: isCompleted && !progress.is_completed ? new Date().toISOString() : progress.completed_at,
        })
        .eq('id', progress.id);

      if (updateError) {
        console.error('Error updating mission progress:', updateError);
        continue;
      }

      updates.push({
        missionId: mission.id,
        newCount,
        completed: isCompleted,
      });

      // If just completed, could trigger a notification here
      if (isCompleted && !progress.is_completed) {
        await createMissionNotification(userId, mission);
      }
    }

    return updates;
  } catch (error) {
    console.error('Unexpected error in updateMissionProgress:', error);
    return [];
  }
}

/**
 * Get missions that are active and relevant to the trigger
 */
async function getRelevantMissions(
  userCity: string,
  trigger: MissionTrigger
): Promise<StreetMission[]> {
  const today = new Date().toISOString();

  const { data: missions } = await supabase
    .from('street_missions')
    .select('*')
    .or(`scope.eq.global,city.eq.${userCity}`)
    .lte('valid_from', today)
    .gte('valid_to', today);

  if (!missions) return [];

  // Filter by trigger type based on mission description/title
  // This is a simple heuristic - in production you might add a 'trigger_type' column
  return missions.filter(mission => {
    const desc = mission.description.toLowerCase();
    const title = mission.title.toLowerCase();
    
    switch (trigger) {
      case 'lead_added':
        return desc.includes('add') && (desc.includes('lead') || desc.includes('venue'));
      case 'run_completed':
        return desc.includes('complete') && desc.includes('run');
      case 'lead_to_follow_up':
        return desc.includes('follow up');
      case 'lead_to_signed_pending':
        return desc.includes('signed') || desc.includes('sign');
      case 'lead_to_live':
        return desc.includes('live');
      default:
        return false;
    }
  });
}

/**
 * Create a notification when a mission is completed
 */
async function createMissionNotification(
  userId: string,
  mission: StreetMission
): Promise<void> {
  try {
    await supabase
      .from('street_notifications')
      .insert({
        user_id: userId,
        title: '🎯 Mission Complete!',
        body: `You completed "${mission.title}". Claim your ${mission.xp_reward} XP reward!`,
        type: 'mission',
        is_read: false,
      });
  } catch (error) {
    console.error('Error creating mission notification:', error);
  }
}

/**
 * Claim a completed mission's XP reward
 */
export async function claimMissionReward(
  userId: string,
  missionId: string
): Promise<{ success: boolean; xpAwarded: number; error?: string }> {
  try {
    // Get mission and progress
    const { data: mission } = await supabase
      .from('street_missions')
      .select('*')
      .eq('id', missionId)
      .single();

    const { data: progress } = await supabase
      .from('street_mission_progress')
      .select('*')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
      .single();

    if (!mission || !progress) {
      return { success: false, xpAwarded: 0, error: 'Mission or progress not found' };
    }

    if (!progress.is_completed) {
      return { success: false, xpAwarded: 0, error: 'Mission not completed yet' };
    }

    if (progress.xp_awarded) {
      return { success: false, xpAwarded: 0, error: 'Reward already claimed' };
    }

    // Award XP via xpService (imported dynamically to avoid circular deps)
    const { awardXP } = await import('./xpService');
    const result = await awardXP({
      userId,
      amount: mission.xp_reward,
      source: 'mission',
      sourceId: missionId,
      pointsAmount: mission.point_reward,
    });

    if (!result.success) {
      return { success: false, xpAwarded: 0, error: result.error };
    }

    // Mark as claimed
    await supabase
      .from('street_mission_progress')
      .update({ xp_awarded: true })
      .eq('id', progress.id);

    return { success: true, xpAwarded: mission.xp_reward };
  } catch (error) {
    console.error('Unexpected error claiming mission:', error);
    return { success: false, xpAwarded: 0, error: 'Unexpected error' };
  }
}
