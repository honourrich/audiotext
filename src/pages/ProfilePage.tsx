import React from 'react';
import { UserProfile } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('navigation.dashboard')}</span>
            </Button>
            <h1 className="text-xl font-semibold text-foreground">{t('settings.title')}</h1>
            <div></div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <UserProfile 
          routing="path"
          path="/profile"
          appearance={{
            baseTheme: undefined,
            elements: {
              card: 'shadow-lg',
              navbar: 'hidden',
              navbarMobileMenuButton: 'hidden'
            },
            variables: {
              colorPrimary: 'hsl(var(--primary))',
              colorBackground: 'hsl(var(--background))',
              colorInputBackground: 'hsl(var(--background))',
              colorInputText: 'hsl(var(--foreground))',
              colorText: 'hsl(var(--foreground))',
              colorTextSecondary: 'hsl(var(--muted-foreground))',
              colorDanger: 'hsl(var(--destructive))',
              colorSuccess: 'hsl(var(--primary))',
              colorWarning: 'hsl(var(--destructive))',
              borderRadius: '0.5rem'
            }
          }}
        />
      </div>
    </div>
  );
};

export default ProfilePage;