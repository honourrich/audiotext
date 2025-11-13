import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Youtube, 
  Clock, 
  FileText, 
  Download, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Calendar,
  User,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { useYouTubeUnified } from '@/hooks/useYouTubeUnified';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { usageService } from '@/lib/usageService';

interface YouTubeUnifiedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const YouTubeUnifiedModal: React.FC<YouTubeUnifiedModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [usageCheck, setUsageCheck] = useState<{canProcess: boolean; reason?: string} | null>(null);
  const [showUsageWarning, setShowUsageWarning] = useState(false);
  
  const { user } = useUser();
  const navigate = useNavigate();
  const {
    isLoading,
    error,
    result,
    processYouTubeVideo,
    clearError,
    reset
  } = useYouTubeUnified();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setYoutubeUrl('');
      setSelectedLang('en');
      reset();
    }
  }, [open, reset]);

  // Handle URL validation
  const isValidUrl = youtubeUrl.trim().length > 0 && 
    (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be'));

  // Process YouTube video
  const handleProcessVideo = async () => {
    if (!isValidUrl || isLoading) return;
    
    clearError();
    setUsageCheck(null);
    
    try {
      // Process the video - the response will include duration and warning if API failed
      const response = await processYouTubeVideo(youtubeUrl.trim(), selectedLang);
      
      // If processing succeeded, create episode and navigate
      if (response.success && response.transcript && response.metadata) {
        const duration = response.metadata.duration || 0;
        
        // Check usage limits before processing
        if (user?.id && duration > 0) {
          console.log('🔍 Duration:', duration, 'seconds');
          const canProcess = await usageService.canProcessYouTubeVideo(user.id, duration);
          setUsageCheck(canProcess);
          
          if (!canProcess.canProcess) {
            // Show error message - the hook's error state will handle display
            setShowUsageWarning(true);
            return;
          }
        }
        
        // Create episode data with YouTube source
        const episodeData = {
          id: `youtube-${response.videoId}-${Date.now()}`,
          userId: user?.id || 'anonymous',
          title: response.metadata.title || 'YouTube Video',
          transcript: response.transcript,
          duration: duration,
          source: 'youtube',
          sourceUrl: youtubeUrl.trim(),
          sourceType: 'youtube',
          videoId: response.videoId,
          summary: '',
          chapters: [],
          keywords: [],
          hasAIContent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Store in episodes array
        const storedEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
        storedEpisodes.unshift(episodeData);
        localStorage.setItem('episodes', JSON.stringify(storedEpisodes));
        if (user?.id) {
          localStorage.setItem('episodes_owner', user.id);
        }
        
        console.log('🎬 Created YouTube episode:', episodeData);
        console.log('🎬 Episode duration:', episodeData.duration);
        
        // Update usage tracking
        if (user?.id && duration > 0) {
          try {
            await usageService.updateUsageAfterYouTubeVideo(user.id, duration);
            window.dispatchEvent(new CustomEvent('usageUpdated'));
            console.log(`✅ Usage updated: ${Math.ceil(duration / 60)} minutes for YouTube video`);
          } catch (usageError) {
            console.error('Failed to update usage:', usageError);
            // Don't fail the upload if usage tracking fails
          }
        }
        
        // Dispatch event to update dashboard
        window.dispatchEvent(new CustomEvent('episodesUpdated'));
        
        // Navigate to episode page immediately (like file uploads)
        navigate(`/episode/${episodeData.id}`);
        
        // Close modal
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error processing video:', error);
      // Error is handled by the hook's error state
    }
  };


  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <CardTitle>YouTube Unified Processing</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            ×
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="youtube-url">YouTube Video URL</Label>
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="language">Caption Language</Label>
              <select
                id="language"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                disabled={isLoading}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="auto">Auto-detect</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </select>
            </div>

            <Button 
              onClick={handleProcessVideo}
              disabled={!isValidUrl || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Process Video
                </>
              )}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Processing YouTube video...</p>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Processing Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Usage Warning State */}
          {showUsageWarning && result?.success && (
            <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Usage Warning</AlertTitle>
              <AlertDescription>
                {result.warning || (
                  usageCheck?.reason || 
                  'Video duration was estimated from captions. Upgrade to Pro for accurate duration tracking.'
                )}
                {result.hasEstimatedDuration && (
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={() => window.open('/billing', '_blank')}>
                      <Lock className="w-3 h-3 mr-1" />
                      Upgrade to Pro
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default YouTubeUnifiedModal;
