-- Enable Row Level Security (RLS) on all tables
-- This migration fixes critical security vulnerabilities

-- Enable RLS on all tables
ALTER TABLE public.user_personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genre_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_personalization_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_style_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user-specific tables
-- These policies ensure users can only access their own data

-- User personality profiles - users can only access their own profiles
CREATE POLICY "Users can view own personality profiles" ON public.user_personality_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personality profiles" ON public.user_personality_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personality profiles" ON public.user_personality_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personality profiles" ON public.user_personality_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Brand voice profiles - users can only access their own profiles
CREATE POLICY "Users can view own brand voice profiles" ON public.brand_voice_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand voice profiles" ON public.brand_voice_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand voice profiles" ON public.brand_voice_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand voice profiles" ON public.brand_voice_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Personalization settings - users can only access their own settings
CREATE POLICY "Users can view own personalization settings" ON public.personalization_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personalization settings" ON public.personalization_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personalization settings" ON public.personalization_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personalization settings" ON public.personalization_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Episode personalization data - users can only access their own data
CREATE POLICY "Users can view own episode personalization data" ON public.episode_personalization_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own episode personalization data" ON public.episode_personalization_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own episode personalization data" ON public.episode_personalization_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own episode personalization data" ON public.episode_personalization_data
    FOR DELETE USING (auth.uid() = user_id);

-- Social media profiles - users can only access their own profiles
CREATE POLICY "Users can view own social media profiles" ON public.social_media_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social media profiles" ON public.social_media_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social media profiles" ON public.social_media_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social media profiles" ON public.social_media_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Social media posts - users can only access their own posts
CREATE POLICY "Users can view own social media posts" ON public.social_media_posts
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.social_media_profiles WHERE id = profile_id));

CREATE POLICY "Users can insert own social media posts" ON public.social_media_posts
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.social_media_profiles WHERE id = profile_id));

CREATE POLICY "Users can update own social media posts" ON public.social_media_posts
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.social_media_profiles WHERE id = profile_id));

CREATE POLICY "Users can delete own social media posts" ON public.social_media_posts
    FOR DELETE USING (auth.uid() = (SELECT user_id FROM public.social_media_profiles WHERE id = profile_id));

-- Social media style analysis - users can only access their own analysis
CREATE POLICY "Users can view own social media style analysis" ON public.social_media_style_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social media style analysis" ON public.social_media_style_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social media style analysis" ON public.social_media_style_analysis
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social media style analysis" ON public.social_media_style_analysis
    FOR DELETE USING (auth.uid() = user_id);

-- Privacy consents - users can only access their own consents
CREATE POLICY "Users can view own privacy consents" ON public.privacy_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy consents" ON public.privacy_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy consents" ON public.privacy_consents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own privacy consents" ON public.privacy_consents
    FOR DELETE USING (auth.uid() = user_id);

-- User onboarding - users can only access their own onboarding data
CREATE POLICY "Users can view own onboarding data" ON public.user_onboarding
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding data" ON public.user_onboarding
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding data" ON public.user_onboarding
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding data" ON public.user_onboarding
    FOR DELETE USING (auth.uid() = user_id);

-- Onboarding analytics - users can only access their own analytics
CREATE POLICY "Users can view own onboarding analytics" ON public.onboarding_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding analytics" ON public.onboarding_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding analytics" ON public.onboarding_analytics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding analytics" ON public.onboarding_analytics
    FOR DELETE USING (auth.uid() = user_id);

-- Workspaces - users can only access workspaces they belong to
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces
    FOR SELECT USING (auth.uid() = owner_id OR auth.uid() IN (
        SELECT user_id FROM public.team_members WHERE workspace_id = workspaces.id
    ));

CREATE POLICY "Users can insert workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update workspaces they own" ON public.workspaces
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete workspaces they own" ON public.workspaces
    FOR DELETE USING (auth.uid() = owner_id);

-- Team members - users can only access team members in their workspaces
CREATE POLICY "Users can view team members in their workspaces" ON public.team_members
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT owner_id FROM public.workspaces WHERE id = workspace_id
    ) OR auth.uid() IN (
        SELECT user_id FROM public.team_members tm2 WHERE tm2.workspace_id = team_members.workspace_id
    ));

CREATE POLICY "Workspace owners can manage team members" ON public.team_members
    FOR ALL USING (auth.uid() IN (
        SELECT owner_id FROM public.workspaces WHERE id = workspace_id
    ));

-- Episode collaborators - users can only access episodes they collaborate on
CREATE POLICY "Users can view episodes they collaborate on" ON public.episode_collaborators
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT user_id FROM public.episodes WHERE id = episode_id
    ));

CREATE POLICY "Episode owners can manage collaborators" ON public.episode_collaborators
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM public.episodes WHERE id = episode_id
    ));

-- Version history - users can only access versions of episodes they own or collaborate on
CREATE POLICY "Users can view versions of their episodes" ON public.version_history
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM public.episodes WHERE id = episode_id
    ) OR auth.uid() IN (
        SELECT user_id FROM public.episode_collaborators WHERE episode_id = version_history.episode_id
    ));

CREATE POLICY "Episode owners can manage versions" ON public.version_history
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM public.episodes WHERE id = episode_id
    ));

-- Episode comments - users can only access comments on episodes they own or collaborate on
CREATE POLICY "Users can view comments on their episodes" ON public.episode_comments
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT user_id FROM public.episodes WHERE id = episode_id
    ) OR auth.uid() IN (
        SELECT user_id FROM public.episode_collaborators WHERE episode_id = episode_comments.episode_id
    ));

CREATE POLICY "Users can manage their own comments" ON public.episode_comments
    FOR ALL USING (auth.uid() = user_id);

-- Episode reactions - users can only access reactions on episodes they own or collaborate on
CREATE POLICY "Users can view reactions on their episodes" ON public.episode_reactions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT user_id FROM public.episodes WHERE id = episode_id
    ) OR auth.uid() IN (
        SELECT user_id FROM public.episode_collaborators WHERE episode_id = episode_reactions.episode_id
    ));

CREATE POLICY "Users can manage their own reactions" ON public.episode_reactions
    FOR ALL USING (auth.uid() = user_id);

-- Workflow states - users can only access workflows for their episodes
CREATE POLICY "Users can view workflows for their episodes" ON public.workflow_states
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM public.episodes WHERE id = episode_id
    ) OR auth.uid() IN (
        SELECT user_id FROM public.episode_collaborators WHERE episode_id = workflow_states.episode_id
    ));

CREATE POLICY "Episode owners can manage workflows" ON public.workflow_states
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM public.episodes WHERE id = episode_id
    ));

-- Notifications - users can only access their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- User presence - users can only access their own presence data
CREATE POLICY "Users can view own presence data" ON public.user_presence
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presence data" ON public.user_presence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence data" ON public.user_presence
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presence data" ON public.user_presence
    FOR DELETE USING (auth.uid() = user_id);

-- Genre templates - these can be public (read-only for all users)
CREATE POLICY "Anyone can view genre templates" ON public.genre_templates
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert genre templates" ON public.genre_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update genre templates" ON public.genre_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete genre templates" ON public.genre_templates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Resource database - these can be public (read-only for all users)
CREATE POLICY "Anyone can view resource database" ON public.resource_database
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert resources" ON public.resource_database
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update resources" ON public.resource_database
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete resources" ON public.resource_database
    FOR DELETE USING (auth.role() = 'authenticated');
