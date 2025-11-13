import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalityProfileCard from "@/components/PersonalityProfileCard";
import ResourceLinkManager from "@/components/ResourceLinkManager";
import {
  Brain,
  Sparkles,
  Target,
  BarChart3,
  Mic,
  Link,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

export default function SmartPersonalizationDemo() {
  const [activeDemo, setActiveDemo] = useState("overview");

  // Mock data for demonstration
  const mockPersonalityProfile = {
    id: "1",
    user_id: "demo-user",
    openness: 0.75,
    conscientiousness: 0.82,
    extraversion: 0.65,
    agreeableness: 0.78,
    neuroticism: 0.35,
    avg_sentence_length: 18,
    vocabulary_complexity: 0.68,
    formality_score: 0.72,
    enthusiasm_score: 0.85,
    technical_depth: 0.79,
    writing_patterns: {},
    analyzed_episodes: 12,
    last_analysis_at: new Date().toISOString(),
  };

  const mockBrandVoice = {
    brand_name: "TechTalk Podcast",
    formality_score: 0.68,
    technical_level: 0.82,
    enthusiasm_score: 0.75,
    authenticity_score: 0.88,
    brand_keywords: ["innovation", "technology", "startup", "AI", "future"],
  };

  const mockGenreTemplates = [
    { name: "business", display: "Business & Entrepreneurship", active: true },
    { name: "education", display: "Educational & Learning", active: false },
    { name: "interview", display: "Interview & Conversation", active: false },
  ];

  const mockPersonalizationResults = {
    detectedGenre: "business",
    personalityFitScore: 0.89,
    brandVoiceScore: 0.92,
    extractedResources: 5,
    appliedTemplate: "Business & Entrepreneurship",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart Content Personalization Engine
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            AI-powered personalization that adapts to your unique voice, brand,
            and content style for authentic show notes generation.
          </p>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <Brain className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Writing Style Cloning
              </h3>
              <p className="text-sm text-blue-700">
                Analyzes 5-10 episodes to match your authentic voice
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <Mic className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold text-purple-900">
                Brand Voice Consistency
              </h3>
              <p className="text-sm text-purple-700">
                LIWC analysis ensures consistent brand personality
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold text-green-900">
                Dynamic Genre Templates
              </h3>
              <p className="text-sm text-green-700">
                Auto-detects and applies genre-specific structures
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <Link className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-semibold text-orange-900">
                Resource Automation
              </h3>
              <p className="text-sm text-orange-700">
                NLP entity recognition for automatic resource linking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Tabs */}
        <Tabs
          value={activeDemo}
          onValueChange={setActiveDemo}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="personality">Personality Analysis</TabsTrigger>
            <TabsTrigger value="brand">Brand Voice</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Personalization Pipeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          1
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">Content Analysis</div>
                        <div className="text-sm text-gray-600">
                          Analyze writing patterns and personality traits
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">
                          2
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">Genre Detection</div>
                        <div className="text-sm text-gray-600">
                          Auto-classify content and select appropriate template
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-green-600">
                          3
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">
                          Personalized Generation
                        </div>
                        <div className="text-sm text-gray-600">
                          Generate content matching your unique style
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-orange-600">
                          4
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">Resource Enhancement</div>
                        <div className="text-sm text-gray-600">
                          Automatically link mentioned resources and tools
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        89%
                      </div>
                      <div className="text-sm text-gray-600">
                        Personality Match
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        92%
                      </div>
                      <div className="text-sm text-gray-600">
                        Brand Consistency
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        95%
                      </div>
                      <div className="text-sm text-gray-600">
                        Genre Accuracy
                      </div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        12
                      </div>
                      <div className="text-sm text-gray-600">
                        Episodes Analyzed
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Content Quality Score</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: "94%" }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="personality">
            <PersonalityProfileCard
              profile={mockPersonalityProfile}
              showDetails={true}
            />
          </TabsContent>

          <TabsContent value="brand" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="w-5 h-5" />
                  <span>Brand Voice Profile</span>
                  <Badge variant="default" className="ml-auto">
                    Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">68%</div>
                    <div className="text-sm text-gray-600">Formality</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">82%</div>
                    <div className="text-sm text-gray-600">Technical Level</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      75%
                    </div>
                    <div className="text-sm text-gray-600">Enthusiasm</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      88%
                    </div>
                    <div className="text-sm text-gray-600">Authenticity</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Brand Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {mockBrandVoice.brand_keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">LIWC Analysis Results</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      Positive Emotion:{" "}
                      <span className="font-medium">High</span>
                    </div>
                    <div>
                      Social Words:{" "}
                      <span className="font-medium">Moderate</span>
                    </div>
                    <div>
                      Achievement Focus:{" "}
                      <span className="font-medium">High</span>
                    </div>
                    <div>
                      Cognitive Processing:{" "}
                      <span className="font-medium">High</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Personalization Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Detected Genre</span>
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      Business & Entrepreneurship
                    </div>
                    <div className="text-sm text-gray-600">95% confidence</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Personality Fit</span>
                    </div>
                    <div className="text-lg font-semibold text-purple-600">
                      89%
                    </div>
                    <div className="text-sm text-gray-600">Excellent match</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Link className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Resources Found</span>
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      5 Resources
                    </div>
                    <div className="text-sm text-gray-600">Auto-linked</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Applied Personalizations</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>
                        Business genre template applied with action items and
                        key takeaways
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>
                        Formal tone (72%) maintained throughout content
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Average sentence length adjusted to 18 words</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Brand keywords naturally integrated</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>
                        Technical depth (79%) preserved for target audience
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">
                    Sample Generated Content
                  </h4>
                  <div className="text-sm text-green-700 space-y-2">
                    <p>
                      <strong>Summary:</strong> This episode explores
                      cutting-edge AI innovations transforming modern business
                      operations. Key insights include strategic implementation
                      frameworks, ROI optimization techniques, and scalable
                      automation solutions for enterprise growth.
                    </p>
                    <p>
                      <strong>Key Takeaways:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>
                        AI adoption requires strategic planning and clear
                        success metrics
                      </li>
                      <li>
                        Implementation should focus on high-impact, low-risk use
                        cases initially
                      </li>
                      <li>
                        Cross-functional collaboration drives successful AI
                        integration
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
