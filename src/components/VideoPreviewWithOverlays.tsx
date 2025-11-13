import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2,
  RotateCcw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
  isActive?: boolean;
}

interface BrandingElement {
  id: string;
  type: 'logo' | 'text' | 'watermark';
  content: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  opacity: number;
  rotation: number;
  visible: boolean;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

interface VideoPreviewWithOverlaysProps {
  videoFile: File;
  subtitles: Subtitle[];
  brandingElements: BrandingElement[];
  onTimeUpdate: (time: number) => void;
  className?: string;
}

export const VideoPreviewWithOverlays: React.FC<VideoPreviewWithOverlaysProps> = ({
  videoFile,
  subtitles,
  brandingElements,
  onTimeUpdate,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showBranding, setShowBranding] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current active subtitle
  const activeSubtitle = subtitles.find(sub => 
    currentTime >= sub.startTime && currentTime <= sub.endTime
  );

  // Get visible branding elements
  const visibleBrandingElements = brandingElements.filter(el => el.visible);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate(time);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const time = (clickX / width) * duration;
    
    seekToTime(time);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Video Preview with Overlays
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubtitles(!showSubtitles)}
              >
                {showSubtitles ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                Subtitles
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBranding(!showBranding)}
              >
                {showBranding ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                Branding
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={containerRef}
            className="relative bg-black rounded-lg overflow-hidden group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-auto max-h-96"
              src={URL.createObjectURL(videoFile)}
              muted={isMuted}
            />

            {/* Subtitles Overlay */}
            {showSubtitles && activeSubtitle && (
              <div className="absolute bottom-20 left-0 right-0 px-4">
                <div 
                  className="text-center text-white text-lg font-medium bg-black bg-opacity-75 rounded-lg p-4"
                  style={{
                    fontSize: '18px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    lineHeight: '1.4'
                  }}
                >
                  {activeSubtitle.text}
                  {activeSubtitle.speaker && (
                    <div className="text-sm text-gray-300 mt-1">
                      - {activeSubtitle.speaker}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Branding Elements Overlay */}
            {showBranding && visibleBrandingElements.map((element) => (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: `${element.position.x}%`,
                  top: `${element.position.y}%`,
                  width: `${element.size.width}px`,
                  height: `${element.size.height}px`,
                  opacity: element.opacity,
                  transform: `rotate(${element.rotation}deg)`,
                  pointerEvents: 'none'
                }}
              >
                {element.type === 'logo' ? (
                  <img
                    src={element.content}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-center"
                    style={{
                      fontSize: `${element.style?.fontSize || 16}px`,
                      fontFamily: element.style?.fontFamily || 'Arial',
                      color: element.style?.color || '#FFFFFF',
                      backgroundColor: element.style?.backgroundColor || 'transparent',
                      border: element.style?.borderWidth ? 
                        `${element.style.borderWidth}px solid ${element.style.borderColor}` : 
                        'none',
                      borderRadius: '4px',
                      padding: '8px'
                    }}
                  >
                    {element.content}
                  </div>
                )}
              </div>
            ))}

            {/* Video Controls Overlay */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                {/* Progress Bar */}
                <div 
                  className="w-full h-1 bg-white/30 rounded-full mb-2 cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-200"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  
                  <div className="flex-1 mx-2">
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4" />
              <span className="font-medium">Subtitles</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Total: {subtitles.length} segments
              </div>
              <div className="text-sm text-muted-foreground">
                Active: {activeSubtitle ? 'Yes' : 'No'}
              </div>
              {activeSubtitle && (
                <div className="text-sm text-muted-foreground">
                  Current: {activeSubtitle.speaker || 'Unknown'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Branding</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Elements: {brandingElements.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Visible: {visibleBrandingElements.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Logos: {brandingElements.filter(el => el.type === 'logo').length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-4 h-4" />
              <span className="font-medium">Video Info</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Duration: {formatTime(duration)}
              </div>
              <div className="text-sm text-muted-foreground">
                Current: {formatTime(currentTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                Progress: {Math.round((currentTime / duration) * 100)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Subtitle Display */}
      {activeSubtitle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Currently Playing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  {formatTime(activeSubtitle.startTime)} - {formatTime(activeSubtitle.endTime)}
                </Badge>
                {activeSubtitle.speaker && (
                  <Badge variant="secondary">
                    {activeSubtitle.speaker}
                  </Badge>
                )}
              </div>
              <p className="text-lg font-medium">{activeSubtitle.text}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoPreviewWithOverlays;
