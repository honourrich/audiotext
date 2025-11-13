import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Youtube, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  FileText,
  Download,
  Copy,
  ExternalLink,
  Clock
} from 'lucide-react';
import { useYouTubeImport } from '@/hooks/useYouTubeImport';
import { Episode, GeneratedContent } from '@/types';
import YouTubeValidation from './YouTubeValidation';
import { parseTimestampToSeconds, createYouTubeUrlWithTimestamp, extractVideoId } from '@/lib/youtubeHelpers';

interface YouTubeImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const YouTubeImportModal: React.FC<YouTubeImportModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  // State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [showDiarization, setShowDiarization] = useState(false);
  const [showGeneratedContent, setShowGeneratedContent] = useState(false);
  const lastValidatedUrl = useRef<string>('');
  
  // Custom hook
  const {
    isValidating,
    isProcessing,
    validationResult,
    processingResult,
    error,
    validateYouTubeUrl,
    processYouTubeCaptions,
    clearError,
    reset
  } = useYouTubeImport();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      reset();
      setYoutubeUrl('');
      setShowTranscript(false);
      setShowTimestamps(false);
      setShowDiarization(false);
      setShowGeneratedContent(false);
      lastValidatedUrl.current = '';
    }
  }, [open, reset]);

  // Auto-validate URL when it changes (with debounce)
  useEffect(() => {
    const trimmedUrl = youtubeUrl.trim();
    
    if (!trimmedUrl || !trimmedUrl.includes('youtube.com') || isValidating || isProcessing) {
      return;
    }

    // Don't validate if we already validated this exact URL
    if (lastValidatedUrl.current === trimmedUrl) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        lastValidatedUrl.current = trimmedUrl;
        await validateYouTubeUrl(trimmedUrl);
      } catch (error) {
        console.error('Auto-validation error:', error);
        lastValidatedUrl.current = ''; // Reset on error
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [youtubeUrl, validateYouTubeUrl, isValidating, isProcessing]);

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


  // Handle content processing
  const handleProcessContent = async () => {
    if (!validationResult?.valid || !validationResult?.hasCaption) {
      return;
    }

    try {
      const result = await processYouTubeCaptions(youtubeUrl.trim());
      
      if (result.success) {
        // Create episode object for localStorage (like audio uploads)
        const episode: Episode = {
          id: result.episodeId || `episode_${Date.now()}`,
          userId: userId || 'anonymous',
          title: result.videoTitle || 'YouTube Episode', // Use actual video title
          transcript: result.transcript || '',
          generatedContent: null, // No AI content generated yet
          sourceType: 'youtube',
          youtubeUrl: youtubeUrl.trim(),
          duration: result.videoDuration || 0, // Include video duration
          processingStatus: 'completed',
          processingProgress: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Save to localStorage
        const existingEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
        existingEpisodes.unshift(episode);
        localStorage.setItem('episodes', JSON.stringify(existingEpisodes));
        if (userId) {
          localStorage.setItem('episodes_owner', userId);
        }
        
        // Dispatch event to update dashboard
        window.dispatchEvent(new CustomEvent('episodesUpdated'));
        
        setShowTranscript(true);
        setShowGeneratedContent(true);
        
        // Navigate to episode page after delay
        setTimeout(() => {
          onOpenChange(false);
          navigate(`/episode/${episode.id}`);
        }, 3000);
      }
    } catch (error) {
      console.error('Processing error:', error);
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

  // Download transcript
  const downloadTranscript = () => {
    if (!processingResult?.transcript) return;
    
    const dataStr = `data:text/plain;charset=utf-8,${encodeURIComponent(processingResult.transcript)}`;
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `youtube-captions-${Date.now()}.txt`;
    link.click();
  };

  // Parse transcript segments for display
  const parseTranscriptSegments = (transcript: string) => {
    const lines = transcript.split('\n');
    const segments: Array<{timestamp: string, text: string, timestampSeconds: number}> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('[') && line.includes(']')) {
        const timestampMatch = line.match(/^\[([^\]]+)\]\s*(.*)$/);
        if (timestampMatch) {
          const timestamp = timestampMatch[1];
          const text = timestampMatch[2];
          const timestampSeconds = parseTimestampToSeconds(`[${timestamp}]`);
          segments.push({ timestamp, text, timestampSeconds });
        }
      }
    }
    
    return segments;
  };

  const canProcess = validationResult?.valid && validationResult?.hasCaption && !isProcessing;
  const isCompleted = processingResult?.success && processingResult?.transcript;

  const videoId = extractVideoId(youtubeUrl);
  const transcriptSegments = processingResult?.transcript ? parseTranscriptSegments(processingResult.transcript) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <span>Import from YouTube Captions</span>
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
                Paste any public YouTube video URL. We'll automatically check for captions and extract them.
              </p>
            </div>

            {/* Auto-validation status - only show if actively validating */}
            {isValidating && !validationResult && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Checking video for captions...</span>
              </div>
            )}
          </div>

          {/* Validation Component */}
          {youtubeUrl.trim() && (
            <YouTubeValidation
              validationResult={validationResult}
              isValidating={isValidating}
              onProcess={handleProcessContent}
              isProcessing={isProcessing}
              canProcess={canProcess}
              onRetry={() => {
                if (youtubeUrl.trim()) {
                  validateYouTubeUrl(youtubeUrl.trim());
                }
              }}
            />
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing YouTube captions...</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Extracting captions from YouTube</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Generating content with AI</span>
                </div>
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

          {/* Transcript Display */}
          {isCompleted && showTranscript && processingResult?.transcript && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Extracted Captions with Timestamps
                </h3>
                <div className="flex space-x-2">
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
                  <Button
                    onClick={downloadTranscript}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(processingResult.transcript!, 'transcript')}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                <div className="space-y-4">
                  {transcriptSegments.map((segment, index) => (
                    <div key={index} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 p-1 h-auto"
                          onClick={() => {
                            if (videoId) {
                              const url = createYouTubeUrlWithTimestamp(videoId, segment.timestampSeconds);
                              window.open(url, '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        {showTimestamps && (
                          <div className="text-sm font-mono text-gray-600 mb-1">
                            [{segment.timestamp}]
                          </div>
                        )}
                        <div className="text-gray-900">
                          {showDiarization ? segment.text : segment.text.replace(/^(Speaker \d+|Host|Guest|Interviewer|Interviewee|Person \d+):\s*/gm, '')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generated Content Display */}
          {isCompleted && showGeneratedContent && processingResult?.generatedContent && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generated Content</h3>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Episode Title</Label>
                    <Button
                      onClick={() => copyToClipboard(processingResult.generatedContent!.title, 'title')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{processingResult.generatedContent!.title}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Summary</Label>
                    <Button
                      onClick={() => copyToClipboard(processingResult.generatedContent!.summary, 'summary')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{processingResult.generatedContent!.summary}</p>
                  </div>
                </div>

                {/* Takeaways */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Key Takeaways</Label>
                    <Button
                      onClick={() => copyToClipboard(
                        processingResult.generatedContent!.takeaways.map(t => `• ${t}`).join('\n'),
                        'takeaways'
                      )}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <ul className="text-sm space-y-1">
                      {processingResult.generatedContent!.takeaways.map((takeaway, index) => (
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
                      onClick={() => copyToClipboard(
                        processingResult.generatedContent!.topics.join(', '),
                        'topics'
                      )}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {processingResult.generatedContent!.topics.map((topic, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Call to Action</Label>
                    <Button
                      onClick={() => copyToClipboard(processingResult.generatedContent!.cta, 'cta')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{processingResult.generatedContent!.cta}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isCompleted && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                YouTube captions extracted and content generated successfully! You'll be redirected to the episode page shortly.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default YouTubeImportModal;
