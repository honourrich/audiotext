import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Smartphone, 
  Square, 
  Tv,
  Info,
  AlertTriangle
} from 'lucide-react';
import { VideoDimension } from '@/lib/videoDimensions';
import { extractVideoMetadata, getAspectRatio, isVerticalVideo, isHorizontalVideo, isSquareVideo } from '@/lib/videoMetadata';

interface AspectRatioPreviewProps {
  videoFile: File;
  targetDimension: VideoDimension | null;
  className?: string;
}

export const AspectRatioPreview: React.FC<AspectRatioPreviewProps> = ({
  videoFile,
  targetDimension,
  className = ''
}) => {
  const [metadata, setMetadata] = useState<{
    width: number;
    height: number;
    aspectRatio: string;
    isVertical: boolean;
    isHorizontal: boolean;
    isSquare: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (videoFile) {
      setLoading(true);
      extractVideoMetadata(videoFile)
        .then(meta => {
          setMetadata({
            width: meta.width,
            height: meta.height,
            aspectRatio: getAspectRatio(meta.width, meta.height),
            isVertical: isVerticalVideo(meta.width, meta.height),
            isHorizontal: isHorizontalVideo(meta.width, meta.height),
            isSquare: isSquareVideo(meta.width, meta.height)
          });
        })
        .catch(error => {
          console.error('Failed to extract video metadata:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [videoFile]);

  const getConversionInfo = () => {
    if (!metadata || !targetDimension) return null;

    const inputAspectRatio = metadata.width / metadata.height;
    const targetAspectRatio = targetDimension.width / targetDimension.height;
    const aspectRatioDiff = Math.abs(inputAspectRatio - targetAspectRatio);

    let conversionType = '';
    let warning = '';
    let description = '';

    if (aspectRatioDiff < 0.01) {
      conversionType = 'Perfect Match';
      description = 'No conversion needed - aspect ratios match perfectly';
    } else if (inputAspectRatio > targetAspectRatio) {
      conversionType = 'Crop Horizontally';
      description = 'Video will be cropped on the sides to fit the target format';
      if (aspectRatioDiff > 0.5) {
        warning = 'Significant cropping required - consider using a different format';
      }
    } else {
      conversionType = 'Crop Vertically';
      description = 'Video will be cropped on the top/bottom to fit the target format';
      if (aspectRatioDiff > 0.5) {
        warning = 'Significant cropping required - consider using a different format';
      }
    }

    return {
      conversionType,
      warning,
      description,
      aspectRatioDiff
    };
  };

  const conversionInfo = getConversionInfo();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-muted-foreground">Analyzing video...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No video selected</p>
            <p className="text-sm">Select a video to see aspect ratio preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Original Video Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Original Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dimensions</span>
              <span className="text-sm text-muted-foreground">
                {metadata.width} × {metadata.height}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aspect Ratio</span>
              <Badge variant="outline">{metadata.aspectRatio}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Orientation</span>
              <div className="flex gap-2">
                {metadata.isVertical && <Badge variant="secondary">📱 Vertical</Badge>}
                {metadata.isHorizontal && <Badge variant="secondary">📺 Horizontal</Badge>}
                {metadata.isSquare && <Badge variant="secondary">⬜ Square</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Format Info */}
      {targetDimension && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="w-5 h-5" />
              Target Format: {targetDimension.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Target Dimensions</span>
                <span className="text-sm text-muted-foreground">
                  {targetDimension.width} × {targetDimension.height}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Target Aspect Ratio</span>
                <Badge variant="outline">{targetDimension.aspectRatio}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Platform</span>
                <Badge variant="secondary">{targetDimension.platform}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Preview */}
      {conversionInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Conversion Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conversion Type</span>
                <Badge variant={conversionInfo.aspectRatioDiff < 0.1 ? "default" : "destructive"}>
                  {conversionInfo.conversionType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {conversionInfo.description}
              </p>
              
              {conversionInfo.warning && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {conversionInfo.warning}
                  </p>
                </div>
              )}

              {/* Visual Preview */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Visual Preview</span>
                <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {/* Original */}
                  <div className="text-center">
                    <div 
                      className="bg-blue-200 dark:bg-blue-800 rounded border-2 border-blue-400 dark:border-blue-600 mx-auto"
                      style={{
                        width: Math.min(80, (metadata.width / metadata.height) * 60),
                        height: Math.min(60, (metadata.height / metadata.width) * 80)
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Original</p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="text-muted-foreground">→</div>
                  
                  {/* Target */}
                  <div className="text-center">
                    <div 
                      className="bg-green-200 dark:bg-green-800 rounded border-2 border-green-400 dark:border-green-600 mx-auto"
                      style={{
                        width: Math.min(80, (targetDimension.width / targetDimension.height) * 60),
                        height: Math.min(60, (targetDimension.height / targetDimension.width) * 80)
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Target</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {metadata && !targetDimension && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Format Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metadata.isVertical && (
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                  <p className="text-sm">
                    <strong>Vertical Video:</strong> Perfect for TikTok, Instagram Stories, and YouTube Shorts
                  </p>
                </div>
              )}
              {metadata.isHorizontal && (
                <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                  <p className="text-sm">
                    <strong>Horizontal Video:</strong> Great for YouTube, Facebook, and LinkedIn
                  </p>
                </div>
              )}
              {metadata.isSquare && (
                <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded">
                  <p className="text-sm">
                    <strong>Square Video:</strong> Ideal for Instagram posts and Facebook
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AspectRatioPreview;
