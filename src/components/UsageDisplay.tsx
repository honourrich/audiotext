import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare, AlertTriangle, Crown } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { usageService } from '@/lib/usageService';
import { useTranslation } from 'react-i18next';

interface UsageDisplayProps {
  className?: string;
}

const UsageDisplay: React.FC<UsageDisplayProps> = ({ className }) => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [usage, setUsage] = useState({
    minutesUsed: 0,
    minutesLimit: 30,
    gptPromptsUsed: 0,
    gptPromptsLimit: 5,
    planName: 'Free'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      if (user?.id) {
        try {
          const usageData = await usageService.getUsageForDisplay(user.id);
          setUsage(usageData);
        } catch (error) {
          console.error('Error fetching usage data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUsage();

    // Listen for usage updates
    const handleUsageUpdate = () => {
      fetchUsage();
    };

    window.addEventListener('usageUpdated', handleUsageUpdate);
    return () => window.removeEventListener('usageUpdated', handleUsageUpdate);
  }, [user?.id]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>{t('usage.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-muted rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check for unlimited (-1) instead of 999999
  const isMinutesUnlimited = usage.minutesLimit === -1;
  const isPromptsUnlimited = usage.gptPromptsLimit === -1;
  
  const minutesPercentage = isMinutesUnlimited ? 0 : (usage.minutesUsed / usage.minutesLimit) * 100;
  const promptsPercentage = isPromptsUnlimited ? 0 : (usage.gptPromptsUsed / usage.gptPromptsLimit) * 100;

  const isMinutesNearLimit = !isMinutesUnlimited && minutesPercentage > 80;
  const isPromptsNearLimit = !isPromptsUnlimited && promptsPercentage > 80;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>{t('usage.title')}</span>
          </div>
          <Badge variant={usage.planName === 'Pro' ? 'default' : 'secondary'}>
            {usage.planName === 'Pro' ? (
              <div className="flex items-center space-x-1">
                <Crown className="w-3 h-3" />
                <span>{t('usage.plan.pro')}</span>
              </div>
            ) : (
              t('usage.plan.free')
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          {t('usage.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Processing Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">{t('usage.audioProcessing')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {usage.minutesUsed} / {isMinutesUnlimited ? 'Unlimited' : `${usage.minutesLimit} ${t('usage.minutes')}`}
              </span>
              {isMinutesNearLimit && (
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              )}
            </div>
          </div>
          {!isMinutesUnlimited && (
            <Progress 
              value={minutesPercentage} 
              className={`h-2 ${isMinutesNearLimit ? 'bg-orange-100' : ''}`}
            />
          )}
        </div>

        {/* GPT Prompts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">{t('usage.gptPrompts')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {usage.gptPromptsUsed} / {isPromptsUnlimited ? 'Unlimited' : usage.gptPromptsLimit}
              </span>
              {isPromptsNearLimit && (
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              )}
            </div>
          </div>
          {!isPromptsUnlimited && (
            <Progress 
              value={promptsPercentage} 
              className={`h-2 ${isPromptsNearLimit ? 'bg-orange-100' : ''}`}
            />
          )}
        </div>

        {/* Usage Warnings */}
        {(isMinutesNearLimit || isPromptsNearLimit) && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">{t('usage.warning.title')}</p>
                <p className="text-orange-700">
                  {isMinutesNearLimit && isPromptsNearLimit 
                    ? t('usage.warning.both')
                    : isMinutesNearLimit 
                    ? t('usage.warning.audio')
                    : t('usage.warning.prompts')
                  }
                  {usage.planName === 'Free' && ` ${t('usage.warning.upgrade')}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageDisplay;
