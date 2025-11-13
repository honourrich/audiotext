import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Youtube, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Copy,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { useYouTubeContent } from '@/hooks/useYouTubeContent';
import { validateYouTubeUrlForCaptions, isValidYouTubeUrl } from '@/lib/youtubeHelpers';
import { Episode } from '@/types';

interface YouTubeUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

const YouTubeUploadModal: React.FC<YouTubeUploadModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  // State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [showDiarization, setShowDiarization] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  
  // Custom hook
  const {
    isValidating,
    isProcessing,
    processYouTubeContent,
    error,
    clearError,
    reset
  } = useYouTubeContent();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      reset();
      setYoutubeUrl('');
      setValidationResult(null);
      setProcessingSteps([]);
      setProgress(0);
      setShowTranscript(false);
      setShowTimestamps(false);
      setShowDiarization(false);
      setGeneratedContent(null);
    }
  }, [open, reset]);

  // Update processing step
  const updateProcessingStep = (
    step: string, 
    status: 'processing' | 'completed' | 'error', 
    message?: string
  ) => {
    setProcessingSteps(prev => {
      const existingIndex = prev.findIndex(s => s.step === step);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { step, status, message };
        return updated;
      } else {
        return [...prev, { step, status, message }];
      }
    });
  };

  // Remove timestamps from transcript
  const removeTimestamps = (transcript: string): string => {
    if (!transcript) return transcript;
    
    // Remove timestamps in format [00:00:00] or [HH:MM:SS]
    return transcript.replace(/\[(\d{2}):(\d{2}):(\d{2})\]\s*/g, '');
  };

  // Remove speaker labels (diarization) from transcript
  const removeSpeakerLabels = (transcript: string): string => {
    if (!transcript) return transcript;
    
    // Remove speaker labels like "Speaker 1:", "Speaker 2:", etc.
    return transcript.replace(/^(Speaker \d+|Host|Guest|Interviewer|Interviewee|Person \d+):\s*/gm, '');
  };

  // Process transcript for display
  const processTranscriptForDisplay = (transcript: string): string => {
    if (!transcript) return transcript;
    let processed = transcript;
    if (!showTimestamps) {
      processed = removeTimestamps(processed);
    }
    if (!showDiarization) {
      processed = removeSpeakerLabels(processed);
    }
    return processed;
  };

  // Validate YouTube URL
  const handleValidateUrl = async () => {
    if (!youtubeUrl.trim()) {
      return;
    }

    try {
      setProgress(10);
      updateProcessingStep('Validating URL', 'processing');
      
      const result = await validateYouTubeUrlForCaptions(youtubeUrl.trim());
      setValidationResult(result);
      
      if (result.valid && result.hasCaption) {
        updateProcessingStep('URL validated', 'completed');
        setProgress(25);
      } else {
        updateProcessingStep('Validation failed', 'error', result.error);
        setProgress(0);
      }
    } catch (error) {
      console.error('Validation error:', error);
      updateProcessingStep('Validation failed', 'error', 'Failed to validate URL');
      setProgress(0);
    }
  };

  // Process YouTube content
  const handleProcessContent = async () => {
    if (!validationResult?.valid || !validationResult?.hasCaption) {
      return;
    }

    try {
      setProgress(25);
      updateProcessingStep('Extracting captions', 'processing');
      setProgress(50);
      
      updateProcessingStep('Generating content', 'processing');
      setProgress(75);
      
      const result = await processYouTubeContent(youtubeUrl.trim());
      console.log('YouTube processing result:', result);
      console.log('Video duration from result:', result.videoDuration);
      console.log('Type of videoDuration:', typeof result.videoDuration);
      
      if (result.success) {
        updateProcessingStep('Content generated', 'completed');
        setProgress(100);
        setGeneratedContent(result.generatedContent);
        
        // Create episode object for localStorage (like audio uploads)
        const episode: Episode = {
          id: result.episodeId || `episode_${Date.now()}`,
          userId: userId || 'anonymous',
          title: result.videoTitle || 'YouTube Episode', // Use actual video title
          transcript: result.transcript || '',
          generatedContent: null, // No AI content generated yet
          sourceType: 'youtube',
          youtubeUrl: youtubeUrl.trim(),
          duration: result.videoDuration || 0, // Include video duration (fallback to 0)
          processingStatus: 'completed',
          processingProgress: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log('📹 CREATING EPISODE:');
        console.log('📹 Video duration from result:', result.videoDuration);
        console.log('📹 Episode duration value:', episode.duration);
        console.log('📹 Full result object:', result);
        console.log('📹 Full episode object:', episode);
        
        // Save to localStorage
        const existingEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
        existingEpisodes.unshift(episode);
        localStorage.setItem('episodes', JSON.stringify(existingEpisodes));
        if (userId) {
          localStorage.setItem('episodes_owner', userId);
        }
        
        // Dispatch event to update dashboard
        window.dispatchEvent(new CustomEvent('episodesUpdated'));
        
        // Navigate to episode page after delay
        setTimeout(() => {
          onOpenChange(false);
          navigate(`/episode/${episode.id}`);
        }, 2000);
        
      } else {
        updateProcessingStep('Processing failed', 'error', result.error);
        setProgress(0);
      }
    } catch (error) {
      console.error('Processing error:', error);
      updateProcessingStep('Processing failed', 'error', 'Failed to process YouTube content');
      setProgress(0);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Download as JSON
  const downloadAsJson = () => {
    if (!generatedContent) return;
    
    const dataStr = JSON.stringify(generatedContent, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `youtube-content-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const canValidate = youtubeUrl.trim().length > 0 && !isValidating;
  const canProcess = validationResult?.valid && validationResult?.hasCaption && !isProcessing;
  const isCompleted = generatedContent && progress === 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <span>Import from YouTube</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* URL Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="youtube-url">YouTube Video URL</Label>
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="mt-1"
                disabled={isValidating || isProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste any public YouTube video URL with captions
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleValidateUrl}
                disabled={!canValidate}
                variant="outline"
                className="flex-1"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Validate URL
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleProcessContent}
                disabled={!canProcess}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Youtube className="w-4 h-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <Alert className={validationResult.valid && validationResult.hasCaption ? 
              'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }>
              <AlertCircle className={`w-4 h-4 ${
                validationResult.valid && validationResult.hasCaption ? 
                'text-green-600' : 'text-red-600'
              }`} />
              <AlertDescription>
                {validationResult.valid && validationResult.hasCaption ? (
                  <div>
                    <p className="text-green-800 font-medium">✅ Video validated successfully!</p>
                    <p className="text-green-700 text-sm mt-1">
                      Title: {validationResult.videoTitle}
                    </p>
                    <p className="text-green-700 text-sm">
                      Captions available: Yes
                    </p>
                  </div>
                ) : (
                  <p className="text-red-800">{validationResult.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Processing Steps */}
          {processingSteps.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Processing Steps</h4>
              <div className="space-y-1">
                {processingSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    {step.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {step.status === 'processing' && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                    {step.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    {step.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={step.status === 'error' ? 'text-red-600' : ''}>
                      {step.step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Generated Content Preview */}
          {isCompleted && generatedContent && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generated Content</h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={downloadAsJson}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    JSON
                  </Button>
                </div>
              </div>

              {/* Content Sections */}
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Episode Title</Label>
                    <Button
                      onClick={() => copyToClipboard(generatedContent.title, 'title')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{generatedContent.title}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Summary</Label>
                    <Button
                      onClick={() => copyToClipboard(generatedContent.summary, 'summary')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{generatedContent.summary}</p>
                  </div>
                </div>

                {/* Takeaways */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Key Takeaways</Label>
                    <Button
                      onClick={() => copyToClipboard(generatedContent.takeaways.join('\n• '), 'takeaways')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <ul className="text-sm space-y-1">
                      {generatedContent.takeaways.map((takeaway: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Topics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Topics</Label>
                    <Button
                      onClick={() => copyToClipboard(generatedContent.topics.join(', '), 'topics')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.topics.map((topic: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Call to Action</Label>
                    <Button
                      onClick={() => copyToClipboard(generatedContent.cta, 'cta')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{generatedContent.cta}</p>
                  </div>
                </div>

                {/* Transcript Toggle */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowTranscript(!showTranscript)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {showTranscript ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Hide Transcript
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Show Transcript
                        </>
                      )}
                    </Button>
                    
                    {showTranscript && (
                      <>
                        <Button
                          onClick={() => setShowTimestamps(!showTimestamps)}
                          variant={showTimestamps ? "default" : "outline"}
                          size="sm"
                        >
                          {showTimestamps ? "Hide Timestamps" : "Show Timestamps"}
                        </Button>
                        <Button
                          onClick={() => setShowDiarization(!showDiarization)}
                          variant={showDiarization ? "default" : "outline"}
                          size="sm"
                        >
                          {showDiarization ? "Hide Speaker Labels" : "Show Speaker Labels"}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {showTranscript && (
                    <div className="p-3 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">
                        {processTranscriptForDisplay(generatedContent.transcript || 'Transcript will be displayed here...')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Success Message */}
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Content generated successfully! You'll be redirected to the episode page shortly.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default YouTubeUploadModal;
