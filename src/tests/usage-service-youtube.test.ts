import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usageService } from '../src/lib/usageService';

// Mock Supabase
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      upsert: vi.fn(() => ({
        onConflict: vi.fn()
      }))
    }))
  }
}));

describe('Usage Service - YouTube Duration Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('canProcessYouTubeVideo', () => {
    it('should allow Pro users to process any video', async () => {
      // Mock Pro user usage
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValueOnce({
        maxMinutes: -1, // Unlimited
        maxGptPrompts: -1,
        currentMinutes: 100,
        currentGptPrompts: 50,
        planName: 'Pro'
      });

      const result = await usageService.canProcessYouTubeVideo('user-123', 3600); // 1 hour video

      expect(result.canProcess).toBe(true);
      expect(result.estimatedDuration).toBe('60 min');
      expect(result.reason).toBeUndefined();
    });

    it('should allow Free users to process videos within limit', async () => {
      // Mock Free user usage
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValueOnce({
        maxMinutes: 30,
        maxGptPrompts: 5,
        currentMinutes: 10, // 10 minutes used
        currentGptPrompts: 2,
        planName: 'Free'
      });

      const result = await usageService.canProcessYouTubeVideo('user-123', 900); // 15 minutes video

      expect(result.canProcess).toBe(true);
      expect(result.estimatedDuration).toBe('15 min');
      expect(result.reason).toBeUndefined();
    });

    it('should block Free users when video exceeds remaining limit', async () => {
      // Mock Free user usage
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValueOnce({
        maxMinutes: 30,
        maxGptPrompts: 5,
        currentMinutes: 25, // 25 minutes used, only 5 remaining
        currentGptPrompts: 2,
        planName: 'Free'
      });

      const result = await usageService.canProcessYouTubeVideo('user-123', 600); // 10 minutes video

      expect(result.canProcess).toBe(false);
      expect(result.estimatedDuration).toBe('10 min');
      expect(result.reason).toBe('This video is 10 minutes long, but you only have 5 minutes remaining this month. Upgrade to Pro for unlimited processing.');
    });

    it('should handle videos longer than total monthly limit', async () => {
      // Mock Free user usage
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValueOnce({
        maxMinutes: 30,
        maxGptPrompts: 5,
        currentMinutes: 5, // 5 minutes used
        currentGptPrompts: 2,
        planName: 'Free'
      });

      const result = await usageService.canProcessYouTubeVideo('user-123', 2400); // 40 minutes video

      expect(result.canProcess).toBe(false);
      expect(result.estimatedDuration).toBe('40 min');
      expect(result.reason).toBe('This video is 40 minutes long, but you only have 25 minutes remaining this month. Upgrade to Pro for unlimited processing.');
    });

    it('should handle edge case where video exactly matches remaining limit', async () => {
      // Mock Free user usage
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValueOnce({
        maxMinutes: 30,
        maxGptPrompts: 5,
        currentMinutes: 20, // 20 minutes used, exactly 10 remaining
        currentGptPrompts: 2,
        planName: 'Free'
      });

      const result = await usageService.canProcessYouTubeVideo('user-123', 600); // Exactly 10 minutes video

      expect(result.canProcess).toBe(true);
      expect(result.estimatedDuration).toBe('10 min');
      expect(result.reason).toBeUndefined();
    });

    it('should handle very short videos', async () => {
      // Mock Free user usage
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValueOnce({
        maxMinutes: 30,
        maxGptPrompts: 5,
        currentMinutes: 29, // 29 minutes used, 1 remaining
        currentGptPrompts: 2,
        planName: 'Free'
      });

      const result = await usageService.canProcessYouTubeVideo('user-123', 30); // 30 seconds video

      expect(result.canProcess).toBe(true);
      expect(result.estimatedDuration).toBe('1 min');
      expect(result.reason).toBeUndefined();
    });

    it('should handle videos with fractional minutes', async () => {
      // Mock Free user usage
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValueOnce({
        maxMinutes: 30,
        maxGptPrompts: 5,
        currentMinutes: 10,
        currentGptPrompts: 2,
        planName: 'Free'
      });

      const result = await usageService.canProcessYouTubeVideo('user-123', 90); // 1.5 minutes video

      expect(result.canProcess).toBe(true);
      expect(result.estimatedDuration).toBe('2 min'); // Rounded up
      expect(result.reason).toBeUndefined();
    });

    it('should handle error in getCurrentUsage gracefully', async () => {
      // Mock error in getCurrentUsage
      vi.spyOn(usageService, 'getCurrentUsage').mockRejectedValueOnce(new Error('Database error'));

      const result = await usageService.canProcessYouTubeVideo('user-123', 600);

      expect(result.canProcess).toBe(true); // Should allow processing on error
    });

    it('should format duration correctly for different lengths', async () => {
      // Mock Pro user usage
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValueOnce({
        maxMinutes: -1,
        maxGptPrompts: -1,
        currentMinutes: 0,
        currentGptPrompts: 0,
        planName: 'Pro'
      });

      // Test different durations
      const testCases = [
        { seconds: 30, expected: '1 min' },
        { seconds: 90, expected: '2 min' },
        { seconds: 3600, expected: '60 min' },
        { seconds: 3660, expected: '61 min' },
        { seconds: 7200, expected: '120 min' },
        { seconds: 7260, expected: '121 min' }
      ];

      for (const testCase of testCases) {
        const result = await usageService.canProcessYouTubeVideo('user-123', testCase.seconds);
        expect(result.estimatedDuration).toBe(testCase.expected);
      }
    });
  });

  describe('updateUsageAfterYouTubeVideo', () => {
    it('should update usage for successful video processing', async () => {
      // Mock updateUsage method
      const updateUsageSpy = vi.spyOn(usageService, 'updateUsage').mockResolvedValueOnce(true);

      const result = await usageService.updateUsageAfterYouTubeVideo('user-123', 600); // 10 minutes video

      expect(result).toBe(true);
      expect(updateUsageSpy).toHaveBeenCalledWith('user-123', { minutesUsed: 10 });
    });

    it('should handle fractional minutes by rounding up', async () => {
      const updateUsageSpy = vi.spyOn(usageService, 'updateUsage').mockResolvedValueOnce(true);

      const result = await usageService.updateUsageAfterYouTubeVideo('user-123', 90); // 1.5 minutes video

      expect(result).toBe(true);
      expect(updateUsageSpy).toHaveBeenCalledWith('user-123', { minutesUsed: 2 }); // Rounded up
    });

    it('should handle very short videos', async () => {
      const updateUsageSpy = vi.spyOn(usageService, 'updateUsage').mockResolvedValueOnce(true);

      const result = await usageService.updateUsageAfterYouTubeVideo('user-123', 30); // 30 seconds video

      expect(result).toBe(true);
      expect(updateUsageSpy).toHaveBeenCalledWith('user-123', { minutesUsed: 1 }); // Rounded up to 1 minute
    });

    it('should handle updateUsage errors gracefully', async () => {
      const updateUsageSpy = vi.spyOn(usageService, 'updateUsage').mockResolvedValueOnce(false);

      const result = await usageService.updateUsageAfterYouTubeVideo('user-123', 600);

      expect(result).toBe(false);
      expect(updateUsageSpy).toHaveBeenCalledWith('user-123', { minutesUsed: 10 });
    });

    it('should handle exceptions in updateUsage', async () => {
      const updateUsageSpy = vi.spyOn(usageService, 'updateUsage').mockRejectedValueOnce(new Error('Database error'));

      const result = await usageService.updateUsageAfterYouTubeVideo('user-123', 600);

      expect(result).toBe(false);
      expect(updateUsageSpy).toHaveBeenCalledWith('user-123', { minutesUsed: 10 });
    });

    it('should handle zero duration videos', async () => {
      const updateUsageSpy = vi.spyOn(usageService, 'updateUsage').mockResolvedValueOnce(true);

      const result = await usageService.updateUsageAfterYouTubeVideo('user-123', 0);

      expect(result).toBe(true);
      expect(updateUsageSpy).toHaveBeenCalledWith('user-123', { minutesUsed: 0 });
    });

    it('should handle very long videos', async () => {
      const updateUsageSpy = vi.spyOn(usageService, 'updateUsage').mockResolvedValueOnce(true);

      const result = await usageService.updateUsageAfterYouTubeVideo('user-123', 7200); // 2 hours video

      expect(result).toBe(true);
      expect(updateUsageSpy).toHaveBeenCalledWith('user-123', { minutesUsed: 120 });
    });
  });

  describe('Integration with existing usage methods', () => {
    it('should work with existing canPerformAction method', async () => {
      // Mock Free user usage
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValueOnce({
        maxMinutes: 30,
        maxGptPrompts: 5,
        currentMinutes: 10,
        currentGptPrompts: 2,
        planName: 'Free'
      });

      // Test existing method still works
      const audioResult = await usageService.canPerformAction('user-123', 'processAudio', 5);
      expect(audioResult.canPerform).toBe(true);

      // Test new YouTube method
      const youtubeResult = await usageService.canProcessYouTubeVideo('user-123', 300); // 5 minutes
      expect(youtubeResult.canProcess).toBe(true);
    });

    it('should maintain consistency between audio and YouTube usage tracking', async () => {
      // Mock getCurrentUsage to return consistent data
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValue({
        maxMinutes: 30,
        maxGptPrompts: 5,
        currentMinutes: 15,
        currentGptPrompts: 2,
        planName: 'Free'
      });

      // Mock updateUsage to track calls
      const updateUsageSpy = vi.spyOn(usageService, 'updateUsage').mockResolvedValue(true);

      // Test audio processing
      await usageService.updateUsage('user-123', { minutesUsed: 5 });

      // Test YouTube processing
      await usageService.updateUsageAfterYouTubeVideo('user-123', 300); // 5 minutes

      // Both should call updateUsage with same minutes
      expect(updateUsageSpy).toHaveBeenCalledTimes(2);
      expect(updateUsageSpy).toHaveBeenNthCalledWith(1, 'user-123', { minutesUsed: 5 });
      expect(updateUsageSpy).toHaveBeenNthCalledWith(2, 'user-123', { minutesUsed: 5 });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle negative duration gracefully', async () => {
      const result = await usageService.canProcessYouTubeVideo('user-123', -100);

      expect(result.canProcess).toBe(true); // Should allow processing
      expect(result.estimatedDuration).toBe('0 min');
    });

    it('should handle extremely large durations', async () => {
      // Mock Pro user usage
      vi.spyOn(usageService, 'getCurrentUsage').mockResolvedValueOnce({
        maxMinutes: -1,
        maxGptPrompts: -1,
        currentMinutes: 0,
        currentGptPrompts: 0,
        planName: 'Pro'
      });

      const result = await usageService.canProcessYouTubeVideo('user-123', 86400); // 24 hours

      expect(result.canProcess).toBe(true);
      expect(result.estimatedDuration).toBe('1440 min'); // 24 * 60
    });

    it('should handle missing userId', async () => {
      const result = await usageService.canProcessYouTubeVideo('', 600);

      expect(result.canProcess).toBe(true); // Should allow processing
    });

    it('should handle null userId', async () => {
      const result = await usageService.canProcessYouTubeVideo(null as any, 600);

      expect(result.canProcess).toBe(true); // Should allow processing
    });
  });
});
