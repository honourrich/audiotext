import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  YouTubeValidationResult, 
  YouTubeCaptionResponse 
} from '@/types';

interface UseYouTubeImportReturn {
  // State
  isValidating: boolean;
  isProcessing: boolean;
  validationResult: YouTubeValidationResult | null;
  processingResult: YouTubeCaptionResponse | null;
  error: string | null;
  
  // Actions
  validateYouTubeUrl: (url: string) => Promise<YouTubeValidationResult>;
  processYouTubeCaptions: (url: string) => Promise<YouTubeCaptionResponse>;
  clearError: () => void;
  reset: () => void;
}

export function useYouTubeImport(): UseYouTubeImportReturn {
  const { getToken } = useAuth();
  
  // State
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<YouTubeValidationResult | null>(null);
  const [processingResult, setProcessingResult] = useState<YouTubeCaptionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate YouTube URL for captions
  const validateYouTubeUrl = useCallback(async (url: string): Promise<YouTubeValidationResult> => {
    setIsValidating(true);
    setError(null);
    
    try {
      const { validateYouTubeUrlForCaptions } = await import('@/lib/youtubeHelpers');
      const result = await validateYouTubeUrlForCaptions(url);
      setValidationResult(result);
      return result;
      
    } catch (err) {
      const errorMessage = 'Failed to validate YouTube URL';
      setError(errorMessage);
      const result: YouTubeValidationResult = {
        valid: false,
        hasCaption: false,
        message: errorMessage
      };
      setValidationResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Process YouTube captions
  const processYouTubeCaptions = useCallback(async (url: string): Promise<YouTubeCaptionResponse> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase configuration missing');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/process-youtube-captions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No authorization header needed - function deployed with --no-verify-jwt
        },
        body: JSON.stringify({ 
          youtubeUrl: url,
          userId: 'current-user' // Will be extracted from token on server
        }),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('YouTube caption processing function is not deployed. Please contact support to deploy the required Edge Function.');
        }
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      setProcessingResult(result);
      return result;
      
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Processing failed';
      
      // Handle specific error types
      if (errorMessage.includes('CORS') || errorMessage.includes('blocked')) {
        errorMessage = 'YouTube caption processing function is not deployed. Please deploy the Edge Function to enable this feature.';
      } else if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      const result: YouTubeCaptionResponse = {
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
    processYouTubeCaptions,
    clearError,
    reset,
  };
}
