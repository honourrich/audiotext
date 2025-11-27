import { supabase } from './supabase';
import { Database } from '@/types/supabase';

type Episode = Database['public']['Tables']['episodes']['Row'];
type EpisodeInsert = Database['public']['Tables']['episodes']['Insert'];
type EpisodeUpdate = Database['public']['Tables']['episodes']['Update'];

export interface EpisodeData {
  id?: string;
  title: string;
  duration: string;
  transcript: string;
  summary: string;
  chapters: any[];
  keywords: string[];
  quotes?: any[];
  hasAIContent?: boolean;
  aiGeneratedAt?: string;
  audioUrl?: string;
  youtubeUrl?: string;
  fileSize?: number;
  processingStatus?: string;
  processingProgress?: number;
  processingError?: string;
  wordCount?: number;
  processingTime?: number;
  apiCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

export class EpisodeService {
  // Get all episodes for a user
  static async getEpisodes(userId: string): Promise<EpisodeData[]> {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(episode => this.mapEpisodeToLocalFormat(episode));
    } catch (error) {
      console.error('Error fetching episodes:', error);
      throw error;
    }
  }

  // Get a single episode by ID
  static async getEpisode(episodeId: string): Promise<EpisodeData | null> {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', episodeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Episode not found
        }
        throw error;
      }

      return this.mapEpisodeToLocalFormat(data);
    } catch (error) {
      console.error('Error fetching episode:', error);
      throw error;
    }
  }

  // Create a new episode
  static async createEpisode(userId: string, episodeData: Partial<EpisodeData>): Promise<EpisodeData> {
    try {
      const episodeInsert: EpisodeInsert = {
        user_id: userId,
        title: episodeData.title || 'Untitled Episode',
        audio_url: episodeData.audioUrl,
        youtube_url: episodeData.youtubeUrl,
        file_size: episodeData.fileSize,
        duration: this.parseDurationToSeconds(episodeData.duration || '00:00'),
        transcript: episodeData.transcript || '',
        summary_short: episodeData.summary || '',
        summary_long: episodeData.summary || '',
        chapters: episodeData.chapters || [],
        keywords: episodeData.keywords || [],
        quotes: [],
        processing_status: episodeData.processingStatus || 'pending',
        processing_progress: episodeData.processingProgress || 0,
        processing_error: episodeData.processingError,
        word_count: episodeData.wordCount || 0,
        processing_time: episodeData.processingTime || 0,
        api_cost: episodeData.apiCost || 0
      };

      const { data, error } = await supabase
        .from('episodes')
        .insert(episodeInsert)
        .select()
        .single();

      if (error) throw error;

      return this.mapEpisodeToLocalFormat(data);
    } catch (error) {
      console.error('Error creating episode:', error);
      throw error;
    }
  }

  // Update an existing episode
  static async updateEpisode(episodeId: string, updates: Partial<EpisodeData>): Promise<EpisodeData> {
    try {
      const episodeUpdate: EpisodeUpdate = {
        title: updates.title,
        audio_url: updates.audioUrl,
        youtube_url: updates.youtubeUrl,
        file_size: updates.fileSize,
        duration: updates.duration ? this.parseDurationToSeconds(updates.duration) : undefined,
        transcript: updates.transcript,
        summary_short: updates.summary,
        summary_long: updates.summary,
        chapters: updates.chapters,
        keywords: updates.keywords,
        quotes: updates.quotes,
        processing_status: updates.processingStatus,
        processing_progress: updates.processingProgress,
        processing_error: updates.processingError,
        word_count: updates.wordCount,
        processing_time: updates.processingTime,
        api_cost: updates.apiCost,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(episodeUpdate).forEach(key => {
        if (episodeUpdate[key as keyof EpisodeUpdate] === undefined) {
          delete episodeUpdate[key as keyof EpisodeUpdate];
        }
      });

      const { data, error } = await supabase
        .from('episodes')
        .update(episodeUpdate)
        .eq('id', episodeId)
        .select()
        .single();

      if (error) throw error;

      return this.mapEpisodeToLocalFormat(data);
    } catch (error) {
      console.error('Error updating episode:', error);
      throw error;
    }
  }

  // Delete an episode
  static async deleteEpisode(episodeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', episodeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting episode:', error);
      throw error;
    }
  }

  // Delete multiple episodes
  static async deleteEpisodes(episodeIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('episodes')
        .delete()
        .in('id', episodeIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting episodes:', error);
      throw error;
    }
  }

  // Helper function to map Supabase episode to local format
  private static mapEpisodeToLocalFormat(episode: Episode): EpisodeData {
    const chapters = Array.isArray(episode.chapters) ? episode.chapters : [];
    const keywords = Array.isArray(episode.keywords)
      ? episode.keywords.map(keyword => (typeof keyword === 'string' ? keyword : JSON.stringify(keyword)))
      : [];
    const quotes = Array.isArray(episode.quotes) ? episode.quotes : [];

    return {
      id: episode.id,
      title: episode.title,
      duration: this.formatDuration(episode.duration || 0),
      transcript: episode.transcript || '',
      summary: episode.summary_short || episode.summary_long || '',
      chapters,
      keywords,
      quotes,
      hasAIContent: !!(episode.summary_short || chapters.length || keywords.length),
      aiGeneratedAt: episode.updated_at,
      audioUrl: episode.audio_url || undefined,
      youtubeUrl: episode.youtube_url || undefined,
      fileSize: episode.file_size || undefined,
      processingStatus: episode.processing_status || 'pending',
      processingProgress: episode.processing_progress || 0,
      processingError: episode.processing_error || undefined,
      wordCount: episode.word_count || 0,
      processingTime: episode.processing_time || 0,
      apiCost: episode.api_cost || 0,
      createdAt: episode.created_at,
      updatedAt: episode.updated_at
    };
  }

  // Helper function to parse duration string to seconds
  private static parseDurationToSeconds(duration: string): number {
    if (!duration || duration === '00:00') return 0;
    
    const parts = duration.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      return minutes * 60 + seconds;
    }
    return 0;
  }

  // Helper function to format seconds to duration string
  private static formatDuration(seconds: number): string {
    if (!seconds) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Migrate data from localStorage to Supabase
  static async migrateFromLocalStorage(userId: string): Promise<void> {
    try {
      const storedEpisodes = localStorage.getItem('episodes');
      if (!storedEpisodes) return;

      const episodes = JSON.parse(storedEpisodes);
      
      for (const episode of episodes) {
        // Check if episode already exists in Supabase
        const existingEpisode = await this.getEpisode(episode.id);
        if (existingEpisode) continue;

        // Create episode in Supabase
        await this.createEpisode(userId, {
          id: episode.id,
          title: episode.title,
          duration: episode.duration,
          transcript: episode.transcript,
          summary: episode.summary,
          chapters: episode.chapters,
          keywords: episode.keywords,
          hasAIContent: episode.hasAIContent,
          aiGeneratedAt: episode.aiGeneratedAt,
          audioUrl: episode.audioUrl,
          youtubeUrl: episode.youtubeUrl,
          fileSize: episode.fileSize,
          processingStatus: episode.processingStatus || 'completed',
          processingProgress: episode.processingProgress || 100,
          wordCount: episode.transcript?.length || 0,
          createdAt: episode.createdAt,
          updatedAt: episode.updatedAt
        });
      }

      console.log(`Migrated ${episodes.length} episodes to Supabase`);
    } catch (error) {
      console.error('Error migrating episodes:', error);
      throw error;
    }
  }
}
