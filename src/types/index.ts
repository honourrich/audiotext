// Core episode types
export interface Episode {
  id: string;
  userId: string;
  title: string;
  transcript: string;
  summaryShort?: string;
  summaryLong?: string;
  chapters?: Chapter[];
  keywords?: string[];
  quotes?: Quote[];
  generatedContent?: GeneratedContent | null;
  sourceType: 'audio' | 'youtube';
  audioFilePath?: string;
  youtubeUrl?: string;
  fileSize?: number;
  duration?: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingProgress?: number;
  processingError?: string;
  createdAt: string;
  updatedAt: string;
}

// YouTube-specific episode type
export interface YouTubeEpisode {
  id: string;
  userId: string;
  youtubeUrl: string;
  videoTitle: string;
  transcript: string;
  generatedContent: GeneratedContent;
  sourceType: 'youtube';
  createdAt: string;
  updatedAt: string;
}

// YouTube caption extraction types
export interface YouTubeValidationResult {
  valid: boolean;
  hasCaption: boolean;
  videoTitle?: string;
  wordCount?: number;
  message: string;
  error?: string;
}

export interface YouTubeImportOptions {
  youtubeUrl: string;
  userId: string;
}

export interface CaptionSegment {
  text: string;
  duration: number;
  offset: number;
}

export interface YouTubeCaptionResponse {
  success: boolean;
  episodeId?: string;
  transcript?: string;
  generatedContent?: GeneratedContent;
  videoTitle?: string;
  message?: string;
  error?: string;
  videoDuration?: number;
  videoDescription?: string;
  warning?: string;
  hasEstimatedDuration?: boolean;
}

// Generated content structure
export interface GeneratedContent {
  title: string;
  summary: string;
  takeaways: string[];
  topics: string[];
  cta: string;
}

// Chapter structure
export interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
  summary?: string;
}

// Quote structure
export interface Quote {
  text: string;
  timestamp: number;
  speaker?: string;
}

// Processing step for UI
export interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}


// API response types
export interface YouTubeProcessResponse {
  success: boolean;
  episodeId?: string;
  generatedContent?: GeneratedContent;
  transcript?: string;
  videoTitle?: string;
  videoDuration?: number;
  message?: string;
  error?: string;
  videoDescription?: string;
  warning?: string;
  hasEstimatedDuration?: boolean;
}

// User preferences
export interface UserPreferences {
  aiModel: 'gpt-4' | 'gpt-3.5-turbo';
  language: string;
  style: 'professional' | 'casual' | 'technical';
  maxSummaryLength: number;
}

// Social media post
export interface SocialMediaPost {
  id: string;
  episodeId: string;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook';
  content: string;
  scheduledAt?: string;
  publishedAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt: string;
}

// Analytics data
export interface EpisodeAnalytics {
  episodeId: string;
  views: number;
  downloads: number;
  shares: number;
  engagement: number;
  createdAt: string;
  updatedAt: string;
}
