import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Edit3,
  Download,
  Share2,
  Settings,
  BarChart3,
  Users,
  Sparkles,
  ArrowLeft,
  Trophy,
  Gift,
  Zap,
  Target,
  BookOpen,
  Rocket,
  Video,
  Subtitles,
  Image
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import VideoExportTutorial from '@/components/tutorials/VideoExportTutorial';

interface Step6FeatureTourProps {
  onBack: () => void;
  onComplete?: () => void;
}

const FEATURES = [
  {
    id: 'editor',
    title: 'Smart Editor',
    description: 'Edit transcripts, summaries, and chapters with AI assistance',
    icon: <Edit3 className="w-6 h-6" />,
    color: 'bg-blue-500',
    highlight: 'Real-time collaboration'
  },
  {
    id: 'export',
    title: 'Multi-Format Export',
    description: 'Export to PDF, Word, HTML, SRT, and more formats',
    icon: <Download className="w-6 h-6" />,
    color: 'bg-green-500',
    highlight: 'One-click publishing'
  },
  {
    id: 'video',
    title: 'Video Export',
    description: 'Create professional videos with subtitles and branding',
    icon: <Video className="w-6 h-6" />,
    color: 'bg-purple-500',
    highlight: 'Social media ready'
  },
  {
    id: 'analytics',
    title: 'Performance Analytics',
    description: 'Track engagement, SEO performance, and content metrics',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'bg-purple-500',
    highlight: 'Detailed insights'
  },
  {
    id: 'collaboration',
    title: 'Team Collaboration',
    description: 'Share projects, assign roles, and collaborate in real-time',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-amber-500',
    highlight: 'Multi-user editing'
  },
  {
    id: 'personalization',
    title: 'AI Personalization',
    description: 'Content that matches your unique voice and brand',
    icon: <Target className="w-6 h-6" />,
    color: 'bg-red-500',
    highlight: 'Social media analysis'
  },
  {
    id: 'automation',
    title: 'Workflow Automation',
    description: 'Set up automated processing and publishing workflows',
    icon: <Zap className="w-6 h-6" />,
    color: 'bg-indigo-500',
    highlight: 'Save hours weekly'
  }
];

const ACHIEVEMENTS = [
  { title: 'Onboarding Complete', icon: <Trophy className="w-5 h-5" /> },
  { title: 'First Content Processed', icon: <Sparkles className="w-5 h-5" /> },
  { title: 'Profile Personalized', icon: <Target className="w-5 h-5" /> },
  { title: 'Ready to Create', icon: <Rocket className="w-5 h-5" /> }
];

const Step6FeatureTour: React.FC<Step6FeatureTourProps> = ({ onBack, onComplete }) => {
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showVideoTutorial, setShowVideoTutorial] = useState(false);

  const handleFeatureClick = async (featureId: string) => {
    setSelectedFeature(featureId);
    
    // Show video tutorial for video export feature
    if (featureId === 'video') {
      setShowVideoTutorial(true);
    }
  };

  const handleComplete = async () => {
    try {
      setShowCelebration(true);
      
      // Wait for celebration animation
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else {
          navigate('/dashboard');
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still navigate to dashboard on error
      if (onComplete) {
        onComplete();
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleStartCreating = async () => {
    navigate('/dashboard');
  };

  if (showVideoTutorial) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowVideoTutorial(false)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feature Tour
            </Button>
          </div>
          <VideoExportTutorial
            onComplete={() => {
              setShowVideoTutorial(false);
              setSelectedFeature(null);
            }}
            onSkip={() => {
              setShowVideoTutorial(false);
              setSelectedFeature(null);
            }}
          />
        </div>
      </div>
    );
  }

  if (showCelebration) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-8 py-16">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <Trophy className="w-16 h-16 text-white" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-ping"></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">🎉 Congratulations!</h2>
            <p className="text-xl text-muted-foreground">
              You've successfully completed the audiotext onboarding!
            </p>
            <div className="flex justify-center space-x-2">
              {ACHIEVEMENTS.map((achievement, index) => (
                <Badge key={index} className="bg-green-100 text-green-800 px-3 py-1">
                  {achievement.icon}
                  <span className="ml-1">{achievement.title}</span>
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">You're all set!</h3>
            <p className="text-muted-foreground mb-6">
              Redirecting you to your dashboard where you can start creating amazing content...
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mb-4">
          <Logo size="lg" className="mb-2" />
          <h2 className="text-3xl font-bold text-foreground">Welcome to audiotext!</h2>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          You're all set up! Here's a quick tour of the powerful features that will transform 
          your content creation workflow.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <Card 
            key={feature.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedFeature === feature.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
            onClick={() => handleFeatureClick(feature.id)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className={`${feature.color} rounded-lg p-3 text-white w-fit`}>
                  {feature.icon}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {feature.highlight}
                </Badge>
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
              {selectedFeature === feature.id && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800 font-medium">
                      Feature explored! This will be available in your dashboard.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start Guide */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            <span>Quick Start Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Upload Content</h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop audio files to get started
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI Processing</h3>
              <p className="text-sm text-muted-foreground">
                Watch AI generate transcripts, summaries, and show notes automatically
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Edit & Export</h3>
              <p className="text-sm text-muted-foreground">
                Fine-tune your content and export in your preferred format
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Special Welcome Offer</h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                As a new user, you get 5 free episodes to try all premium features. 
                No credit card required!
              </p>
            </div>
            <Badge className="bg-blue-600 text-white px-4 py-2">
              5 Free Episodes
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="px-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex space-x-4">
          <Button variant="outline" onClick={handleStartCreating} className="px-6">
            <Settings className="w-4 h-4 mr-2" />
            Explore Settings
          </Button>
          <Button onClick={handleComplete} className="px-8 bg-gradient-to-r from-blue-600 to-purple-600">
            <Rocket className="w-4 h-4 mr-2" />
            Start Creating!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step6FeatureTour;