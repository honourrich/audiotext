import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2,
  FileVideo,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  onVideoRemove: () => void;
  selectedVideo?: File | null;
  className?: string;
}

interface ProcessedMedia {
  id: string;
  title: string;
  duration: string;
  size: string;
  thumbnail: string;
  createdAt: string;
  type: 'video' | 'audio';
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoSelect,
  onVideoRemove,
  selectedVideo,
  className = ''
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processedMedia, setProcessedMedia] = useState<ProcessedMedia[]>([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Load processed media from localStorage
  const loadProcessedMedia = useCallback(() => {
    try {
      const episodes = localStorage.getItem('episodes');
      if (episodes) {
        const parsedEpisodes = JSON.parse(episodes);
        const mediaItems: ProcessedMedia[] = parsedEpisodes
          .filter((episode: any) => episode.audioUrl || episode.youtubeUrl)
          .map((episode: any) => ({
            id: episode.id,
            title: episode.title,
            duration: episode.duration || 'Unknown',
            size: episode.fileSize ? `${Math.round(episode.fileSize / 1024 / 1024)}MB` : 'Unknown',
            thumbnail: episode.audioUrl ? '/video-placeholder.png' : '/youtube-placeholder.png',
            createdAt: new Date(episode.createdAt).toLocaleDateString(),
            type: episode.audioUrl ? 'audio' : 'video'
          }));
        setProcessedMedia(mediaItems);
      }
    } catch (error) {
      console.error('Failed to load processed media:', error);
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const videoFiles = acceptedFiles.filter(file => 
      file.type.startsWith('video/') ||
      file.name.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/)
    );
    
    if (videoFiles.length === 0) {
      setError('Please upload video files only (MP4, MOV, AVI, MKV, WEBM)');
      return;
    }

    if (videoFiles.some(file => file.size > 5 * 1024 * 1024 * 1024)) {
      setError('File size must be less than 5GB');
      return;
    }

    setError(null);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          onVideoSelect(videoFiles[0]);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  }, [onVideoSelect]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onDrop([file]);
    }
  };

  const handleRemoveVideo = () => {
    onVideoRemove();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = parseFloat(event.target.value);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const selectFromMediaLibrary = (media: ProcessedMedia) => {
    // For now, we'll create a mock file object
    // In a real implementation, you'd fetch the actual media file
    const mockFile = new File([''], media.title, { type: 'video/mp4' });
    onVideoSelect(mockFile);
    setShowMediaLibrary(false);
  };

  const openMediaLibrary = () => {
    loadProcessedMedia();
    setShowMediaLibrary(true);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="w-5 h-5" />
            Video Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedVideo ? (
            <div className="space-y-4">
              {/* Upload Dropzone */}
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  }
                `}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop your video here' : 'Upload a video file'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop or click to select (MP4, MOV, AVI, MKV, WEBM)
                </p>
                <Button variant="outline" size="sm">
                  Choose File
                </Button>
              </div>

              {/* Or select from existing media */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">or</p>
                <Button 
                  variant="outline" 
                  onClick={openMediaLibrary}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Select from Processed Media
                </Button>
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-muted-foreground text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            /* Video Preview */
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-96"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  <source src={URL.createObjectURL(selectedVideo)} type={selectedVideo.type} />
                  Your browser does not support the video tag.
                </video>
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center gap-2 mb-2">
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
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{selectedVideo.name}</span>
                  <Badge variant="secondary">
                    {Math.round(selectedVideo.size / 1024 / 1024)}MB
                  </Badge>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemoveVideo}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Select from Processed Media</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMediaLibrary(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {processedMedia.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processedMedia.map((media) => (
                  <Card 
                    key={media.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => selectFromMediaLibrary(media)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded mb-3 flex items-center justify-center">
                        <FileVideo className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-sm mb-1 truncate">{media.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{media.duration}</span>
                        <span>•</span>
                        <span>{media.size}</span>
                      </div>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {media.type}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">No processed media found</p>
                <p className="text-sm text-muted-foreground">
                  Upload and process some content first
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoUpload;
