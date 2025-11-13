import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Share2, 
  Globe, 
  Upload,
  ArrowRight,
  ArrowLeft,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Music,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

const WRITING_TONES = [
  {
    id: 'professional',
    title: 'Professional',
    description: 'Formal, business-focused tone',
    example: 'In today\'s episode, we explore the strategic implications...',
    color: 'bg-blue-500'
  },
  {
    id: 'casual',
    title: 'Casual',
    description: 'Friendly, conversational style',
    example: 'Hey everyone! Today we\'re diving into something really cool...',
    color: 'bg-green-500'
  },
  {
    id: 'educational',
    title: 'Educational',
    description: 'Clear, instructional approach',
    example: 'Let\'s break down this concept step by step...',
    color: 'bg-purple-500'
  },
  {
    id: 'humorous',
    title: 'Humorous',
    description: 'Light-hearted and entertaining',
    example: 'Buckle up folks, because this topic is about to get wild...',
    color: 'bg-amber-500'
  }
];

const SOCIAL_PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, placeholder: '@username' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/username' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, placeholder: '@username' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, placeholder: '@channelname' },
  { id: 'tiktok', name: 'TikTok', icon: Music, placeholder: '@username' }
];

interface Step3StylePersonalizationProps {
  onNext: () => void;
  onBack: () => void;
}

const Step3StylePersonalization: React.FC<Step3StylePersonalizationProps> = ({ onNext, onBack }) => {
  const { onboarding, updateStylePreferences, trackEvent } = useOnboarding();
  
  const [writingTone, setWritingTone] = React.useState<string>(
    onboarding?.style_preferences?.writing_tone || ''
  );
  const [socialProfiles, setSocialProfiles] = React.useState<Record<string, string>>(
    onboarding?.style_preferences?.social_profiles?.reduce((acc, profile) => {
      const [platform, handle] = profile.split(':');
      acc[platform] = handle;
      return acc;
    }, {} as Record<string, string>) || {}
  );
  const [websiteUrl, setWebsiteUrl] = React.useState<string>(
    onboarding?.style_preferences?.website_url || ''
  );
  const [writingSample, setWritingSample] = React.useState<string>('');
  const [skipSocialMedia, setSkipSocialMedia] = React.useState(false);

  const handleToneSelect = async (toneId: string) => {
    setWritingTone(toneId);
    await trackEvent('writing_tone_selected', { tone: toneId });
  };

  const handleSocialProfileChange = async (platform: string, value: string) => {
    const newProfiles = { ...socialProfiles, [platform]: value };
    setSocialProfiles(newProfiles);
    await trackEvent('social_profile_added', { platform, hasValue: !!value });
  };

  const handleWebsiteChange = async (value: string) => {
    setWebsiteUrl(value);
    await trackEvent('website_url_added', { hasValue: !!value });
  };

  const handleSkipSocialMedia = async () => {
    setSkipSocialMedia(true);
    await trackEvent('social_media_skipped');
  };

  const handleContinue = async () => {
    if (!writingTone) return;

    const socialProfilesArray = Object.entries(socialProfiles)
      .filter(([_, handle]) => handle.trim())
      .map(([platform, handle]) => `${platform}:${handle}`);

    const preferences = {
      writing_tone: writingTone,
      social_profiles: socialProfilesArray,
      website_url: websiteUrl.trim() || undefined,
      writing_samples: writingSample.trim() ? [writingSample] : undefined
    };

    await updateStylePreferences(preferences);
    onNext();
  };

  const isValid = writingTone;
  const hasSocialProfiles = Object.values(socialProfiles).some(handle => handle.trim());

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Style Personalization</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Let's customize the AI to match your unique voice and writing style. 
          This ensures your show notes sound authentically like you.
        </p>
      </div>

      {/* Writing Tone Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <span>Choose your writing tone</span>
          </CardTitle>
          <p className="text-muted-foreground">This will be the default style for all your generated content</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {WRITING_TONES.map((tone) => (
              <div
                key={tone.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  writingTone === tone.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-input hover:border-muted-foreground'
                }`}
                onClick={() => handleToneSelect(tone.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`${tone.color} rounded-lg p-2 text-white w-fit`}>
                    <Palette className="w-4 h-4" />
                  </div>
                  {writingTone === tone.id && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{tone.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{tone.description}</p>
                <div className="bg-muted rounded p-3">
                  <p className="text-xs text-muted-foreground italic">"{tone.example}"</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Media Profiles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-purple-600" />
                <span>Connect social media profiles</span>
                <Badge variant="secondary">Optional</Badge>
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                We'll analyze your public posts to learn your writing style and personality
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkipSocialMedia}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!skipSocialMedia ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <div key={platform.id} className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{platform.name}</span>
                      </Label>
                      <Input
                        placeholder={platform.placeholder}
                        value={socialProfiles[platform.id] || ''}
                        onChange={(e) => handleSocialProfileChange(platform.id, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
              
              {hasSocialProfiles && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">Great! We'll analyze your social media style</p>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Only public posts will be analyzed. Your data is encrypted and can be deleted anytime.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Share2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Social media analysis skipped</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSkipSocialMedia(false)}
                className="mt-2"
              >
                Add social profiles
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Website URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-green-600" />
            <span>Website or blog URL</span>
            <Badge variant="secondary">Optional</Badge>
          </CardTitle>
          <p className="text-muted-foreground">We can analyze your existing content to understand your brand voice</p>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="https://yourwebsite.com"
            value={websiteUrl}
            onChange={(e) => handleWebsiteChange(e.target.value)}
          />
          {websiteUrl && (
            <p className="text-sm text-green-600 mt-2 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>We'll analyze your website content for brand voice consistency</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Writing Sample */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-amber-600" />
            <span>Writing sample</span>
            <Badge variant="secondary">Optional</Badge>
          </CardTitle>
          <p className="text-muted-foreground">Paste a sample of your writing to help train the AI</p>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste a paragraph or two of your typical writing style here..."
            value={writingSample}
            onChange={(e) => setWritingSample(e.target.value)}
            rows={4}
          />
          {writingSample && (
            <p className="text-sm text-amber-600 mt-2 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Sample added - this will help personalize your content</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Privacy & Data Usage</h4>
              <p className="text-blue-800 text-sm mt-1">
                All data is encrypted and used only to personalize your content. 
                You can view, edit, or delete your data anytime from your settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="px-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!isValid}
          className="px-8"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Step3StylePersonalization;