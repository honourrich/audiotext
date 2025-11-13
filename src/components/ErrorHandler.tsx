import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  RefreshCw, 
  FileX, 
  Wifi, 
  Clock, 
  MessageCircle,
  ChevronRight 
} from 'lucide-react';

export type ErrorType = 
  | 'file_too_large'
  | 'invalid_format'
  | 'network_error'
  | 'network'
  | 'rate_limit'
  | 'api_error'
  | 'whisper_failure'
  | 'gpt4_error'
  | 'unknown';

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: string;
  canRetry?: boolean;
  canResume?: boolean;
  partialResults?: boolean;
}

interface ErrorHandlerProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onResume?: () => void;
  onContactSupport?: () => void;
  onDismiss?: () => void;
}

const errorConfig: Record<ErrorType, {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  color: string;
}> = {
  file_too_large: {
    icon: FileX,
    title: 'File Size Error',
    color: 'text-orange-600'
  },
  invalid_format: {
    icon: FileX,
    title: 'Invalid File Format',
    color: 'text-orange-600'
  },
  network_error: {
    icon: Wifi,
    title: 'Network Error',
    color: 'text-red-600'
  },
  rate_limit: {
    icon: Clock,
    title: 'High Demand',
    color: 'text-yellow-600'
  },
  whisper_failure: {
    icon: MessageCircle,
    title: 'Transcription Failed',
    color: 'text-red-600'
  },
  gpt4_error: {
    icon: AlertTriangle,
    title: 'Content Generation Error',
    color: 'text-red-600'
  },
  network: {
    icon: Wifi,
    title: 'Network Error',
    color: 'text-red-600'
  },
  api_error: {
    icon: AlertTriangle,
    title: 'API Error',
    color: 'text-red-600'
  },
  unknown: {
    icon: AlertTriangle,
    title: 'Unexpected Error',
    color: 'text-red-600'
  }
};

export default function ErrorHandler({
  error,
  onRetry,
  onResume,
  onContactSupport,
  onDismiss
}: ErrorHandlerProps) {
  const config = errorConfig[error.type] ?? errorConfig.unknown;
  const IconComponent = config.icon;

  return (
    <div className="bg-background min-h-screen p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-red-50 ${config.color}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{config.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="font-medium">{error.message}</p>
              {error.details && (
                <p className="text-sm text-muted-foreground mt-1">{error.details}</p>
              )}
            </AlertDescription>
          </Alert>

          {/* Partial Results Notice */}
          {error.partialResults && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">Partial Results Saved</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Some of your content was processed successfully and has been saved. 
                You can continue from where the process stopped.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {error.canRetry && onRetry && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
            
            {error.canResume && onResume && (
              <Button variant="outline" onClick={onResume} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Resume Processing
              </Button>
            )}
            
            {onContactSupport && (
              <Button variant="outline" onClick={onContactSupport} className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </Button>
            )}
          </div>

          {/* Troubleshooting Tips */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Troubleshooting Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {error.type === 'file_too_large' && (
                <>
                  <li>• Try compressing your audio file using tools like Audacity</li>
                  <li>• Consider splitting longer recordings into smaller segments</li>
                  <li>• Reduce audio quality if the content allows it</li>
                </>
              )}
              {error.type === 'invalid_format' && (
                <>
                  <li>• Supported formats: MP3, WAV, M4A</li>
                  <li>• Convert your file using online converters or audio software</li>
                  <li>• Ensure the file isn't corrupted</li>
                </>
              )}
              {error.type === 'network_error' && (
                <>
                  <li>• Check your internet connection</li>
                  <li>• Try refreshing the page</li>
                  <li>• Disable VPN if you're using one</li>
                </>
              )}
              {error.type === 'whisper_failure' && (
                <>
                  <li>• Ensure audio quality is clear with minimal background noise</li>
                  <li>• Try a shorter audio segment first</li>
                  <li>• Check that the audio contains speech content</li>
                </>
              )}
              {error.type === 'rate_limit' && (
                <>
                  <li>• Your request has been queued and will process shortly</li>
                  <li>• Consider upgrading your plan for priority processing</li>
                  <li>• Try again in a few minutes</li>
                </>
              )}
            </ul>
          </div>

          {onDismiss && (
            <div className="flex justify-end">
              <Button variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to create error objects
export const createError = (
  type: ErrorType,
  message: string,
  options?: {
    details?: string;
    canRetry?: boolean;
    canResume?: boolean;
    partialResults?: boolean;
  }
): ErrorInfo => ({
  type,
  message,
  details: options?.details,
  canRetry: options?.canRetry ?? true,
  canResume: options?.canResume ?? false,
  partialResults: options?.partialResults ?? false,
});

// Predefined error messages
export const errorMessages = {
  fileTooLarge: () => createError(
    'file_too_large',
    'File size exceeds 100MB limit. Please compress your audio file.',
    { canRetry: false }
  ),
  invalidFormat: () => createError(
    'invalid_format',
    'Please upload MP3, WAV, or M4A files only.',
    { canRetry: false }
  ),
  networkError: () => createError(
    'network_error',
    'Upload failed. Check your connection and try again.',
    { canRetry: true }
  ),
  rateLimitError: () => createError(
    'rate_limit',
    'High demand detected. Your request is queued and will complete shortly.',
    { canRetry: true, canResume: true }
  ),
  whisperFailure: () => createError(
    'whisper_failure',
    'Transcription failed. This may be due to poor audio quality. Please try a cleaner audio file.',
    { canRetry: true }
  ),
  gpt4Error: () => createError(
    'gpt4_error',
    'Content generation temporarily unavailable. Transcript saved successfully.',
    { canRetry: true, canResume: true, partialResults: true }
  ),
  network: () => createError(
    'network',
    'Network connection failed. Please check your internet connection and try again.',
    { canRetry: true }
  ),
  apiError: () => createError(
    'api_error',
    'API error occurred. Please try again.',
    { canRetry: true }
  ),
};

// Named factory functions expected by storyboards
export const createUploadError = (sizeBytes: number, limitMB: number): ErrorInfo => {
  const limitBytes = limitMB * 1024 * 1024;
  if (sizeBytes > limitBytes) {
    return createError(
      'file_too_large',
      `File size exceeds ${limitMB}MB limit. Please compress your audio file.`,
      { canRetry: false }
    );
  }
  return errorMessages.invalidFormat();
};

export const createNetworkError = (): ErrorInfo => 
  createError('network', 'Network connection failed. Please check your internet connection and try again.', { canRetry: true });

export const createAPIError = (service: 'openai' | 'whisper', isRateLimit: boolean = false): ErrorInfo => {
  if (isRateLimit) {
    return createError('rate_limit', `${service === 'openai' ? 'OpenAI' : 'Whisper'} API rate limit exceeded. Please try again in a few minutes.`, { canRetry: true });
  }
  return createError('api_error', `${service === 'openai' ? 'OpenAI' : 'Whisper'} API error occurred. Please try again.`, { canRetry: true });
};

export const createQuotaError = (used: number, limit: number, resetDate: Date): ErrorInfo =>
  createError('rate_limit', `Quota exceeded: ${used}/${limit} used. Resets on ${resetDate.toLocaleDateString()}.`, { canRetry: true, canResume: true });

export const createValidationError = (field: string, message: string): ErrorInfo =>
  createError('invalid_format', `${field}: ${message}`, { canRetry: false });