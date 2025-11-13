import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Dashboard from '@/components/Dashboard';

const DashboardPage: React.FC = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoaded || !user) return;

      try {
        // Check localStorage for onboarding completion
        const hasCompleted = localStorage.getItem(`onboarding_completed_${user.id}`) === 'true';
        
        if (!hasCompleted) {
          // Redirect new users to onboarding
          navigate('/onboarding', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, allow dashboard to load
      } finally {
        setCheckingOnboarding(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setCheckingOnboarding(false);
    }, 1000);

    checkOnboardingStatus();

    return () => clearTimeout(timeout);
  }, [user, isLoaded, navigate]);

  // Show loading while checking onboarding status
  if (checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

export default DashboardPage;