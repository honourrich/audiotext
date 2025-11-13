import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video,
  Subtitles,
  Image,
  Target,
  Download,
  Play,
  Settings,
  HelpCircle,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  FileVideo,
  Clock,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VideoExportHelpProps {
  className?: string;
}

export const VideoExportHelp: React.FC<VideoExportHelpProps> = ({
  className = ''
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const quickStartSteps = [
    {
      step: 1,
      title: 'Upload Video',
      description: 'Drag and drop your video file or click to browse',
      icon: <FileVideo className="w-5 h-5" />,
      tips: ['Supported formats: MP4, MOV, AVI, MKV, WEBM', 'Maximum file size: 500MB', 'Use high-quality source videos for best results']
    },
    {
      step: 2,
      title: 'Add Subtitles',
      description: 'Use your podcast transcript or create custom subtitles',
      icon: <Subtitles className="w-5 h-5" />,
      tips: ['Auto-generate from episode transcript', 'Manual timing and text editing', 'Style with fonts, colors, and backgrounds']
    },
    {
      step: 3,
      title: 'Add Branding',
      description: 'Upload your logo and add text watermarks',
      icon: <Image className="w-5 h-5" />,
      tips: ['Position logos in corners', 'Keep branding subtle (70-90% opacity)', 'Use consistent branding across videos']
    },
    {
      step: 4,
      title: 'Choose Format',
      description: 'Select the perfect format for your target platform',
      icon: <Target className="w-5 h-5" />,
      tips: ['TikTok: 9:16 vertical', 'Instagram: 1:1 square', 'YouTube: 16:9 widescreen', 'Preview conversion before processing']
    },
    {
      step: 5,
      title: 'Export Video',
      description: 'Process and download your final video',
      icon: <Download className="w-5 h-5" />,
      tips: ['Review all settings before processing', 'Processing time depends on video length', 'Download ready-to-upload video file']
    }
  ];

  const platformFormats = [
    {
      platform: 'TikTok',
      dimensions: '1080×1920',
      aspectRatio: '9:16',
      description: 'Vertical format perfect for short-form content',
      useCase: 'Short videos, dances, tutorials, quick tips',
      color: 'bg-pink-500',
      icon: '📱'
    },
    {
      platform: 'Instagram Square',
      dimensions: '1080×1080',
      aspectRatio: '1:1',
      description: 'Square format for Instagram posts',
      useCase: 'Feed posts, carousel content, product showcases',
      color: 'bg-purple-500',
      icon: '📸'
    },
    {
      platform: 'Instagram Stories',
      dimensions: '1080×1920',
      aspectRatio: '9:16',
      description: 'Vertical format for Instagram Stories',
      useCase: 'Behind-the-scenes, quick updates, story highlights',
      color: 'bg-purple-500',
      icon: '📱'
    },
    {
      platform: 'YouTube',
      dimensions: '1920×1080',
      aspectRatio: '16:9',
      description: 'Widescreen format for YouTube videos',
      useCase: 'Long-form content, tutorials, vlogs, presentations',
      color: 'bg-red-500',
      icon: '📺'
    },
    {
      platform: 'YouTube Shorts',
      dimensions: '1080×1920',
      aspectRatio: '9:16',
      description: 'Vertical format for YouTube Shorts',
      useCase: 'Quick tutorials, highlights, trending content',
      color: 'bg-red-500',
      icon: '📱'
    },
    {
      platform: 'Facebook',
      dimensions: '1920×1080',
      aspectRatio: '16:9',
      description: 'Widescreen format for Facebook videos',
      useCase: 'Business content, announcements, educational videos',
      color: 'bg-blue-500',
      icon: '👥'
    },
    {
      platform: 'Twitter',
      dimensions: '1280×720',
      aspectRatio: '16:9',
      description: 'Optimized format for Twitter videos',
      useCase: 'Quick updates, news, trending topics',
      color: 'bg-sky-500',
      icon: '🐦'
    },
    {
      platform: 'LinkedIn',
      dimensions: '1920×1080',
      aspectRatio: '16:9',
      description: 'Professional format for LinkedIn',
      useCase: 'Professional content, business updates, thought leadership',
      color: 'bg-blue-600',
      icon: '💼'
    }
  ];

  const troubleshootingItems = [
    {
      issue: 'Video won\'t upload',
      solutions: [
        'Check file format (MP4, MOV, AVI, MKV, WEBM)',
        'Ensure file size is under 500MB',
        'Try compressing the video first',
        'Check internet connection stability'
      ],
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />
    },
    {
      issue: 'Subtitles not appearing',
      solutions: [
        'Check subtitle timing (start/end times)',
        'Verify text color contrasts with background',
        'Ensure subtitles are within video duration',
        'Check subtitle positioning settings'
      ],
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />
    },
    {
      issue: 'Branding not visible',
      solutions: [
        'Check logo opacity (should be 70-90%)',
        'Verify logo is positioned within video bounds',
        'Ensure logo file is not corrupted',
        'Try different logo positioning'
      ],
      icon: <AlertTriangle className="w-5 h-5 text-orange-500" />
    },
    {
      issue: 'Processing fails',
      solutions: [
        'Check browser compatibility (Chrome, Firefox, Safari)',
        'Ensure stable internet connection',
        'Try refreshing the page and starting over',
        'Check if video file is corrupted'
      ],
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />
    }
  ];

  const bestPractices = [
    {
      category: 'Content Creation',
      icon: <Lightbulb className="w-5 h-5 text-yellow-500" />,
      practices: [
        'Plan your content with video in mind',
        'Use engaging thumbnails and titles',
        'Keep important content in the center of the frame',
        'Test your content on different devices'
      ]
    },
    {
      category: 'Technical Optimization',
      icon: <Settings className="w-5 h-5 text-blue-500" />,
      practices: [
        'Use high-quality source videos (1080p or higher)',
        'Keep file sizes reasonable for faster processing',
        'Ensure good audio quality for subtitle generation',
        'Use consistent branding across all videos'
      ]
    },
    {
      category: 'Subtitle Best Practices',
      icon: <Subtitles className="w-5 h-5 text-green-500" />,
      practices: [
        'Keep subtitles concise (2-3 lines max)',
        'Use high contrast colors for readability',
        'Avoid placing subtitles over important visual content',
        'Test subtitle visibility on different devices'
      ]
    },
    {
      category: 'Branding Guidelines',
      icon: <Image className="w-5 h-5 text-purple-500" />,
      practices: [
        'Keep logos small and unobtrusive (10-15% of screen)',
        'Use consistent branding across all videos',
        'Position logos in corners to avoid content interference',
        'Test branding visibility on different screen sizes'
      ]
    }
  ];

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Video className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold">Video Export Help Center</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about creating professional videos with audiotext
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="quickstart" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Start
          </TabsTrigger>
          <TabsTrigger value="platforms" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Troubleshooting
          </TabsTrigger>
          <TabsTrigger value="bestpractices" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Best Practices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-6 h-6" />
                What is Video Export?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Video Export is a powerful feature that transforms your podcast episodes into engaging social media videos. 
                It automatically generates subtitles from your transcripts, adds your branding, and optimizes the video 
                for different social media platforms.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <Subtitles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-center mb-1">Smart Subtitles</h4>
                  <p className="text-sm text-muted-foreground text-center">
                    Auto-generate from transcripts with perfect timing
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Image className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-center mb-1">Branding Overlay</h4>
                  <p className="text-sm text-muted-foreground text-center">
                    Add logos and watermarks for brand recognition
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-center mb-1">Multi-Platform</h4>
                  <p className="text-sm text-muted-foreground text-center">
                    Optimized for all major social platforms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-6 h-6" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Upload Your Video</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload your video file and let our system analyze it for optimal processing.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Add Subtitles & Branding</h4>
                    <p className="text-sm text-muted-foreground">
                      Use your podcast transcript to generate subtitles and add your branding elements.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Choose Your Platform</h4>
                    <p className="text-sm text-muted-foreground">
                      Select the perfect format for your target social media platform.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Export & Download</h4>
                    <p className="text-sm text-muted-foreground">
                      Process your video and download the final result ready for social media.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quickstart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Follow these simple steps to create your first video export in minutes.
              </p>
              
              <div className="space-y-6">
                {quickStartSteps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        {step.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">Step {step.step}: {step.title}</h4>
                        <Badge variant="outline">Step {step.step}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{step.description}</p>
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                        <h5 className="font-medium text-sm mb-2">💡 Pro Tips:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {step.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start gap-2">
                              <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6" />
                Platform Formats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Choose the perfect format for your target social media platform.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platformFormats.map((platform, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                          {platform.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{platform.platform}</h4>
                          <p className="text-sm text-muted-foreground">{platform.dimensions}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Aspect Ratio:</span>
                          <Badge variant="outline">{platform.aspectRatio}</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{platform.description}</p>
                        
                        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Best for:</p>
                          <p className="text-xs">{platform.useCase}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-6 h-6" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Common issues and their solutions to help you get the most out of Video Export.
              </p>
              
              <div className="space-y-4">
                {troubleshootingItems.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-red-200 dark:border-l-red-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {item.icon}
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{item.issue}</h4>
                          <div className="space-y-1">
                            {item.solutions.map((solution, solutionIndex) => (
                              <div key={solutionIndex} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">{solution}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bestpractices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-6 h-6" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Expert tips and best practices to create professional, engaging videos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bestPractices.map((category, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        {category.icon}
                        <h4 className="font-medium">{category.category}</h4>
                      </div>
                      <ul className="space-y-2">
                        {category.practices.map((practice, practiceIndex) => (
                          <li key={practiceIndex} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoExportHelp;
