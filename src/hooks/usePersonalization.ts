import { useState, useEffect, useCallback } from 'react';
import { 
  PersonalizationAPI, 
  PersonalityProfile, 
  BrandVoiceProfile, 
  GenreTemplate, 
  PersonalizationSettings,
  EpisodePersonalizationData 
} from '../lib/personalization';
import { supabase } from '../lib/supabase';

export function usePersonalization(userId?: string) {
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  const [brandVoiceProfile, setBrandVoiceProfile] = useState<BrandVoiceProfile | null>(null);
  const [settings, setSettings] = useState<PersonalizationSettings | null>(null);
  const [genreTemplates, setGenreTemplates] = useState<GenreTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPersonalizationData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Load all personalization data in parallel
      const [
        personalityData,
        brandVoiceData,
        settingsData,
        templatesData
      ] = await Promise.allSettled([
        supabase.from('user_personality_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('brand_voice_profiles').select('*').eq('user_id', userId).single(),
        PersonalizationAPI.getPersonalizationSettings(userId),
        PersonalizationAPI.getGenreTemplates()
      ]);

      // Handle personality profile
      if (personalityData.status === 'fulfilled' && personalityData.value.data) {
        setPersonalityProfile(personalityData.value.data);
      }

      // Handle brand voice profile
      if (brandVoiceData.status === 'fulfilled' && brandVoiceData.value.data) {
        setBrandVoiceProfile(brandVoiceData.value.data);
      }

      // Handle settings
      if (settingsData.status === 'fulfilled' && settingsData.value) {
        setSettings(settingsData.value);
      } else {
        // Create default settings if none exist
        const defaultSettings = await PersonalizationAPI.updatePersonalizationSettings(userId, {
          enable_style_cloning: true,
          enable_brand_voice: true,
          enable_genre_detection: true,
          enable_personality_scoring: true,
          enable_resource_linking: true
        });
        setSettings(defaultSettings);
      }

      // Handle genre templates
      if (templatesData.status === 'fulfilled') {
        setGenreTemplates(templatesData.value);
      }

    } catch (err) {
      console.error('Failed to load personalization data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load personalization data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPersonalizationData();
  }, [loadPersonalizationData]);

  const analyzeWritingStyle = useCallback(async (episodeTexts: string[]) => {
    if (!userId) throw new Error('User ID required');
    
    try {
      const profile = await PersonalizationAPI.analyzeWritingStyle(userId, episodeTexts);
      setPersonalityProfile(profile);
      return profile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze writing style');
      throw err;
    }
  }, [userId]);

  const analyzeBrandVoice = useCallback(async (brandContent: string[], brandName?: string) => {
    if (!userId) throw new Error('User ID required');
    
    try {
      const profile = await PersonalizationAPI.analyzeBrandVoice(userId, brandContent, brandName);
      setBrandVoiceProfile(profile);
      return profile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze brand voice');
      throw err;
    }
  }, [userId]);

  const updateSettings = useCallback(async (newSettings: Partial<PersonalizationSettings>) => {
    if (!userId) throw new Error('User ID required');
    
    try {
      const updatedSettings = await PersonalizationAPI.updatePersonalizationSettings(userId, newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  }, [userId]);

  const detectGenre = useCallback(async (transcript: string, title: string) => {
    try {
      return await PersonalizationAPI.detectGenre(transcript, title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect genre');
      throw err;
    }
  }, []);

  const extractResources = useCallback(async (text: string) => {
    try {
      return await PersonalizationAPI.extractResources(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract resources');
      throw err;
    }
  }, []);

  const calculatePersonalityFit = useCallback((content: string) => {
    if (!personalityProfile) return 0;
    return PersonalizationAPI.calculatePersonalityFitScore(content, personalityProfile);
  }, [personalityProfile]);

  return {
    personalityProfile,
    brandVoiceProfile,
    settings,
    genreTemplates,
    loading,
    error,
    analyzeWritingStyle,
    analyzeBrandVoice,
    updateSettings,
    detectGenre,
    extractResources,
    calculatePersonalityFit,
    refresh: loadPersonalizationData
  };
}

export function useGenreDetection() {
  const [detectedGenre, setDetectedGenre] = useState<string | null>(null);
  const [genreScores, setGenreScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const detectGenre = useCallback(async (transcript: string, title: string) => {
    setLoading(true);
    try {
      const genre = await PersonalizationAPI.detectGenre(transcript, title);
      setDetectedGenre(genre);
      return genre;
    } catch (error) {
      console.error('Genre detection failed:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    detectedGenre,
    genreScores,
    loading,
    detectGenre
  };
}

export function useBrandVoice(userId?: string) {
  const [brandProfile, setBrandProfile] = useState<BrandVoiceProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeBrandVoice = useCallback(async (
    brandContent: string[], 
    brandName?: string,
    sourceUrls?: string[]
  ) => {
    if (!userId) throw new Error('User ID required');
    
    setLoading(true);
    setError(null);
    
    try {
      const profile = await PersonalizationAPI.analyzeBrandVoice(userId, brandContent, brandName);
      
      // Update with source URLs if provided
      if (sourceUrls && sourceUrls.length > 0) {
        const { data, error } = await supabase
          .from('brand_voice_profiles')
          .update({ source_content_urls: sourceUrls })
          .eq('id', profile.id)
          .select()
          .single();
        
        if (!error && data) {
          setBrandProfile(data);
          return data;
        }
      }
      
      setBrandProfile(profile);
      return profile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze brand voice';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadBrandProfile = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brand_voice_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setBrandProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brand profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBrandProfile();
  }, [loadBrandProfile]);

  return {
    brandProfile,
    loading,
    error,
    analyzeBrandVoice,
    refresh: loadBrandProfile
  };
}

export function useEpisodePersonalization(episodeId: string, userId?: string) {
  const [personalizationData, setPersonalizationData] = useState<EpisodePersonalizationData | null>(null);
  const [loading, setLoading] = useState(false);

  const savePersonalizationData = useCallback(async (data: Partial<EpisodePersonalizationData>) => {
    if (!userId) throw new Error('User ID required');
    
    setLoading(true);
    try {
      const result = await PersonalizationAPI.saveEpisodePersonalizationData(episodeId, userId, data);
      setPersonalizationData(result);
      return result;
    } catch (error) {
      console.error('Failed to save personalization data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [episodeId, userId]);

  const loadPersonalizationData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('episode_personalization_data')
        .select('*')
        .eq('episode_id', episodeId)
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setPersonalizationData(data);
    } catch (error) {
      console.error('Failed to load personalization data:', error);
    } finally {
      setLoading(false);
    }
  }, [episodeId, userId]);

  useEffect(() => {
    loadPersonalizationData();
  }, [loadPersonalizationData]);

  return {
    personalizationData,
    loading,
    savePersonalizationData,
    refresh: loadPersonalizationData
  };
}