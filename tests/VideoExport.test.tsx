import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import VideoEditor from '../components/VideoEditor';
import VideoUpload from '../components/VideoUpload';
import DimensionSelector from '../components/DimensionSelector';
import AspectRatioPreview from '../components/AspectRatioPreview';
import VideoProcessor from '../components/VideoProcessor';

// Mock video file
const createMockVideoFile = (name: string = 'test-video.mp4', size: number = 1024 * 1024) => {
  const file = new File(['video content'], name, { type: 'video/mp4' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock transcript data
const mockTranscript = {
  segments: [
    { start: 0, end: 5, text: 'Hello, welcome to our podcast' },
    { start: 5, end: 10, text: 'Today we will discuss video editing' },
    { start: 10, end: 15, text: 'Thank you for listening' }
  ]
};

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </BrowserRouter>
);

describe('Video Export Feature', () => {
  describe('VideoEditor Component', () => {
    test('renders all tabs correctly', () => {
      const mockVideoFile = createMockVideoFile();
      
      render(
        <TestWrapper>
          <VideoEditor
            videoFile={mockVideoFile}
            transcript={mockTranscript}
            onExport={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Subtitles')).toBeInTheDocument();
      expect(screen.getByText('Branding')).toBeInTheDocument();
      expect(screen.getByText('Format')).toBeInTheDocument();
      expect(screen.getByText('Process')).toBeInTheDocument();
    });

    test('switches between tabs correctly', async () => {
      const mockVideoFile = createMockVideoFile();
      
      render(
        <TestWrapper>
          <VideoEditor
            videoFile={mockVideoFile}
            transcript={mockTranscript}
            onExport={() => {}}
          />
        </TestWrapper>
      );

      // Click on Subtitles tab
      fireEvent.click(screen.getByText('Subtitles'));
      await waitFor(() => {
        expect(screen.getByText('Subtitle Editor')).toBeInTheDocument();
      });

      // Click on Branding tab
      fireEvent.click(screen.getByText('Branding'));
      await waitFor(() => {
        expect(screen.getByText('Branding Overlay')).toBeInTheDocument();
      });
    });

    test('handles video file changes', async () => {
      const mockVideoFile = createMockVideoFile();
      const onExport = jest.fn();
      
      render(
        <TestWrapper>
          <VideoEditor
            videoFile={mockVideoFile}
            transcript={mockTranscript}
            onExport={onExport}
          />
        </TestWrapper>
      );

      // Should display video information
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    });
  });

  describe('VideoUpload Component', () => {
    test('renders upload interface correctly', () => {
      const onVideoSelect = jest.fn();
      const onVideoRemove = jest.fn();
      
      render(
        <TestWrapper>
          <VideoUpload
            onVideoSelect={onVideoSelect}
            onVideoRemove={onVideoRemove}
            selectedVideo={null}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Upload Video')).toBeInTheDocument();
      expect(screen.getByText('Drag & drop a video file here')).toBeInTheDocument();
    });

    test('handles file selection', async () => {
      const onVideoSelect = jest.fn();
      const onVideoRemove = jest.fn();
      const mockVideoFile = createMockVideoFile();
      
      render(
        <TestWrapper>
          <VideoUpload
            onVideoSelect={onVideoSelect}
            onVideoRemove={onVideoRemove}
            selectedVideo={null}
          />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText('file-input');
      fireEvent.change(fileInput, { target: { files: [mockVideoFile] } });
      
      await waitFor(() => {
        expect(onVideoSelect).toHaveBeenCalledWith(mockVideoFile);
      });
    });

    test('validates file types', async () => {
      const onVideoSelect = jest.fn();
      const onVideoRemove = jest.fn();
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      render(
        <TestWrapper>
          <VideoUpload
            onVideoSelect={onVideoSelect}
            onVideoRemove={onVideoRemove}
            selectedVideo={null}
          />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText('file-input');
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Please upload a valid video file')).toBeInTheDocument();
      });
    });
  });

  describe('DimensionSelector Component', () => {
    test('renders all platform options', () => {
      const onDimensionSelect = jest.fn();
      
      render(
        <TestWrapper>
          <DimensionSelector
            selectedDimension={null}
            onDimensionSelect={onDimensionSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByText('TikTok')).toBeInTheDocument();
      expect(screen.getByText('Instagram')).toBeInTheDocument();
      expect(screen.getByText('YouTube')).toBeInTheDocument();
      expect(screen.getByText('Facebook')).toBeInTheDocument();
      expect(screen.getByText('Twitter')).toBeInTheDocument();
      expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    });

    test('handles dimension selection', async () => {
      const onDimensionSelect = jest.fn();
      
      render(
        <TestWrapper>
          <DimensionSelector
            selectedDimension={null}
            onDimensionSelect={onDimensionSelect}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('TikTok'));
      expect(onDimensionSelect).toHaveBeenCalled();
    });

    test('shows selected dimension', () => {
      const mockDimension = {
        id: 'tiktok',
        name: 'TikTok',
        width: 1080,
        height: 1920,
        aspectRatio: 9/16,
        platform: 'TikTok'
      };
      const onDimensionSelect = jest.fn();
      
      render(
        <TestWrapper>
          <DimensionSelector
            selectedDimension={mockDimension}
            onDimensionSelect={onDimensionSelect}
          />
        </TestWrapper>
      );

      // Should show selected state
      const tiktokButton = screen.getByText('TikTok').closest('button');
      expect(tiktokButton).toHaveClass('bg-blue-600');
    });
  });

  describe('AspectRatioPreview Component', () => {
    test('shows loading state', () => {
      const mockVideoFile = createMockVideoFile();
      
      render(
        <TestWrapper>
          <AspectRatioPreview
            videoFile={mockVideoFile}
            targetDimension={null}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Analyzing video...')).toBeInTheDocument();
    });

    test('displays video metadata when loaded', async () => {
      const mockVideoFile = createMockVideoFile();
      
      // Mock the video metadata extraction
      jest.spyOn(require('../lib/videoMetadata'), 'extractVideoMetadata').mockResolvedValue({
        width: 1920,
        height: 1080,
        duration: 60,
        frameRate: 30,
        bitrate: 1000,
        codec: 'h264'
      });
      
      render(
        <TestWrapper>
          <AspectRatioPreview
            videoFile={mockVideoFile}
            targetDimension={null}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Original Video')).toBeInTheDocument();
      });
    });
  });

  describe('VideoProcessor Component', () => {
    test('renders processing interface', () => {
      const mockVideoFile = createMockVideoFile();
      const mockSubtitles = [
        { id: '1', startTime: 0, endTime: 5, text: 'Hello world' }
      ];
      const mockBranding = [
        { id: '1', type: 'logo', visible: true, position: { x: 10, y: 10 } }
      ];
      
      render(
        <TestWrapper>
          <VideoProcessor
            videoFile={mockVideoFile}
            subtitles={mockSubtitles}
            brandingElements={mockBranding}
            onExportComplete={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Video Processing')).toBeInTheDocument();
      expect(screen.getByText('Start Processing')).toBeInTheDocument();
    });

    test('shows processing steps', async () => {
      const mockVideoFile = createMockVideoFile();
      const mockSubtitles = [];
      const mockBranding = [];
      
      render(
        <TestWrapper>
          <VideoProcessor
            videoFile={mockVideoFile}
            subtitles={mockSubtitles}
            brandingElements={mockBranding}
            onExportComplete={() => {}}
          />
        </TestWrapper>
      );

      // Should show input summary
      expect(screen.getByText('Video File')).toBeInTheDocument();
      expect(screen.getByText('Subtitles')).toBeInTheDocument();
      expect(screen.getByText('Branding')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('VideoEditor has proper ARIA labels', () => {
      const mockVideoFile = createMockVideoFile();
      
      render(
        <TestWrapper>
          <VideoEditor
            videoFile={mockVideoFile}
            transcript={mockTranscript}
            onExport={() => {}}
          />
        </TestWrapper>
      );

      // Check for proper tab roles
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(6);
      
      // Check for tabpanel roles
      const tabPanels = screen.getAllByRole('tabpanel');
      expect(tabPanels.length).toBeGreaterThan(0);
    });

    test('DimensionSelector is keyboard accessible', () => {
      const onDimensionSelect = jest.fn();
      
      render(
        <TestWrapper>
          <DimensionSelector
            selectedDimension={null}
            onDimensionSelect={onDimensionSelect}
          />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        // Test keyboard navigation
        fireEvent.keyDown(button, { key: 'Enter' });
        fireEvent.keyDown(button, { key: ' ' });
      });
    });

    test('VideoUpload has proper labels and descriptions', () => {
      const onVideoSelect = jest.fn();
      const onVideoRemove = jest.fn();
      
      render(
        <TestWrapper>
          <VideoUpload
            onVideoSelect={onVideoSelect}
            onVideoRemove={onVideoRemove}
            selectedVideo={null}
          />
        </TestWrapper>
      );

      // Check for proper labels
      expect(screen.getByLabelText('file-input')).toBeInTheDocument();
      expect(screen.getByText('Supported formats: MP4, MOV, AVI, MKV, WEBM')).toBeInTheDocument();
    });
  });

  describe('Responsive Design Tests', () => {
    test('VideoEditor adapts to different screen sizes', () => {
      const mockVideoFile = createMockVideoFile();
      
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      render(
        <TestWrapper>
          <VideoEditor
            videoFile={mockVideoFile}
            transcript={mockTranscript}
            onExport={() => {}}
          />
        </TestWrapper>
      );

      // Should render without errors on mobile
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    test('DimensionSelector grid adapts to screen size', () => {
      const onDimensionSelect = jest.fn();
      
      render(
        <TestWrapper>
          <DimensionSelector
            selectedDimension={null}
            onDimensionSelect={onDimensionSelect}
          />
        </TestWrapper>
      );

      // Check for responsive grid classes
      const grid = screen.getByRole('grid');
      expect(grid).toHaveClass('grid');
    });
  });

  describe('Dark Mode Compatibility', () => {
    test('VideoEditor supports dark mode classes', () => {
      const mockVideoFile = createMockVideoFile();
      
      // Simulate dark mode
      document.documentElement.classList.add('dark');
      
      render(
        <TestWrapper>
          <VideoEditor
            videoFile={mockVideoFile}
            transcript={mockTranscript}
            onExport={() => {}}
          />
        </TestWrapper>
      );

      // Should render without errors in dark mode
      expect(screen.getByText('Preview')).toBeInTheDocument();
      
      // Clean up
      document.documentElement.classList.remove('dark');
    });

    test('AspectRatioPreview uses dark mode classes', () => {
      const mockVideoFile = createMockVideoFile();
      
      render(
        <TestWrapper>
          <AspectRatioPreview
            videoFile={mockVideoFile}
            targetDimension={null}
          />
        </TestWrapper>
      );

      // Check for dark mode classes in the component
      const cards = screen.getAllByRole('article');
      cards.forEach(card => {
        expect(card).toHaveClass('dark:bg-gray-900');
      });
    });
  });

  describe('Error Handling', () => {
    test('VideoProcessor handles processing errors gracefully', async () => {
      const mockVideoFile = createMockVideoFile();
      const mockSubtitles = [];
      const mockBranding = [];
      
      // Mock FFmpeg service to throw error
      jest.spyOn(require('../lib/ffmpegService'), 'ffmpegService').mockImplementation({
        initialize: jest.fn().mockRejectedValue(new Error('FFmpeg initialization failed')),
        processVideo: jest.fn()
      });
      
      render(
        <TestWrapper>
          <VideoProcessor
            videoFile={mockVideoFile}
            subtitles={mockSubtitles}
            brandingElements={mockBranding}
            onExportComplete={() => {}}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Start Processing'));
      
      await waitFor(() => {
        expect(screen.getByText('Processing Error')).toBeInTheDocument();
      });
    });

    test('VideoUpload shows error for invalid files', async () => {
      const onVideoSelect = jest.fn();
      const onVideoRemove = jest.fn();
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      render(
        <TestWrapper>
          <VideoUpload
            onVideoSelect={onVideoSelect}
            onVideoRemove={onVideoRemove}
            selectedVideo={null}
          />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText('file-input');
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        expect(screen.getByText(/Please upload a valid video file/)).toBeInTheDocument();
      });
    });
  });
});
