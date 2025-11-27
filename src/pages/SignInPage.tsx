import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import Logo from '@/components/Logo';

const SignInPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Sign in to audiotext
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Access your dashboard and manage your content
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignIn 
            routing="path" 
            path="/sign-in" 
            redirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden'
              },
              variables: {
                colorBackground: 'hsl(var(--card))',
                colorInputBackground: 'hsl(var(--background))',
                colorInputText: 'hsl(var(--foreground))',
                colorText: 'hsl(var(--foreground))',
                colorTextSecondary: 'hsl(var(--muted-foreground))'
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
