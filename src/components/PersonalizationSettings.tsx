import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Brain, 
  Mic, 
  Target, 
  Link, 
  Settings, 
  User, 
  Sparkles,
  BarChart3,
  Globe,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';
import { useToast } from './ui/use-toast';

interface PersonalizationSettingsProps {
  userId?: string;
}

export default function PersonalizationSettings({ userId = 'demo-user' }: PersonalizationSettingsProps) {
  const { toast } = useToast();
  
  // Local state for demo purposes
  const [settings, setSettings] = useState({
    enable_style_cloning: true,
    enable_brand_voice: true,
    enable_genre_detection: true,
    enable_personality_scoring: true,
    enable_resource_linking: true,
    preferred_genre: ''
  });

  const [personalityProfile] = useState({
    openness: 0.75,
    conscientiousness: 0.68,
    extraversion: 0.82,
    agreeableness: 0.71,
    neuroticism: 0.35,
    avg_sentence_length: 18,
    formality_score: 0.65,
    analyzed_episodes: 3
  });

  const [brandVoiceProfile] = useState({
    brand_name: 'Your Brand',
    formality_score: 0.72,
    technical_level: 0.68,
    enthusiasm_score: 0.85,
    authenticity_score: 0.78,
    brand_keywords: ['innovation', 'technology', 'growth', 'success', 'community', 'impact']
  });

  const [genreTemplates] = useState([
    {
      id: '1',
      genre_name: 'business',
      display_name: 'Business & Entrepreneurship',
      description: 'Professional business content with actionable insights',
      required_sections: ['Key Takeaways', 'Action Items'],
      optional_sections: ['Key Metrics', 'Resources', 'Tools Mentioned']
    },
    {
      id: '2',
      genre_name: 'education',
      display_name: 'Educational & Learning',
      description: 'Structured educational content with clear learning outcomes',
      required_sections: ['Learning Objectives', 'Key Concepts'],
      optional_sections: ['Examples', 'Additional Resources', 'Practice Exercises']
    },
    {
      id: '3',
      genre_name: 'interview',
      display_name: 'Interview & Conversation',
      description: 'Guest-focused content highlighting key insights and quotes',
      required_sections: ['Guest Introduction', 'Key Insights'],
      optional_sections: ['Notable Quotes', 'Guest Background', 'Contact Information']
    }
  ]);

  const [brandContent, setBrandContent] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandUrls, setBrandUrls] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleSettingsUpdate = async (key: string, value: any) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      toast({
        title: "Settings updated",
        description: "Your personalization preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBrandVoiceAnalysis = async () => {
    if (!brandContent.trim()) {
      toast({
        title: "Content required",
        description: "Please provide brand content to analyze.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Brand voice analyzed",
        description: "Your brand voice profile has been updated successfully.",
      });
      
      setBrandContent('');
      setBrandName('');
      setBrandUrls('');
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze brand voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleWritingStyleAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Writing style analyzed",
        description: "Your personality profile has been updated based on your content.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze writing style. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white">
      <div className="flex items-center space-x-3">
        <Sparkles className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Smart Personalization</h1>
      </div>
      
      <p className="text-gray-600">
        Configure AI personalization to match your unique voice, brand, and content style.
      </p>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="brand">Brand Voice</TabsTrigger>
          <TabsTrigger value="genres">Genres</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Personalization Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Writing Style Cloning</Label>
                  <p className="text-sm text-gray-600">
                    Analyze your previous content to match your authentic voice
                  </p>
                </div>
                <Switch
                  checked={settings.enable_style_cloning}
                  onCheckedChange={(checked) => handleSettingsUpdate('enable_style_cloning', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Brand Voice Consistency</Label>
                  <p className="text-sm text-gray-600">
                    Maintain consistent brand personality across all content
                  </p>
                </div>
                <Switch
                  checked={settings.enable_brand_voice}
                  onCheckedChange={(checked) => handleSettingsUpdate('enable_brand_voice', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Genre Detection</Label>
                  <p className="text-sm text-gray-600">
                    Automatically detect and apply genre-specific templates
                  </p>
                </div>
                <Switch
                  checked={settings.enable_genre_detection}
                  onCheckedChange={(checked) => handleSettingsUpdate('enable_genre_detection', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Personality Scoring</Label>
                  <p className="text-sm text-gray-600">
                    Score generated content against your personality profile
                  </p>
                </div>
                <Switch
                  checked={settings.enable_personality_scoring}
                  onCheckedChange={(checked) => handleSettingsUpdate('enable_personality_scoring', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Resource Link Automation</Label>
                  <p className="text-sm text-gray-600">
                    Automatically detect and link mentioned resources
                  </p>
                </div>
                <Switch
                  checked={settings.enable_resource_linking}
                  onCheckedChange={(checked) => handleSettingsUpdate('enable_resource_linking', checked)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Preferred Genre</Label>
                <Select
                  value={settings.preferred_genre}
                  onValueChange={(value) => handleSettingsUpdate('preferred_genre', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect genre</SelectItem>
                    {genreTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.genre_name}>
                        {template.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personality Tab */}
        <TabsContent value="personality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Personality Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Openness</Label>
                      <span className="text-sm text-gray-600">
                        {Math.round(personalityProfile.openness * 100)}%
                      </span>
                    </div>
                    <Progress value={personalityProfile.openness * 100} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Conscientiousness</Label>
                      <span className="text-sm text-gray-600">
                        {Math.round(personalityProfile.conscientiousness * 100)}%
                      </span>
                    </div>
                    <Progress value={personalityProfile.conscientiousness * 100} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Extraversion</Label>
                      <span className="text-sm text-gray-600">
                        {Math.round(personalityProfile.extraversion * 100)}%
                      </span>
                    </div>
                    <Progress value={personalityProfile.extraversion * 100} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Agreeableness</Label>
                      <span className="text-sm text-gray-600">
                        {Math.round(personalityProfile.agreeableness * 100)}%
                      </span>
                    </div>
                    <Progress value={personalityProfile.agreeableness * 100} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Neuroticism</Label>
                      <span className="text-sm text-gray-600">
                        {Math.round(personalityProfile.neuroticism * 100)}%
                      </span>
                    </div>
                    <Progress value={personalityProfile.neuroticism * 100} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {personalityProfile.avg_sentence_length}
                    </div>
                    <div className="text-sm text-gray-600">Avg. Sentence Length</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(personalityProfile.formality_score * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Formality Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {personalityProfile.analyzed_episodes}
                    </div>
                    <div className="text-sm text-gray-600">Episodes Analyzed</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleWritingStyleAnalysis}
                    disabled={analyzing}
                    className="w-full"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Re-analyze Writing Style
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand Voice Tab */}
        <TabsContent value="brand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="w-5 h-5" />
                <span>Brand Voice Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {brandVoiceProfile.brand_name}
                  </h3>
                  <Badge variant="default">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(brandVoiceProfile.formality_score * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Formality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(brandVoiceProfile.technical_level * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Technical Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(brandVoiceProfile.enthusiasm_score * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Enthusiasm</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(brandVoiceProfile.authenticity_score * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Authenticity</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Brand Keywords</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {brandVoiceProfile.brand_keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Analyze New Brand Content</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="brandName">Brand Name (Optional)</Label>
                    <Input
                      id="brandName"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Your brand or company name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="brandContent">Brand Content</Label>
                    <Textarea
                      id="brandContent"
                      value={brandContent}
                      onChange={(e) => setBrandContent(e.target.value)}
                      placeholder="Paste your website content, marketing materials, or social media posts here..."
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="brandUrls">Source URLs (Optional)</Label>
                    <Textarea
                      id="brandUrls"
                      value={brandUrls}
                      onChange={(e) => setBrandUrls(e.target.value)}
                      placeholder="https://yourwebsite.com&#10;https://twitter.com/yourbrand&#10;https://linkedin.com/company/yourbrand"
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleBrandVoiceAnalysis}
                    disabled={analyzing}
                    className="w-full"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Brand Voice...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analyze Brand Voice
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Genres Tab */}
        <TabsContent value="genres" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {genreTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{template.display_name}</span>
                    {settings.preferred_genre === template.genre_name && (
                      <Badge variant="default">Preferred</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {template.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Required Sections</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.required_sections.map((section, index) => (
                          <Badge key={index} variant="default" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {template.optional_sections.length > 0 && (
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Optional Sections</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.optional_sections.map((section, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}