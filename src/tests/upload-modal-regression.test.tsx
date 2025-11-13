import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadModal } from '../src/components/UploadModal';
import { usageService } from '../src/lib/usageService';

// Mock dependencies
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({
    user: { id: 'test-user-123' }
  })
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false
  })
}));

// Mock OpenAI API
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Upload Modal - Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]'); // Empty episodes
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Local File Upload Workflow', () => {
    it('should process small audio files without compression', async () => {
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      // Mock successful OpenAI response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          text: 'This is a test transcription of the audio file.',
          segments: [
            { start: 0, end: 3, text: 'This is a test' },
            { start: 3, end: 6, text: 'transcription of the audio file.' }
          ]
        })
      });

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }

      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText(/Transcription completed successfully/i)).toBeInTheDocument();
      });

      // Verify OpenAI API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/audio/transcriptions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': expect.stringContaining('Bearer')
          }
        })
      );
    });

    it('should compress large audio files before transcription', async () => {
      const mockFile = new File(['audio content'], 'large.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(mockFile, 'size', { value: 50 * 1024 * 1024 }); // 50MB

      // Mock successful OpenAI response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          text: 'This is a test transcription of the large audio file.',
          segments: [
            { start: 0, end: 3, text: 'This is a test' },
            { start: 3, end: 6, text: 'transcription of the large audio file.' }
          ]
        })
      });

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }

      // Wait for compression step
      await waitFor(() => {
        expect(screen.getByText(/Large file detected/i)).toBeInTheDocument();
      });

      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText(/Transcription completed successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle transcription errors gracefully', async () => {
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      // Mock OpenAI API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: { message: 'Invalid audio format' }
        })
      });

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/OpenAI transcription failed/i)).toBeInTheDocument();
      });
    });

    it('should handle files with no speech content', async () => {
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      // Mock OpenAI response with empty transcription
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          text: '', // Empty transcription
          segments: []
        })
      });

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/No speech detected/i)).toBeInTheDocument();
      });
    });

    it('should create episode with correct structure', async () => {
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      // Mock successful OpenAI response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          text: 'This is a test transcription.',
          segments: [
            { start: 0, end: 3, text: 'This is a test transcription.' }
          ]
        })
      });

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }

      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText(/Transcription completed successfully/i)).toBeInTheDocument();
      });

      // Verify episode was saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'episodes',
        expect.stringContaining('"transcript":"This is a test transcription."')
      );
    });

    it('should handle multiple file formats', async () => {
      const formats = [
        { name: 'test.mp3', type: 'audio/mpeg' },
        { name: 'test.wav', type: 'audio/wav' },
        { name: 'test.mp4', type: 'video/mp4' },
        { name: 'test.m4a', type: 'audio/mp4' }
      ];

      for (const format of formats) {
        const mockFile = new File(['audio content'], format.name, { type: format.type });
        Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

        // Mock successful OpenAI response
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            text: `Transcription for ${format.name}`,
            segments: [
              { start: 0, end: 3, text: `Transcription for ${format.name}` }
            ]
          })
        });

        const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
        
        // Simulate file upload
        const fileInput = container.querySelector('input[type="file"]');
        if (fileInput) {
          fireEvent.change(fileInput, { target: { files: [mockFile] } });
        }

        // Wait for processing to complete
        await waitFor(() => {
          expect(screen.getByText(/Transcription completed successfully/i)).toBeInTheDocument();
        });

        // Clean up for next iteration
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('[]');
      }
    });
  });

  describe('Bulk Upload Workflow', () => {
    it('should process multiple files sequentially', async () => {
      const mockFiles = [
        new File(['audio1'], 'test1.mp3', { type: 'audio/mpeg' }),
        new File(['audio2'], 'test2.mp3', { type: 'audio/mpeg' }),
        new File(['audio3'], 'test3.mp3', { type: 'audio/mpeg' })
      ];

      // Set file sizes
      mockFiles.forEach(file => {
        Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      });

      // Mock successful OpenAI responses
      mockFiles.forEach((file, index) => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            text: `Transcription ${index + 1}`,
            segments: [
              { start: 0, end: 3, text: `Transcription ${index + 1}` }
            ]
          })
        });
      });

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate bulk file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: mockFiles } });
      }

      // Wait for all files to be processed
      await waitFor(() => {
        expect(screen.getByText(/All files processed successfully/i)).toBeInTheDocument();
      });

      // Verify OpenAI API was called for each file
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in bulk upload', async () => {
      const mockFiles = [
        new File(['audio1'], 'test1.mp3', { type: 'audio/mpeg' }),
        new File(['audio2'], 'test2.mp3', { type: 'audio/mpeg' })
      ];

      // Set file sizes
      mockFiles.forEach(file => {
        Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      });

      // First file succeeds, second fails
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            text: 'Transcription 1',
            segments: [{ start: 0, end: 3, text: 'Transcription 1' }]
          })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            error: { message: 'Invalid audio format' }
          })
        });

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate bulk file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: mockFiles } });
      }

      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText(/1 of 2 files processed successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should show progress indicators during processing', async () => {
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      // Mock OpenAI response with delay
      (global.fetch as any).mockImplementationOnce(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                text: 'Test transcription',
                segments: [{ start: 0, end: 3, text: 'Test transcription' }]
              })
            });
          }, 100);
        })
      );

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }

      // Check for progress indicator
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/Transcription completed successfully/i)).toBeInTheDocument();
      });
    });

    it('should show processing steps', async () => {
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      // Mock successful OpenAI response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          text: 'Test transcription',
          segments: [{ start: 0, end: 3, text: 'Test transcription' }]
        })
      });

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }

      // Check for processing steps
      await waitFor(() => {
        expect(screen.getByText(/Transcribing audio with OpenAI Whisper/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Transcription completed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should handle API rate limiting', async () => {
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      // Mock rate limit error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: { message: 'Rate limit exceeded' }
        })
      });

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Rate limit exceeded/i)).toBeInTheDocument();
      });
    });
  });

  describe('UI State Management', () => {
    it('should reset state when modal is closed and reopened', async () => {
      const { rerender } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Close modal
      rerender(<UploadModal open={false} onOpenChange={vi.fn()} />);
      
      // Reopen modal
      rerender(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Verify state is reset
      expect(screen.queryByText(/Transcription completed/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should disable upload button during processing', async () => {
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      // Mock OpenAI response with delay
      (global.fetch as any).mockImplementationOnce(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                text: 'Test transcription',
                segments: [{ start: 0, end: 3, text: 'Test transcription' }]
              })
            });
          }, 100);
        })
      );

      const { container } = render(<UploadModal open={true} onOpenChange={vi.fn()} />);
      
      // Simulate file upload
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }

      // Check that upload button is disabled
      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /process/i });
        expect(uploadButton).toBeDisabled();
      });
    });
  });
});
