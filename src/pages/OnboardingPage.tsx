import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

const OnboardingPage: React.FC = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [bypassCheck, setBypassCheck] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoaded || !user) return;

      try {
        // Check localStorage for onboarding completion
        const hasCompleted = localStorage.getItem(`onboarding_completed_${user.id}`) === 'true';
        
        if (hasCompleted) {
          // Redirect existing users to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // Allow onboarding to proceed
          setBypassCheck(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, bypass the check and allow onboarding
        setBypassCheck(true);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setBypassCheck(true);
    }, 1000);

    checkOnboardingStatus();

    return () => clearTimeout(timeout);
  }, [user, isLoaded, navigate]);

  // Show loading while checking
  if (!bypassCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <OnboardingFlow />
    </div>
  );
};

export default OnboardingPage;