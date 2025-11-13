import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { YouTubeUnifiedModal } from '../src/components/YouTubeUnifiedModal';
import { useYouTubeUnified } from '../src/hooks/useYouTubeUnified';
import { usageService } from '../src/lib/usageService';

// Mock dependencies
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({
    user: { id: 'test-user-123' }
  })
}));

vi.mock('../src/hooks/useYouTubeUnified', () => ({
  useYouTubeUnified: vi.fn()
}));

vi.mock('../src/lib/usageService', () => ({
  usageService: {
    canProcessYouTubeVideo: vi.fn(),
    updateUsageAfterYouTubeVideo: vi.fn()
  }
}));

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true
});

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: vi.fn(),
  writable: true
});

describe('YouTube Processing - End-to-End Tests', () => {
  let mockUseYouTubeUnified: any;
  let mockUsageService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockUseYouTubeUnified = {
      isLoading: false,
      error: null,
      result: null,
      processYouTubeVideo: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn()
    };

    mockUsageService = {
      canProcessYouTubeVideo: vi.fn(),
      updateUsageAfterYouTubeVideo: vi.fn()
    };

    (useYouTubeUnified as any).mockReturnValue(mockUseYouTubeUnified);
    Object.assign(usageService, mockUsageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful YouTube Processing Flow', () => {
    it('should process YouTube video with metadata and captions', async () => {
      // Mock successful processing
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: true,
        videoId: 'dQw4w9WgXcQ',
        metadata: {
          title: 'Rick Astley - Never Gonna Give You Up',
          description: 'The official video for Never Gonna Give You Up',
          duration: 253,
          publishedAt: '2009-10-25T06:57:33Z',
          channelTitle: 'Rick Astley',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        },
        captions: [
          { text: 'We\'re no strangers to love', offset: 0, duration: 3.5 },
          { text: 'You know the rules and so do I', offset: 3500, duration: 3.2 }
        ],
        transcript: 'We\'re no strangers to love You know the rules and so do I',
        processingTime: 1250
      });

      // Mock usage check allowing processing
      mockUsageService.canProcessYouTubeVideo.mockResolvedValueOnce({
        canProcess: true,
        estimatedDuration: '4 min'
      });

      // Mock usage update success
      mockUsageService.updateUsageAfterYouTubeVideo.mockResolvedValueOnce(true);

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      // Enter YouTube URL
      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      // Click process button
      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText('Rick Astley - Never Gonna Give You Up')).toBeInTheDocument();
      });

      // Verify usage service was called
      expect(mockUsageService.canProcessYouTubeVideo).toHaveBeenCalledWith('test-user-123', 253);
      expect(mockUsageService.updateUsageAfterYouTubeVideo).toHaveBeenCalledWith('test-user-123', 253);

      // Verify usage update event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: 'usageUpdated'
      }));
    });

    it('should show video metadata correctly', async () => {
      // Mock successful processing
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: true,
        videoId: 'dQw4w9WgXcQ',
        metadata: {
          title: 'Test Video Title',
          description: 'This is a test video description that goes on for a while to test the truncation functionality.',
          duration: 120,
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        },
        captions: [],
        transcript: '',
        processingTime: 800
      });

      mockUsageService.canProcessYouTubeVideo.mockResolvedValueOnce({
        canProcess: true,
        estimatedDuration: '2 min'
      });

      mockUsageService.updateUsageAfterYouTubeVideo.mockResolvedValueOnce(true);

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Test Video Title')).toBeInTheDocument();
      });

      // Check metadata display
      expect(screen.getByText('Test Channel')).toBeInTheDocument();
      expect(screen.getByText('2:00')).toBeInTheDocument(); // Duration format
      expect(screen.getByText('1/1/2023')).toBeInTheDocument(); // Date format
      expect(screen.getByText('This is a test video description that goes on for a while to test the truncation functionality.')).toBeInTheDocument();
    });

    it('should display captions correctly', async () => {
      // Mock successful processing with captions
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: true,
        videoId: 'dQw4w9WgXcQ',
        metadata: {
          title: 'Test Video',
          description: 'Test Description',
          duration: 60,
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        },
        captions: [
          { text: 'First caption text', offset: 0, duration: 3.0 },
          { text: 'Second caption text', offset: 3000, duration: 3.0 },
          { text: 'Third caption text', offset: 6000, duration: 3.0 }
        ],
        transcript: 'First caption text Second caption text Third caption text',
        processingTime: 900
      });

      mockUsageService.canProcessYouTubeVideo.mockResolvedValueOnce({
        canProcess: true,
        estimatedDuration: '1 min'
      });

      mockUsageService.updateUsageAfterYouTubeVideo.mockResolvedValueOnce(true);

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Captions (3 segments)')).toBeInTheDocument();
      });

      // Check caption display
      expect(screen.getByText('First caption text')).toBeInTheDocument();
      expect(screen.getByText('Second caption text')).toBeInTheDocument();
      expect(screen.getByText('Third caption text')).toBeInTheDocument();
    });
  });

  describe('Usage Limit Enforcement', () => {
    it('should block processing when user exceeds limit', async () => {
      // Mock successful processing
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: true,
        videoId: 'dQw4w9WgXcQ',
        metadata: {
          title: 'Long Video',
          description: 'This is a long video',
          duration: 1800, // 30 minutes
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        },
        captions: [],
        transcript: '',
        processingTime: 1000
      });

      // Mock usage check blocking processing
      mockUsageService.canProcessYouTubeVideo.mockResolvedValueOnce({
        canProcess: false,
        reason: 'This video is 30 minutes long, but you only have 5 minutes remaining this month. Upgrade to Pro for unlimited processing.',
        estimatedDuration: '30 min'
      });

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Usage Warning')).toBeInTheDocument();
      });

      // Check warning message
      expect(screen.getByText(/This video is 30 minutes long, but you only have 5 minutes remaining this month/)).toBeInTheDocument();

      // Usage should not be updated
      expect(mockUsageService.updateUsageAfterYouTubeVideo).not.toHaveBeenCalled();
    });

    it('should show upgrade button for Pro features', async () => {
      // Mock processing with estimated duration
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: true,
        videoId: 'dQw4w9WgXcQ',
        metadata: {
          title: 'Test Video',
          description: 'Test Description',
          duration: 120,
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        },
        captions: [],
        transcript: '',
        processingTime: 800,
        hasEstimatedDuration: true,
        warning: 'YouTube API quota exceeded. Duration may be estimated from captions.'
      });

      mockUsageService.canProcessYouTubeVideo.mockResolvedValueOnce({
        canProcess: true,
        estimatedDuration: '2 min'
      });

      mockUsageService.updateUsageAfterYouTubeVideo.mockResolvedValueOnce(true);

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Usage Warning')).toBeInTheDocument();
      });

      // Check for upgrade button
      const upgradeButton = screen.getByRole('button', { name: /Upgrade to Pro/i });
      expect(upgradeButton).toBeInTheDocument();

      // Click upgrade button
      fireEvent.click(upgradeButton);
      expect(window.open).toHaveBeenCalledWith('/billing', '_blank');
    });
  });

  describe('Error Handling', () => {
    it('should handle API quota exceeded error', async () => {
      // Mock processing with API failure
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: true,
        videoId: 'dQw4w9WgXcQ',
        metadata: {
          title: 'YouTube Video dQw4w9WgXcQ',
          description: '',
          duration: 120,
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        },
        captions: [],
        transcript: '',
        processingTime: 500,
        hasEstimatedDuration: true,
        warning: 'YouTube API quota exceeded. Duration may be estimated from captions.'
      });

      mockUsageService.canProcessYouTubeVideo.mockResolvedValueOnce({
        canProcess: true,
        estimatedDuration: '2 min'
      });

      mockUsageService.updateUsageAfterYouTubeVideo.mockResolvedValueOnce(true);

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Usage Warning')).toBeInTheDocument();
      });

      // Check warning message
      expect(screen.getByText(/YouTube API quota exceeded. Duration may be estimated from captions/)).toBeInTheDocument();
    });

    it('should handle processing errors', async () => {
      // Mock processing error
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: false,
        error: 'Video not found or private'
      });

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=invalid' } });

      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Processing Failed')).toBeInTheDocument();
      });

      // Check error message
      expect(screen.getByText('Video not found or private')).toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      // Mock network error
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: false,
        error: 'Network error - Unable to reach YouTube API'
      });

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Processing Failed')).toBeInTheDocument();
      });

      // Check error message
      expect(screen.getByText('Network error - Unable to reach YouTube API')).toBeInTheDocument();
    });
  });

  describe('UI Interactions', () => {
    it('should copy transcript to clipboard', async () => {
      // Mock successful processing
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: true,
        videoId: 'dQw4w9WgXcQ',
        metadata: {
          title: 'Test Video',
          description: 'Test Description',
          duration: 60,
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        },
        captions: [],
        transcript: 'This is the transcript text',
        processingTime: 800
      });

      mockUsageService.canProcessYouTubeVideo.mockResolvedValueOnce({
        canProcess: true,
        estimatedDuration: '1 min'
      });

      mockUsageService.updateUsageAfterYouTubeVideo.mockResolvedValueOnce(true);

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        }
      });

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Full Transcript')).toBeInTheDocument();
      });

      // Click copy button
      const copyButton = screen.getByRole('button', { name: /Copy/i });
      fireEvent.click(copyButton);

      // Verify clipboard was called
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('This is the transcript text');
    });

    it('should download transcript', async () => {
      // Mock successful processing
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: true,
        videoId: 'dQw4w9WgXcQ',
        metadata: {
          title: 'Test Video',
          description: 'Test Description',
          duration: 60,
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        },
        captions: [],
        transcript: 'This is the transcript text',
        processingTime: 800
      });

      mockUsageService.canProcessYouTubeVideo.mockResolvedValueOnce({
        canProcess: true,
        estimatedDuration: '1 min'
      });

      mockUsageService.updateUsageAfterYouTubeVideo.mockResolvedValueOnce(true);

      // Mock URL.createObjectURL and document.createElement
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });
      Object.defineProperty(document, 'createElement', {
        value: vi.fn().mockReturnValue({
          click: mockClick,
          href: '',
          download: ''
        })
      });
      Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild });
      Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild });

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText('Full Transcript')).toBeInTheDocument();
      });

      // Click download button
      const downloadButton = screen.getByRole('button', { name: /Download/i });
      fireEvent.click(downloadButton);

      // Verify download was triggered
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should reset state when modal is closed', async () => {
      const onOpenChange = vi.fn();
      render(<YouTubeUnifiedModal open={true} onOpenChange={onOpenChange} />);

      // Enter URL
      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      // Close modal
      const closeButton = screen.getByRole('button', { name: /×/i });
      fireEvent.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mockUseYouTubeUnified.reset).toHaveBeenCalled();
    });

    it('should disable process button for invalid URLs', () => {
      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      // Enter invalid URL
      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'not-a-youtube-url' } });

      // Check that process button is disabled
      const processButton = screen.getByRole('button', { name: /Process Video/i });
      expect(processButton).toBeDisabled();
    });

    it('should show loading state during processing', async () => {
      // Mock loading state
      mockUseYouTubeUnified.isLoading = true;

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      const processButton = screen.getByRole('button', { name: /Processing/i });
      expect(processButton).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Language Selection', () => {
    it('should process video with selected language', async () => {
      // Mock successful processing
      mockUseYouTubeUnified.processYouTubeVideo.mockResolvedValueOnce({
        success: true,
        videoId: 'dQw4w9WgXcQ',
        metadata: {
          title: 'Test Video',
          description: 'Test Description',
          duration: 60,
          publishedAt: '2023-01-01T00:00:00Z',
          channelTitle: 'Test Channel',
          thumbnailUrl: 'https://example.com/thumb.jpg'
        },
        captions: [],
        transcript: '',
        processingTime: 800
      });

      mockUsageService.canProcessYouTubeVideo.mockResolvedValueOnce({
        canProcess: true,
        estimatedDuration: '1 min'
      });

      mockUsageService.updateUsageAfterYouTubeVideo.mockResolvedValueOnce(true);

      render(<YouTubeUnifiedModal open={true} onOpenChange={vi.fn()} />);

      // Select Spanish language
      const languageSelect = screen.getByLabelText(/Caption Language/i);
      fireEvent.change(languageSelect, { target: { value: 'es' } });

      const urlInput = screen.getByLabelText(/YouTube Video URL/i);
      fireEvent.change(urlInput, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

      const processButton = screen.getByRole('button', { name: /Process Video/i });
      fireEvent.click(processButton);

      // Verify processYouTubeVideo was called with Spanish language
      expect(mockUseYouTubeUnified.processYouTubeVideo).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'es'
      );
    });
  });
});
