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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import {
  Save,
  Download,
  Copy,
  FileText,
  BookOpen,
  Hash,
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
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ExportManager from '@/components/ExportManager';
// import { EpisodeService } from '@/lib/episodeService'; // Disabled - using localStorage only
import { useUser } from '@clerk/clerk-react';

interface ContentEditorProps {
  episodeId?: string;
}

interface Chapter {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  summary: string;
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
    speaker?: string;
    timestamp?: string;
  }>;
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
  duration: string;
  transcript: string;
  summary: string;
  chapters: Chapter[];
  keywords: string[];
  quotes?: any[];
  hasAIContent?: boolean;
  aiGeneratedAt?: string;
}

const ContentEditor: React.FC<ContentEditorProps> = ({ episodeId = "1" }) => {
  const { toast } = useToast();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("transcript");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [episodeData, setEpisodeData] = useState<EpisodeData>({
    title: "Untitled Episode",
    duration: "00:00",
    transcript: "",
    summary: "",
    chapters: [] as Chapter[],
    keywords: [] as string[],
  });

  // Processing status state
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([
    { id: 'analysis', name: 'Analyzing Content', status: 'pending', progress: 0 },
    { id: 'summary', name: 'Generate Summary', status: 'pending', progress: 0 },
    { id: 'chapters', name: 'Create Chapters', status: 'pending', progress: 0 },
    { id: 'keywords', name: 'Extract Keywords', status: 'pending', progress: 0 },
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

  // Speaker names state
  const [speakerNames, setSpeakerNames] = useState({
    speaker1: 'Speaker 1',
    speaker2: 'Speaker 2'
  });

  // Speaker detection and formatting
  const detectSpeakers = (transcript: string): string => {
    if (!transcript || transcript.trim().length === 0) {
      return transcript;
    }

    // Try to detect existing speaker patterns first
    const existingSpeakerPattern = /^(Speaker \d+|Host|Guest|Interviewer|Interviewee|Person \d+):/m;
    if (existingSpeakerPattern.test(transcript)) {
      return transcript; // Already has speaker labels
    }

    // Split transcript into sentences/paragraphs
    const sentences = transcript.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    if (sentences.length < 2) {
      return transcript; // Not enough content to detect speakers
    }

    // Group sentences by speaker to avoid fragmentation
    const speakerGroups: { speaker: number; sentences: string[] }[] = [];
    let currentSpeaker = 1;
    let currentGroup: string[] = [];
    let sentenceCount = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      
      // Check for natural speaker change indicators
      const isQuestion = sentence.includes('?');
      const isShortResponse = sentence.length < 50;
      const isGreeting = /^(hi|hello|hey|thanks|thank you|yes|no|okay|ok|sure|absolutely|exactly|right)/i.test(sentence);
      const isTransition = /^(so|now|well|actually|however|but|and|also|furthermore|moreover)/i.test(sentence);
      const isAgreement = /^(yes|yeah|yep|absolutely|exactly|right|correct|true|agreed)/i.test(sentence);
      const isDisagreement = /^(no|nope|not really|disagree|actually|but|however)/i.test(sentence);
      
      // More conservative speaker change detection
      let shouldChangeSpeaker = false;
      
      // Only change speaker for clear indicators
      if (isQuestion && sentenceCount > 0) {
        shouldChangeSpeaker = true;
      }
      // Change speaker for very short responses after a longer statement
      else if (isShortResponse && (isGreeting || isAgreement || isDisagreement) && sentenceCount > 2) {
        shouldChangeSpeaker = true;
      }
      // Change speaker for major transitions (new topic)
      else if (isTransition && sentenceCount > 3) {
        shouldChangeSpeaker = true;
      }
      // Change speaker after a longer monologue (6-8 sentences)
      else if (sentenceCount >= 6) {
        shouldChangeSpeaker = true;
      }
      
      // If we should change speaker, save current group and start new one
      if (shouldChangeSpeaker && currentGroup.length > 0) {
        speakerGroups.push({ speaker: currentSpeaker, sentences: [...currentGroup] });
        currentSpeaker = currentSpeaker === 1 ? 2 : 1;
        currentGroup = [];
        sentenceCount = 0;
      }
      
      // Add sentence to current group
      currentGroup.push(sentence);
      sentenceCount++;
    }
    
    // Add the last group
    if (currentGroup.length > 0) {
      speakerGroups.push({ speaker: currentSpeaker, sentences: currentGroup });
    }

    // Format the grouped sentences
    const formattedGroups = speakerGroups.map(group => {
      const combinedText = group.sentences.join(' ');
      return `Speaker ${group.speaker}: ${combinedText}`;
    });

    return formattedGroups.join('\n\n');
  };

  // Format transcript with speaker labels
  const formatTranscriptWithSpeakers = (transcript: string): string => {
    return detectSpeakers(transcript);
  };

  // Replace speaker names in transcript
  const replaceSpeakerNames = (transcript: string, speaker1Name: string, speaker2Name: string): string => {
    if (!transcript) return transcript;
    
    // More robust replacement - handle different formats
    let updatedTranscript = transcript
      .replace(/Speaker 1:/g, `${speaker1Name}:`)
      .replace(/Speaker 2:/g, `${speaker2Name}:`)
      .replace(/Speaker 1 /g, `${speaker1Name} `)
      .replace(/Speaker 2 /g, `${speaker2Name} `);
    
    return updatedTranscript;
  };

  // Update speaker names and apply to transcript
  const updateSpeakerNames = (speaker1: string, speaker2: string) => {
    setSpeakerNames({ speaker1, speaker2 });
    
    // Don't update the transcript here - let the display handle the conversion
    // The transcript should always be stored with Speaker 1/2 labels
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
          setEpisodeData({
            title: episode.title || "Untitled Episode",
            duration: episode.duration || "00:00",
            transcript: episode.transcript || "",
            summary: episode.summary || "",
            chapters: episode.chapters || [],
            keywords: episode.keywords || [],
            quotes: episode.quotes || [],
            hasAIContent: episode.hasAIContent || false,
            aiGeneratedAt: episode.aiGeneratedAt
          });

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

  // Auto-format transcript with speaker labels when loaded
  useEffect(() => {
    if (episodeData.transcript && episodeData.transcript.trim().length > 0) {
      console.log('Auto-formatting transcript...');
      console.log('Original transcript sample:', episodeData.transcript.substring(0, 200));
      
      const formattedTranscript = formatTranscriptWithSpeakers(episodeData.transcript);
      console.log('Formatted transcript sample:', formattedTranscript.substring(0, 200));
      
      if (formattedTranscript !== episodeData.transcript) {
        console.log('Transcript needs formatting, updating...');
        setEpisodeData(prev => ({ ...prev, transcript: formattedTranscript }));
      } else {
        console.log('Transcript already formatted');
      }
    }
  }, [episodeData.transcript]);


  // Auto-generate content when transcript is available
  useEffect(() => {
    const autoGenerateContent = async () => {
      // Only auto-generate if we have a transcript and haven't generated content yet
      if (episodeData.transcript && 
          episodeData.transcript.trim().length > 100 && 
          !episodeData.hasAIContent && 
          !isGeneratingRef.current &&
          !generatedContent) {
        
        console.log("Auto-generating content for transcript...");
        await generateAIContent();
      }
    };

    // Small delay to ensure transcript is fully loaded
    const timer = setTimeout(autoGenerateContent, 1000);
    return () => clearTimeout(timer);
  }, [episodeData.transcript, episodeData.hasAIContent, generatedContent]);

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
      analysis: 20,
      summary: 30,
      chapters: 25,
      keywords: 15,
      finalize: 10
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

  const generateAIContent = async () => {
    if (!episodeData.transcript || episodeData.transcript.trim().length < 100) {
      return; // Silently return if no transcript
    }

    // Prevent multiple simultaneous calls
    if (isGeneratingRef.current) {
      console.log("Generation already in progress, skipping...");
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setProcessingError(null);
    setOverallProgress(0);
    
    try {
      // Stage 1: Content Analysis
      updateProcessingStage('analysis', 0, 'processing');
      setEstimatedTimeRemaining('2-3 minutes');
      
      for (let i = 0; i <= 100; i += 25) {
        updateProcessingStage('analysis', i, 'processing');
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      updateProcessingStage('analysis', 100, 'completed');

      // Stage 2: Generate Summary
      updateProcessingStage('summary', 0, 'processing');
      setEstimatedTimeRemaining('1-2 minutes');
      
      for (let i = 0; i <= 100; i += 20) {
        updateProcessingStage('summary', i, 'processing');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      updateProcessingStage('summary', 100, 'completed');

      // Stage 3: Generate Chapters
      updateProcessingStage('chapters', 0, 'processing');
      setEstimatedTimeRemaining('30-60 seconds');
      
      for (let i = 0; i <= 100; i += 25) {
        updateProcessingStage('chapters', i, 'processing');
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      updateProcessingStage('chapters', 100, 'completed');

      // Stage 4: Extract Keywords
      updateProcessingStage('keywords', 0, 'processing');
      setEstimatedTimeRemaining('15-30 seconds');
      
      for (let i = 0; i <= 100; i += 33) {
        updateProcessingStage('keywords', i, 'processing');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      updateProcessingStage('keywords', 100, 'completed');

      // Stage 5: Finalize
      updateProcessingStage('finalize', 0, 'processing');
      setEstimatedTimeRemaining('5-10 seconds');

      // Call the Supabase function to generate real AI content
      console.log('Calling Supabase generate-content function...', {
        transcriptLength: episodeData.transcript.length,
        title: episodeData.title,
        userId: user?.id,
        episodeId: episodeId
      });

      // Check if Supabase is properly configured
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }

      // First, let's test if the function exists
      try {
        const { data, error } = await supabase.functions.invoke('generate-content', {
          body: {
            transcript: episodeData.transcript,
            videoTitle: episodeData.title,
            userId: user?.id,
            episodeId: episodeId,
            enablePersonalization: true
          }
        });

        console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`AI content generation failed: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('Supabase function returned unsuccessful response:', data);
        throw new Error(data?.error || 'AI content generation failed - no data returned');
      }

      const generatedContent = data.content;
      console.log('Generated content received:', generatedContent);
      setGeneratedContent(generatedContent);

      // Update episode data with generated content
      const updatedEpisodeData: EpisodeData = {
        ...episodeData,
        summary: generatedContent.summary.long,
        chapters: generatedContent.chapters.map((chapter: any, index: number) => ({
          id: Date.now().toString() + index,
          title: chapter.title,
          startTime: chapter.timestamp,
          endTime: "00:00",
          summary: chapter.content
        })),
        keywords: generatedContent.keywords,
        hasAIContent: true,
        aiGeneratedAt: new Date().toISOString()
      };

      setEpisodeData(updatedEpisodeData);

      updateProcessingStage('finalize', 100, 'completed');
      setOverallProgress(100);
      setEstimatedTimeRemaining('');
      setCurrentStage('');

      // Auto-save generated content
      try {
        await saveEpisodeData({
          ...updatedEpisodeData,
          hasAIContent: true,
          aiGeneratedAt: new Date().toISOString()
        });

      toast({
          title: "Content generated automatically!",
          description: "Summary, chapters, and keywords have been created from your transcript.",
        });

      } catch (saveError) {
        console.error("Failed to save generated content:", saveError);
        setSaveState(prev => ({ ...prev, status: 'error' }));
      }

    } catch (error) {
      console.error("Failed to generate AI content:", error);
      
      // Try fallback generation with OpenAI API
      console.log("Attempting fallback generation with OpenAI API...");
      try {
        // Generate proper summary using OpenAI API directly
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error("OpenAI API key not configured");
        }

        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert content creator specializing in podcast and video content analysis. Create engaging, informative summaries that capture the main topics and key insights.'
              },
              {
                role: 'user',
                content: `Create two versions of a summary for this podcast/video transcript:

1. SHORT (2-3 sentences): A concise, engaging summary that captures the main topics and key insights. Make it compelling for potential listeners.

2. LONG (1 paragraph): A more detailed summary that provides context and highlights the most valuable takeaways.

Format your response as:
SHORT: [your short summary]
LONG: [your long summary]

Transcript: ${episodeData.transcript}`
              }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        if (!summaryResponse.ok) {
          throw new Error(`OpenAI API error: ${summaryResponse.status}`);
        }

        const summaryData = await summaryResponse.json();
        const summaryText = summaryData.choices[0]?.message?.content || '';
        
        const shortMatch = summaryText.match(/SHORT:\s*(.*?)(?=LONG:|$)/s);
        const longMatch = summaryText.match(/LONG:\s*(.*?)$/s);

        // Generate chapters using OpenAI
        const chaptersResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert content creator. Break transcripts into logical chapters with timestamps and descriptive titles.'
              },
              {
                role: 'user',
                content: `Break this transcript into 5-8 logical chapters with timestamps and descriptive titles. Each chapter should represent a distinct topic or conversation segment.

Format your response as:
CHAPTER 1: 00:00:00 - [Descriptive Title]
[Brief description of what's covered in this chapter]

CHAPTER 2: 00:05:30 - [Descriptive Title]
[Brief description of what's covered in this chapter]

Continue this pattern for all chapters. Make timestamps realistic based on content length.

Transcript: ${episodeData.transcript}`
              }
            ],
            max_tokens: 1500,
            temperature: 0.7,
          }),
        });

        let chapters = [
          {
            timestamp: "00:00",
            title: "Introduction",
            content: "Opening remarks and topic introduction"
          },
          {
            timestamp: "05:00",
            title: "Main Discussion",
            content: "Core content and key points"
          },
          {
            timestamp: "10:00",
            title: "Conclusion",
            content: "Wrap-up and final thoughts"
          }
        ];

        if (chaptersResponse.ok) {
          const chaptersData = await chaptersResponse.json();
          const chaptersText = chaptersData.choices[0]?.message?.content || '';
          
          const chapterMatches = chaptersText.match(/CHAPTER \d+:\s*(\d{2}:\d{2}:\d{2})\s*-\s*(.*?)\n(.*?)(?=CHAPTER \d+:|$)/gs);
          
          if (chapterMatches) {
            chapters = chapterMatches.map(match => {
              const parts = match.match(/CHAPTER \d+:\s*(\d{2}:\d{2}:\d{2})\s*-\s*(.*?)\n(.*?)$/s);
              if (parts) {
                return {
                  timestamp: parts[1],
                  title: parts[2].trim(),
                  content: parts[3].trim()
                };
              }
              return null;
            }).filter(Boolean);
          }
        }

        // Generate keywords using OpenAI
        const keywordsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert content creator. Extract SEO-optimized keywords and topics from content.'
              },
              {
                role: 'user',
                content: `Extract 10-15 SEO-optimized keywords and topics from this content. Include both broad categories and specific terms that would help people discover this content.

Format your response as a simple comma-separated list:
keyword1, keyword2, keyword3, etc.

Transcript: ${episodeData.transcript}`
              }
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        let keywords = ["podcast", "content", "AI", "transcription", "automation"];
        if (keywordsResponse.ok) {
          const keywordsData = await keywordsResponse.json();
          const keywordsText = keywordsData.choices[0]?.message?.content || '';
          keywords = keywordsText
            .split(',')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword.length > 0)
            .slice(0, 15);
        }

        // Generate quotes using OpenAI
        const quotesResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert content creator. Find the most impactful, quotable moments from transcripts.'
              },
              {
                role: 'user',
                content: `Find the 5 most impactful, quotable moments from this transcript. Choose quotes that are insightful, memorable, or would perform well on social media.

Format your response as:
QUOTE 1: "[exact quote text]" - Speaker Name (if identifiable)
QUOTE 2: "[exact quote text]" - Speaker Name (if identifiable)
Continue this pattern...

Transcript: ${episodeData.transcript}`
              }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        let quotes = [
          {
            text: episodeData.transcript.split('.')[0] + ".",
            speaker: "Speaker"
          }
        ];

        if (quotesResponse.ok) {
          const quotesData = await quotesResponse.json();
          const quotesText = quotesData.choices[0]?.message?.content || '';
          
          const quoteMatches = quotesText.match(/QUOTE \d+:\s*"([^"]+)"\s*(?:-\s*([^(]+))?/g);
          
          if (quoteMatches) {
            quotes = quoteMatches.map(match => {
              const parts = match.match(/QUOTE \d+:\s*"([^"]+)"\s*(?:-\s*([^(]+))?/);
              if (parts) {
                return {
                  text: parts[1].trim(),
                  speaker: parts[2]?.trim() || "Speaker"
                };
              }
              return null;
            }).filter(Boolean);
          }
        }

        const fallbackContent = {
          summary: {
            short: shortMatch?.[1]?.trim() || "AI-generated summary of your content.",
            long: longMatch?.[1]?.trim() || episodeData.transcript.substring(0, 500) + "..."
          },
          chapters: chapters,
          keywords: keywords,
          quotes: quotes
        };

        setGeneratedContent(fallbackContent);

        // Update episode data with fallback content
        const updatedEpisodeData: EpisodeData = {
          ...episodeData,
          summary: fallbackContent.summary.long,
          chapters: fallbackContent.chapters.map((chapter: any, index: number) => ({
            id: Date.now().toString() + index,
            title: chapter.title,
            startTime: chapter.timestamp,
            endTime: "00:00",
            summary: chapter.content
          })),
          keywords: fallbackContent.keywords,
          hasAIContent: true,
          aiGeneratedAt: new Date().toISOString()
        };

        setEpisodeData(updatedEpisodeData);
        updateProcessingStage('finalize', 100, 'completed');
        setOverallProgress(100);
        setEstimatedTimeRemaining('');
        setCurrentStage('');

        // Auto-save fallback content
        await saveEpisodeData({
          ...updatedEpisodeData,
          hasAIContent: true,
          aiGeneratedAt: new Date().toISOString()
        });

        toast({
          title: "Content generated with fallback method",
          description: "Summary, chapters, and keywords have been created using basic processing.",
        });

      } catch (fallbackError) {
        console.error("Fallback generation also failed:", fallbackError);
        setProcessingError({ type: 'processing', message: 'Content generation failed. Please try again.' });
      }
    }
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
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

  const retryProcessing = () => {
    setProcessingError(null);
    generateAIContent();
  };

  const handleSave = async () => {
    await saveEpisodeData(episodeData);
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

  const addChapter = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: "New Chapter",
      startTime: "00:00",
      endTime: "00:00",
      summary: "",
    };
    setEpisodeData((prev) => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
    }));
    setHasUnsavedChanges(true);
  };

  const updateChapter = (chapterId: string, field: string, value: string) => {
    setEpisodeData((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, [field]: value } : chapter,
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const deleteChapter = (chapterId: string) => {
    setEpisodeData((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((chapter) => chapter.id !== chapterId),
    }));
    setHasUnsavedChanges(true);
  };

  const addKeyword = () => {
    const newKeyword = "new keyword";
    setEpisodeData((prev) => ({
      ...prev,
      keywords: [...prev.keywords, newKeyword],
    }));
    setHasUnsavedChanges(true);
  };

  const updateKeyword = (index: number, value: string) => {
    setEpisodeData((prev) => ({
      ...prev,
      keywords: prev.keywords.map((keyword, i) =>
        i === index ? value : keyword,
      ),
    }));
    setHasUnsavedChanges(true);
  };

  const deleteKeyword = (index: number) => {
    setEpisodeData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
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
                    <span>{episodeData.duration}</span>
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

                <div className="flex items-center space-x-2">
                    <Button
                variant="outline" 
                size="sm"
                      onClick={generateAIContent}
                disabled={isGenerating || !episodeData.transcript}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : generatedContent ? (
                  <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate AI Content
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate AI Content
                  </>
                )}
              </Button>
                  <Button
                onClick={saveNow} 
                disabled={saveState.status === 'saving' || !saveState.hasUnsavedChanges}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Now
                  </Button>
                </div>
              </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="transcript"
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Transcript</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Summary</span>
            </TabsTrigger>
            <TabsTrigger
              value="chapters"
              className="flex items-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>Chapters</span>
            </TabsTrigger>
            <TabsTrigger
              value="keywords"
              className="flex items-center space-x-2"
            >
              <Hash className="w-4 h-4" />
              <span>Keywords</span>
            </TabsTrigger>
            <TabsTrigger
              value="export"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </TabsTrigger>
              </TabsList>

            <TabsContent value="transcript" className="space-y-4">
              <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                  <CardTitle>Transcript</CardTitle>
                    <CardDescription>
                       Edit the automatically generated transcript with speaker identification. Changes are
                        saved automatically.
                    </CardDescription>
                    </div>
                   <div className="flex gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleCopy(episodeData.transcript)}
                     >
                       <Copy className="w-4 h-4 mr-2" />
                       Copy
                     </Button>
                   </div>
                </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Speaker Names Editor */}
                    <div className="p-4 bg-muted rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Speaker Names</h4>
                        <div className="text-xs text-muted-foreground">
                          Edit names to replace throughout transcript
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Speaker 1</label>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <input
                              type="text"
                              value={speakerNames.speaker1}
                              onChange={(e) => setSpeakerNames(prev => ({ ...prev, speaker1: e.target.value }))}
                              onBlur={() => updateSpeakerNames(speakerNames.speaker1, speakerNames.speaker2)}
                              className="flex-1 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Enter speaker name"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Speaker 2</label>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <input
                              type="text"
                              value={speakerNames.speaker2}
                              onChange={(e) => setSpeakerNames(prev => ({ ...prev, speaker2: e.target.value }))}
                              onBlur={() => updateSpeakerNames(speakerNames.speaker1, speakerNames.speaker2)}
                              className="flex-1 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Enter speaker name"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Textarea
                      value={replaceSpeakerNames(episodeData.transcript, speakerNames.speaker1, speakerNames.speaker2)}
                      onChange={(e) => {
                        // Convert custom names back to Speaker 1/2 for storage
                        const revertedTranscript = e.target.value
                          .replace(new RegExp(`${speakerNames.speaker1}:`, 'g'), 'Speaker 1:')
                          .replace(new RegExp(`${speakerNames.speaker2}:`, 'g'), 'Speaker 2:');
                        updateContent("transcript", revertedTranscript);
                      }}
                      className="min-h-[500px] font-mono text-sm leading-relaxed"
                      placeholder="Transcript will appear here with speaker identification..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                  <CardTitle>Episode Summary</CardTitle>
                  <CardDescription>
                      AI-generated summary of your episode content. Edit as
                      needed.
                  </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(episodeData.summary)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={episodeData.summary}
                  onChange={(e) => updateContent("summary", e.target.value)}
                  className="min-h-[300px] leading-relaxed"
                    placeholder="Episode summary will appear here..."
                  />
                </CardContent>
              </Card>
            </TabsContent>

          <TabsContent value="chapters" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Chapters</CardTitle>
                    <CardDescription>
                      Automatically generated chapter markers with timestamps
                      and summaries.
                    </CardDescription>
                  </div>
                  <Button onClick={addChapter}>
                    <Clock className="w-4 h-4 mr-2" />
                    Add Chapter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {episodeData.chapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Chapter {index + 1}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {chapter.startTime} - {chapter.endTime}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteChapter(chapter.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Chapter title"
                        value={chapter.title}
                        onChange={(e) =>
                          updateChapter(chapter.id, "title", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Start time (00:00)"
                        value={chapter.startTime}
                        onChange={(e) =>
                          updateChapter(chapter.id, "startTime", e.target.value)
                        }
                      />
                      <Input
                        placeholder="End time (00:00)"
                        value={chapter.endTime}
                        onChange={(e) =>
                          updateChapter(chapter.id, "endTime", e.target.value)
                        }
                      />
                    </div>

                    <Textarea
                      placeholder="Chapter summary"
                      value={chapter.summary}
                      onChange={(e) =>
                        updateChapter(chapter.id, "summary", e.target.value)
                      }
                      className="min-h-[80px]"
                    />
                  </div>
                ))}

                {episodeData.chapters.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      No chapters yet. Click "Add Chapter" to create
                      your first chapter marker.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Keywords & Tags</CardTitle>
                  <CardDescription>
                      AI-extracted keywords and topics from your content. Add or
                      remove as needed.
                  </CardDescription>
                  </div>
                  <Button onClick={addKeyword}>
                    <Hash className="w-4 h-4 mr-2" />
                    Add Keyword
                  </Button>
                </div>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {episodeData.keywords.map((keyword, index) => (
                      <div key={index} className="flex items-center space-x-1">
                        <Input
                          value={keyword}
                          onChange={(e) => updateKeyword(index, e.target.value)}
                          className="w-auto min-w-[120px]"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteKeyword(index)}
                          className="text-red-600 hover:text-red-700 px-2"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>

                  {episodeData.keywords.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>
                        No keywords yet. Click "Add Keyword" to start
                        tagging your content.
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Keyword Preview</h4>
                  <div className="flex flex-wrap gap-2">
                    {episodeData.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                    </div>
                  </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          <TabsContent value="export" className="space-y-4">
            {episodeData.transcript ? (
              <ExportManager episode={{
                title: episodeData.title,
                transcript: episodeData.transcript,
                summary: episodeData.summary || 'No summary available',
                chapters: episodeData.chapters.length > 0 
                  ? episodeData.chapters.map(ch => `${ch.startTime} - ${ch.title}: ${ch.summary}`).join('\n')
                  : 'No chapters available',
                keywords: episodeData.keywords.length > 0 
                  ? episodeData.keywords.join(', ')
                  : 'No keywords available'
              }} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Export Content</CardTitle>
                  <CardDescription>
                    Upload and transcribe audio first to enable export functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    No transcript available for export yet.
                  </p>
                  <Button 
                    onClick={generateAIContent}
                    disabled={isGenerating || !episodeData.transcript}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating Content...
                      </>
                    ) : (
                      <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                        Generate AI Content
                      </>
                    )}
                        </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

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
                      {quote.speaker && (
                        <cite className="text-sm text-muted-foreground">
                          — {quote.speaker}
                        </cite>
                      )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                        onClick={() => handleCopy(`"${quote.text}"${quote.speaker ? ` - ${quote.speaker}` : ''}`)}
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

          </Tabs>
      </div>
    </div>
  );
};

export default ContentEditor;