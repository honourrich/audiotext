export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          average_listen_duration_seconds: number | null
          completion_rate: number | null
          created_at: string | null
          date: string
          device_data: Json | null
          episode_id: string
          geographic_data: Json | null
          id: string
          plays: number | null
          unique_listeners: number | null
          updated_at: string | null
        }
        Insert: {
          average_listen_duration_seconds?: number | null
          completion_rate?: number | null
          created_at?: string | null
          date: string
          device_data?: Json | null
          episode_id: string
          geographic_data?: Json | null
          id?: string
          plays?: number | null
          unique_listeners?: number | null
          updated_at?: string | null
        }
        Update: {
          average_listen_duration_seconds?: number | null
          completion_rate?: number | null
          created_at?: string | null
          date?: string
          device_data?: Json | null
          episode_id?: string
          geographic_data?: Json | null
          id?: string
          plays?: number | null
          unique_listeners?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_voice_profiles: {
        Row: {
          authenticity_score: number | null
          brand_keywords: string[] | null
          brand_name: string | null
          created_at: string | null
          enthusiasm_score: number | null
          formality_score: number | null
          id: string
          last_analysis_at: string | null
          liwc_analysis: Json | null
          source_content_urls: string[] | null
          technical_level: number | null
          tone_markers: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          authenticity_score?: number | null
          brand_keywords?: string[] | null
          brand_name?: string | null
          created_at?: string | null
          enthusiasm_score?: number | null
          formality_score?: number | null
          id?: string
          last_analysis_at?: string | null
          liwc_analysis?: Json | null
          source_content_urls?: string[] | null
          technical_level?: number | null
          tone_markers?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          authenticity_score?: number | null
          brand_keywords?: string[] | null
          brand_name?: string | null
          created_at?: string | null
          enthusiasm_score?: number | null
          formality_score?: number | null
          id?: string
          last_analysis_at?: string | null
          liwc_analysis?: Json | null
          source_content_urls?: string[] | null
          technical_level?: number | null
          tone_markers?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      episode_collaborators: {
        Row: {
          created_at: string | null
          episode_id: string
          id: string
          permissions: Json | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          episode_id: string
          id?: string
          permissions?: Json | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          episode_id?: string
          id?: string
          permissions?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_collaborators_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_comments: {
        Row: {
          content: string
          created_at: string | null
          episode_id: string
          id: string
          parent_id: string | null
          priority: string
          status: string
          text_selection: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          episode_id: string
          id?: string
          parent_id?: string | null
          priority?: string
          status?: string
          text_selection?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          episode_id?: string
          id?: string
          parent_id?: string | null
          priority?: string
          status?: string
          text_selection?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_comments_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "episode_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_personalization_data: {
        Row: {
          brand_voice_score: number | null
          created_at: string | null
          detected_genre: string | null
          episode_id: string
          extracted_resources: Json | null
          id: string
          personality_fit_score: number | null
          personalization_applied: Json | null
          updated_at: string | null
          user_feedback: Json | null
          user_id: string
        }
        Insert: {
          brand_voice_score?: number | null
          created_at?: string | null
          detected_genre?: string | null
          episode_id: string
          extracted_resources?: Json | null
          id?: string
          personality_fit_score?: number | null
          personalization_applied?: Json | null
          updated_at?: string | null
          user_feedback?: Json | null
          user_id: string
        }
        Update: {
          brand_voice_score?: number | null
          created_at?: string | null
          detected_genre?: string | null
          episode_id?: string
          extracted_resources?: Json | null
          id?: string
          personality_fit_score?: number | null
          personalization_applied?: Json | null
          updated_at?: string | null
          user_feedback?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      episode_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "episode_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_tags: {
        Row: {
          episode_id: string
          tag_id: string
        }
        Insert: {
          episode_id: string
          tag_id: string
        }
        Update: {
          episode_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_tags_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          id: string
          user_id: string | null
          title: string
          audio_url: string | null
          youtube_url: string | null
          file_size: number | null
          duration: number | null
          transcript: string | null
          summary_short: string | null
          summary_long: string | null
          chapters: Json | null
          keywords: Json | null
          quotes: Json | null
          processing_status: string | null
          processing_progress: number | null
          processing_error: string | null
          created_at: string | null
          updated_at: string | null
          last_edited: string | null
          word_count: number | null
          processing_time: number | null
          api_cost: number | null
          workspace_id: string | null
          current_status: string | null
          assigned_to: string | null
          due_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          audio_url?: string | null
          youtube_url?: string | null
          file_size?: number | null
          duration?: number | null
          transcript?: string | null
          summary_short?: string | null
          summary_long?: string | null
          chapters?: Json | null
          keywords?: Json | null
          quotes?: Json | null
          processing_status?: string | null
          processing_progress?: number | null
          processing_error?: string | null
          created_at?: string | null
          current_status?: string | null
          last_edited?: string | null
          word_count?: number | null
          processing_time?: number | null
          api_cost?: number | null
          workspace_id?: string | null
          assigned_to?: string | null
          due_date?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          audio_url?: string | null
          youtube_url?: string | null
          file_size?: number | null
          duration?: number | null
          transcript?: string | null
          summary_short?: string | null
          summary_long?: string | null
          chapters?: Json | null
          keywords?: Json | null
          quotes?: Json | null
          created_at?: string | null
          current_status?: string | null
          processing_status?: string | null
          processing_progress?: number | null
          processing_error?: string | null
          last_edited?: string | null
          word_count?: number | null
          processing_time?: number | null
          api_cost?: number | null
          workspace_id?: string | null
          assigned_to?: string | null
          due_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      genre_templates: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          example_content: string | null
          formatting_rules: Json | null
          genre_name: string
          id: string
          is_active: boolean | null
          optional_sections: string[] | null
          required_sections: string[] | null
          structure_template: Json
          tone_guidelines: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          example_content?: string | null
          formatting_rules?: Json | null
          genre_name: string
          id?: string
          is_active?: boolean | null
          optional_sections?: string[] | null
          required_sections?: string[] | null
          structure_template: Json
          tone_guidelines?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          example_content?: string | null
          formatting_rules?: Json | null
          genre_name?: string
          id?: string
          is_active?: boolean | null
          optional_sections?: string[] | null
          required_sections?: string[] | null
          structure_template?: Json
          tone_guidelines?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_analytics: {
        Row: {
          action: string
          data: Json | null
          id: string
          ip_address: unknown | null
          session_id: string | null
          step_number: number
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          data?: Json | null
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          step_number: number
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          data?: Json | null
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          step_number?: number
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      personalization_settings: {
        Row: {
          created_at: string | null
          enable_brand_voice: boolean | null
          enable_genre_detection: boolean | null
          enable_personality_scoring: boolean | null
          enable_resource_linking: boolean | null
          enable_style_cloning: boolean | null
          feedback_data: Json | null
          id: string
          manual_overrides: Json | null
          preferred_genre: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enable_brand_voice?: boolean | null
          enable_genre_detection?: boolean | null
          enable_personality_scoring?: boolean | null
          enable_resource_linking?: boolean | null
          enable_style_cloning?: boolean | null
          feedback_data?: Json | null
          id?: string
          manual_overrides?: Json | null
          preferred_genre?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enable_brand_voice?: boolean | null
          enable_genre_detection?: boolean | null
          enable_personality_scoring?: boolean | null
          enable_resource_linking?: boolean | null
          enable_style_cloning?: boolean | null
          feedback_data?: Json | null
          id?: string
          manual_overrides?: Json | null
          preferred_genre?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      podcasts: {
        Row: {
          categories: string[] | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_explicit: boolean | null
          language: string | null
          rss_feed_url: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          categories?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_explicit?: boolean | null
          language?: string | null
          rss_feed_url?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          categories?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_explicit?: boolean | null
          language?: string | null
          rss_feed_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "podcasts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      privacy_consents: {
        Row: {
          consent_date: string | null
          consent_given: boolean | null
          consent_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean | null
          consent_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean | null
          consent_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      resource_database: {
        Row: {
          alternative_names: string[] | null
          auto_link_enabled: boolean | null
          canonical_url: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          resource_name: string
          resource_type: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          alternative_names?: string[] | null
          auto_link_enabled?: boolean | null
          canonical_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          resource_name: string
          resource_type: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          alternative_names?: string[] | null
          auto_link_enabled?: boolean | null
          canonical_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          resource_name?: string
          resource_type?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      show_notes: {
        Row: {
          ai_generated: boolean | null
          content: string | null
          created_at: string | null
          episode_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          content?: string | null
          created_at?: string | null
          episode_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: string | null
          created_at?: string | null
          episode_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "show_notes_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_posts: {
        Row: {
          content: string
          engagement_metrics: Json | null
          id: string
          is_original: boolean | null
          platform: string
          post_date: string | null
          post_id: string
          profile_id: string | null
          scraped_at: string | null
        }
        Insert: {
          content: string
          engagement_metrics?: Json | null
          id?: string
          is_original?: boolean | null
          platform: string
          post_date?: string | null
          post_id: string
          profile_id?: string | null
          scraped_at?: string | null
        }
        Update: {
          content?: string
          engagement_metrics?: Json | null
          id?: string
          is_original?: boolean | null
          platform?: string
          post_date?: string | null
          post_id?: string
          profile_id?: string | null
          scraped_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "social_media_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_profiles: {
        Row: {
          analysis_enabled: boolean | null
          consent_given: boolean | null
          created_at: string | null
          handle: string
          id: string
          platform: string
          profile_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_enabled?: boolean | null
          consent_given?: boolean | null
          created_at?: string | null
          handle: string
          id?: string
          platform: string
          profile_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_enabled?: boolean | null
          consent_given?: boolean | null
          created_at?: string | null
          handle?: string
          id?: string
          platform?: string
          profile_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      social_media_style_analysis: {
        Row: {
          analysis_data: Json
          confidence_score: number | null
          created_at: string | null
          id: string
          last_analysis: string | null
          posts_analyzed: number | null
          style_profile: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_data?: Json
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_analysis?: string | null
          posts_analyzed?: number | null
          style_profile?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_analysis?: string | null
          posts_analyzed?: number | null
          style_profile?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          permissions: Json | null
          role: string
          status: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          permissions?: Json | null
          role: string
          status?: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          analytics_data: Json | null
          completed: boolean | null
          completed_at: string | null
          content_preferences: Json | null
          created_at: string | null
          current_step: number | null
          first_content_data: Json | null
          id: string
          started_at: string | null
          style_preferences: Json | null
          updated_at: string | null
          user_id: string | null
          user_segment: string | null
        }
        Insert: {
          analytics_data?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          content_preferences?: Json | null
          created_at?: string | null
          current_step?: number | null
          first_content_data?: Json | null
          id?: string
          started_at?: string | null
          style_preferences?: Json | null
          updated_at?: string | null
          user_id?: string | null
          user_segment?: string | null
        }
        Update: {
          analytics_data?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          content_preferences?: Json | null
          created_at?: string | null
          current_step?: number | null
          first_content_data?: Json | null
          id?: string
          started_at?: string | null
          style_preferences?: Json | null
          updated_at?: string | null
          user_id?: string | null
          user_segment?: string | null
        }
        Relationships: []
      }
      user_personality_profiles: {
        Row: {
          agreeableness: number | null
          analyzed_episodes: number | null
          avg_sentence_length: number | null
          conscientiousness: number | null
          created_at: string | null
          enthusiasm_score: number | null
          extraversion: number | null
          formality_score: number | null
          id: string
          last_analysis_at: string | null
          neuroticism: number | null
          openness: number | null
          technical_depth: number | null
          updated_at: string | null
          user_id: string
          vocabulary_complexity: number | null
          writing_patterns: Json | null
        }
        Insert: {
          agreeableness?: number | null
          analyzed_episodes?: number | null
          avg_sentence_length?: number | null
          conscientiousness?: number | null
          created_at?: string | null
          enthusiasm_score?: number | null
          extraversion?: number | null
          formality_score?: number | null
          id?: string
          last_analysis_at?: string | null
          neuroticism?: number | null
          openness?: number | null
          technical_depth?: number | null
          updated_at?: string | null
          user_id: string
          vocabulary_complexity?: number | null
          writing_patterns?: Json | null
        }
        Update: {
          agreeableness?: number | null
          analyzed_episodes?: number | null
          avg_sentence_length?: number | null
          conscientiousness?: number | null
          created_at?: string | null
          enthusiasm_score?: number | null
          extraversion?: number | null
          formality_score?: number | null
          id?: string
          last_analysis_at?: string | null
          neuroticism?: number | null
          openness?: number | null
          technical_depth?: number | null
          updated_at?: string | null
          user_id?: string
          vocabulary_complexity?: number | null
          writing_patterns?: Json | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          cursor_position: Json | null
          episode_id: string
          id: string
          is_active: boolean | null
          last_seen: string | null
          user_id: string
        }
        Insert: {
          cursor_position?: Json | null
          episode_id: string
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          user_id: string
        }
        Update: {
          cursor_position?: Json | null
          episode_id?: string
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          twitter_handle: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          twitter_handle?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          twitter_handle?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      version_history: {
        Row: {
          change_description: string | null
          changed_by: string
          content_snapshot: Json
          episode_id: string
          id: string
          timestamp: string | null
          version_number: number
        }
        Insert: {
          change_description?: string | null
          changed_by: string
          content_snapshot: Json
          episode_id: string
          id?: string
          timestamp?: string | null
          version_number?: number
        }
        Update: {
          change_description?: string | null
          changed_by?: string
          content_snapshot?: Json
          episode_id?: string
          id?: string
          timestamp?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "version_history_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_states: {
        Row: {
          changed_by: string
          created_at: string | null
          episode_id: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          episode_id: string
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          episode_id?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_states_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
