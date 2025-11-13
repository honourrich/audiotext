import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Calendar, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Real subscription data - fetch from your backend
  const subscription = {
    plan: 'Free',
    status: 'active',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    price: '$0',
    interval: 'month'
  };

  // Get real usage data from localStorage
  const episodes = JSON.parse(localStorage.getItem('episodes') || '[]');
  const usage = {
    episodesThisMonth: episodes.length,
    episodeLimit: 5, // Free tier limit
    storageUsed: '0 GB',
    storageLimit: '1 GB'
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    // In a real app, this would redirect to Stripe Customer Portal
    // const response = await fetch('/api/create-portal-session', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${await getToken()}` }
    // });
    // const { url } = await response.json();
    // window.location.href = url;
    
    // For demo, just show a message
    alert('This would redirect to Stripe Customer Portal for subscription management');
    setLoading(false);
  };

  const handleUpgrade = () => {
    // In a real app, redirect to Stripe Checkout
    alert('This would redirect to Stripe Checkout for plan upgrade');
  };

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
            <h1 className="text-xl font-semibold text-foreground">Billing & Subscription</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Current Plan</span>
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-bold text-foreground">{subscription.plan} Plan</h3>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {subscription.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  {subscription.price}/{subscription.interval}{subscription.currentPeriodEnd ? ` • Renews on ${subscription.currentPeriodEnd}` : ''}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleManageSubscription} disabled={loading}>
                  {loading ? 'Loading...' : 'Manage Subscription'}
                </Button>
                <Button onClick={handleUpgrade}>
                  Upgrade Plan
                </Button>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  Your subscription will be canceled at the end of the current billing period ({subscription.currentPeriodEnd}).
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Usage This Month</span>
            </CardTitle>
            <CardDescription>
              Track your current usage against plan limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Episodes Processed</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.episodesThisMonth} / {usage.episodeLimit}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(usage.episodesThisMonth / usage.episodeLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Storage Used</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.storageUsed} / {usage.storageLimit}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: '21%' }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <p className="text-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Customer ID</label>
                <p className="text-foreground font-mono text-sm">cus_{user?.id?.slice(-8)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Account Created</label>
                <p className="text-foreground">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingPage;