import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import TranscriptChat from './TranscriptChat';
import {
  Save,
  Download,
  FileText,
  Clock,
  Edit3,
  ChevronDown,
  Undo,
  Redo,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  Loader2,
  User,
  Scissors,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Search,
  Replace,
  Zap,
  Target,
  BarChart3,
  Hash,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Copy
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ExportManager from '@/components/ExportManager';
// import { EpisodeService } from '@/lib/episodeService'; // Disabled - using localStorage only
import { useUser } from '@clerk/clerk-react';

interface ContentEditorProps {
  episodeId?: string;
}



// Add missing type definitions
interface ProcessingStage {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

interface ErrorInfo {
  type: 'network' | 'rateLimit' | 'transcription' | 'processing' | 'unknown';
  message: string;
}

interface EpisodeData {
  title: string;
  duration: string | number;
  transcript: string;
  quotes?: any[];
  hasAIContent?: boolean;
  aiGeneratedAt?: string;
  summary?: string;
  chapters?: any[];
  keywords?: any[];
  // YouTube-specific fields
  sourceUrl?: string;
  source?: string;
  videoId?: string;
}

interface GeneratedContent {
  summary: {
    short: string;
    long: string;
  };
  chapters: Array<{
    timestamp: string;
    title: string;
    content: string;
  }>;
  keywords: string[];
  quotes: Array<{
    text: string;
    timestamp?: string;
  }>;
}

const ContentEditor: React.FC<ContentEditorProps> = ({ episodeId = "1" }) => {
  const { toast } = useToast();
  const { user } = useUser();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [episodeData, setEpisodeData] = useState<EpisodeData>({
    title: "Untitled Episode",
    duration: "00:00",
    transcript: "",
  });

  // Processing status state
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([
    { id: 'analysis', name: 'Analyzing Content', status: 'pending', progress: 0 },
    { id: 'finalize', name: 'Finalizing', status: 'pending', progress: 0 }
  ]);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [processingError, setProcessingError] = useState<ErrorInfo | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');

  // Auto-save state
  const [saveState, setSaveState] = useState({
    status: 'saved' as 'saving' | 'saved' | 'error',
    hasUnsavedChanges: false,
    lastSaved: new Date()
  });

  // Ref to track if generation is in progress to prevent multiple calls
  const isGeneratingRef = useRef(false);


  // Text processing tools state
  const [showTextTools, setShowTextTools] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showStats, setShowStats] = useState(true);
  
  // Undo/Redo functionality
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Censoring toggle states
  const [censoringEnabled, setCensoringEnabled] = useState(false);
  const [censoringStyle, setCensoringStyle] = useState<'asterisks' | 'dashes' | 'clean' | 'remove'>('asterisks');
  const [originalTranscript, setOriginalTranscript] = useState<string>('');
  
  // Text processing toggle states
  const [cleanSpacesEnabled, setCleanSpacesEnabled] = useState(false);
  const [addBreaksEnabled, setAddBreaksEnabled] = useState(false);
  const [originalTextForSpaces, setOriginalTextForSpaces] = useState<string>('');
  const [originalTextForBreaks, setOriginalTextForBreaks] = useState<string>('');
  
  const [showChat, setShowChat] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);



  // Process transcript for display
  const processTranscriptForDisplay = (transcript: string): string => {
    if (!transcript) return transcript;
    
    let processed = transcript;
    
    // Apply censoring if enabled
    if (censoringEnabled) {
      processed = applyCensoring(processed, censoringStyle);
    }
    
    return processed;
  };

  // Helper function to parse duration string to seconds
  const parseDurationToSeconds = (duration: string): number => {
    if (!duration || duration === '00:00' || duration === '0:00' || duration === '0' || duration === '') return 0;
    
    console.log('Parsing duration string:', duration);
    
    // Handle formats like "1:23:45" or "23:45" or "45"
    const parts = duration.split(':').map(Number);
    console.log('Duration parts:', parts);
    
    if (parts.length === 3) {
      // HH:MM:SS format
      const seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      console.log('Parsed as HH:MM:SS:', seconds, 'seconds');
      return seconds;
    } else if (parts.length === 2) {
      // MM:SS format
      const seconds = parts[0] * 60 + parts[1];
      console.log('Parsed as MM:SS:', seconds, 'seconds');
      return seconds;
    } else if (parts.length === 1) {
      // SS format
      console.log('Parsed as SS:', parts[0], 'seconds');
      return parts[0];
    }
    
    console.log('Failed to parse duration, returning 0');
    return 0;
  };


  // Save episode data to Supabase
  const saveEpisodeData = async (data: Partial<EpisodeData>) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaveState(prev => ({ ...prev, status: 'saving' }));
      
      if (episodeId && episodeId !== "1") {
        // Update existing episode in localStorage
        const storedEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
        const episodeIndex = storedEpisodes.findIndex((ep: any) => ep.id === episodeId);
        if (episodeIndex !== -1) {
          storedEpisodes[episodeIndex] = { ...storedEpisodes[episodeIndex], ...data, updatedAt: Date.now() };
          localStorage.setItem('episodes', JSON.stringify(storedEpisodes));
          localStorage.setItem('episodes_owner', user.id);
        }
      } else {
        // Create new episode in localStorage
        const newEpisode = {
          id: `episode_${Date.now()}`,
          userId: user.id,
          ...data,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        const storedEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
        storedEpisodes.unshift(newEpisode);
        localStorage.setItem('episodes', JSON.stringify(storedEpisodes));
        localStorage.setItem('episodes_owner', user.id);
        // Update the URL to use the new episode ID
        window.history.replaceState({}, '', `/episode/${newEpisode.id}`);
      }

      setSaveState(prev => ({ 
        ...prev, 
        status: 'saved', 
        hasUnsavedChanges: false,
        lastSaved: new Date()
      }));

      toast({
        title: "Changes saved",
        description: "Your episode has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving episode:", error);
      setSaveState(prev => ({ ...prev, status: 'error' }));
      
      toast({
        title: "Save failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Load episode data from Supabase
  useEffect(() => {
    const loadEpisodeData = async () => {
      if (!user?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        // Load episode from localStorage
        const storedEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
        const episode = storedEpisodes.find((ep: any) => ep.id === episodeId);
        
        if (episode) {
          console.log('📖 LOADING EPISODE DATA:');
          console.log('📖 Episode ID:', episode.id);
          console.log('📖 Episode title:', episode.title);
          console.log('📖 Raw duration value:', episode.duration);
          console.log('📖 Duration type:', typeof episode.duration);
          console.log('📖 Duration is finite:', isFinite(episode.duration));
          console.log('📖 Full episode object:', episode);
          
          setEpisodeData({
            title: episode.title || "Untitled Episode",
            duration: episode.duration || 0, // Preserve numeric duration, don't convert to string
            transcript: episode.transcript || "",
            summary: episode.summary || "",
            chapters: episode.chapters || [],
            keywords: episode.keywords || [],
            quotes: episode.quotes || [],
            hasAIContent: episode.hasAIContent || false,
            aiGeneratedAt: episode.aiGeneratedAt,
            // Preserve YouTube-specific fields
            sourceUrl: episode.sourceUrl,
            source: episode.source,
            videoId: episode.videoId
          });

          // Reset toggle states when loading new episode
          setCleanSpacesEnabled(false);
          setAddBreaksEnabled(false);
          setCensoringEnabled(false);
          setOriginalTextForSpaces('');
          setOriginalTextForBreaks('');
          setOriginalTranscript('');

          // Restore previously generated AI content
          if (episode.hasAIContent && episode.aiGeneratedAt) {
            const restoredContent: GeneratedContent = {
              summary: {
                short: episode.summary ? episode.summary.substring(0, 200) + "..." : "",
                long: episode.summary || ""
              },
              chapters: episode.chapters?.map((chapter: any) => ({
                timestamp: chapter.startTime || "00:00",
                title: chapter.title || "Untitled Chapter",
                content: chapter.summary || ""
              })) || [],
              keywords: episode.keywords || [],
              quotes: episode.quotes || []
            };

            setGeneratedContent(restoredContent);

            toast({
              title: "AI content restored",
              description: `Previously generated content from ${new Date(episode.aiGeneratedAt).toLocaleDateString()} has been loaded.`,
            });
          }
        } else {
          setError("Episode not found");
        }
      } catch (error) {
        console.error("Failed to load episode:", error);
        setError("Failed to load episode data");
      } finally {
        setLoading(false);
      }
    };

    loadEpisodeData();
  }, [episodeId, user?.id, toast]);




  // Update processing stage
  const updateProcessingStage = (stageId: string, progress: number, status: ProcessingStage['status']) => {
    setProcessingStages(prev => {
      const updatedStages = prev.map(stage => 
      stage.id === stageId 
        ? { ...stage, progress, status }
        : stage
      );
      
      // Calculate overall progress using the updated stages
    const stageWeights = {
      analysis: 50,
      finalize: 50
    };
    
      const totalProgress = updatedStages.reduce((total, stage) => {
      const weight = stageWeights[stage.id as keyof typeof stageWeights] || 0;
      const stageProgress = stage.status === 'completed' ? 100 : 
                             stage.status === 'processing' ? stage.progress : 0;
      return total + (weight * stageProgress / 100);
    }, 0);
    
    setOverallProgress(Math.round(totalProgress));
      
      return updatedStages;
    });
    
    if (status === 'processing') {
      setCurrentStage(stageId);
    }
  };






  // Add missing functions
  const cancelProcessing = () => {
    isGeneratingRef.current = false;
    setIsGenerating(false);
    setProcessingError(null);
    setCurrentStage('');
    setOverallProgress(0);
    setEstimatedTimeRemaining('');
    
    // Reset all stages to pending
    setProcessingStages(prev => prev.map(stage => ({
      ...stage,
      status: 'pending' as const,
      progress: 0
    })));
  };


  const handleSave = async () => {
    await saveEpisodeData(episodeData);
  };

  // Undo/Redo functionality
  const saveToHistory = (transcript: string) => {
    const newHistory = transcriptHistory.slice(0, historyIndex + 1);
    newHistory.push(transcript);
    setTranscriptHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      updateContent("transcript", transcriptHistory[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < transcriptHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      updateContent("transcript", transcriptHistory[newIndex]);
    }
  };

  // Text processing utilities
  const formatText = (format: 'uppercase' | 'lowercase' | 'title' | 'sentence') => {
    let formatted = episodeData.transcript;
    switch (format) {
      case 'uppercase':
        formatted = episodeData.transcript.toUpperCase();
        break;
      case 'lowercase':
        formatted = episodeData.transcript.toLowerCase();
        break;
      case 'title':
        formatted = episodeData.transcript.replace(/\b\w/g, l => l.toUpperCase());
        break;
      case 'sentence':
        // Convert to lowercase first
        formatted = episodeData.transcript.toLowerCase();
        
        // Split by sentence endings, keeping the punctuation
        const parts = formatted.split(/([.!?]+\s*)/);
        let result = '';
        
        for (let i = 0; i < parts.length; i++) {
          if (i % 2 === 0) {
            // This is a sentence (not punctuation)
            const sentence = parts[i].trim();
            if (sentence.length > 0) {
              // Find the first letter (skip timestamps like [00:00:00])
              const match = sentence.match(/^(\[[^\]]*\]\s*)?(.*)/);
              if (match) {
                const prefix = match[1] || ''; // Timestamp part like "[00:00:00] "
                const text = match[2] || '';    // Actual text part
                if (text.length > 0) {
                  // Capitalize first letter of the actual text
                  const capitalized = prefix + text.charAt(0).toUpperCase() + text.slice(1);
                  result += capitalized;
                } else {
                  result += sentence;
                }
              } else {
                result += sentence;
              }
            }
          } else {
            // This is punctuation and spaces - keep as is
            result += parts[i];
          }
        }
        
        formatted = result;
        break;
    }
    saveToHistory(episodeData.transcript);
    updateContent("transcript", formatted);
  };

  const toggleCleanSpaces = () => {
    if (cleanSpacesEnabled) {
      // Turn off - restore original
      setCleanSpacesEnabled(false);
      if (originalTextForSpaces) {
        saveToHistory(episodeData.transcript);
        updateContent("transcript", originalTextForSpaces);
      }
    } else {
      // Turn on - save original and apply cleaning
      setOriginalTextForSpaces(episodeData.transcript);
      const cleaned = episodeData.transcript
        .replace(/\s+/g, ' ')
        .replace(/\n\s+/g, '\n')
        .trim();
      saveToHistory(episodeData.transcript);
      updateContent("transcript", cleaned);
      setCleanSpacesEnabled(true);
    }
  };

  // Censoring functionality
  const censorWords = [
    'damn', 'damned', 'damning',
    'hell', 'hella',
    'shit', 'shits', 'shitting', 'shitty',
    'fuck', 'fucks', 'fucking', 'fucked', 'fucker',
    'bitch', 'bitches', 'bitching',
    'ass', 'asses', 'asshole', 'assholes',
    'crap', 'crappy',
    'stupid', 'stupidity',
    'idiot', 'idiots', 'idiotic',
    'dumb', 'dumber', 'dumbest',
    'suck', 'sucks', 'sucking', 'sucked'
  ];

  const applyCensoring = (text: string, style: 'asterisks' | 'dashes' | 'clean' | 'remove' = 'asterisks'): string => {
    let censored = text;

    censorWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      
      switch (style) {
        case 'asterisks':
          const asteriskReplacement = word.charAt(0) + '*'.repeat(Math.max(1, word.length - 1));
          censored = censored.replace(regex, asteriskReplacement);
          break;
        case 'dashes':
          const dashReplacement = word.charAt(0) + '-'.repeat(Math.max(1, word.length - 1));
          censored = censored.replace(regex, dashReplacement);
          break;
        case 'clean':
          const cleanReplacements: { [key: string]: string } = {
            'damn': 'darn', 'damned': 'darned', 'damning': 'darning',
            'hell': 'heck', 'hella': 'hecka',
            'shit': 'shoot', 'shits': 'shoots', 'shitting': 'shooting', 'shitty': 'shooty',
            'fuck': 'fudge', 'fucks': 'fudges', 'fucking': 'fudging', 'fucked': 'fudged', 'fucker': 'fudger',
            'bitch': 'witch', 'bitches': 'witches', 'bitching': 'witching',
            'ass': 'butt', 'asses': 'butts', 'asshole': 'butthole', 'assholes': 'buttholes',
            'crap': 'carp', 'crappy': 'carppy',
            'stupid': 'silly', 'stupidity': 'silliness',
            'idiot': 'goof', 'idiots': 'goofs', 'idiotic': 'goofy',
            'dumb': 'silly', 'dumber': 'sillier', 'dumbest': 'silliest',
            'suck': 'stink', 'sucks': 'stinks', 'sucking': 'stinking', 'sucked': 'stunk'
          };
          const cleanWord = cleanReplacements[word.toLowerCase()] || word;
          censored = censored.replace(regex, cleanWord);
          break;
        case 'remove':
          censored = censored.replace(regex, '[CENSORED]');
          break;
      }
    });

    return censored;
  };

  const toggleCensoring = (style: 'asterisks' | 'dashes' | 'clean' | 'remove') => {
    if (censoringEnabled && censoringStyle === style) {
      // Turn off censoring - restore original
      setCensoringEnabled(false);
      if (originalTranscript) {
        saveToHistory(episodeData.transcript);
        updateContent("transcript", originalTranscript);
      }
    } else {
      // Turn on censoring or change style
      if (!censoringEnabled) {
        // First time enabling - save original
        setOriginalTranscript(episodeData.transcript);
      }
      setCensoringStyle(style);
      setCensoringEnabled(true);
      
      const censored = applyCensoring(episodeData.transcript, style);
      saveToHistory(episodeData.transcript);
      updateContent("transcript", censored);
    }
  };


  const toggleAddBreaks = () => {
    if (addBreaksEnabled) {
      // Turn off - restore original
      setAddBreaksEnabled(false);
      if (originalTextForBreaks) {
        saveToHistory(episodeData.transcript);
        updateContent("transcript", originalTextForBreaks);
      }
    } else {
      // Turn on - save original and apply breaks
      setOriginalTextForBreaks(episodeData.transcript);
      const withBreaks = episodeData.transcript
        .replace(/\. /g, '.\n')
        .replace(/\? /g, '?\n')
        .replace(/! /g, '!\n');
      saveToHistory(episodeData.transcript);
      updateContent("transcript", withBreaks);
      setAddBreaksEnabled(true);
    }
  };

  const searchAndReplace = () => {
    if (!searchText) return;
    const regex = new RegExp(searchText, 'gi');
    const replaced = episodeData.transcript.replace(regex, replaceText);
    saveToHistory(episodeData.transcript);
    updateContent("transcript", replaced);
    setSearchText('');
    setReplaceText('');
  };

  // Format duration to precise MM:SS or HH:MM:SS format
  const formatDurationToMinutes = (duration: string | number): string => {
    if (!duration || duration === 0 || duration === '0' || duration === '00:00' || duration === '0:00') {
      return '0:00';
    }
    
    let totalSeconds = 0;
    
    // Handle number (assume seconds)
    if (typeof duration === 'number') {
      totalSeconds = Math.floor(duration); // Round down to whole seconds
    }
    // Handle string format (MM:SS or HH:MM:SS)
    else if (typeof duration === 'string') {
      const parts = duration.split(':').map(Number);
      
      if (parts.length === 3) {
        // HH:MM:SS format - return as is
        return duration;
      } else if (parts.length === 2) {
        // MM:SS format - return as is
        return duration;
      } else if (parts.length === 1) {
        // SS format or just a number string
        totalSeconds = Math.floor(parts[0] || 0);
      }
    }
    
    // Convert seconds to MM:SS or HH:MM:SS format
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const getTranscriptStats = () => {
    const words = episodeData.transcript.split(/\s+/).filter(w => w.length > 0).length;
    const characters = episodeData.transcript.length;
    const charactersNoSpaces = episodeData.transcript.replace(/\s/g, '').length;
    const paragraphs = episodeData.transcript.split('\n\n').filter(p => p.trim().length > 0).length;
    const sentences = episodeData.transcript.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const estimatedMinutes = Math.ceil(words / 150); // Average speaking rate
    
    return {
      words,
      characters,
      charactersNoSpaces,
      paragraphs,
      sentences,
      estimatedMinutes
    };
  };

  // Count censored words in transcript
  const getCensoredWordsCount = () => {
    if (!censoringEnabled || !episodeData.transcript) return 0;
    
    let count = 0;
    censorWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = episodeData.transcript.match(regex);
      if (matches) {
        count += matches.length;
      }
    });
    
    return count;
  };

  const saveNow = async () => {
    await saveEpisodeData(episodeData);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard",
    });
  };

  const updateContent = (field: string, value: string) => {
    setEpisodeData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleTranscriptChange = (value: string) => {
    // If censoring is enabled, we need to update the original transcript
    if (censoringEnabled) {
      setOriginalTranscript(value);
    }
    
    updateContent("transcript", value);
  };


  // Auto-save functionality
  useEffect(() => {
    setSaveState(prev => ({ ...prev, hasUnsavedChanges }));
  }, [hasUnsavedChanges]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Show processing status when generating */}
              {isGenerating && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="font-medium text-blue-900">
              Automatically generating content from transcript...
            </span>
      </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${overallProgress}%` }}
                        ></div>
                      </div>
            
            {estimatedTimeRemaining && (
              <p className="text-sm text-blue-700">
                    Estimated time remaining: {estimatedTimeRemaining}
                  </p>
            )}
            
            <div className="space-y-2">
              {processingStages.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between text-sm">
                  <span className={`flex items-center gap-2 ${
                    stage.status === 'completed' ? 'text-green-600' :
                    stage.status === 'processing' ? 'text-blue-600' :
                    stage.status === 'error' ? 'text-red-600' :
                    'text-muted-foreground'
                  }`}>
                    {stage.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                    {stage.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {stage.name}
                  </span>
                  <span>{stage.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header with Auto-Save Status */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div>
                <h1 className="text-2xl font-bold">{episodeData.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDurationToMinutes(episodeData.duration)}</span>
                  </span>
                  
                  {/* AI Content Status */}
                  {generatedContent && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      AI Content Generated
                    </Badge>
                  )}
                  
                  {/* Auto-save status */}
                  {saveState.status === 'saving' && (
                    <Badge variant="secondary" className="animate-pulse">
                      <Save className="w-3 h-3 mr-1 animate-spin" />
                      Saving...
                    </Badge>
                  )}
                  {saveState.status === 'saved' && (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                  {saveState.hasUnsavedChanges && saveState.status !== 'saving' && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Unsaved Changes
                    </Badge>
                  )}
                  {saveState.lastSaved && (
                    <span className="text-xs">
                      Last saved: {saveState.lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

              </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
              <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                  <CardTitle>Transcript</CardTitle>
                    <CardDescription>
                       Edit the automatically generated transcript. Changes are saved automatically.
                    </CardDescription>
                    </div>
                   <div className="flex gap-2">
                     <Button
                       variant="default"
                       size="sm"
                       onClick={() => setShowExportModal(true)}
                       className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                     >
                       <Download className="w-4 h-4 mr-2" />
                       Export
                     </Button>
                   </div>
                </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* AI Assistant Section */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-purple-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            AI Transcript Assistant
                          </h4>
                          <p className="text-sm text-purple-600 mt-1">
                            Get AI help to refine your transcript - summarize, extract quotes, improve clarity, and more
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowChat(true)}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Chat with AI
                        </Button>
                      </div>
                    </div>

                    {/* Compact Text Processing Tools */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-800 flex items-center gap-2">
                          <Scissors className="w-4 h-4" />
                          Tools
                        </h4>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className="h-8 px-2"
                          >
                            <Undo className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={redo}
                            disabled={historyIndex >= transcriptHistory.length - 1}
                            className="h-8 px-2"
                          >
                            <Redo className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* All Text Processing Tools */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {/* Formatting Tools */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => formatText('uppercase')}
                          className="h-8 px-3 text-xs"
                        >
                          <Bold className="w-3 h-3 mr-1" />
                          UPPER
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => formatText('lowercase')}
                          className="h-8 px-3 text-xs"
                        >
                          <Type className="w-3 h-3 mr-1" />
                          lower
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => formatText('title')}
                          className="h-8 px-3 text-xs"
                        >
                          <Target className="w-3 h-3 mr-1" />
                          Title
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => formatText('sentence')}
                          className="h-8 px-3 text-xs"
                        >
                          <AlignLeft className="w-3 h-3 mr-1" />
                          Sentence
                        </Button>

                        {/* Cleaning Tools */}
                        <Button
                          variant={cleanSpacesEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={toggleCleanSpaces}
                          className={`h-8 px-3 text-xs ${
                            cleanSpacesEnabled 
                              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                              : ''
                          }`}
                        >
                          <Scissors className="w-3 h-3 mr-1" />
                          {cleanSpacesEnabled ? 'Cleaning Spaces' : 'Clean Spaces'}
                        </Button>
                        <Button
                          variant={addBreaksEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={toggleAddBreaks}
                          className={`h-8 px-3 text-xs ${
                            addBreaksEnabled 
                              ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                              : ''
                          }`}
                        >
                          <AlignLeft className="w-3 h-3 mr-1" />
                          {addBreaksEnabled ? 'Adding Breaks' : 'Add Breaks'}
                        </Button>

                        {/* Censoring Tools */}
                        <Button
                          variant={censoringEnabled && censoringStyle === 'asterisks' ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCensoring('asterisks')}
                          className={`h-8 px-3 text-xs ${
                            censoringEnabled && censoringStyle === 'asterisks' 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : ''
                          }`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {censoringEnabled && censoringStyle === 'asterisks' ? 'Censoring *' : 'Censor *'}
                        </Button>
                        <Button
                          variant={censoringEnabled && censoringStyle === 'clean' ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCensoring('clean')}
                          className={`h-8 px-3 text-xs ${
                            censoringEnabled && censoringStyle === 'clean' 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : ''
                          }`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {censoringEnabled && censoringStyle === 'clean' ? 'Cleaning' : 'Clean Words'}
                        </Button>
                        <Button
                          variant={censoringEnabled && censoringStyle === 'remove' ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCensoring('remove')}
                          className={`h-8 px-3 text-xs ${
                            censoringEnabled && censoringStyle === 'remove' 
                              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                              : ''
                          }`}
                        >
                          <EyeOff className="w-3 h-3 mr-1" />
                          {censoringEnabled && censoringStyle === 'remove' ? 'Removing' : 'Remove'}
                        </Button>
                      </div>

                      {/* Search & Replace */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="h-8 text-xs flex-1"
                        />
                        <Input
                          placeholder="Replace..."
                          value={replaceText}
                          onChange={(e) => setReplaceText(e.target.value)}
                          className="h-8 text-xs flex-1"
                        />
                        <Button
                          onClick={searchAndReplace}
                          disabled={!searchText}
                          size="sm"
                          className="h-8 px-3 text-xs"
                        >
                          <Replace className="w-3 h-3 mr-1" />
                          Replace
                        </Button>
                      </div>


                      {/* Quick Stats */}
                      {showStats && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex items-center text-xs text-blue-600">
                            <span className="flex items-center gap-1 mr-2">
                              <BarChart3 className="w-3 h-3" />
                              Stats:
                            </span>
                            <div className="flex gap-4">
                              <span>{getTranscriptStats().words} words</span>
                              <span>{getTranscriptStats().characters} chars</span>
                              {censoringEnabled && getCensoredWordsCount() > 0 && (
                                <span className="text-red-600 font-medium">
                                  {getCensoredWordsCount()} censored
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Textarea
                      value={processTranscriptForDisplay(episodeData.transcript)}
                      onChange={(e) => handleTranscriptChange(e.target.value)}
                      className="min-h-[500px] font-mono text-sm leading-relaxed"
                      placeholder="Transcript will appear here..."
                    />
                    
                    {/* Show helpful message if transcript is placeholder */}
                    {episodeData.transcript.includes('[This is a placeholder transcript') && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Placeholder Transcript Detected
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>This appears to be a placeholder transcript. To get the best AI-generated content, please:</p>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                <li>Go to the original YouTube video</li>
                                <li>Click "..." → "Open transcript" to copy the real transcript</li>
                                <li>Paste it here to replace this placeholder</li>
                                <li>Then use the AI Chat feature in the Export section to refine your content</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

          {generatedContent?.quotes && generatedContent.quotes.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Key Quotes
                </CardTitle>
                <CardDescription>
                  AI-extracted impactful quotes from your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedContent.quotes.map((quote, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4 py-2">
                      <blockquote className="text-lg italic mb-2">
                        "{quote.text}"
                      </blockquote>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                        onClick={() => handleCopy(`"${quote.text}"`)}
                        className="ml-2"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                              ))}
                            </div>
                </CardContent>
              </Card>
          )}

        </div>
      </div>

      {/* Transcript Chat Modal */}
      {showChat && (
        <TranscriptChat
          transcript={episodeData.transcript}
          onClose={() => setShowChat(false)}
          onUpdateTranscript={(updatedTranscript) => {
            updateContent("transcript", updatedTranscript);
          }}
        />
      )}

      {/* Export Modal */}
      {showExportModal && episodeData.transcript && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Export Content</h2>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label="Close export modal"
              >
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ExportManager episode={{
                title: episodeData.title,
                transcript: episodeData.transcript,
                summary: 'No summary available',
                chapters: 'No chapters available',
                keywords: 'No keywords available',
                quotes: episodeData.quotes || []
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentEditor;