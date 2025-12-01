import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Calendar, Users, Zap, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createCheckoutSession, createCustomerPortalSession } from '@/lib/stripe';
import { usageService } from '@/lib/usageService';

const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  // Fetch current plan
  useEffect(() => {
    const fetchPlan = async () => {
      if (user?.id) {
        setPlanLoading(true);
        try {
          const usage = await usageService.getUsageForDisplay(user.id);
          setCurrentPlan(usage.planName);
        } catch (error) {
          console.error('Error fetching plan:', error);
          setCurrentPlan('Free');
        } finally {
          setPlanLoading(false);
        }
      } else {
        setPlanLoading(false);
      }
    };
    fetchPlan();
  }, [user?.id]);

  // Simplified subscription plans
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'month',
      description: 'Perfect for getting started with AI-powered show notes',
      features: [
        '30 minutes of audio processing per month',
        '5 GPT prompts for AI content generation',
        'Basic export formats (TXT)',
        'Community support',
        'Unlimited episodes (within time limit)'
      ],
      limitations: [
        'Limited to 30 minutes total processing time',
        'Only 5 AI prompts per month',
        'Basic export options only'
      ],
      current: true,
      popular: false
    },
    {
      name: 'Pro',
      price: '$7',
      period: 'week',
      description: 'For professional podcasters and content creators • Cancel any time',
      features: [
        '500 minutes of audio processing per week',
        'Unlimited YouTube transcript extraction',
        '50 GPT prompts per month',
        'Advanced export formats (TXT, PDF, DOCX)',
        'Priority processing',
        'Email support',
        'Advanced editing features',
        'Unlimited episodes'
      ],
      limitations: [],
      current: false,
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For teams and organizations • Custom pricing and features',
      features: [
        'Unlimited audio processing',
        'Unlimited YouTube transcript extraction',
        'Unlimited GPT prompts',
        'Advanced AI features & customization',
        'Dedicated account manager',
        'Priority support & SLA',
        'Custom integrations & API access',
        'Team collaboration features',
        'White-label options'
      ],
      limitations: [],
      current: false,
      popular: false,
      isEnterprise: true
    }
  ];

  // Get real usage data from service
  const [usage, setUsage] = useState({
    minutesUsed: 0,
    minutesLimit: 30,
    gptPromptsUsed: 0,
    gptPromptsLimit: 5
  });

  useEffect(() => {
    const fetchUsage = async () => {
      if (user?.id) {
        try {
          const usageData = await usageService.getUsageForDisplay(user.id);
          setUsage(usageData);
        } catch (error) {
          console.error('Error fetching usage data:', error);
        }
      }
    };
    fetchUsage();
  }, [user?.id]);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      // Get Clerk session token (works without template)
      let token: string | null = null;
      try {
        // Try to get token with template first (if configured)
        token = await getToken({ template: 'supabase' });
      } catch (templateError) {
        // Fallback to default session token if template doesn't exist
        console.log('Supabase template not found, using default token');
        token = await getToken();
      }
      
      const returnUrl = `${window.location.origin}/billing`;
      
      await createCustomerPortalSession(returnUrl, token || undefined);
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      alert('Failed to open customer portal. Please try again or contact support.');
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (planName === 'Enterprise') {
      // Enterprise plan - open email to contact
      window.location.href = 'mailto:support@audiotext.com?subject=Enterprise Plan Inquiry&body=Hi, I\'m interested in learning more about the Enterprise plan.';
      return;
    }

    if (planName === 'Pro') {
      setLoading(true);
      try {
        // Get Clerk session token (works without template)
        let token: string | null = null;
        try {
          // Try to get token with template first (if configured)
          token = await getToken({ template: 'supabase' });
        } catch (templateError) {
          // Fallback to default session token if template doesn't exist
          console.log('Supabase template not found, using default token');
          token = await getToken();
        }
        
        const userEmail = user?.emailAddresses[0]?.emailAddress;
        
        await createCheckoutSession(planName, userEmail, token || undefined);
      } catch (error) {
        console.error('Error creating checkout session:', error);
        alert('Failed to start checkout. Please try again or contact support.');
        setLoading(false);
      }
    }
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

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
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
                  <span className="text-sm font-medium text-foreground">Audio Processing Time</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.minutesUsed} / {usage.minutesLimit === -1 ? 'Unlimited' : `${usage.minutesLimit} minutes`}
                  </span>
                </div>
                {usage.minutesLimit !== -1 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min((usage.minutesUsed / usage.minutesLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">GPT Prompts Used</span>
                  <span className="text-sm text-muted-foreground">
                    {usage.gptPromptsUsed} / {usage.gptPromptsLimit === -1 ? 'Unlimited' : usage.gptPromptsLimit}
                  </span>
                </div>
                {usage.gptPromptsLimit !== -1 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((usage.gptPromptsUsed / usage.gptPromptsLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans - Only show if not on Pro plan */}
        {!planLoading && currentPlan !== 'Pro' && (
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <X className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    {plan.current ? (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full ${plan.isEnterprise ? 'bg-gray-800 hover:bg-gray-900' : ''}`}
                        onClick={() => handleUpgrade(plan.name)}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : plan.isEnterprise ? 'Contact Us' : `Upgrade to ${plan.name}`}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pro Plan Active Message */}
        {!planLoading && currentPlan === 'Pro' && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Badge className="bg-primary text-primary-foreground">Pro Plan Active</Badge>
              </CardTitle>
              <CardDescription>
                You're currently on the Pro plan. Manage your subscription below.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Manage Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Subscription Management</span>
            </CardTitle>
            <CardDescription>
              Manage your subscription, payment methods, and billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={handleManageSubscription}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Manage Subscription'}
            </Button>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Update payment methods, view invoices, or cancel your subscription
            </p>
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