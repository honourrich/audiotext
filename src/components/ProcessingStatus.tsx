import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Clock, AlertCircle } from 'lucide-react';

export interface ProcessingStage {
  id: string;
  name?: string;
  label?: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'active';
}

interface ProcessingStatusProps {
  overallProgress?: number;
  currentStage?: string;
  estimatedTimeRemaining?: string;
  onCancel?: () => void;
  error?: string;
  stages?: ProcessingStage[];
  canCancel?: boolean;
}

const defaultStages: ProcessingStage[] = [
  { id: 'upload', label: 'Uploading audio file...', progress: 20, status: 'pending' },
  { id: 'transcribe', label: 'Transcribing with AI...', progress: 60, status: 'pending' },
  { id: 'summary', label: 'Generating summary...', progress: 75, status: 'pending' },
  { id: 'chapters', label: 'Creating chapters...', progress: 85, status: 'pending' },
  { id: 'keywords', label: 'Extracting keywords...', progress: 95, status: 'pending' },
  { id: 'finalize', label: 'Finalizing content...', progress: 100, status: 'pending' },
];

export const createDefaultProcessingStages = (): ProcessingStage[] => [
  { id: 'upload', label: 'Uploading audio file...', progress: 0, status: 'pending' },
  { id: 'transcribe', label: 'Transcribing with AI...', progress: 0, status: 'pending' },
  { id: 'summary', label: 'Generating summary...', progress: 0, status: 'pending' },
  { id: 'chapters', label: 'Creating chapters...', progress: 0, status: 'pending' },
  { id: 'keywords', label: 'Extracting keywords...', progress: 0, status: 'pending' },
  { id: 'finalize', label: 'Finalizing content...', progress: 0, status: 'pending' },
];

export default function ProcessingStatus({
  overallProgress = 0,
  currentStage = 'upload',
  estimatedTimeRemaining,
  onCancel,
  error,
  stages = defaultStages,
  canCancel = !!onCancel,
}: ProcessingStatusProps) {
  const getStageStatus = (stage: ProcessingStage) => {
    if (stage.status) return stage.status;
    if (error && stage.id === currentStage) return 'error';
    if (stage.progress <= (overallProgress || 0)) return 'completed';
    if (stage.id === currentStage) return 'active';
    return 'pending';
  };

  const formatTime = (value?: string | number) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    const seconds = value as number;
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="bg-white min-h-screen p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Processing Audio Content</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={error ? 'destructive' : 'default'}>
                {error ? 'Error' : 'Processing'}
              </Badge>
              {estimatedTimeRemaining && !error && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatTime(estimatedTimeRemaining)} remaining
                </div>
              )}
            </div>
          </div>
          {(onCancel || canCancel) && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress || 0)}%</span>
            </div>
            <Progress value={overallProgress || 0} className="h-3" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Processing Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Stage List */}
          <div className="space-y-3">
            {stages.map((stage) => {
              const status = getStageStatus(stage);
              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    status === 'active'
                      ? 'bg-blue-50 border-blue-200'
                      : status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      status === 'active'
                        ? 'bg-blue-500 animate-pulse'
                        : status === 'completed'
                        ? 'bg-green-500'
                        : status === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-300'
                    }`}
                  />
                  <span
                    className={`flex-1 ${
                      status === 'active'
                        ? 'font-medium text-blue-900'
                        : status === 'completed'
                        ? 'text-green-800'
                        : status === 'error'
                        ? 'text-red-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {stage.label ?? stage.name ?? stage.id}
                  </span>
                  {status === 'completed' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓
                    </Badge>
                  )}
                  {status === 'error' && (
                    <Badge variant="destructive">
                      ✗
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Background Processing Note */}
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
            💡 You can continue using the app while processing happens in the background.
            We'll notify you when your content is ready!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}