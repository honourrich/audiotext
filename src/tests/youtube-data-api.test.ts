import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchYouTubeVideoMetadata, parseYouTubeDuration } from '../supabase/functions/youtube-data-api/index';

// Mock fetch globally
global.fetch = vi.fn();

describe('YouTube Data API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseYouTubeDuration', () => {
    it('should parse PT4M13S correctly', () => {
      const result = parseYouTubeDuration('PT4M13S');
      expect(result).toBe(253); // 4*60 + 13 = 253 seconds
    });

    it('should parse PT1H30M45S correctly', () => {
      const result = parseYouTubeDuration('PT1H30M45S');
      expect(result).toBe(5445); // 1*3600 + 30*60 + 45 = 5445 seconds
    });

    it('should parse PT0S correctly', () => {
      const result = parseYouTubeDuration('PT0S');
      expect(result).toBe(0);
    });

    it('should handle missing seconds', () => {
      const result = parseYouTubeDuration('PT2M');
      expect(result).toBe(120); // 2*60 = 120 seconds
    });

    it('should handle missing minutes', () => {
      const result = parseYouTubeDuration('PT45S');
      expect(result).toBe(45);
    });

    it('should handle invalid format gracefully', () => {
      const result = parseYouTubeDuration('invalid');
      expect(result).toBe(0);
    });
  });

  describe('fetchYouTubeVideoMetadata', () => {
    const mockOptions = {
      videoId: 'dQw4w9WgXcQ',
      apiKey: 'test-api-key'
    };

    it('should fetch metadata successfully', async () => {
      const mockResponse = {
        items: [{
          snippet: {
            title: 'Rick Astley - Never Gonna Give You Up',
            description: 'The official video for Never Gonna Give You Up',
            publishedAt: '2009-10-25T06:57:33Z',
            channelTitle: 'Rick Astley',
            thumbnails: {
              high: { url: 'https://example.com/thumbnail.jpg' }
            }
          },
          contentDetails: {
            duration: 'PT4M13S'
          }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchYouTubeVideoMetadata(mockOptions);

      expect(result.success).toBe(true);
      expect(result.metadata).toEqual({
        videoId: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up',
        description: 'The official video for Never Gonna Give You Up',
        duration: 253,
        publishedAt: '2009-10-25T06:57:33Z',
        channelTitle: 'Rick Astley',
        thumbnailUrl: 'https://example.com/thumbnail.jpg'
      });
    });

    it('should handle 403 quota exceeded error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Quota exceeded')
      });

      const result = await fetchYouTubeVideoMetadata(mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('YouTube API quota exceeded or API key invalid');
    });

    it('should handle 404 video not found error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Video not found')
      });

      const result = await fetchYouTubeVideoMetadata(mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Video not found or private');
    });

    it('should retry on 429 rate limit error', async () => {
      // First request fails with 429
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded')
      });

      // Second request succeeds
      const mockResponse = {
        items: [{
          snippet: {
            title: 'Test Video',
            description: 'Test Description',
            publishedAt: '2023-01-01T00:00:00Z',
            channelTitle: 'Test Channel',
            thumbnails: { high: { url: 'https://example.com/thumb.jpg' } }
          },
          contentDetails: { duration: 'PT2M30S' }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Mock setTimeout to avoid actual delays in tests
      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return {} as any;
      });

      const result = await fetchYouTubeVideoMetadata(mockOptions);

      expect(result.success).toBe(true);
      expect(result.metadata?.title).toBe('Test Video');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on 500 server error', async () => {
      // First request fails with 500
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error')
      });

      // Second request succeeds
      const mockResponse = {
        items: [{
          snippet: {
            title: 'Test Video',
            description: 'Test Description',
            publishedAt: '2023-01-01T00:00:00Z',
            channelTitle: 'Test Channel',
            thumbnails: { high: { url: 'https://example.com/thumb.jpg' } }
          },
          contentDetails: { duration: 'PT2M30S' }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return {} as any;
      });

      const result = await fetchYouTubeVideoMetadata(mockOptions);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle timeout error', async () => {
      // Mock AbortController
      const mockAbortController = {
        abort: vi.fn(),
        signal: {}
      };
      
      global.AbortController = vi.fn(() => mockAbortController) as any;
      global.setTimeout = vi.fn((fn: any) => {
        // Simulate timeout by calling abort
        const error = new Error('Request timeout');
        error.name = 'AbortError';
        throw error;
      }) as any;

      (global.fetch as any).mockRejectedValueOnce(new Error('Request timeout'));

      const result = await fetchYouTubeVideoMetadata(mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout - YouTube API did not respond in time');
    });

    it('should handle network error', async () => {
      const networkError = new TypeError('Failed to fetch');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return {} as any;
      });

      const result = await fetchYouTubeVideoMetadata(mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error - Unable to reach YouTube API');
    });

    it('should handle empty response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] })
      });

      const result = await fetchYouTubeVideoMetadata(mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Video not found or private');
    });

    it('should handle missing duration', async () => {
      const mockResponse = {
        items: [{
          snippet: {
            title: 'Test Video',
            description: 'Test Description',
            publishedAt: '2023-01-01T00:00:00Z',
            channelTitle: 'Test Channel',
            thumbnails: { high: { url: 'https://example.com/thumb.jpg' } }
          },
          contentDetails: {
            duration: 'PT0S' // Zero duration
          }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchYouTubeVideoMetadata(mockOptions);

      expect(result.success).toBe(true);
      expect(result.metadata?.duration).toBe(0);
    });

    it('should handle missing thumbnail', async () => {
      const mockResponse = {
        items: [{
          snippet: {
            title: 'Test Video',
            description: 'Test Description',
            publishedAt: '2023-01-01T00:00:00Z',
            channelTitle: 'Test Channel',
            thumbnails: {
              default: { url: 'https://example.com/default.jpg' }
            }
          },
          contentDetails: { duration: 'PT2M30S' }
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetchYouTubeVideoMetadata(mockOptions);

      expect(result.success).toBe(true);
      expect(result.metadata?.thumbnailUrl).toBe('https://example.com/default.jpg');
    });

    it('should respect max retries limit', async () => {
      // All requests fail with 500
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error')
      });

      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return {} as any;
      });

      const result = await fetchYouTubeVideoMetadata(mockOptions, 0, 2); // Max 2 retries

      expect(result.success).toBe(false);
      expect(result.error).toBe('YouTube API error: 500 Internal Server Error');
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
