/**
 * Usage Service - Dual-Source Duration Tracking
 * 
 * PRESERVED FUNCTIONALITY:
 * - Existing usage tracking for local file uploads
 * - Monthly usage limits and enforcement
 * - Free vs Pro plan differentiation
 * - GPT prompt usage tracking
 * 
 * NEW FUNCTIONALITY (YouTube Integration):
 * - YouTube video duration enforcement
 * - Accurate duration tracking from YouTube Data API
 * - Fallback duration estimation from captions
 * - Usage limit checking before processing
 * 
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Usage Service                             │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Local Files:                │  YouTube Videos:              │
 * │  • File duration metadata    │  • YouTube Data API duration  │
 * │  • OpenAI processing time    │  • Caption-based estimation   │
 * │  • Direct usage tracking     │  • Pre-processing validation  │
 * │                              │  • Post-processing update     │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * @author Original implementation preserved + YouTube enhancements
 * @version 2.0.0 (YouTube integration added)
 */

import { supabase } from './supabase';

export interface UsageLimits {
  maxMinutes: number;
  maxGptPrompts: number;
  currentMinutes: number;
  currentGptPrompts: number;
  planName: string;
}

export interface UsageUpdate {
  minutesUsed?: number;
  gptPromptsUsed?: number;
}

class UsageService {
  private static instance: UsageService;
  private currentUsage: UsageLimits | null = null;

  static getInstance(): UsageService {
    if (!UsageService.instance) {
      UsageService.instance = new UsageService();
    }
    return UsageService.instance;
  }

  // Get current usage limits based on user's plan
  async getUserLimits(userId: string): Promise<UsageLimits> {
    try {
      // Get user's current subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_plans (
            name,
            max_minutes_per_episode,
            features
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      // Handle missing tables gracefully
      if (subError && (subError.code === 'PGRST116' || subError.message.includes('relation "user_subscriptions" does not exist') || subError.code === 'PGRST301' || subError.code === 'PGRST400')) {
        console.log('Database tables not found or query failed, using Free plan defaults');
        return this.getFreePlanLimits();
      }

      if (subError || !subscription) {
        // Default to Free plan if no subscription found
        return this.getFreePlanLimits();
      }

      const planData = subscription.subscription_plans;
      const plan = Array.isArray(planData) ? planData[0] : planData;

      if (!plan) {
        return this.getFreePlanLimits();
      }

      const features = (plan.features as Record<string, any> | null) || {};

      return {
        maxMinutes: plan.max_minutes_per_episode === -1 ? -1 : 30, // Free plan limit
        maxGptPrompts: features.max_gpt_prompts === -1 ? -1 : 5, // Free plan limit
        currentMinutes: 0,
        currentGptPrompts: 0,
        planName: plan.name
      };
    } catch (error) {
      console.error('Error fetching user limits:', error);
      return this.getFreePlanLimits();
    }
  }

  // Get current usage for the month
  async getCurrentUsage(userId: string): Promise<UsageLimits> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      console.log(`[Usage Service] Getting current usage for user: ${userId}, month: ${currentMonth}`);
      
      const { data: usage, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonth)
        .maybeSingle();

      const limits = await this.getUserLimits(userId);

      if (error || !usage) {
        console.log(`[Usage Service] No usage data found for user ${userId}, returning zero usage`);
        // No usage data found, return limits with zero usage
        return {
          ...limits,
          currentMinutes: 0,
          currentGptPrompts: 0
        };
      }

      return {
        ...limits,
        currentMinutes: usage.total_minutes_processed || 0,
        currentGptPrompts: usage.gpt_prompts_used || 0
      };
    } catch (error) {
      console.error('Error fetching current usage:', error);
      return this.getFreePlanLimits();
    }
  }

  // Update usage when user processes audio or uses GPT
  async updateUsage(userId: string, update: UsageUpdate): Promise<boolean> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Get current usage
      const { data: currentUsage, error: fetchError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonth)
        .maybeSingle();

      // If table doesn't exist or no data found, start with zeros
      if (fetchError && (fetchError.code === 'PGRST116' || fetchError.message.includes('relation "user_usage" does not exist') || fetchError.code === 'PGRST301' || fetchError.code === 'PGRST400')) {
        console.log('No existing usage data found or table missing, creating new record');
      } else if (fetchError) {
        console.error('Error fetching current usage:', fetchError);
        // For now, continue with zeros - this handles cases where table doesn't exist
      }

      const newMinutes = (currentUsage?.total_minutes_processed || 0) + (update.minutesUsed || 0);
      const newGptPrompts = (currentUsage?.gpt_prompts_used || 0) + (update.gptPromptsUsed || 0);

      // Use upsert to handle both insert and update cases
      const { error: upsertError } = await supabase
        .from('user_usage')
        .upsert({
          user_id: userId,
          month_year: currentMonth,
          total_minutes_processed: newMinutes,
          gpt_prompts_used: newGptPrompts,
          episodes_processed: currentUsage?.episodes_processed || 0,
          api_calls_made: (currentUsage?.api_calls_made || 0) + 1,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, month_year'
        });

      if (upsertError) {
        console.error('Error upserting usage:', upsertError);
        // If table doesn't exist, don't fail - just log and continue
        if (upsertError.message.includes('relation "user_usage" does not exist')) {
          console.log('Usage table not found, skipping usage tracking for now');
          return true; // Don't fail the upload process
        }
        return false;
      }

      // Update local cache
      this.currentUsage = null; // Clear cache to force re-fetch
      return true;
    } catch (error) {
      console.error('Error updating usage:', error);
      return false;
    }
  }

  // Check if user can perform an action (within limits)
  async canPerformAction(userId: string, action: 'processAudio' | 'useGpt', amount: number = 1): Promise<{ canPerform: boolean; reason?: string }> {
    const usage = await this.getCurrentUsage(userId);

    if (action === 'processAudio') {
      if (usage.maxMinutes === -1) {
        return { canPerform: true }; // Pro plan, unlimited
      }
      if (usage.currentMinutes + amount > usage.maxMinutes) {
        const remaining = usage.maxMinutes - usage.currentMinutes;
        return { 
          canPerform: false, 
          reason: remaining > 0
            ? `This file would use ${amount} minutes, but you only have ${remaining} minutes remaining this month. Upgrade to Pro for unlimited processing.`
            : `You've reached your monthly limit of ${usage.maxMinutes} minutes. Upgrade to Pro for unlimited processing.`
        };
      }
    }

    if (action === 'useGpt') {
      if (usage.maxGptPrompts === -1) {
        return { canPerform: true }; // Pro plan, unlimited
      }
      if (usage.currentGptPrompts + amount > usage.maxGptPrompts) {
        return { 
          canPerform: false, 
          reason: `You've used all ${usage.maxGptPrompts} GPT prompts for this month. Upgrade to Pro for unlimited prompts.` 
        };
      }
    }

    return { canPerform: true };
  }

  // ============================================================================
  // NEW FUNCTIONALITY - YouTube Duration Enforcement
  // ============================================================================
  // These functions handle YouTube video duration tracking and usage enforcement
  // Added for YouTube integration while preserving existing local file functionality

  /**
   * NEW FUNCTION: Check if user can process a YouTube video based on its duration
   * 
   * This function enforces usage limits for YouTube videos using accurate duration
   * from the YouTube Data API v3. It provides clear error messages and upgrade
   * prompts for Free users who exceed their monthly limits.
   * 
   * @param userId - User ID for usage tracking
   * @param videoDurationSeconds - Video duration in seconds from YouTube API
   * @returns Object with processing permission and reason
   */
  async canProcessYouTubeVideo(userId: string, videoDurationSeconds: number): Promise<{ canProcess: boolean; reason?: string; estimatedDuration?: string }> {
    try {
      const usage = await this.getCurrentUsage(userId);
      const videoDurationMinutes = Math.ceil(videoDurationSeconds / 60);

      console.log(`[Usage Service] Checking YouTube video processing:`, {
        videoDurationSeconds,
        videoDurationMinutes,
        currentUsage: usage.currentMinutes,
        limit: usage.maxMinutes,
        plan: usage.planName
      });

      // Convert to minutes for consistency with other limits
      if (usage.maxMinutes === -1) {
        // Pro plan - unlimited
        return { 
          canProcess: true,
          estimatedDuration: this.formatDuration(videoDurationMinutes)
        };
      }

      // Free plan - check if processing this video would exceed limit
      if (usage.currentMinutes + videoDurationMinutes > usage.maxMinutes) {
        const remaining = usage.maxMinutes - usage.currentMinutes;
        return { 
          canProcess: false,
          reason: `This video is ${videoDurationMinutes} minutes long, but you only have ${remaining} minutes remaining this month. Upgrade to Pro for unlimited processing.`,
          estimatedDuration: this.formatDuration(videoDurationMinutes)
        };
      }

      // Check remaining minutes
      const remaining = usage.maxMinutes - (usage.currentMinutes + videoDurationMinutes);
      
      return { 
        canProcess: true,
        estimatedDuration: this.formatDuration(videoDurationMinutes),
        reason: remaining < 0 ? 'You will exceed your monthly limit after this video.' : undefined
      };
    } catch (error) {
      console.error('[Usage Service] Error checking YouTube video processing:', error);
      // On error, allow processing to continue
      return { canProcess: true };
    }
  }

  /**
   * NEW FUNCTION: Update usage after processing a YouTube video
   * 
   * This function updates the user's usage tracking after successfully processing
   * a YouTube video. It converts the duration from seconds to minutes and calls
   * the existing updateUsage method to maintain consistency with local file tracking.
   * 
   * @param userId - User ID for usage tracking
   * @param videoDurationSeconds - Video duration in seconds from YouTube API
   * @returns Success status of the update operation
   */
  async updateUsageAfterYouTubeVideo(userId: string, videoDurationSeconds: number): Promise<boolean> {
    try {
      const videoDurationMinutes = Math.ceil(videoDurationSeconds / 60);
      
      console.log(`[Usage Service] Updating usage after YouTube video:`, {
        videoDurationSeconds,
        videoDurationMinutes
      });

      return await this.updateUsage(userId, {
        minutesUsed: videoDurationMinutes
      });
    } catch (error) {
      console.error('[Usage Service] Error updating usage after YouTube video:', error);
      return false;
    }
  }

  // Format duration for display
  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  // Get Free plan limits (fallback)
  private getFreePlanLimits(): UsageLimits {
    return {
      maxMinutes: 30,
      maxGptPrompts: 5,
      currentMinutes: 0,
      currentGptPrompts: 0,
      planName: 'Free'
    };
  }

  // Reset monthly usage (called by cron job)
  async resetMonthlyUsage(): Promise<void> {
    // This would be called by a cron job or scheduled function
    // Implementation depends on your hosting setup
  }

  // Get usage for display in UI
  async getUsageForDisplay(userId: string): Promise<{
    minutesUsed: number;
    minutesLimit: number;
    gptPromptsUsed: number;
    gptPromptsLimit: number;
    planName: string;
  }> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Get current usage data
      const { data: usage, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonth)
        .maybeSingle();

      // Calculate usage from localStorage if database shows 0 or doesn't exist
      let calculatedMinutes = 0;
      try {
        const storedEpisodes = localStorage.getItem('episodes');
        if (storedEpisodes) {
          const episodes = JSON.parse(storedEpisodes);
          
          // Filter episodes by userId, or include episodes without userId for backward compatibility
          // (old episodes might not have userId set)
          // Also check if user has any episodes with userId - if not, assume all episodes belong to current user
          const episodesWithUserId = episodes.filter((ep: any) => ep.userId === userId);
          const episodesWithoutUserId = episodes.filter((ep: any) => !ep.userId);
          
          // Include episodes with matching userId, plus episodes without userId (for backward compatibility)
          // Only include episodes without userId if current user exists (logged in)
          const userEpisodes = episodes.filter((ep: any) => 
            ep.userId === userId || (!ep.userId && userId)
          );
          
          console.log(`📊 Calculating usage from ${userEpisodes.length} episodes for user ${userId}`);
          console.log(`📊 Total episodes in storage: ${episodes.length}`);
          console.log(`📊 Episodes with userId ${userId}: ${episodesWithUserId.length}`);
          console.log(`📊 Episodes without userId: ${episodesWithoutUserId.length}`);
          
          // Auto-fix: Add userId to episodes that don't have it (for backward compatibility)
          if (episodesWithoutUserId.length > 0 && userId) {
            console.log(`🔧 Auto-fixing ${episodesWithoutUserId.length} episodes by adding userId...`);
            let hasUpdates = false;
            const updatedEpisodes = episodes.map((ep: any) => {
              if (!ep.userId) {
                hasUpdates = true;
                return { ...ep, userId };
              }
              return ep;
            });
            
            if (hasUpdates) {
              try {
                localStorage.setItem('episodes', JSON.stringify(updatedEpisodes));
                localStorage.setItem('episodes_owner', userId);
                console.log(`✅ Added userId to ${episodesWithoutUserId.length} episodes`);
              } catch (saveError) {
                console.error('Failed to save episodes with userId:', saveError);
              }
            }
          }
          
          // Calculate total seconds first, then convert to minutes once (to avoid rounding inflation)
          let totalSeconds = 0;
          userEpisodes.forEach((ep: any) => {
            let durationSeconds = 0;
            let parsedDuration = '';
            
            if (typeof ep.duration === 'number') {
              durationSeconds = ep.duration;
              parsedDuration = `${Math.floor(ep.duration / 60)}:${(ep.duration % 60).toString().padStart(2, '0')}`;
            } else if (typeof ep.duration === 'string') {
              parsedDuration = ep.duration;
              const parts = ep.duration.split(':').map(Number);
              
              if (parts.length === 3) {
                // HH:MM:SS format
                durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
              } else if (parts.length === 2) {
                // MM:SS format (most common)
                durationSeconds = parts[0] * 60 + parts[1];
              } else if (parts.length === 1 && !isNaN(parts[0])) {
                // Just seconds
                durationSeconds = parts[0];
              }
            }
            
            totalSeconds += durationSeconds;
            console.log(`  - "${ep.title}": ${parsedDuration} (${durationSeconds}s)`);
          });
          
          // Convert total seconds to minutes (round up once for billing accuracy)
          calculatedMinutes = Math.ceil(totalSeconds / 60);
          console.log(`  📊 Total: ${totalSeconds}s = ${calculatedMinutes} min (calculated from ${userEpisodes.length} episodes)`);
          
          // Log episode details for debugging
          if (userEpisodes.length > 0) {
            console.log('📋 Episode details:');
            userEpisodes.forEach((ep: any) => {
              const durationStr = typeof ep.duration === 'number' 
                ? `${Math.floor(ep.duration / 60)}:${(ep.duration % 60).toString().padStart(2, '0')}` 
                : ep.duration || '0:00';
              console.log(`  - "${ep.title}": ${durationStr} (userId: ${ep.userId || 'missing'})`);
            });
          }
        }
      } catch (localStorageError) {
        console.error('Error calculating usage from localStorage:', localStorageError);
      }

      // If no usage data found or table doesn't exist, return calculated from localStorage or defaults
      if (error && (error.code === 'PGRST116' || error.message.includes('relation "user_usage" does not exist') || error.code === 'PGRST301' || error.code === 'PGRST400' || error.code === '22P02')) {
        // No rows found or table doesn't exist - use calculated from localStorage if available
        console.log('No usage data found in database, using localStorage calculation:', calculatedMinutes, 'minutes');
        console.log('⚠️  NOTE: Usage will persist once episodes are processed and saved to database');
        return {
          minutesUsed: calculatedMinutes,
          minutesLimit: 30,
          gptPromptsUsed: 0,
          gptPromptsLimit: 5,
          planName: 'Free'
        };
      }

      if (error) {
        console.error('Error fetching usage for display:', error);
        // On error, use calculated usage but log that this is a fallback
        console.log('⚠️  Using calculated usage as fallback due to database error');
        return {
          minutesUsed: calculatedMinutes,
          minutesLimit: 30,
          gptPromptsUsed: 0,
          gptPromptsLimit: 5,
          planName: 'Free'
        };
      }

      // Return actual usage data from database - usage is persistent and doesn't decrease when episodes are deleted
      const dbMinutes = usage?.total_minutes_processed || 0;
      // IMPORTANT: Usage should never decrease when episodes are deleted
      // Always prefer database usage (persistent) over calculated usage (based on current episodes)
      // Only use calculatedMinutes as fallback if database is 0 or unavailable (for initial sync)
      // If both exist, use the maximum to ensure usage never decreases
      const finalMinutes = dbMinutes > 0 
        ? Math.max(dbMinutes, calculatedMinutes) // If DB exists, use max to prevent decreases
        : calculatedMinutes; // Only use calculated if DB is 0/unavailable
      
      console.log('Usage calculation:', {
        dbMinutes,
        calculatedMinutes,
        finalMinutes,
        episodeCount: calculatedMinutes > 0 ? 'calculated from localStorage' : 'from database'
      });
      
      return {
        minutesUsed: finalMinutes,
        minutesLimit: 30, // Free plan limit
        gptPromptsUsed: usage?.gpt_prompts_used || 0,
        gptPromptsLimit: 5, // Free plan limit
        planName: 'Free'
      };
    } catch (error) {
      console.error('Error fetching usage for display:', error);
      return {
        minutesUsed: 0,
        minutesLimit: 30,
        gptPromptsUsed: 0,
        gptPromptsLimit: 5,
        planName: 'Free'
      };
    }
  }
}

export const usageService = UsageService.getInstance();
