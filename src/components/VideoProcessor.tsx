import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Download, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Video,
  Subtitles,
  Image,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ffmpegService, VideoProcessingOptions, SubtitleSegment, BrandingElement } from '@/lib/ffmpegService';
import { VideoDimension } from '@/lib/videoDimensions';

interface VideoProcessorProps {
  videoFile: File;
  subtitles: SubtitleSegment[];
  brandingElements: BrandingElement[];
  targetDimension?: VideoDimension | null;
  onExportComplete?: (videoBlob: Blob) => void;
  className?: string;
}

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({
  videoFile,
  subtitles,
  brandingElements,
  targetDimension,
  onExportComplete,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);

  const { toast } = useToast();

  // Initialize FFmpeg service
  useEffect(() => {
    const initializeFFmpeg = async () => {
      try {
        await ffmpegService.initialize();
        setIsInitialized(true);
        toast({
          title: "Video processor ready",
          description: "FFmpeg engine initialized successfully",
        });
      } catch (error) {
        console.error('Failed to initialize FFmpeg:', error);
        setError('Failed to initialize video processing engine');
        toast({
          title: "Initialization failed",
          description: "Could not initialize video processing engine",
          variant: "destructive"
        });
      }
    };

    initializeFFmpeg();
  }, [toast]);

  // Initialize processing steps
  useEffect(() => {
    const steps: ProcessingStep[] = [
      { id: 'init', name: 'Initialize FFmpeg', status: 'pending', progress: 0 },
      { id: 'prepare', name: 'Prepare video file', status: 'pending', progress: 0 },
      { id: 'subtitles', name: 'Process subtitles', status: 'pending', progress: 0 },
      { id: 'branding', name: 'Apply branding', status: 'pending', progress: 0 },
      { id: 'render', name: 'Render video', status: 'pending', progress: 0 },
      { id: 'finalize', name: 'Finalize output', status: 'pending', progress: 0 }
    ];
    setProcessingSteps(steps);
  }, []);

  const updateStep = (stepId: string, status: ProcessingStep['status'], progress: number, message?: string) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, message }
        : step
    ));
  };

  const processVideo = async () => {
    if (!isInitialized) {
      toast({
        title: "Not ready",
        description: "Video processor is still initializing",
        variant: "destructive"
      });
      return;
    }

    if (isProcessing) {
      toast({
        title: "Already processing",
        description: "Video processing is already in progress",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setOutputBlob(null);

    try {
      // Reset all steps
      setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'pending', progress: 0 })));

      // Update initialization step
      updateStep('init', 'completed', 100, 'FFmpeg initialized');

      const options: VideoProcessingOptions = {
        videoFile,
        subtitles,
        brandingElements,
        outputFormat: 'mp4',
        quality: 'medium',
        targetDimension: targetDimension || undefined,
        onProgress: (progressValue, message) => {
          setProgress(progressValue);
          setCurrentMessage(message);

          // Update steps based on progress
          if (progressValue >= 10 && progressValue < 20) {
            updateStep('prepare', 'processing', progressValue, message);
          } else if (progressValue >= 20 && progressValue < 30) {
            updateStep('prepare', 'completed', 100);
            updateStep('subtitles', 'processing', progressValue, message);
          } else if (progressValue >= 30 && progressValue < 40) {
            updateStep('subtitles', 'completed', 100);
            updateStep('branding', 'processing', progressValue, message);
          } else if (progressValue >= 40 && progressValue < 50) {
            updateStep('branding', 'completed', 100);
            updateStep('render', 'processing', progressValue, message);
          } else if (progressValue >= 50 && progressValue < 90) {
            updateStep('render', 'processing', progressValue, message);
          } else if (progressValue >= 90) {
            updateStep('render', 'completed', 100);
            updateStep('finalize', 'processing', progressValue, message);
          }
        }
      };

      const result = await ffmpegService.processVideo(options);

      // Complete final step
      updateStep('finalize', 'completed', 100, 'Video processing completed');

      setOutputBlob(result);
      setIsProcessing(false);

      toast({
        title: "Video processed successfully",
        description: "Your video is ready for download",
      });

      if (onExportComplete) {
        onExportComplete(result);
      }

    } catch (error) {
      console.error('Video processing failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsProcessing(false);

      // Mark current step as error
      const currentStep = processingSteps.find(step => step.status === 'processing');
      if (currentStep) {
        updateStep(currentStep.id, 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      }

      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    }
  };

  const downloadVideo = () => {
    if (!outputBlob) return;

    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed-video-${Date.now()}.mp4`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Video downloaded",
      description: "Your processed video has been downloaded",
    });
  };

  const resetProcessor = () => {
    setProgress(0);
    setCurrentMessage('');
    setError(null);
    setOutputBlob(null);
    setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'pending', progress: 0 })));
  };

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const canProcess = isInitialized && !isProcessing && videoFile && subtitles.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Video Processor
            {isInitialized && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Video className="w-4 h-4" />
              <div>
                <div className="text-sm font-medium">Video File</div>
                <div className="text-xs text-muted-foreground">
                  {videoFile ? `${videoFile.name} (${Math.round(videoFile.size / 1024 / 1024)}MB)` : 'No file selected'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Subtitles className="w-4 h-4" />
              <div>
                <div className="text-sm font-medium">Subtitles</div>
                <div className="text-xs text-muted-foreground">
                  {subtitles.length} segments
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Image className="w-4 h-4" />
              <div>
                <div className="text-sm font-medium">Branding</div>
                <div className="text-xs text-muted-foreground">
                  {brandingElements.filter(el => el.visible).length} elements
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Settings className="w-4 h-4" />
              <div>
                <div className="text-sm font-medium">Output Format</div>
                <div className="text-xs text-muted-foreground">
                  {targetDimension ? `${targetDimension.name} (${targetDimension.aspectRatio})` : 'Original dimensions'}
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Progress Display */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing...</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
              {currentMessage && (
                <p className="text-sm text-muted-foreground">{currentMessage}</p>
              )}
            </div>
          )}

          {/* Processing Steps */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Processing Steps</h4>
            <div className="space-y-1">
              {processingSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-2 text-sm">
                  {getStepIcon(step)}
                  <span className={step.status === 'error' ? 'text-red-600' : ''}>
                    {step.name}
                  </span>
                  {step.message && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {step.message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={processVideo}
              disabled={!canProcess}
              className="flex-1"
            >
              {isProcessing ? (
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

            {outputBlob && (
              <Button
                onClick={downloadVideo}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}

            <Button
              onClick={resetProcessor}
              variant="outline"
              disabled={isProcessing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Output Preview */}
      {outputBlob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Processing Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your video has been processed successfully and is ready for download.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Size: {Math.round(outputBlob.size / 1024 / 1024)}MB
                </Badge>
                <Badge variant="secondary">
                  Format: MP4
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoProcessor;
