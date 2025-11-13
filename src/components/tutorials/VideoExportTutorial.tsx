import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Video,
  Subtitles,
  Image,
  Settings,
  Download,
  Eye,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  completed: boolean;
}

interface VideoExportTutorialProps {
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export const VideoExportTutorial: React.FC<VideoExportTutorialProps> = ({
  onComplete,
  onSkip,
  className = ''
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps: TutorialStep[] = [
    {
      id: 'overview',
      title: 'Video Export Overview',
      description: 'Learn how to create professional videos with subtitles and branding',
      icon: <Video className="w-6 h-6" />,
      completed: completedSteps.has(0),
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Video className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Welcome to Video Export</h3>
            <p className="text-muted-foreground">
              Transform your podcast episodes into engaging social media videos with professional subtitles and branding.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
              <Subtitles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Smart Subtitles</h4>
              <p className="text-sm text-muted-foreground">Auto-generate from transcripts</p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
              <Image className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Branding Overlay</h4>
              <p className="text-sm text-muted-foreground">Add logos and watermarks</p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
              <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Multi-Platform</h4>
              <p className="text-sm text-muted-foreground">Optimized for all platforms</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'upload',
      title: 'Upload Your Video',
      description: 'Select and upload your video file to get started',
      icon: <Play className="w-6 h-6" />,
      completed: completedSteps.has(1),
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Play className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Your Video</h3>
            <p className="text-muted-foreground">
              Start by uploading your video file. We support MP4, MOV, AVI, MKV, and WEBM formats.
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Drag & drop your video here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Choose Video File
            </Button>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium mb-2">💡 Tips for Best Results:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use high-quality source videos (1080p or higher)</li>
              <li>• Keep file size under 500MB for faster processing</li>
              <li>• MP4 format works best for compatibility</li>
              <li>• Ensure good audio quality for subtitle generation</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'subtitles',
      title: 'Add Subtitles',
      description: 'Create engaging subtitles from your transcript or manually',
      icon: <Subtitles className="w-6 h-6" />,
      completed: completedSteps.has(2),
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Subtitles className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Create Subtitles</h3>
            <p className="text-muted-foreground">
              Add professional subtitles to make your content accessible and engaging.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Auto-Generate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Use your podcast transcript to automatically generate timed subtitles.
                </p>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                  Use Episode Transcript
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  Manual Creation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create custom subtitles with precise timing and styling.
                </p>
                <Button variant="outline" className="w-full">
                  Add Subtitle
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <h4 className="font-medium mb-2">🎨 Subtitle Styling Options:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Font & Size</p>
                <p className="text-muted-foreground">Choose readable fonts and sizes</p>
              </div>
              <div>
                <p className="font-medium">Colors & Background</p>
                <p className="text-muted-foreground">High contrast for visibility</p>
              </div>
              <div>
                <p className="font-medium">Position</p>
                <p className="text-muted-foreground">Top, center, or bottom placement</p>
              </div>
              <div>
                <p className="font-medium">Timing</p>
                <p className="text-muted-foreground">Precise start and end times</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'branding',
      title: 'Add Branding',
      description: 'Upload your logo and add text watermarks',
      icon: <Image className="w-6 h-6" />,
      completed: completedSteps.has(3),
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Image className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Add Your Branding</h3>
            <p className="text-muted-foreground">
              Make your videos recognizable with logos and watermarks.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-purple-500" />
                  Logo Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                  <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm mb-2">Upload your logo</p>
                  <Button size="sm" variant="outline">
                    Choose Logo
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Position:</span>
                    <span>Top Right</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Opacity:</span>
                    <span>80%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  Text Watermark
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Watermark Text</label>
                    <input 
                      type="text" 
                      placeholder="@yourhandle" 
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Size</label>
                      <select className="w-full mt-1 px-2 py-1 border rounded text-sm">
                        <option>Small</option>
                        <option>Medium</option>
                        <option>Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Color</label>
                      <select className="w-full mt-1 px-2 py-1 border rounded text-sm">
                        <option>White</option>
                        <option>Black</option>
                        <option>Blue</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
            <h4 className="font-medium mb-2">🎯 Branding Best Practices:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Keep logos small and unobtrusive (10-15% of screen)</li>
              <li>• Use consistent branding across all videos</li>
              <li>• Position logos in corners to avoid content interference</li>
              <li>• Test visibility on different devices and screen sizes</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'format',
      title: 'Choose Output Format',
      description: 'Select the perfect format for your target platform',
      icon: <Target className="w-6 h-6" />,
      completed: completedSteps.has(4),
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Target className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Select Output Format</h3>
            <p className="text-muted-foreground">
              Choose the perfect format for your target social media platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:border-blue-500 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <span className="text-pink-600 font-bold text-lg">9:16</span>
                </div>
                <h4 className="font-medium mb-1">TikTok</h4>
                <p className="text-sm text-muted-foreground">1080×1920</p>
                <Badge variant="secondary" className="mt-2">Vertical</Badge>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:border-blue-500 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">1:1</span>
                </div>
                <h4 className="font-medium mb-1">Instagram</h4>
                <p className="text-sm text-muted-foreground">1080×1080</p>
                <Badge variant="secondary" className="mt-2">Square</Badge>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:border-blue-500 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <span className="text-red-600 font-bold text-lg">16:9</span>
                </div>
                <h4 className="font-medium mb-1">YouTube</h4>
                <p className="text-sm text-muted-foreground">1920×1080</p>
                <Badge variant="secondary" className="mt-2">Widescreen</Badge>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
            <h4 className="font-medium mb-2">📐 Aspect Ratio Preview:</h4>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="w-16 h-12 bg-blue-200 dark:bg-blue-800 rounded border-2 border-blue-400 dark:border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs text-muted-foreground">Original</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="text-center">
                <div className="w-12 h-16 bg-green-200 dark:bg-green-800 rounded border-2 border-green-400 dark:border-green-600 mx-auto mb-2"></div>
                <p className="text-xs text-muted-foreground">TikTok</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              The system will automatically crop or pad your video to fit the selected format.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'process',
      title: 'Process & Export',
      description: 'Generate your final video and download it',
      icon: <Download className="w-6 h-6" />,
      completed: completedSteps.has(5),
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Download className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Process Your Video</h3>
            <p className="text-muted-foreground">
              Review your settings and start processing your video for export.
            </p>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Video className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Video File</p>
                    <p className="text-xs text-muted-foreground">test-video.mp4</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Subtitles className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Subtitles</p>
                    <p className="text-xs text-muted-foreground">5 segments</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Image className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Branding</p>
                    <p className="text-xs text-muted-foreground">2 elements</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">Format</p>
                    <p className="text-xs text-muted-foreground">TikTok (9:16)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Processing Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm">Initializing FFmpeg</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Processing subtitles</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Adding branding</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Converting format</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Download className="w-5 h-5 mr-2" />
                Start Processing
              </Button>
            </div>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    } else {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentStepData.icon}
                {currentStepData.title}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {currentStepData.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              {currentStepData.completed && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
          
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        
        <CardContent>
          {currentStepData.content}
          
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tutorial
              </Button>
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoExportTutorial;
