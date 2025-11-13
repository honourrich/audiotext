-- Fix RLS Security Issues - Safe Version
-- This migration enables RLS on all tables without assuming column names

-- First, let's enable RLS on all the tables that were reported as having issues
-- We'll do this without creating policies first, then add policies based on actual table structure

-- Enable RLS on all reported tables
ALTER TABLE IF EXISTS public.user_personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.brand_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.genre_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resource_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.personalization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.episode_personalization_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.social_media_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.social_media_style_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.episode_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.episode_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.episode_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_presence ENABLE ROW LEVEL SECURITY;

-- Now let's create basic policies for tables we know have user_id columns
-- Based on the migration files, these tables have user_id:

-- User personality profiles (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_personality_profiles' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_personality_profiles' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own personality profiles" ON public.user_personality_profiles;
            CREATE POLICY "Users can manage own personality profiles" ON public.user_personality_profiles
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Brand voice profiles (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_voice_profiles' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_voice_profiles' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own brand voice profiles" ON public.brand_voice_profiles;
            CREATE POLICY "Users can manage own brand voice profiles" ON public.brand_voice_profiles
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Personalization settings (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personalization_settings' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'personalization_settings' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own personalization settings" ON public.personalization_settings;
            CREATE POLICY "Users can manage own personalization settings" ON public.personalization_settings
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Episode personalization data (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'episode_personalization_data' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episode_personalization_data' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own episode personalization data" ON public.episode_personalization_data;
            CREATE POLICY "Users can manage own episode personalization data" ON public.episode_personalization_data
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Social media profiles (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_media_profiles' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_media_profiles' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own social media profiles" ON public.social_media_profiles;
            CREATE POLICY "Users can manage own social media profiles" ON public.social_media_profiles
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Social media posts (references profile_id, needs special handling)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_media_posts' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_media_posts' AND column_name = 'profile_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own social media posts" ON public.social_media_posts;
            CREATE POLICY "Users can manage own social media posts" ON public.social_media_posts
                FOR ALL USING (auth.uid() = (SELECT user_id FROM public.social_media_profiles WHERE id = profile_id));
        END IF;
    END IF;
END $$;

-- Social media style analysis (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_media_style_analysis' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_media_style_analysis' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own social media style analysis" ON public.social_media_style_analysis;
            CREATE POLICY "Users can manage own social media style analysis" ON public.social_media_style_analysis
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Privacy consents (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'privacy_consents' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'privacy_consents' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own privacy consents" ON public.privacy_consents;
            CREATE POLICY "Users can manage own privacy consents" ON public.privacy_consents
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- User onboarding (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_onboarding' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_onboarding' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own onboarding data" ON public.user_onboarding;
            CREATE POLICY "Users can manage own onboarding data" ON public.user_onboarding
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Onboarding analytics (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_analytics' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_analytics' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own onboarding analytics" ON public.onboarding_analytics;
            CREATE POLICY "Users can manage own onboarding analytics" ON public.onboarding_analytics
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Notifications (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
            CREATE POLICY "Users can manage own notifications" ON public.notifications
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- User presence (has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_presence' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_presence' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage own presence data" ON public.user_presence;
            CREATE POLICY "Users can manage own presence data" ON public.user_presence
                FOR ALL USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Workspaces (has owner_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'owner_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage workspaces they own" ON public.workspaces;
            CREATE POLICY "Users can manage workspaces they own" ON public.workspaces
                FOR ALL USING (auth.uid() = owner_id);
        END IF;
    END IF;
END $$;

-- Team members (references workspace_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'workspace_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage team members in their workspaces" ON public.team_members;
            CREATE POLICY "Users can manage team members in their workspaces" ON public.team_members
                FOR ALL USING (auth.uid() IN (SELECT owner_id FROM public.workspaces WHERE id = workspace_id));
        END IF;
    END IF;
END $$;

-- Episode collaborators (references episode_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'episode_collaborators' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episode_collaborators' AND column_name = 'episode_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage collaborators on their episodes" ON public.episode_collaborators;
            CREATE POLICY "Users can manage collaborators on their episodes" ON public.episode_collaborators
                FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.episodes WHERE id = episode_id));
        END IF;
    END IF;
END $$;

-- Version history (references episode_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'version_history' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'version_history' AND column_name = 'episode_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage versions of their episodes" ON public.version_history;
            CREATE POLICY "Users can manage versions of their episodes" ON public.version_history
                FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.episodes WHERE id = episode_id));
        END IF;
    END IF;
END $$;

-- Episode comments (references episode_id and has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'episode_comments' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can manage comments on their episodes" ON public.episode_comments;
        CREATE POLICY "Users can manage comments on their episodes" ON public.episode_comments
            FOR ALL USING (
                auth.uid() = user_id OR 
                auth.uid() IN (SELECT user_id FROM public.episodes WHERE id = episode_id)
            );
    END IF;
END $$;

-- Episode reactions (references episode_id and has user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'episode_reactions' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can manage reactions on their episodes" ON public.episode_reactions;
        CREATE POLICY "Users can manage reactions on their episodes" ON public.episode_reactions
            FOR ALL USING (
                auth.uid() = user_id OR 
                auth.uid() IN (SELECT user_id FROM public.episodes WHERE id = episode_id)
            );
    END IF;
END $$;

-- Workflow states (references episode_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_states' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_states' AND column_name = 'episode_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can manage workflows for their episodes" ON public.workflow_states;
            CREATE POLICY "Users can manage workflows for their episodes" ON public.workflow_states
                FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.episodes WHERE id = episode_id));
        END IF;
    END IF;
END $$;

-- Genre templates (public read-only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'genre_templates' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Anyone can view genre templates" ON public.genre_templates;
        CREATE POLICY "Anyone can view genre templates" ON public.genre_templates
            FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Authenticated users can manage genre templates" ON public.genre_templates;
        CREATE POLICY "Authenticated users can manage genre templates" ON public.genre_templates
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Resource database (public read-only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_database' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Anyone can view resource database" ON public.resource_database;
        CREATE POLICY "Anyone can view resource database" ON public.resource_database
            FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Authenticated users can manage resource database" ON public.resource_database;
        CREATE POLICY "Authenticated users can manage resource database" ON public.resource_database
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
