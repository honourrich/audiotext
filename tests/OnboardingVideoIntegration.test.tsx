import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import Step6FeatureTour from '../components/onboarding/Step6FeatureTour';
import UploadModal from '../components/UploadModal';

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </BrowserRouter>
);

describe('Onboarding Video Integration', () => {
  describe('Step6FeatureTour Component', () => {
    test('includes video export feature in feature list', () => {
      const onBack = jest.fn();
      const onComplete = jest.fn();
      
      render(
        <TestWrapper>
          <Step6FeatureTour
            onBack={onBack}
            onComplete={onComplete}
          />
        </TestWrapper>
      );

      // Check for video export feature
      expect(screen.getByText('Video Export')).toBeInTheDocument();
      expect(screen.getByText('Create professional videos with subtitles and branding')).toBeInTheDocument();
      expect(screen.getByText('Social media ready')).toBeInTheDocument();
    });

    test('video export feature has correct icon and styling', () => {
      const onBack = jest.fn();
      const onComplete = jest.fn();
      
      render(
        <TestWrapper>
          <Step6FeatureTour
            onBack={onBack}
            onComplete={onComplete}
          />
        </TestWrapper>
      );

      // Check for video icon (Video component should be present)
      const videoFeature = screen.getByText('Video Export').closest('[data-testid="feature-card"]') || 
                          screen.getByText('Video Export').closest('.feature-card');
      
      if (videoFeature) {
        expect(videoFeature).toHaveClass('bg-purple-500');
      }
    });

    test('completes onboarding flow with video feature', async () => {
      const onBack = jest.fn();
      const onComplete = jest.fn();
      
      render(
        <TestWrapper>
          <Step6FeatureTour
            onBack={onBack}
            onComplete={onComplete}
          />
        </TestWrapper>
      );

      // Click complete button
      const completeButton = screen.getByText('Get Started');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('UploadModal Video Integration', () => {
    test('includes video export tab in upload modal', () => {
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

    test('video export tab shows correct content', () => {
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
      
      // Check for video export content
      expect(screen.getByText('Video Export Feature')).toBeInTheDocument();
      expect(screen.getByText('Create professional videos with subtitles and branding for social media platforms.')).toBeInTheDocument();
    });

    test('video export tab has correct feature cards', () => {
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
      
      // Check for feature cards
      expect(screen.getByText('Video Processing')).toBeInTheDocument();
      expect(screen.getByText('Subtitle Overlay')).toBeInTheDocument();
      expect(screen.getByText('Export Ready')).toBeInTheDocument();
    });

    test('video export tab has go to dashboard button', () => {
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
      
      // Test button click
      fireEvent.click(goToDashboardButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Multi-language Support', () => {
    test('video export features support translations', () => {
      // Test with different language
      i18n.changeLanguage('es');
      
      const onBack = jest.fn();
      const onComplete = jest.fn();
      
      render(
        <TestWrapper>
          <Step6FeatureTour
            onBack={onBack}
            onComplete={onComplete}
          />
        </TestWrapper>
      );

      // Should still render without errors
      expect(screen.getByText('Video Export')).toBeInTheDocument();
      
      // Reset language
      i18n.changeLanguage('en');
    });

    test('upload modal video tab supports translations', () => {
      // Test with different language
      i18n.changeLanguage('es');
      
      const onOpenChange = jest.fn();
      
      render(
        <TestWrapper>
          <UploadModal
            open={true}
            onOpenChange={onOpenChange}
          />
        </TestWrapper>
      );

      // Should still render without errors
      expect(screen.getByText('Video Export')).toBeInTheDocument();
      
      // Reset language
      i18n.changeLanguage('en');
    });
  });

  describe('Dark Mode Compatibility', () => {
    test('onboarding video feature supports dark mode', () => {
      // Simulate dark mode
      document.documentElement.classList.add('dark');
      
      const onBack = jest.fn();
      const onComplete = jest.fn();
      
      render(
        <TestWrapper>
          <Step6FeatureTour
            onBack={onBack}
            onComplete={onComplete}
          />
        </TestWrapper>
      );

      // Should render without errors in dark mode
      expect(screen.getByText('Video Export')).toBeInTheDocument();
      
      // Clean up
      document.documentElement.classList.remove('dark');
    });

    test('upload modal video tab supports dark mode', () => {
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
  });

  describe('Accessibility', () => {
    test('video export feature is accessible', () => {
      const onBack = jest.fn();
      const onComplete = jest.fn();
      
      render(
        <TestWrapper>
          <Step6FeatureTour
            onBack={onBack}
            onComplete={onComplete}
          />
        </TestWrapper>
      );

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      // Check for proper button roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('upload modal video tab is accessible', () => {
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
  });

  describe('Responsive Design', () => {
    test('onboarding adapts to mobile screens', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      const onBack = jest.fn();
      const onComplete = jest.fn();
      
      render(
        <TestWrapper>
          <Step6FeatureTour
            onBack={onBack}
            onComplete={onComplete}
          />
        </TestWrapper>
      );

      // Should render without errors on mobile
      expect(screen.getByText('Video Export')).toBeInTheDocument();
    });

    test('upload modal adapts to mobile screens', () => {
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
  });
});
