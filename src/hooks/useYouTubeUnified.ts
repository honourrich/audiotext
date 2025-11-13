import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';

interface CaptionSegment {
  text: string;
  offset: number; // in milliseconds
  duration: number; // in seconds
}

interface YouTubeUnifiedMetadata {
  title: string;
  description: string;
  duration: number; // in seconds
  publishedAt?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
}

interface YouTubeUnifiedResponse {
  success: boolean;
  videoId?: string;
  metadata?: YouTubeUnifiedMetadata;
  captions?: CaptionSegment[];
  transcript?: string;
  error?: string;
  processingTime?: number; // in milliseconds
  warning?: string;
  hasEstimatedDuration?: boolean;
}

interface UseYouTubeUnifiedReturn {
  isLoading: boolean;
  error: string | null;
  result: YouTubeUnifiedResponse | null;
  processYouTubeVideo: (url: string, lang?: string) => Promise<YouTubeUnifiedResponse>;
  clearError: () => void;
  reset: () => void;
}

export function useYouTubeUnified(): UseYouTubeUnifiedReturn {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YouTubeUnifiedResponse | null>(null);

  // Process YouTube video using unified service
  const processYouTubeVideo = useCallback(async (
    url: string, 
    lang: string = 'en'
  ): Promise<YouTubeUnifiedResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[Frontend] Processing YouTube video:', url);
      console.log('[Frontend] Language:', lang);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing. Please check your environment variables.');
      }
      
      const functionName = 'youtube-unified';
      
      // Try Clerk JWT first, fall back to anon key if JWT validation fails
      let authToken = supabaseAnonKey;
      try {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          authToken = token;
          console.log('[Frontend] Using Clerk JWT token');
        } else {
          console.log('[Frontend] No Clerk JWT, using anon key');
        }
      } catch (tokenError) {
        console.log('[Frontend] Clerk JWT error, using anon key:', tokenError);
      }
      
      console.log('[Frontend] Calling Supabase function');
      
      // Use direct fetch with token (Clerk JWT or anon key)
      const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseAnonKey, // Also include apikey header
        },
        body: JSON.stringify({
          youtubeUrl: url, // Function expects 'youtubeUrl', not 'url'
          lang
        })
      });

      console.log('[Frontend] Response status:', response.status);
      console.log('[Frontend] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Frontend] Function error response:', errorText);
        
        // If auth fails, provide helpful message
        if (response.status === 401) {
          throw new Error(
            'Authentication failed. The function needs to be deployed with --no-verify-jwt flag using Supabase CLI. ' +
            'Run: supabase functions deploy youtube-unified --no-verify-jwt ' +
            '(Same configuration as process-youtube-captions which works). Error: ' + errorText
          );
        }
        
        throw new Error(`Function returned ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      console.log('[Frontend] Supabase response:', data);
      console.log('[Frontend] Response success:', data.success);
      console.log('[Frontend] Has metadata:', !!data.metadata);
      console.log('[Frontend] Duration:', data.metadata?.duration);
      console.log('[Frontend] Video ID:', data.videoId);
      
      if (!data) {
        throw new Error('No data returned from Supabase function');
      }
      
      setResult(data);
      return data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      console.error('[Frontend] Error processing YouTube video:', err);
      setError(errorMessage);
      const result: YouTubeUnifiedResponse = {
        success: false,
        error: errorMessage
      };
      setResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setIsLoading(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    result,
    processYouTubeVideo,
    clearError,
    reset
  };
}
