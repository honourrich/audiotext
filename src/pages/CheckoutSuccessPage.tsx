import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CheckoutSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription className="mt-2">
            Your subscription has been activated successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionId && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Session ID:</span> {sessionId}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              You now have access to all Pro features:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>500 minutes of audio upload per month</li>
              <li>Unlimited YouTube transcript extraction</li>
              <li>50 GPT prompts per month</li>
              <li>Multi-format export (PDF, Word, HTML)</li>
              <li>Priority processing</li>
              <li>Email support</li>
            </ul>
          </div>
          <div className="pt-4">
            <Button 
              className="w-full" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/billing')}
              className="text-sm"
            >
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccessPage;

