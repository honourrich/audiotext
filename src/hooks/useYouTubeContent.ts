import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { YouTubeValidationResult, YouTubeProcessResponse } from '@/types';

interface UseYouTubeContentReturn {
  // State
  isValidating: boolean;
  isProcessing: boolean;
  validationResult: YouTubeValidationResult | null;
  processingResult: YouTubeProcessResponse | null;
  error: string | null;
  
  // Actions
  validateYouTubeUrl: (url: string) => Promise<YouTubeValidationResult>;
  processYouTubeContent: (url: string) => Promise<YouTubeProcessResponse>;
  clearError: () => void;
  reset: () => void;
}

export function useYouTubeContent(): UseYouTubeContentReturn {
  const { getToken } = useAuth();
  
  // State
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<YouTubeValidationResult | null>(null);
  const [processingResult, setProcessingResult] = useState<YouTubeProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate YouTube URL
  const validateYouTubeUrl = useCallback(async (url: string): Promise<YouTubeValidationResult> => {
    setIsValidating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/youtube/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Validation failed');
      }
      
      const normalizedResult: YouTubeValidationResult = {
        valid: Boolean(data.valid ?? data.isValid ?? data.hasCaption),
        hasCaption: Boolean(data.hasCaption ?? data.hasCaptions ?? data.valid),
        videoTitle: data.videoTitle,
        wordCount: data.wordCount,
        message: data.message || (data.valid ? 'Captions available' : 'Validation succeeded'),
        error: data.error,
      };
      
      setValidationResult(normalizedResult);
      return normalizedResult;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMessage);
      const failureResult: YouTubeValidationResult = {
        valid: false,
        hasCaption: false,
        message: errorMessage,
        error: errorMessage,
      };
      setValidationResult(failureResult);
      return failureResult;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Process YouTube content
  const processYouTubeContent = useCallback(async (url: string): Promise<YouTubeProcessResponse> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Authentication required');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase configuration missing');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/process-youtube-captions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          youtubeUrl: url,
          userId: 'current-user' // Will be extracted from token on server
        }),
      });
      
      const result = await response.json();
      console.log('🔵 RECEIVED FROM SUPABASE FUNCTION:');
      console.log('🔵 Full result:', result);
      console.log('🔵 videoDuration:', result.videoDuration);
      console.log('🔵 videoDuration type:', typeof result.videoDuration);
      
      if (!response.ok) {
        throw new Error(result.error || 'Processing failed');
      }
      
      setProcessingResult(result);
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      const result: YouTubeProcessResponse = {
        success: false,
        error: errorMessage
      };
      setProcessingResult(result);
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [getToken]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setIsValidating(false);
    setIsProcessing(false);
    setValidationResult(null);
    setProcessingResult(null);
    setError(null);
  }, []);

  return {
    isValidating,
    isProcessing,
    validationResult,
    processingResult,
    error,
    validateYouTubeUrl,
    processYouTubeContent,
    clearError,
    reset,
  };
}
