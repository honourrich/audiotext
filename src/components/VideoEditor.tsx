import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Subtitles, 
  Image, 
  Play, 
  Download,
  Settings,
  Eye,
  FileVideo
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import SubtitleEditor from './SubtitleEditor';
import BrandingOverlay from './BrandingOverlay';
import VideoPreviewWithOverlays from './VideoPreviewWithOverlays';
import VideoProcessor from './VideoProcessor';
import DimensionSelector from './DimensionSelector';
import AspectRatioPreview from './AspectRatioPreview';
import { VideoDimension } from '@/lib/videoDimensions';

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

interface VideoEditorProps {
  videoFile: File;
  transcript: string;
  onExport?: (videoBlob: Blob) => void;
  className?: string;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({
  videoFile,
  transcript,
  onExport,
  className = ''
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('preview');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [brandingElements, setBrandingElements] = useState<BrandingElement[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [selectedDimension, setSelectedDimension] = useState<VideoDimension | null>(null);

  const { toast } = useToast();

  // Initialize video duration
  useEffect(() => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
    };
  }, [videoFile]);

  const handleSubtitlesChange = (newSubtitles: Subtitle[]) => {
    setSubtitles(newSubtitles);
  };

  const handleBrandingChange = (newBranding: BrandingElement[]) => {
    setBrandingElements(newBranding);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };


  const downloadSubtitles = () => {
    const srtContent = subtitles.map((sub, index) => 
      `${index + 1}\n${formatTime(sub.startTime)} --> ${formatTime(sub.endTime)}\n${sub.text}\n`
    ).join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Subtitles exported",
      description: "SRT file downloaded",
    });
  };

  const downloadBranding = () => {
    const brandingData = {
      elements: brandingElements,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(brandingData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branding-overlay.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Branding exported",
      description: "Branding configuration downloaded",
    });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-6 h-6" />
                Video Editor
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Edit subtitles, add branding, and export your video
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadSubtitles}
                disabled={subtitles.length === 0}
              >
                <Subtitles className="w-4 h-4 mr-2" />
                Export SRT
              </Button>
              <Button
                variant="outline"
                onClick={downloadBranding}
                disabled={brandingElements.length === 0}
              >
                <Image className="w-4 h-4 mr-2" />
                Export Branding
              </Button>
              <Button
                onClick={() => setActiveTab('process')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Video className="w-4 h-4 mr-2" />
                Process Video
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Editor Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            {t('video.editor.tabs.preview')}
          </TabsTrigger>
          <TabsTrigger value="subtitles" className="flex items-center gap-2">
            <Subtitles className="w-4 h-4" />
            {t('video.editor.tabs.subtitles')}
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            {t('video.editor.tabs.branding')}
          </TabsTrigger>
          <TabsTrigger value="dimensions" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t('video.editor.tabs.format')}
          </TabsTrigger>
          <TabsTrigger value="process" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            {t('video.editor.tabs.process')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <VideoPreviewWithOverlays
            videoFile={videoFile}
            subtitles={subtitles}
            brandingElements={brandingElements}
            onTimeUpdate={handleTimeUpdate}
          />
        </TabsContent>

        {/* Subtitles Tab */}
        <TabsContent value="subtitles" className="space-y-4">
          <SubtitleEditor
            transcript={transcript}
            videoDuration={videoDuration}
            onSubtitlesChange={handleSubtitlesChange}
            onTimeUpdate={handleTimeUpdate}
            currentTime={currentTime}
          />
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <BrandingOverlay
            onBrandingChange={handleBrandingChange}
          />
        </TabsContent>

        {/* Dimensions Tab */}
        <TabsContent value="dimensions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DimensionSelector
              selectedDimension={selectedDimension}
              onDimensionSelect={setSelectedDimension}
            />
            <AspectRatioPreview
              videoFile={videoFile}
              targetDimension={selectedDimension}
            />
          </div>
        </TabsContent>

        {/* Process Tab */}
        <TabsContent value="process" className="space-y-4">
          <VideoProcessor
            videoFile={videoFile}
            subtitles={subtitles}
            brandingElements={brandingElements}
            targetDimension={selectedDimension}
            onExportComplete={(videoBlob) => {
              if (onExport) {
                onExport(videoBlob);
              }
            }}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Video Quality</label>
                  <select className="w-full p-2 border rounded-md mt-1">
                    <option value="high">High (1080p)</option>
                    <option value="medium">Medium (720p)</option>
                    <option value="low">Low (480p)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Export Format</label>
                  <select className="w-full p-2 border rounded-md mt-1">
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                    <option value="mov">MOV</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Include in Export</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Subtitles</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Branding Overlays</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Original Audio</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileVideo className="w-4 h-4" />
              <span className="font-medium">Video</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Duration: {formatTime(videoDuration)}
              </div>
              <div className="text-sm text-muted-foreground">
                Current: {formatTime(currentTime)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Subtitles className="w-4 h-4" />
              <span className="font-medium">Subtitles</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Segments: {subtitles.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Active: {subtitles.filter(s => s.isActive).length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Image className="w-4 h-4" />
              <span className="font-medium">Branding</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Elements: {brandingElements.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Visible: {brandingElements.filter(e => e.visible).length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoEditor;
