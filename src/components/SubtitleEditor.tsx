import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Clock, 
  Edit3, 
  Trash2, 
  Plus,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
  isActive?: boolean;
}

interface SubtitleEditorProps {
  transcript: string;
  videoDuration: number;
  onSubtitlesChange: (subtitles: Subtitle[]) => void;
  onTimeUpdate: (time: number) => void;
  currentTime: number;
  className?: string;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  transcript,
  videoDuration,
  onSubtitlesChange,
  onTimeUpdate,
  currentTime,
  className = ''
}) => {
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [editingSubtitle, setEditingSubtitle] = useState<string | null>(null);
  const [newSubtitle, setNewSubtitle] = useState<Partial<Subtitle>>({
    startTime: 0,
    endTime: 5,
    text: '',
    speaker: 'Speaker 1'
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.8);
  
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-generate subtitles from transcript
  useEffect(() => {
    if (autoGenerate && transcript && videoDuration > 0) {
      generateSubtitlesFromTranscript();
    }
  }, [transcript, videoDuration, autoGenerate]);

  // Update active subtitle based on current time
  useEffect(() => {
    const activeSubtitle = subtitles.find(sub => 
      currentTime >= sub.startTime && currentTime <= sub.endTime
    );
    
    setSubtitles(prev => prev.map(sub => ({
      ...sub,
      isActive: sub.id === activeSubtitle?.id
    })));
  }, [currentTime, subtitles]);

  const generateSubtitlesFromTranscript = () => {
    if (!transcript || !videoDuration) return;

    const sentences = transcript
      .split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 10)
      .map(sentence => sentence.trim());

    const subtitleDuration = videoDuration / sentences.length;
    const generatedSubtitles: Subtitle[] = sentences.map((sentence, index) => ({
      id: `sub-${Date.now()}-${index}`,
      startTime: index * subtitleDuration,
      endTime: (index + 1) * subtitleDuration,
      text: sentence,
      speaker: index % 2 === 0 ? 'Speaker 1' : 'Speaker 2'
    }));

    setSubtitles(generatedSubtitles);
    onSubtitlesChange(generatedSubtitles);
    
    toast({
      title: "Subtitles generated",
      description: `Created ${generatedSubtitles.length} subtitle segments`,
    });
  };

  const addSubtitle = () => {
    if (!newSubtitle.text?.trim()) {
      toast({
        title: "Error",
        description: "Please enter subtitle text",
        variant: "destructive"
      });
      return;
    }

    const subtitle: Subtitle = {
      id: `sub-${Date.now()}`,
      startTime: newSubtitle.startTime || 0,
      endTime: newSubtitle.endTime || 5,
      text: newSubtitle.text,
      speaker: newSubtitle.speaker || 'Speaker 1'
    };

    const updatedSubtitles = [...subtitles, subtitle].sort((a, b) => a.startTime - b.startTime);
    setSubtitles(updatedSubtitles);
    onSubtitlesChange(updatedSubtitles);
    
    setNewSubtitle({
      startTime: subtitle.endTime,
      endTime: subtitle.endTime + 5,
      text: '',
      speaker: subtitle.speaker
    });

    toast({
      title: "Subtitle added",
      description: "New subtitle segment created",
    });
  };

  const updateSubtitle = (id: string, updates: Partial<Subtitle>) => {
    const updatedSubtitles = subtitles.map(sub => 
      sub.id === id ? { ...sub, ...updates } : sub
    ).sort((a, b) => a.startTime - b.startTime);
    
    setSubtitles(updatedSubtitles);
    onSubtitlesChange(updatedSubtitles);
  };

  const deleteSubtitle = (id: string) => {
    const updatedSubtitles = subtitles.filter(sub => sub.id !== id);
    setSubtitles(updatedSubtitles);
    onSubtitlesChange(updatedSubtitles);
    
    toast({
      title: "Subtitle deleted",
      description: "Subtitle segment removed",
    });
  };

  const seekToTime = (time: number) => {
    onTimeUpdate(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const exportSubtitles = () => {
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Subtitle Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-generate toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={autoGenerate ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoGenerate(!autoGenerate)}
            >
              {autoGenerate ? <CheckCircle className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Auto-generate from transcript
            </Button>
            {autoGenerate && (
              <Badge variant="secondary">
                {subtitles.length} segments
              </Badge>
            )}
          </div>

          {/* Manual subtitle addition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time (seconds)</Label>
              <Input
                id="startTime"
                type="number"
                value={newSubtitle.startTime || 0}
                onChange={(e) => setNewSubtitle(prev => ({ 
                  ...prev, 
                  startTime: parseFloat(e.target.value) || 0 
                }))}
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time (seconds)</Label>
              <Input
                id="endTime"
                type="number"
                value={newSubtitle.endTime || 5}
                onChange={(e) => setNewSubtitle(prev => ({ 
                  ...prev, 
                  endTime: parseFloat(e.target.value) || 5 
                }))}
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="speaker">Speaker</Label>
              <Input
                id="speaker"
                value={newSubtitle.speaker || 'Speaker 1'}
                onChange={(e) => setNewSubtitle(prev => ({ 
                  ...prev, 
                  speaker: e.target.value 
                }))}
                placeholder="Speaker name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subtitleText">Subtitle Text</Label>
            <Textarea
              id="subtitleText"
              value={newSubtitle.text || ''}
              onChange={(e) => setNewSubtitle(prev => ({ 
                ...prev, 
                text: e.target.value 
              }))}
              placeholder="Enter subtitle text..."
              rows={2}
            />
          </div>

          <Button onClick={addSubtitle} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Subtitle
          </Button>
        </CardContent>
      </Card>

      {/* Subtitle List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subtitle Segments ({subtitles.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportSubtitles}>
                <Save className="w-4 h-4 mr-2" />
                Export SRT
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {subtitles.map((subtitle) => (
                <div
                  key={subtitle.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    subtitle.isActive 
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}
                      </Badge>
                      {subtitle.speaker && (
                        <Badge variant="secondary" className="text-xs">
                          {subtitle.speaker}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => seekToTime(subtitle.startTime)}
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingSubtitle(subtitle.id)}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSubtitle(subtitle.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingSubtitle === subtitle.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={subtitle.text}
                        onChange={(e) => updateSubtitle(subtitle.id, { text: e.target.value })}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setEditingSubtitle(null)}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSubtitle(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {subtitle.text}
                    </p>
                  )}
                </div>
              ))}
              
              {subtitles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No subtitles created yet</p>
                  <p className="text-sm">Add your first subtitle above</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Styling Options */}
      <Card>
        <CardHeader>
          <CardTitle>Subtitle Styling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
                min="8"
                max="48"
              />
            </div>
            <div>
              <Label htmlFor="fontColor">Font Color</Label>
              <Input
                id="fontColor"
                type="color"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="backgroundOpacity">Background Opacity</Label>
              <Input
                id="backgroundOpacity"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={backgroundOpacity}
                onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
              />
              <span className="text-sm text-muted-foreground">
                {Math.round(backgroundOpacity * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubtitleEditor;
