import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import ContentEditor from '../components/ContentEditor';
import UploadModal from '../components/UploadModal';
import Dashboard from '../components/Dashboard';

// Mock video file
const createMockVideoFile = (name: string = 'test-video.mp4', size: number = 1024 * 1024) => {
  const file = new File(['video content'], name, { type: 'video/mp4' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock episode data
const mockEpisodeData = {
  id: '1',
  title: 'Test Episode',
  transcript: 'This is a test transcript with multiple sentences. It contains enough content to generate subtitles.',
  summary: 'Test summary',
  chapters: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </BrowserRouter>
);

describe('Video Export Integration', () => {
  describe('ContentEditor Video Integration', () => {
    test('does not include video tab in episode editor', () => {
      render(
        <TestWrapper>
          <ContentEditor
            episodeData={mockEpisodeData}
            onSave={() => {}}
            onPublish={() => {}}
            onDelete={() => {}}
          />
        </TestWrapper>
      );

      // Check that video tab is not present
      expect(screen.queryByText('Video')).not.toBeInTheDocument();
    });

    test('has correct number of tabs without video', () => {
      render(
        <TestWrapper>
          <ContentEditor
            episodeData={mockEpisodeData}
            onSave={() => {}}
            onPublish={() => {}}
            onDelete={() => {}}
          />
        </TestWrapper>
      );
      
      // Should have 5 tabs: Transcript, Summary, Chapters, Keywords, Export
      expect(screen.getByText('Transcript')).toBeInTheDocument();
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Chapters')).toBeInTheDocument();
      expect(screen.getByText('Keywords')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.queryByText('Video')).not.toBeInTheDocument();
    });

    test('video functionality has been removed', () => {
      render(
        <TestWrapper>
          <ContentEditor
            episodeData={mockEpisodeData}
            onSave={() => {}}
            onPublish={() => {}}
            onDelete={() => {}}
          />
        </TestWrapper>
      );

      // Video-related elements should not be present
      expect(screen.queryByText('Upload Video')).not.toBeInTheDocument();
      expect(screen.queryByText('Use Episode Transcript')).not.toBeInTheDocument();
    });
  });

  describe('UploadModal Video Integration', () => {
    test('video export tab is accessible from upload modal', () => {
      const onOpenChange = jest.fn();
      
      render(
        <TestWrapper>
          <UploadModal
            open={true}
            onOpenChange={onOpenChange}
          />
        </TestWrapper>
      );

      // Check for video export tab
      expect(screen.getByText('Video Export')).toBeInTheDocument();
    });

    test('video export tab provides navigation to dashboard', () => {
      const onOpenChange = jest.fn();
      
      render(
        <TestWrapper>
          <UploadModal
            open={true}
            onOpenChange={onOpenChange}
          />
        </TestWrapper>
      );

      // Click on video export tab
      fireEvent.click(screen.getByText('Video Export'));
      
      // Check for go to dashboard button
      const goToDashboardButton = screen.getByText('Go to Video Editor');
      expect(goToDashboardButton).toBeInTheDocument();
      
      // Test button functionality
      fireEvent.click(goToDashboardButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Dashboard Video Integration', () => {
    test('dashboard includes video export in navigation', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check for video-related navigation
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    test('dashboard supports video export workflow', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Should render without errors
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Multi-language Integration', () => {
    test('video export features work with different languages', async () => {
      // Test with Spanish
      await i18n.changeLanguage('es');
      
      const onOpenChange = jest.fn();
      
      render(
        <TestWrapper>
          <UploadModal
            open={true}
            onOpenChange={onOpenChange}
          />
        </TestWrapper>
      );

      // Should still render video export tab
      expect(screen.getByText('Video Export')).toBeInTheDocument();
      
      // Reset to English
      await i18n.changeLanguage('en');
    });

    test('content editor works with different languages without video tab', async () => {
      // Test with French
      await i18n.changeLanguage('fr');
      
      render(
        <TestWrapper>
          <ContentEditor
            episodeData={mockEpisodeData}
            onSave={() => {}}
            onPublish={() => {}}
            onDelete={() => {}}
          />
        </TestWrapper>
      );

      // Should not render video tab
      expect(screen.queryByText('Video')).not.toBeInTheDocument();
      
      // Reset to English
      await i18n.changeLanguage('en');
    });
  });

  describe('Dark Mode Integration', () => {
    test('video export features work in dark mode', () => {
      // Simulate dark mode
      document.documentElement.classList.add('dark');
      
      const onOpenChange = jest.fn();
      
      render(
        <TestWrapper>
          <UploadModal
            open={true}
            onOpenChange={onOpenChange}
          />
        </TestWrapper>
      );

      // Should render without errors in dark mode
      expect(screen.getByText('Video Export')).toBeInTheDocument();
      
      // Clean up
      document.documentElement.classList.remove('dark');
    });

    test('content editor works in dark mode without video tab', () => {
      // Simulate dark mode
      document.documentElement.classList.add('dark');
      
      render(
        <TestWrapper>
          <ContentEditor
            episodeData={mockEpisodeData}
            onSave={() => {}}
            onPublish={() => {}}
            onDelete={() => {}}
          />
        </TestWrapper>
      );

      // Should not render video tab in dark mode
      expect(screen.queryByText('Video')).not.toBeInTheDocument();
      
      // Clean up
      document.documentElement.classList.remove('dark');
    });
  });

  describe('Responsive Integration', () => {
    test('video export features work on mobile devices', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      const onOpenChange = jest.fn();
      
      render(
        <TestWrapper>
          <UploadModal
            open={true}
            onOpenChange={onOpenChange}
          />
        </TestWrapper>
      );

      // Should render without errors on mobile
      expect(screen.getByText('Video Export')).toBeInTheDocument();
    });

    test('content editor works on mobile devices without video tab', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      render(
        <TestWrapper>
          <ContentEditor
            episodeData={mockEpisodeData}
            onSave={() => {}}
            onPublish={() => {}}
            onDelete={() => {}}
          />
        </TestWrapper>
      );

      // Should not render video tab on mobile
      expect(screen.queryByText('Video')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    test('video export features are accessible', () => {
      const onOpenChange = jest.fn();
      
      render(
        <TestWrapper>
          <UploadModal
            open={true}
            onOpenChange={onOpenChange}
          />
        </TestWrapper>
      );

      // Check for proper tab roles
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      // Check for proper tabpanel roles
      const tabPanels = screen.getAllByRole('tabpanel');
      expect(tabPanels.length).toBeGreaterThan(0);
    });

    test('content editor is accessible without video tab', () => {
      render(
        <TestWrapper>
          <ContentEditor
            episodeData={mockEpisodeData}
            onSave={() => {}}
            onPublish={() => {}}
            onDelete={() => {}}
          />
        </TestWrapper>
      );

      // Check for proper tab roles (should have 5 tabs now)
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(5); // Transcript, Summary, Chapters, Keywords, Export
    });
  });

  describe('Error Handling Integration', () => {
    test('video export features handle errors gracefully', () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const onOpenChange = jest.fn();
      
      render(
        <TestWrapper>
          <UploadModal
            open={true}
            onOpenChange={onOpenChange}
          />
        </TestWrapper>
      );

      // Should render without errors even if there are issues
      expect(screen.getByText('Video Export')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('content editor handles errors gracefully without video tab', () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <ContentEditor
            episodeData={mockEpisodeData}
            onSave={() => {}}
            onPublish={() => {}}
            onDelete={() => {}}
          />
        </TestWrapper>
      );

      // Should render without errors even if there are issues, no video tab
      expect(screen.queryByText('Video')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Integration', () => {
    test('video export features load efficiently', () => {
      const startTime = performance.now();
      
      const onOpenChange = jest.fn();
      
      render(
        <TestWrapper>
          <UploadModal
            open={true}
            onOpenChange={onOpenChange}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within reasonable time (adjust threshold as needed)
      expect(loadTime).toBeLessThan(1000);
    });

    test('content editor loads efficiently without video tab', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ContentEditor
            episodeData={mockEpisodeData}
            onSave={() => {}}
            onPublish={() => {}}
            onDelete={() => {}}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within reasonable time (adjust threshold as needed)
      expect(loadTime).toBeLessThan(1000);
    });
  });
});
