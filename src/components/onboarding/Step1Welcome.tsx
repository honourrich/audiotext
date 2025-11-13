import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  Youtube, 
  Building2, 
  UserCheck,
  ArrowRight,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import Logo from '@/components/Logo';

const USER_SEGMENTS = [
  {
    id: 'podcast_host',
    title: 'Podcast Host',
    description: 'Create professional show notes for your podcast episodes',
    icon: <Mic className="w-8 h-8" />,
    benefits: [
      'Automated transcription and summaries',
      'SEO-optimized show notes',
      'Chapter markers and timestamps',
      'Social media snippets'
    ],
    color: 'bg-blue-500',
    popular: true
  },
  {
    id: 'youtube_creator',
    title: 'YouTube Creator',
    description: 'Transform your videos into engaging written content',
    icon: <Youtube className="w-8 h-8" />,
    benefits: [
      'Video-to-text conversion',
      'Blog post generation',
      'Video descriptions',
      'Thumbnail text ideas'
    ],
    color: 'bg-red-500',
    popular: false
  },
  {
    id: 'content_agency',
    title: 'Content Agency',
    description: 'Scale content production for multiple clients',
    icon: <Building2 className="w-8 h-8" />,
    benefits: [
      'Bulk processing capabilities',
      'Client-specific branding',
      'Team collaboration tools',
      'White-label options'
    ],
    color: 'bg-purple-500',
    popular: false
  },
  {
    id: 'va_editor',
    title: 'VA/Editor',
    description: 'Streamline content editing workflows for clients',
    icon: <UserCheck className="w-8 h-8" />,
    benefits: [
      'Fast turnaround times',
      'Quality consistency',
      'Multiple format exports',
      'Client approval workflows'
    ],
    color: 'bg-green-500',
    popular: false
  }
];

interface Step1WelcomeProps {
  onNext: () => void;
}

const Step1Welcome: React.FC<Step1WelcomeProps> = ({ onNext }) => {
  const [selectedSegment, setSelectedSegment] = React.useState<string | null>(null);

  const handleSegmentSelect = (segmentId: string) => {
    setSelectedSegment(segmentId);
  };

  const handleContinue = () => {
    if (!selectedSegment) return;
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-0 mb-4">
          <Logo size="sm" />
          <h1 className="text-3xl font-bold text-foreground -ml-2">Welcome to podjust</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Let's personalize your experience! Tell us what type of content creator you are 
          so we can customize podjust to fit your specific needs.
        </p>
      </div>

      {/* User Segments */}
      <div className="grid md:grid-cols-2 gap-6">
        {USER_SEGMENTS.map((segment) => (
          <Card 
            key={segment.id}
            className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedSegment === segment.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleSegmentSelect(segment.id)}
          >
            {segment.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-amber-400 text-amber-900 px-3 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`${segment.color} rounded-lg p-3 text-white flex-shrink-0`}>
                  {segment.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {segment.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {segment.description}
                  </p>
                  <ul className="space-y-2">
                    {segment.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedSegment === segment.id && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Value Propositions */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
          Why creators choose podjust
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium text-foreground mb-2">Save 5+ Hours Per Episode</h4>
            <p className="text-sm text-muted-foreground">
              Automated transcription and content generation cuts editing time dramatically
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-medium text-foreground mb-2">AI-Powered Personalization</h4>
            <p className="text-sm text-muted-foreground">
              Content that matches your unique voice and style automatically
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-medium text-foreground mb-2">Trusted by 10,000+ Creators</h4>
            <p className="text-sm text-muted-foreground">
              Join the community of creators scaling their content production
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={handleContinue}
          disabled={!selectedSegment}
          className="px-8 py-3 text-lg"
        >
          Continue Setup
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Step1Welcome;