import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractYouTubeCaptions, estimateDurationFromCaptions } from '../supabase/functions/caption-service/index';

// Mock the youtube-caption-extractor module
vi.mock('youtube-caption-extractor', () => ({
  getSubtitles: vi.fn()
}));

describe('YouTube Caption Service', () => {
  let mockGetSubtitles: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mocked function
    const { getSubtitles } = await import('youtube-caption-extractor');
    mockGetSubtitles = getSubtitles as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractYouTubeCaptions', () => {
    it('should extract captions successfully', async () => {
      const mockCaptions = [
        {
          text: 'Hello, welcome to this video.',
          start: 0,
          duration: 3.5
        },
        {
          text: 'Today we will discuss important topics.',
          start: 3.5,
          duration: 4.2
        },
        {
          text: 'Thank you for watching.',
          start: 7.7,
          duration: 2.8
        }
      ];

      mockGetSubtitles.mockResolvedValueOnce(mockCaptions);

      const result = await extractYouTubeCaptions({
        videoId: 'dQw4w9WgXcQ',
        lang: 'en'
      });

      expect(result.success).toBe(true);
      expect(result.captions).toEqual([
        {
          text: 'Hello, welcome to this video.',
          offset: 0,
          duration: 3.5
        },
        {
          text: 'Today we will discuss important topics.',
          offset: 3500,
          duration: 4.2
        },
        {
          text: 'Thank you for watching.',
          offset: 7700,
          duration: 2.8
        }
      ]);
      expect(mockGetSubtitles).toHaveBeenCalledWith({
        videoID: 'dQw4w9WgXcQ',
        lang: 'en'
      });
    });

    it('should handle videos without captions', async () => {
      mockGetSubtitles.mockResolvedValueOnce([]);

      const result = await extractYouTubeCaptions({
        videoId: 'noCaptions123',
        lang: 'en'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No captions available for this video');
      expect(result.captions).toEqual([]);
    });

    it('should handle caption extraction errors', async () => {
      mockGetSubtitles.mockRejectedValueOnce(new Error('Video not found'));

      const result = await extractYouTubeCaptions({
        videoId: 'invalid123',
        lang: 'en'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to extract captions: Video not found');
      expect(result.captions).toEqual([]);
    });

    it('should fallback to auto-detect when specified language fails', async () => {
      // First call fails for 'en'
      mockGetSubtitles.mockRejectedValueOnce(new Error('Language not available'));
      
      // Second call succeeds with auto-detect
      const mockCaptions = [
        {
          text: 'Auto-detected captions',
          start: 0,
          duration: 3.0
        }
      ];
      mockGetSubtitles.mockResolvedValueOnce(mockCaptions);

      const result = await extractYouTubeCaptions({
        videoId: 'fallback123',
        lang: 'en'
      });

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(1);
      expect(result.captions[0].text).toBe('Auto-detected captions');
      expect(mockGetSubtitles).toHaveBeenCalledTimes(2);
      expect(mockGetSubtitles).toHaveBeenNthCalledWith(1, {
        videoID: 'fallback123',
        lang: 'en'
      });
      expect(mockGetSubtitles).toHaveBeenNthCalledWith(2, {
        videoID: 'fallback123',
        lang: 'auto'
      });
    });

    it('should handle auto-detect language', async () => {
      const mockCaptions = [
        {
          text: 'Auto-detected content',
          start: 0,
          duration: 2.5
        }
      ];

      mockGetSubtitles.mockResolvedValueOnce(mockCaptions);

      const result = await extractYouTubeCaptions({
        videoId: 'auto123',
        lang: 'auto'
      });

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(1);
      expect(mockGetSubtitles).toHaveBeenCalledWith({
        videoID: 'auto123',
        lang: 'auto'
      });
    });

    it('should handle malformed caption data', async () => {
      const malformedCaptions = [
        {
          text: 'Valid caption',
          start: 0,
          duration: 3.0
        },
        {
          // Missing text field
          start: 3.0,
          duration: 2.0
        },
        {
          text: 'Another valid caption',
          start: 5.0,
          duration: 2.5
        }
      ];

      mockGetSubtitles.mockResolvedValueOnce(malformedCaptions);

      const result = await extractYouTubeCaptions({
        videoId: 'malformed123',
        lang: 'en'
      });

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(2); // Only valid captions
      expect(result.captions[0].text).toBe('Valid caption');
      expect(result.captions[1].text).toBe('Another valid caption');
    });

    it('should handle very long captions', async () => {
      const longCaptions = Array.from({ length: 1000 }, (_, i) => ({
        text: `Caption ${i}`,
        start: i * 3,
        duration: 3.0
      }));

      mockGetSubtitles.mockResolvedValueOnce(longCaptions);

      const result = await extractYouTubeCaptions({
        videoId: 'long123',
        lang: 'en'
      });

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(1000);
      expect(result.captions[0].text).toBe('Caption 0');
      expect(result.captions[999].text).toBe('Caption 999');
    });

    it('should handle captions with special characters', async () => {
      const specialCaptions = [
        {
          text: 'Hello! How are you? 🎉',
          start: 0,
          duration: 3.0
        },
        {
          text: 'Special chars: @#$%^&*()',
          start: 3.0,
          duration: 2.5
        },
        {
          text: 'Unicode: ñáéíóú',
          start: 5.5,
          duration: 2.0
        }
      ];

      mockGetSubtitles.mockResolvedValueOnce(specialCaptions);

      const result = await extractYouTubeCaptions({
        videoId: 'special123',
        lang: 'en'
      });

      expect(result.success).toBe(true);
      expect(result.captions).toHaveLength(3);
      expect(result.captions[0].text).toBe('Hello! How are you? 🎉');
      expect(result.captions[1].text).toBe('Special chars: @#$%^&*()');
      expect(result.captions[2].text).toBe('Unicode: ñáéíóú');
    });
  });

  describe('estimateDurationFromCaptions', () => {
    it('should estimate duration from captions', () => {
      const captions = [
        {
          text: 'First caption',
          offset: 0,
          duration: 3.0
        },
        {
          text: 'Second caption',
          offset: 3000,
          duration: 4.0
        },
        {
          text: 'Last caption',
          offset: 7000,
          duration: 2.5
        }
      ];

      const duration = estimateDurationFromCaptions(captions);

      // Duration should be last offset + last duration + buffer
      expect(duration).toBe(Math.ceil((7000 + 2500 + 5000) / 1000)); // 14.5 seconds rounded up = 15
    });

    it('should handle empty captions array', () => {
      const duration = estimateDurationFromCaptions([]);
      expect(duration).toBe(0);
    });

    it('should handle single caption', () => {
      const captions = [
        {
          text: 'Only caption',
          offset: 5000,
          duration: 3.0
        }
      ];

      const duration = estimateDurationFromCaptions(captions);
      expect(duration).toBe(Math.ceil((5000 + 3000 + 5000) / 1000)); // 13 seconds
    });

    it('should handle captions with zero duration', () => {
      const captions = [
        {
          text: 'Zero duration',
          offset: 0,
          duration: 0
        },
        {
          text: 'Normal duration',
          offset: 1000,
          duration: 3.0
        }
      ];

      const duration = estimateDurationFromCaptions(captions);
      expect(duration).toBe(Math.ceil((1000 + 3000 + 5000) / 1000)); // 9 seconds
    });

    it('should handle very short estimated duration', () => {
      const captions = [
        {
          text: 'Very short',
          offset: 0,
          duration: 0.1
        }
      ];

      const duration = estimateDurationFromCaptions(captions);
      
      // Should use fallback buffer if estimate is too short
      expect(duration).toBeGreaterThan(5); // At least 5 seconds buffer
    });

    it('should handle captions with large gaps', () => {
      const captions = [
        {
          text: 'First caption',
          offset: 0,
          duration: 3.0
        },
        {
          text: 'Last caption',
          offset: 60000, // 1 minute gap
          duration: 3.0
        }
      ];

      const duration = estimateDurationFromCaptions(captions);
      
      // Should use the last caption's end time
      expect(duration).toBe(Math.ceil((60000 + 3000 + 5000) / 1000)); // 68 seconds
    });

    it('should handle captions out of order', () => {
      const captions = [
        {
          text: 'Later caption',
          offset: 10000,
          duration: 3.0
        },
        {
          text: 'Earlier caption',
          offset: 0,
          duration: 3.0
        }
      ];

      const duration = estimateDurationFromCaptions(captions);
      
      // Should still use the latest offset
      expect(duration).toBe(Math.ceil((10000 + 3000 + 5000) / 1000)); // 18 seconds
    });
  });
});
