import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Youtube, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  User,
  Loader2,
  ExternalLink,
  FileText
} from 'lucide-react';
import { YouTubeValidationResult } from '@/types';

interface YouTubeValidationProps {
  validationResult: YouTubeValidationResult | null;
  isValidating: boolean;
  onProcess: () => void;
  isProcessing: boolean;
  canProcess: boolean;
  onRetry?: () => void;
}

const YouTubeValidation: React.FC<YouTubeValidationProps> = ({
  validationResult,
  isValidating,
  onProcess,
  isProcessing,
  canProcess,
  onRetry
}) => {
  if (!validationResult && !isValidating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <span>Ready to Import</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Paste a YouTube video URL above and we'll automatically check for captions.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isValidating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Checking Video</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Validating YouTube URL and checking for captions...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!validationResult) {
    return null;
  }

  const isSuccess = validationResult.valid && validationResult.hasCaption;
  const hasError = !validationResult.valid || !validationResult.hasCaption;

  return (
    <Card className={isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isSuccess ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Captions Available</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>No Captions Found</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSuccess ? (
          <>
            {/* Success State */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Youtube className="w-5 h-5 text-red-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{validationResult.videoTitle}</h3>
                  {validationResult.wordCount && (
                    <p className="text-sm text-gray-600 mt-1">
                      Estimated {validationResult.wordCount} words in captions
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <FileText className="w-3 h-3 mr-1" />
                  Captions available
                </Badge>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ready to process
                </Badge>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  ✓ This video has captions and can be processed
                </p>
              </div>
            </div>

            {/* Process Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={onProcess}
                disabled={!canProcess || isProcessing}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Youtube className="w-4 h-4 mr-2" />
                    Extract Captions & Generate Content
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This will extract captions with timestamps and generate show notes
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Error State */}
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {validationResult.message}
              </AlertDescription>
            </Alert>

            <div className="flex space-x-2">
              <Button
                onClick={onRetry}
                variant="outline"
                className="flex-1"
                disabled={!onRetry}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>

            {/* Helpful Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Tips for successful processing:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Make sure the video is public and accessible</li>
                <li>• Try videos with auto-generated captions</li>
                <li>• Educational content and talks usually have captions</li>
                <li>• Check if the video has captions enabled on YouTube</li>
              </ul>
            </div>

            {/* Limitations Notice */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ Limitations:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Only works with videos that have captions</li>
                <li>• Auto-generated captions may have errors</li>
                <li>• Best for content-focused videos (talks, interviews)</li>
                <li>• May not capture visual-only elements</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default YouTubeValidation;
