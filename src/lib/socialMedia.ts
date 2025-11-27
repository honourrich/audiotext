import { supabase } from './supabase';

export interface SocialMediaProfile {
  id: string;
  user_id: string;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'tiktok';
  handle: string;
  profile_url?: string;
  consent_given: boolean;
  analysis_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaPost {
  id: string;
  profile_id: string;
  platform: string;
  post_id: string;
  content: string;
  post_date: string;
  engagement_metrics: Record<string, any>;
  is_original: boolean;
  scraped_at: string;
}

export interface SocialMediaStyleAnalysis {
  id: string;
  user_id: string;
  analysis_data: {
    tone: string;
    formality: number;
    humor_style: string;
    vocabulary_level: string;
    common_phrases: string[];
    storytelling_approach: string;
    emotional_expression: string;
    sentence_structure: string;
    platform_differences: Record<string, any>;
  };
  style_profile: {
    writing_style: string;
    personality_traits: string[];
    content_themes: string[];
    engagement_patterns: Record<string, any>;
  };
  confidence_score: number;
  posts_analyzed: number;
  last_analysis: string;
  created_at: string;
  updated_at: string;
}

export interface PrivacyConsent {
  id: string;
  user_id: string;
  consent_type: string;
  consent_given: boolean;
  consent_date: string;
  ip_address?: string;
  user_agent?: string;
}

export class SocialMediaAPI {
  // Social Media Profile Management
  static async addSocialMediaProfile(profile: Omit<SocialMediaProfile, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('social_media_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSocialMediaProfiles(userId: string) {
    const { data, error } = await supabase
      .from('social_media_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async updateSocialMediaProfile(id: string, updates: Partial<SocialMediaProfile>) {
    const { data, error } = await supabase
      .from('social_media_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSocialMediaProfile(id: string) {
    const { error } = await supabase
      .from('social_media_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Privacy Consent Management
  static async recordConsent(consent: Omit<PrivacyConsent, 'id' | 'consent_date'>) {
    const { data, error } = await supabase
      .from('privacy_consents')
      .upsert({
        ...consent,
        consent_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getConsents(userId: string) {
    const { data, error } = await supabase
      .from('privacy_consents')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  // Social Media Posts Management
  static async storePosts(posts: Omit<SocialMediaPost, 'id' | 'scraped_at'>[]) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .upsert(posts.map(post => ({
        ...post,
        scraped_at: new Date().toISOString()
      })))
      .select();

    if (error) throw error;
    return data;
  }

  static async getUserPosts(userId: string, limit = 100) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select(`
        *,
        social_media_profiles!inner(user_id)
      `)
      .eq('social_media_profiles.user_id', userId)
      .eq('is_original', true)
      .order('post_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Style Analysis Management
  static async saveStyleAnalysis(analysis: Omit<SocialMediaStyleAnalysis, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('social_media_style_analysis')
      .upsert({
        ...analysis,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getStyleAnalysis(userId: string) {
    const { data, error } = await supabase
      .from('social_media_style_analysis')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async deleteUserData(userId: string) {
    // Delete all social media data for user
    const { data: profiles, error: profilesFetchError } = await supabase
      .from('social_media_profiles')
      .select('id')
      .eq('user_id', userId);

    if (profilesFetchError) throw profilesFetchError;

    const profileIds = (profiles || []).map(profile => profile.id);

    if (profileIds.length > 0) {
      const { error: postsError } = await supabase
        .from('social_media_posts')
        .delete()
        .in('profile_id', profileIds);

      if (postsError) throw postsError;
    }

    const { error: analysisError } = await supabase
      .from('social_media_style_analysis')
      .delete()
      .eq('user_id', userId);

    if (analysisError) throw analysisError;

    if (profileIds.length > 0) {
      const { error: profilesError } = await supabase
        .from('social_media_profiles')
        .delete()
        .in('id', profileIds);

      if (profilesError) throw profilesError;
    }
  }

  // Social Media Scraping (placeholder for external API integration)
  static async scrapeSocialMediaPosts(profile: SocialMediaProfile): Promise<SocialMediaPost[]> {
    // This would integrate with ScraperAPI or similar service
    // For now, return mock data structure
    console.log(`Scraping ${profile.platform} for ${profile.handle}`);
    
    // In production, this would:
    // 1. Use ScraperAPI to fetch posts
    // 2. Filter for original content
    // 3. Handle rate limiting
    // 4. Return structured post data
    
    return [];
  }

  // Style Analysis using GPT-4
  static async analyzeSocialMediaStyle(userId: string, posts: SocialMediaPost[]): Promise<SocialMediaStyleAnalysis> {
    if (posts.length === 0) {
      throw new Error('No posts available for analysis');
    }

    // Combine all post content
    const combinedContent = posts.map(post => post.content).join('\n\n');
    
    // Group posts by platform for platform-specific analysis
    const postsByPlatform = posts.reduce((acc, post) => {
      if (!acc[post.platform]) acc[post.platform] = [];
      acc[post.platform].push(post);
      return acc;
    }, {} as Record<string, SocialMediaPost[]>);

    try {
      // SECURITY: Use Supabase Edge Function instead of direct OpenAI API call
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase configuration missing. Please check your environment variables.');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/social-media-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          posts: posts,
          analysisType: 'style',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success || !result.analysis) {
        throw new Error(result.error || 'No analysis data returned');
      }

      const analysisResult = result.analysis;

      const styleAnalysis: Omit<SocialMediaStyleAnalysis, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        analysis_data: analysisResult.analysis_data,
        style_profile: analysisResult.style_profile,
        confidence_score: analysisResult.confidence_score,
        posts_analyzed: posts.length,
        last_analysis: new Date().toISOString()
      };

      return await this.saveStyleAnalysis(styleAnalysis);
    } catch (error) {
      console.error('Style analysis failed:', error);
      throw error;
    }
  }
}