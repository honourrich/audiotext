import { useState, useEffect, useCallback } from 'react';
import { OnboardingAPI, UserOnboarding } from '@/lib/onboarding';
import { useUser } from '@clerk/clerk-react';

export function useOnboarding() {
  const { user } = useUser();
  const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  const loadOnboarding = useCallback(async () => {
    if (!user?.id) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Fetching onboarding data for user:", user.id);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = OnboardingAPI.getOrCreateOnboarding(user.id);
      const data = await Promise.race([dataPromise, timeoutPromise]) as UserOnboarding;
      
      console.log("Onboarding data received:", data);
      setOnboarding(data);
    } catch (err) {
      console.error("Error loading onboarding:", err);
      setError(err instanceof Error ? err.message : 'Failed to load onboarding');
      
      // Create a fallback onboarding object
      const fallbackOnboarding: UserOnboarding = {
        id: 'fallback',
        user_id: user.id,
        current_step: 1,
        completed: false,
        started_at: new Date().toISOString(),
        content_preferences: {},
        style_preferences: {},
        first_content_data: {},
        analytics_data: { time_per_step: {}, skipped_steps: [] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setOnboarding(fallbackOnboarding);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadOnboarding();
    } else {
      setLoading(false);
    }
  }, [user?.id, loadOnboarding]);

  const updateOnboarding = async (updates: Partial<UserOnboarding>) => {
    if (!user?.id || !onboarding) {
      throw new Error("User not authenticated or onboarding not loaded");
    }

    try {
      // If using fallback, just update local state
      if (onboarding.id === 'fallback') {
        const updatedData = { ...onboarding, ...updates };
        setOnboarding(updatedData);
        return updatedData;
      }

      const updatedData = await OnboardingAPI.updateOnboarding(user.id, updates);
      setOnboarding(updatedData);
      return updatedData;
    } catch (err) {
      console.error("Error updating onboarding:", err);
      // Fallback to local update
      const updatedData = { ...onboarding, ...updates };
      setOnboarding(updatedData);
      return updatedData;
    }
  };

  const goToStep = async (step: number) => {
    if (!onboarding || !user?.id) return;

    try {
      // Track step navigation (skip if fallback)
      if (onboarding.id !== 'fallback') {
        await OnboardingAPI.trackEvent(
          user.id,
          onboarding.current_step,
          'step_navigation',
          { from_step: onboarding.current_step, to_step: step },
          sessionId
        );
      }

      return updateOnboarding({ current_step: step });
    } catch (err) {
      console.error("Error navigating to step:", err);
      // Fallback to local update
      return updateOnboarding({ current_step: step });
    }
  };

  const nextStep = async () => {
    if (!onboarding || !user?.id) return;
    
    try {
      const nextStepNumber = onboarding.current_step + 1;
      
      // Track step completion (skip if fallback)
      if (onboarding.id !== 'fallback') {
        await OnboardingAPI.trackEvent(
          user.id,
          onboarding.current_step,
          'step_completed',
          { step: onboarding.current_step },
          sessionId
        );
      }

      return updateOnboarding({ current_step: nextStepNumber });
    } catch (err) {
      console.error("Error moving to next step:", err);
      return updateOnboarding({ current_step: onboarding.current_step + 1 });
    }
  };

  const previousStep = async () => {
    if (!onboarding || !user?.id) return;
    
    try {
      const prevStepNumber = Math.max(1, onboarding.current_step - 1);
      
      // Track step back navigation (skip if fallback)
      if (onboarding.id !== 'fallback') {
        await OnboardingAPI.trackEvent(
          user.id,
          onboarding.current_step,
          'step_back',
          { from_step: onboarding.current_step, to_step: prevStepNumber },
          sessionId
        );
      }

      return updateOnboarding({ current_step: prevStepNumber });
    } catch (err) {
      console.error("Error moving to previous step:", err);
      return updateOnboarding({ current_step: Math.max(1, onboarding.current_step - 1) });
    }
  };

  const skipStep = async () => {
    if (!onboarding || !user?.id) return;

    try {
      const skippedSteps = [...(onboarding.analytics_data.skipped_steps || []), onboarding.current_step];
      
      // Track step skip (skip if fallback)
      if (onboarding.id !== 'fallback') {
        await OnboardingAPI.trackEvent(
          user.id,
          onboarding.current_step,
          'step_skipped',
          { step: onboarding.current_step },
          sessionId
        );
      }

      return updateOnboarding({
        current_step: onboarding.current_step + 1,
        analytics_data: {
          ...onboarding.analytics_data,
          skipped_steps: skippedSteps
        }
      });
    } catch (err) {
      console.error("Error skipping step:", err);
      return updateOnboarding({ current_step: onboarding.current_step + 1 });
    }
  };

  const completeOnboarding = async () => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      // Track completion (skip if fallback)
      if (onboarding?.id !== 'fallback') {
        await OnboardingAPI.trackEvent(
          user.id,
          onboarding?.current_step || 6,
          'onboarding_completed',
          { total_time: Date.now() - new Date(onboarding?.started_at || '').getTime() },
          sessionId
        );

        const completedData = await OnboardingAPI.completeOnboarding(user.id);
        setOnboarding(completedData);
        return completedData;
      } else {
        // Fallback completion
        const completedData = {
          ...onboarding,
          completed: true,
          completed_at: new Date().toISOString(),
          current_step: 7
        };
        setOnboarding(completedData);
        return completedData;
      }
    } catch (err) {
      console.error("Error completing onboarding:", err);
      // Fallback completion
      const completedData = {
        ...onboarding,
        completed: true,
        completed_at: new Date().toISOString(),
        current_step: 7
      };
      setOnboarding(completedData);
      return completedData;
    }
  };

  const updateUserSegment = async (segment: UserOnboarding['user_segment']) => {
    if (!user?.id) return;

    try {
      if (onboarding?.id !== 'fallback') {
        await OnboardingAPI.trackEvent(
          user.id,
          1,
          'user_segment_selected',
          { segment },
          sessionId
        );
      }

      return updateOnboarding({ user_segment: segment });
    } catch (err) {
      console.error("Error updating user segment:", err);
      return updateOnboarding({ user_segment: segment });
    }
  };

  const updateContentPreferences = async (preferences: UserOnboarding['content_preferences']) => {
    if (!user?.id) return;

    try {
      if (onboarding?.id !== 'fallback') {
        await OnboardingAPI.trackEvent(
          user.id,
          2,
          'content_preferences_updated',
          preferences,
          sessionId
        );
      }

      return updateOnboarding({ content_preferences: preferences });
    } catch (err) {
      console.error("Error updating content preferences:", err);
      return updateOnboarding({ content_preferences: preferences });
    }
  };

  const updateStylePreferences = async (preferences: UserOnboarding['style_preferences']) => {
    if (!user?.id) return;

    try {
      if (onboarding?.id !== 'fallback') {
        await OnboardingAPI.trackEvent(
          user.id,
          3,
          'style_preferences_updated',
          preferences,
          sessionId
        );
      }

      return updateOnboarding({ style_preferences: preferences });
    } catch (err) {
      console.error("Error updating style preferences:", err);
      return updateOnboarding({ style_preferences: preferences });
    }
  };

  const updateFirstContentData = async (contentData: UserOnboarding['first_content_data']) => {
    if (!user?.id) return;

    try {
      if (onboarding?.id !== 'fallback') {
        await OnboardingAPI.trackEvent(
          user.id,
          4,
          'first_content_uploaded',
          contentData,
          sessionId
        );
      }

      return updateOnboarding({ first_content_data: contentData });
    } catch (err) {
      console.error("Error updating first content data:", err);
      return updateOnboarding({ first_content_data: contentData });
    }
  };

  const trackEvent = async (action: string, data: Record<string, any> = {}) => {
    if (!onboarding || !user?.id || onboarding.id === 'fallback') return;
    
    try {
      await OnboardingAPI.trackEvent(
        user.id,
        onboarding.current_step,
        action,
        data,
        sessionId
      );
    } catch (err) {
      console.error("Error tracking event:", err);
      // Don't throw error for analytics events
    }
  };

  return {
    onboarding,
    loading,
    error,
    sessionId,
    // Navigation
    goToStep,
    nextStep,
    previousStep,
    skipStep,
    completeOnboarding,
    // Data updates
    updateUserSegment,
    updateContentPreferences,
    updateStylePreferences,
    updateFirstContentData,
    // Analytics
    trackEvent,
    // Utilities
    refetch: loadOnboarding
  };
}