import { supabase } from './supabase';

export interface UserOnboarding {
  id: string;
  user_id: string;
  current_step: number;
  completed: boolean;
  started_at: string;
  completed_at?: string;
  user_segment?: 'podcast_host' | 'youtube_creator' | 'content_agency' | 'va_editor';
  content_preferences: {
    content_types: string[];
    publishing_frequency: string;
    average_length: string;
    target_audience?: string;
  };
  style_preferences: {
    writing_tone: string;
    social_profiles?: string[];
    website_url?: string;
    writing_samples?: string[];
  };
  first_content_data: {
    type?: 'audio' | 'youtube' | 'demo';
    file_name?: string;
    youtube_url?: string;
    processing_status?: string;
    generated_content?: any;
  };
  analytics_data: {
    time_per_step: Record<number, number>;
    skipped_steps: number[];
    completion_time?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface OnboardingAnalytics {
  id: string;
  user_id: string;
  step_number: number;
  action: string;
  data: Record<string, any>;
  timestamp: string;
  session_id?: string;
  user_agent?: string;
  ip_address?: string;
}

export class OnboardingAPI {
  // Get or create onboarding record
  static async getOrCreateOnboarding(userId: string): Promise<UserOnboarding> {
    const { data: existing, error: fetchError } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing && !fetchError) {
      return existing;
    }

    // Create new onboarding record
    const { data, error } = await supabase
      .from('user_onboarding')
      .insert({
        user_id: userId,
        current_step: 1,
        completed: false,
        content_preferences: {},
        style_preferences: {},
        first_content_data: {},
        analytics_data: { time_per_step: {}, skipped_steps: [] }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update onboarding progress
  static async updateOnboarding(userId: string, updates: Partial<UserOnboarding>) {
    const { data, error } = await supabase
      .from('user_onboarding')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Complete onboarding
  static async completeOnboarding(userId: string) {
    const { data, error } = await supabase
      .from('user_onboarding')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        current_step: 7, // Beyond the last step
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Track analytics event
  static async trackEvent(
    userId: string,
    stepNumber: number,
    action: string,
    data: Record<string, any> = {},
    sessionId?: string
  ) {
    const { error } = await supabase
      .from('onboarding_analytics')
      .insert({
        user_id: userId,
        step_number: stepNumber,
        action,
        data,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to track onboarding event:', error);
    }
  }

  // Get onboarding analytics
  static async getOnboardingAnalytics(userId: string) {
    const { data, error } = await supabase
      .from('onboarding_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Check if user has completed onboarding
  static async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_onboarding')
      .select('completed')
      .eq('user_id', userId)
      .single();

    if (error || !data) return false;
    return data.completed;
  }

  // Reset onboarding (for testing or re-onboarding)
  static async resetOnboarding(userId: string) {
    const { data, error } = await supabase
      .from('user_onboarding')
      .update({
        current_step: 1,
        completed: false,
        completed_at: null,
        user_segment: null,
        content_preferences: {},
        style_preferences: {},
        first_content_data: {},
        analytics_data: { time_per_step: {}, skipped_steps: [] },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}