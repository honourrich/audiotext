import React from 'react';
import PersonalizationSettings from '@/components/PersonalizationSettings';
import PersonalityProfileCard from '@/components/PersonalityProfileCard';
import ResourceLinkManager from '@/components/ResourceLinkManager';
import SocialMediaIntegration from '@/components/SocialMediaIntegration';
import PersonalizationAIAssistant from '@/components/PersonalizationAIAssistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Settings, 
  User, 
  Link, 
  ArrowLeft,
  Sparkles,
  Target,
  BookOpen,
  Zap,
  Share2,
  Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import Logo from '@/components/Logo';

const PersonalizationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <Logo size="md" />
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-full aspect-square overflow-hidden bg-primary",
                    avatarImage: "rounded-full",
                    avatarFallback: "rounded-full bg-primary text-primary-foreground",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Writing Style</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">Personal</div>
                <p className="text-xs text-muted-foreground">
                  From social media
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Brand Voice</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">Active</div>
                <p className="text-xs text-muted-foreground">
                  Consistency enabled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resources</CardTitle>
                <Link className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">0</div>
                <p className="text-xs text-muted-foreground">
                  Links added
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Social Media</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">0</div>
                <p className="text-xs text-muted-foreground">
                  Connected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Personality</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">Custom</div>
                <p className="text-xs text-muted-foreground">
                  AI learned
                </p>
              </CardContent>
            </Card>
          </div>


          {/* Personalization Tabs */}
          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
              <TabsTrigger value="personality" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Personality</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center space-x-2">
                <Share2 className="w-4 h-4" />
                <span>Social Media</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center space-x-2">
                <Link className="w-4 h-4" />
                <span>Resources</span>
              </TabsTrigger>
              <TabsTrigger value="assistant" className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <span>AI Assistant</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <PersonalizationSettings />
            </TabsContent>

            <TabsContent value="personality" className="space-y-6">
              <PersonalityProfileCard />
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <SocialMediaIntegration />
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <ResourceLinkManager />
            </TabsContent>

            <TabsContent value="assistant" className="space-y-6">
              <PersonalizationAIAssistant />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personalization Analytics</CardTitle>
                  <CardDescription>
                    Track how AI personalization is improving your content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">89%</div>
                        <p className="text-sm text-muted-foreground">Style Match Score</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">12</div>
                        <p className="text-sm text-muted-foreground">Episodes Analyzed</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">3</div>
                        <p className="text-sm text-muted-foreground">Active Templates</p>
                      </div>
                    </div>

                    <div className="bg-muted p-6 rounded-lg">
                      <h4 className="font-medium text-foreground mb-4">How Personalization Works</h4>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs">1</div>
                          <div>
                            <p className="font-medium text-foreground">Social Media Analysis</p>
                            <p>We analyze your posts to understand your unique writing style, tone, and voice.</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs">2</div>
                          <div>
                            <p className="font-medium text-foreground">Style Extraction</p>
                            <p>Our AI identifies patterns in your vocabulary, sentence structure, and personality traits.</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs">3</div>
                          <div>
                            <p className="font-medium text-foreground">Content Generation</p>
                            <p>Every show note is generated to match your authentic voice and brand personality.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Pro Tip</p>
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            Connect more social media accounts and add sample content to improve AI accuracy and get 
                            show notes that sound even more like you!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default PersonalizationPage;
