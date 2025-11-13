import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleYouTubeUnified } from '../supabase/functions/youtube-unified/index';

// Mock the dependencies
vi.mock('../supabase/functions/youtube-data-api/index', () => ({
  fetchYouTubeVideoMetadataAuto: vi.fn()
}));

vi.mock('../supabase/functions/caption-service/index', () => ({
  extractYouTubeCaptions: vi.fn(),
  estimateDurationFromCaptions: vi.fn()
}));

describe('YouTube Unified Service Integration', () => {
  let mockFetchMetadata: any;
  let mockExtractCaptions: any;
  let mockEstimateDuration: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get mocked functions
    const { fetchYouTubeVideoMetadataAuto } = await import('../supabase/functions/youtube-data-api/index');
    const { extractYouTubeCaptions, estimateDurationFromCaptions } = await import('../supabase/functions/caption-service/index');
    
    mockFetchMetadata = fetchYouTubeVideoMetadataAuto as any;
    mockExtractCaptions = extractYouTubeCaptions as any;
    mockEstimateDuration = estimateDurationFromCaptions as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleYouTubeUnified', () => {
    const mockRequest = {
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      lang: 'en',
      userId: 'test-user-123'
    };

    it('should process video successfully with both metadata and captions', async () => {
      // Mock successful metadata fetch
      mockFetchMetadata.mockResolvedValueOnce({
        success: true,
        metadata: {
          videoId: 'dQw4w9WgXcQ',
          title: 'Rick Astley - Never Gonna Give You Up',
          description: 'The official video',
          duration: 253,
          publishedAt: '2009-10-25T06:57:33Z',
          channelTitle: 'Rick Astley',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        }
      });

      // Mock successful caption extraction
      const mockCaptions = [
        { text: 'We\'re no strangers to love', offset: 0, duration: 3.5 },
        { text: 'You know the rules and so do I', offset: 3500, duration: 3.2 }
      ];
      
      mockExtractCaptions.mockResolvedValueOnce({
        success: true,
        captions: mockCaptions
      });

      const result = await handleYouTubeUnified(mockRequest);

      expect(result.success).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.metadata?.title).toBe('Rick Astley - Never Gonna Give You Up');
      expect(result.metadata?.duration).toBe(253);
      expect(result.captions).toEqual(mockCaptions);
      expect(result.transcript).toBe('We\'re no strangers to love You know the rules and so do I');
      expect(result.hasEstimatedDuration).toBe(false);
      expect(result.warning).toBeUndefined();
    });

    it('should handle metadata failure but continue with captions', async () => {
      // Mock metadata failure
      mockFetchMetadata.mockResolvedValueOnce({
        success: false,
        error: 'YouTube API quota exceeded'
      });

      // Mock successful caption extraction
      const mockCaptions = [
        { text: 'Caption text', offset: 0, duration: 3.0 },
        { text: 'More caption text', offset: 3000, duration: 2.5 }
      ];
      
      mockExtractCaptions.mockResolvedValueOnce({
        success: true,
        captions: mockCaptions
      });

      // Mock duration estimation
      mockEstimateDuration.mockReturnValueOnce(8); // 8 seconds estimated

      const result = await handleYouTubeUnified(mockRequest);

      expect(result.success).toBe(true);
      expect(result.metadata?.title).toBe('YouTube Video dQw4w9WgXcQ');
      expect(result.metadata?.duration).toBe(8); // Estimated duration
      expect(result.captions).toEqual(mockCaptions);
      expect(result.hasEstimatedDuration).toBe(true);
      expect(result.warning).toBe('YouTube API quota exceeded. Duration may be estimated from captions.');
    });

    it('should handle caption failure but continue with metadata', async () => {
      // Mock successful metadata fetch
      mockFetchMetadata.mockResolvedValueOnce({
        success: true,
        metadata: {
          videoId: 'dQw4w9WgXcQ',
          title: 'Test Video',
          description: 'Test Description',
          duration: 120,
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        }
      });

      // Mock caption failure
      mockExtractCaptions.mockResolvedValueOnce({
        success: false,
        error: 'No captions available for this video',
        captions: []
      });

      const result = await handleYouTubeUnified(mockRequest);

      expect(result.success).toBe(true);
      expect(result.metadata?.title).toBe('Test Video');
      expect(result.metadata?.duration).toBe(120);
      expect(result.captions).toBeUndefined();
      expect(result.transcript).toBeUndefined();
      expect(result.hasEstimatedDuration).toBe(false);
    });

    it('should handle both metadata and caption failures', async () => {
      // Mock both failures
      mockFetchMetadata.mockResolvedValueOnce({
        success: false,
        error: 'Video not found'
      });

      mockExtractCaptions.mockResolvedValueOnce({
        success: false,
        error: 'No captions available',
        captions: []
      });

      const result = await handleYouTubeUnified(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to process video: Video not found');
    });

    it('should handle invalid YouTube URL', async () => {
      const invalidRequest = {
        ...mockRequest,
        youtubeUrl: 'https://example.com/not-youtube'
      };

      const result = await handleYouTubeUnified(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid YouTube URL');
    });

    it('should handle missing YouTube URL', async () => {
      const invalidRequest = {
        ...mockRequest,
        youtubeUrl: ''
      };

      const result = await handleYouTubeUnified(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('YouTube URL is required');
    });

    it('should handle timeout error in metadata fetch', async () => {
      // Mock metadata timeout
      mockFetchMetadata.mockResolvedValueOnce({
        success: false,
        error: 'Request timeout - YouTube API did not respond in time'
      });

      // Mock successful caption extraction
      const mockCaptions = [
        { text: 'Timeout caption', offset: 0, duration: 3.0 }
      ];
      
      mockExtractCaptions.mockResolvedValueOnce({
        success: true,
        captions: mockCaptions
      });

      mockEstimateDuration.mockReturnValueOnce(5);

      const result = await handleYouTubeUnified(mockRequest);

      expect(result.success).toBe(true);
      expect(result.warning).toBe('YouTube API timeout. Duration may be estimated from captions.');
      expect(result.hasEstimatedDuration).toBe(true);
    });

    it('should handle network error in metadata fetch', async () => {
      // Mock metadata network error
      mockFetchMetadata.mockResolvedValueOnce({
        success: false,
        error: 'Network error - Unable to reach YouTube API'
      });

      // Mock successful caption extraction
      const mockCaptions = [
        { text: 'Network error caption', offset: 0, duration: 3.0 }
      ];
      
      mockExtractCaptions.mockResolvedValueOnce({
        success: true,
        captions: mockCaptions
      });

      mockEstimateDuration.mockReturnValueOnce(5);

      const result = await handleYouTubeUnified(mockRequest);

      expect(result.success).toBe(true);
      expect(result.warning).toBe('Network error. Duration may be estimated from captions.');
      expect(result.hasEstimatedDuration).toBe(true);
    });

    it('should handle videos with no captions but successful metadata', async () => {
      // Mock successful metadata fetch
      mockFetchMetadata.mockResolvedValueOnce({
        success: true,
        metadata: {
          videoId: 'dQw4w9WgXcQ',
          title: 'Video Without Captions',
          description: 'This video has no captions',
          duration: 180,
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        }
      });

      // Mock caption failure
      mockExtractCaptions.mockResolvedValueOnce({
        success: false,
        error: 'No captions available for this video',
        captions: []
      });

      const result = await handleYouTubeUnified(mockRequest);

      expect(result.success).toBe(true);
      expect(result.metadata?.title).toBe('Video Without Captions');
      expect(result.metadata?.duration).toBe(180);
      expect(result.captions).toBeUndefined();
      expect(result.transcript).toBeUndefined();
      expect(result.hasEstimatedDuration).toBe(false);
    });

    it('should handle very long videos', async () => {
      // Mock successful metadata for long video
      mockFetchMetadata.mockResolvedValueOnce({
        success: true,
        metadata: {
          videoId: 'dQw4w9WgXcQ',
          title: 'Very Long Video',
          description: 'This is a very long video',
          duration: 7200, // 2 hours
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        }
      });

      // Mock many captions
      const mockCaptions = Array.from({ length: 100 }, (_, i) => ({
        text: `Caption ${i}`,
        offset: i * 3000,
        duration: 3.0
      }));
      
      mockExtractCaptions.mockResolvedValueOnce({
        success: true,
        captions: mockCaptions
      });

      const result = await handleYouTubeUnified(mockRequest);

      expect(result.success).toBe(true);
      expect(result.metadata?.duration).toBe(7200);
      expect(result.captions).toHaveLength(100);
      expect(result.transcript).toContain('Caption 0');
      expect(result.transcript).toContain('Caption 99');
    });

    it('should handle videos with estimated duration', async () => {
      // Mock metadata failure
      mockFetchMetadata.mockResolvedValueOnce({
        success: false,
        error: 'API key invalid'
      });

      // Mock successful caption extraction
      const mockCaptions = [
        { text: 'First caption', offset: 0, duration: 3.0 },
        { text: 'Last caption', offset: 30000, duration: 3.0 }
      ];
      
      mockExtractCaptions.mockResolvedValueOnce({
        success: true,
        captions: mockCaptions
      });

      // Mock duration estimation
      mockEstimateDuration.mockReturnValueOnce(35); // 35 seconds estimated

      const result = await handleYouTubeUnified(mockRequest);

      expect(result.success).toBe(true);
      expect(result.metadata?.duration).toBe(35);
      expect(result.hasEstimatedDuration).toBe(true);
      expect(result.warning).toBe('Video metadata unavailable. Duration may be estimated from captions.');
    });

    it('should include processing time in response', async () => {
      // Mock successful responses
      mockFetchMetadata.mockResolvedValueOnce({
        success: true,
        metadata: {
          videoId: 'dQw4w9WgXcQ',
          title: 'Test Video',
          description: 'Test Description',
          duration: 120,
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        }
      });

      mockExtractCaptions.mockResolvedValueOnce({
        success: true,
        captions: [
          { text: 'Test caption', offset: 0, duration: 3.0 }
        ]
      });

      const result = await handleYouTubeUnified(mockRequest);

      expect(result.success).toBe(true);
      expect(result.processingTime).toBeDefined();
      expect(typeof result.processingTime).toBe('number');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle different YouTube URL formats', async () => {
      const urlFormats = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ'
      ];

      for (const url of urlFormats) {
        // Mock successful responses
        mockFetchMetadata.mockResolvedValueOnce({
          success: true,
          metadata: {
            videoId: 'dQw4w9WgXcQ',
            title: 'Test Video',
            description: 'Test Description',
            duration: 120,
            publishedAt: '2023-01-01T00:00:00Z',
            channelTitle: 'Test Channel',
            thumbnailUrl: 'https://example.com/thumb.jpg'
          }
        });

        mockExtractCaptions.mockResolvedValueOnce({
          success: true,
          captions: [
            { text: 'Test caption', offset: 0, duration: 3.0 }
          ]
        });

        const result = await handleYouTubeUnified({
          ...mockRequest,
          youtubeUrl: url
        });

        expect(result.success).toBe(true);
        expect(result.videoId).toBe('dQw4w9WgXcQ');
      }
    });
  });
});
