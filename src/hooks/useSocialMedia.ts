import { useState, useEffect } from 'react';
import { SocialMediaAPI, SocialMediaProfile, SocialMediaStyleAnalysis, PrivacyConsent } from '@/lib/socialMedia';
import { useUser } from '@clerk/clerk-react';

export function useSocialMediaProfiles() {
  const { user } = useUser();
  const [profiles, setProfiles] = useState<SocialMediaProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProfiles();
    }
  }, [user?.id]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await SocialMediaAPI.getSocialMediaProfiles(user!.id);
      setProfiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const addProfile = async (profile: Omit<SocialMediaProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProfile = await SocialMediaAPI.addSocialMediaProfile({
        ...profile,
        user_id: user!.id
      });
      setProfiles(prev => [newProfile, ...prev]);
      return newProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add profile');
      throw err;
    }
  };

  const updateProfile = async (id: string, updates: Partial<SocialMediaProfile>) => {
    try {
      const updatedProfile = await SocialMediaAPI.updateSocialMediaProfile(id, updates);
      setProfiles(prev => prev.map(p => p.id === id ? updatedProfile : p));
      return updatedProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      await SocialMediaAPI.deleteSocialMediaProfile(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      throw err;
    }
  };

  return {
    profiles,
    loading,
    error,
    addProfile,
    updateProfile,
    deleteProfile,
    refetch: loadProfiles
  };
}

export function useSocialMediaAnalysis() {
  const { user } = useUser();
  const [analysis, setAnalysis] = useState<SocialMediaStyleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadAnalysis();
    }
  }, [user?.id]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await SocialMediaAPI.getStyleAnalysis(user!.id);
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      
      // Get user's posts
      const posts = await SocialMediaAPI.getUserPosts(user!.id);
      
      if (posts.length === 0) {
        throw new Error('No social media posts found for analysis');
      }

      // Run style analysis
      const analysisResult = await SocialMediaAPI.analyzeSocialMediaStyle(user!.id, posts);
      setAnalysis(analysisResult);
      
      return analysisResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteAnalysis = async () => {
    try {
      await SocialMediaAPI.deleteUserData(user!.id);
      setAnalysis(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete analysis');
      throw err;
    }
  };

  return {
    analysis,
    loading,
    analyzing,
    error,
    runAnalysis,
    deleteAnalysis,
    refetch: loadAnalysis
  };
}

export function usePrivacyConsents() {
  const { user } = useUser();
  const [consents, setConsents] = useState<PrivacyConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadConsents();
    }
  }, [user?.id]);

  const loadConsents = async () => {
    try {
      setLoading(true);
      const data = await SocialMediaAPI.getConsents(user!.id);
      setConsents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consents');
    } finally {
      setLoading(false);
    }
  };

  const recordConsent = async (consentType: string, consentGiven: boolean) => {
    try {
      const consent = await SocialMediaAPI.recordConsent({
        user_id: user!.id,
        consent_type: consentType,
        consent_given: consentGiven,
        ip_address: undefined, // Would be set server-side
        user_agent: navigator.userAgent
      });
      
      setConsents(prev => {
        const existing = prev.find(c => c.consent_type === consentType);
        if (existing) {
          return prev.map(c => c.consent_type === consentType ? consent : c);
        }
        return [...prev, consent];
      });
      
      return consent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record consent');
      throw err;
    }
  };

  const hasConsent = (consentType: string): boolean => {
    const consent = consents.find(c => c.consent_type === consentType);
    return consent?.consent_given || false;
  };

  return {
    consents,
    loading,
    error,
    recordConsent,
    hasConsent,
    refetch: loadConsents
  };
}