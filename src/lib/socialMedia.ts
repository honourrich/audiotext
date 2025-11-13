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
    const { error: postsError } = await supabase
      .from('social_media_posts')
      .delete()
      .in('profile_id', 
        supabase
          .from('social_media_profiles')
          .select('id')
          .eq('user_id', userId)
      );

    if (postsError) throw postsError;

    const { error: analysisError } = await supabase
      .from('social_media_style_analysis')
      .delete()
      .eq('user_id', userId);

    if (analysisError) throw analysisError;

    const { error: profilesError } = await supabase
      .from('social_media_profiles')
      .delete()
      .eq('user_id', userId);

    if (profilesError) throw profilesError;
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
      // Call OpenAI API for style analysis
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a writing style analyst. Analyze the following social media posts and provide a detailed writing style profile. Return a JSON object with the following structure:
              {
                "analysis_data": {
                  "tone": "professional/casual/humorous/serious",
                  "formality": 0.0-1.0,
                  "humor_style": "description",
                  "vocabulary_level": "basic/intermediate/advanced",
                  "common_phrases": ["phrase1", "phrase2"],
                  "storytelling_approach": "description",
                  "emotional_expression": "description",
                  "sentence_structure": "short/medium/long/varied",
                  "platform_differences": {}
                },
                "style_profile": {
                  "writing_style": "description",
                  "personality_traits": ["trait1", "trait2"],
                  "content_themes": ["theme1", "theme2"],
                  "engagement_patterns": {}
                },
                "confidence_score": 0.0-1.0
              }`
            },
            {
              role: 'user',
              content: `Analyze these social media posts for writing style:\n\n${combinedContent}`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      const analysisResult = JSON.parse(result.choices[0].message.content);

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