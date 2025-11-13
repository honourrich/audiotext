import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CheckoutCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription className="mt-2">
            Your subscription was not completed. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            You can try again anytime or explore our free plan features.
          </p>
          <div className="pt-4 space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate('/billing')}
            >
              Try Again
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutCancelPage;

