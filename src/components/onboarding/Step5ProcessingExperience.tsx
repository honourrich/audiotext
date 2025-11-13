import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle, 
  Brain,
  FileText,
  Hash,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  Zap,
  Target
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

interface Step5ProcessingExperienceProps {
  onNext: () => void;
  onBack: () => void;
}

const PROCESSING_STEPS = [
  {
    id: 'transcription',
    title: 'AI Transcription',
    description: 'Converting audio to text with 99% accuracy',
    icon: <FileText className="w-5 h-5" />,
    duration: 2000,
    tip: 'Our AI uses advanced speech recognition to capture every word, even with background noise.'
  },
  {
    id: 'analysis',
    title: 'Content Analysis',
    description: 'Understanding context and key topics',
    icon: <Brain className="w-5 h-5" />,
    duration: 1500,
    tip: 'AI analyzes your content structure, identifies main topics, and understands the flow.'
  },
  {
    id: 'personalization',
    title: 'Style Personalization',
    description: 'Applying your unique voice and tone',
    icon: <Target className="w-5 h-5" />,
    duration: 1000,
    tip: 'Based on your preferences, we customize the writing style to match your authentic voice.'
  },
  {
    id: 'generation',
    title: 'Content Generation',
    description: 'Creating summaries, chapters, and keywords',
    icon: <Sparkles className="w-5 h-5" />,
    duration: 2000,
    tip: 'AI generates comprehensive show notes, chapter markers, and SEO-optimized keywords.'
  }
];

const Step5ProcessingExperience: React.FC<Step5ProcessingExperienceProps> = ({ onNext, onBack }) => {
  const { onboarding, trackEvent } = useOnboarding();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const startProcessing = async () => {
    setIsProcessing(true);
    await trackEvent('processing_started', { 
      content_type: onboarding?.first_content_data?.type 
    });

    // Simulate processing steps
    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setCurrentStepIndex(i);
      
      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, PROCESSING_STEPS[i].duration));
      
      // Mark step as completed
      setCompletedSteps(prev => [...prev, PROCESSING_STEPS[i].id]);
      
      await trackEvent('processing_step_completed', { 
        step: PROCESSING_STEPS[i].id,
        step_index: i 
      });
    }

    setIsProcessing(false);
    setShowResults(true);
    
    await trackEvent('processing_completed', { 
      total_steps: PROCESSING_STEPS.length 
    });
  };

  const handleContinue = async () => {
    await trackEvent('processing_experience_completed');
    onNext();
  };

  // Auto-start processing when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      startProcessing();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const overallProgress = (completedSteps.length / PROCESSING_STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">AI Processing in Action</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Watch as our AI transforms your content into professional show notes. 
          This usually takes 2-5 minutes for a typical episode.
        </p>
      </div>

      {/* Processing Card */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : showResults ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Clock className="w-5 h-5 text-white" />
                )}
              </div>
              <span>
                {showResults ? 'Processing Complete!' : isProcessing ? 'Processing...' : 'Ready to Process'}
              </span>
            </CardTitle>
            <Badge variant={showResults ? "default" : "secondary"}>
              {Math.round(overallProgress)}% Complete
            </Badge>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Processing Steps */}
          <div className="space-y-4">
            {PROCESSING_STEPS.map((step, index) => {
              const isActive = currentStepIndex === index && isProcessing;
              const isCompleted = completedSteps.includes(step.id);
              const isPending = index > currentStepIndex && isProcessing;

              return (
                <div key={step.id} className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCompleted 
                      ? 'bg-green-600 text-white' 
                      : isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${
                        isCompleted ? 'text-green-900 dark:text-green-100' : isActive ? 'text-blue-900 dark:text-blue-100' : 'text-foreground'
                      }`}>
                        {step.title}
                      </h3>
                      {isActive && (
                        <Badge variant="outline" className="animate-pulse">
                          Processing...
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-green-100 text-green-800">
                          Complete
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      isCompleted ? 'text-green-700 dark:text-green-300' : isActive ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'
                    }`}>
                      {step.description}
                    </p>
                    {(isActive || isCompleted) && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Tip:</strong> {step.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results Preview */}
          {showResults && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Generated Content Preview</span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-green-900 mb-2">📝 Transcript</h4>
                    <p className="text-sm text-green-800">
                      "Welcome to today's episode where we dive deep into the fascinating world of..."
                    </p>
                    <Badge className="bg-green-100 text-green-800 mt-2">
                      99.2% Accuracy
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-900 mb-2">📋 Summary</h4>
                    <p className="text-sm text-blue-800">
                      "In this episode, we explore key insights about content creation, discussing..."
                    </p>
                    <Badge className="bg-blue-100 text-blue-800 mt-2">
                      Personalized Style
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-purple-900 mb-2">📚 Chapters</h4>
                    <div className="space-y-1 text-sm text-purple-800">
                      <div>00:00 - Introduction</div>
                      <div>05:30 - Main Topic Discussion</div>
                      <div>15:45 - Key Takeaways</div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800 mt-2">
                      Auto-Generated
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-amber-900 mb-2">🏷️ Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {['content creation', 'productivity', 'AI tools', 'workflow'].map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 mt-2">
                      SEO Optimized
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Stats */}
      {showResults && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">2m 34s</div>
                <div className="text-sm text-muted-foreground">Processing Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">5.2x</div>
                <div className="text-sm text-muted-foreground">Faster than Manual</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">99.2%</div>
                <div className="text-sm text-muted-foreground">Accuracy Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="px-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!showResults}
          className="px-8"
        >
          {showResults ? 'Continue to Features' : 'Processing...'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Step5ProcessingExperience;