import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  ArrowLeft,
  Sparkles,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Logo from '@/components/Logo';

// Import step components
import Step1Welcome from './Step1Welcome';
import Step2ContentPreferences from './Step2ContentPreferences';
import Step3StylePersonalization from './Step3StylePersonalization';
import Step4FirstContent from './Step4FirstContent';
import Step5ProcessingExperience from './Step5ProcessingExperience';
import Step6FeatureTour from './Step6FeatureTour';

const STEPS = [
  { id: 1, title: 'Welcome', description: 'Choose your creator type' },
  { id: 2, title: 'Content', description: 'Set your preferences' },
  { id: 3, title: 'Style', description: 'Personalize your voice' },
  { id: 4, title: 'Upload', description: 'Add your first content' },
  { id: 5, title: 'Process', description: 'Watch AI in action' },
  { id: 6, title: 'Complete', description: 'Explore features' }
];

const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Mark onboarding as completed
    if (user?.id) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }
    navigate('/dashboard');
  };

  const handleSkipOnboarding = () => {
    if (window.confirm('Are you sure you want to skip onboarding? You can always access these settings later.')) {
      if (user?.id) {
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      }
      navigate('/dashboard');
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Welcome onNext={handleNext} />;
      case 2:
        return <Step2ContentPreferences onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <Step3StylePersonalization onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <Step4FirstContent onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <Step5ProcessingExperience onNext={handleNext} onBack={handleBack} />;
      case 6:
        return <Step6FeatureTour onBack={handleBack} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-0">
              <Logo size="md" />
              <span className="text-xl font-bold text-foreground -ml-2">podjust</span>
            </div>

            {/* Progress Steps */}
            <div className="hidden md:flex items-center space-x-4">
              {STEPS.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const isAccessible = step.id <= currentStep;

                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => isAccessible && setCurrentStep(step.id)}
                      disabled={!isAccessible}
                      className={`flex items-center space-x-2 ${
                        isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : isActive ? (
                        <Circle className="w-5 h-5 text-blue-600 fill-blue-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <div className={`text-xs font-medium ${
                          isActive ? 'text-blue-600' : 
                          isCompleted ? 'text-green-600' : 
                          'text-muted-foreground'
                        }`}>
                          {step.title}
                        </div>
                      </div>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-600' : 'bg-border'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Skip Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkipOnboarding}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Skip Setup
            </Button>
          </div>

          {/* Mobile Progress Bar */}
          <div className="md:hidden pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Step {currentStep} of {STEPS.length}
              </span>
              <Badge variant="outline">
                {STEPS[currentStep - 1]?.title}
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {renderCurrentStep()}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              © 2024 podjust. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
              <a href="#" className="hover:text-foreground">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OnboardingFlow;
