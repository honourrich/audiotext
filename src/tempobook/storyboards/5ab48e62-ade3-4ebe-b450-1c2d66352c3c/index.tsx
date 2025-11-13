import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Upload,
  FileText,
  Youtube,
  FileAudio,
  CheckCircle,
  Clock,
  Download,
  Edit3,
  BarChart3,
} from "lucide-react";

export default function CompleteAppDemo() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
  });

  useEffect(() => {
    // Load episodes from localStorage to show real data
    try {
      const storedEpisodes = localStorage.getItem("episodes");
      if (storedEpisodes) {
        const parsedEpisodes = JSON.parse(storedEpisodes);
        setEpisodes(parsedEpisodes.slice(0, 3)); // Show first 3 episodes

        setStats({
          total: parsedEpisodes.length,
          completed: parsedEpisodes.filter(
            (ep: any) => ep.status === "completed",
          ).length,
          processing: parsedEpisodes.filter(
            (ep: any) => ep.status === "processing",
          ).length,
        });
      }
    } catch (error) {
      console.error("Failed to load episodes:", error);
    }
  }, []);

  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Smart Upload System",
      description:
        "Upload audio files or paste YouTube URLs for automatic processing",
      status: "✅ Functional",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "AI Transcription",
      description: "OpenAI Whisper API integration for accurate speech-to-text",
      status: "✅ Functional",
    },
    {
      icon: <Edit3 className="w-6 h-6" />,
      title: "Content Editor",
      description: "Edit transcripts, summaries, chapters, and keywords",
      status: "✅ Functional",
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Export Manager",
      description: "Export to multiple formats and social media templates",
      status: "✅ Functional",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Real-time Processing",
      description: "Live progress tracking with detailed status updates",
      status: "✅ Functional",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI Content Generation",
      description: "Automated summaries, chapters, and keyword extraction",
      status: "✅ Functional",
    },
  ];

  return (
    <div className="bg-white min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              ShowNote AI - Fully Functional
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete podcast and YouTube content management platform with real
            AI processing, file uploads, and content generation capabilities.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.total}
              </div>
              <div className="text-gray-600">Total Episodes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.completed}
              </div>
              <div className="text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.processing}
              </div>
              <div className="text-gray-600">Processing</div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Functional Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      {feature.icon}
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {feature.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Episodes */}
        {episodes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Episodes (Real Data)
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {episodes.map((episode) => (
                <Card key={episode.id} className="overflow-hidden">
                  <div className="relative h-32">
                    <img
                      src={
                        episode.videoInfo?.thumbnail ||
                        "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80"
                      }
                      alt={episode.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge
                        className={`${
                          episode.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : episode.status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {episode.status === "completed" ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" /> Complete
                          </>
                        ) : episode.status === "processing" ? (
                          <>
                            <Clock className="w-3 h-3 mr-1 animate-spin" />{" "}
                            Processing
                          </>
                        ) : (
                          episode.status
                        )}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge
                        variant="outline"
                        className="bg-black/50 text-white border-none"
                      >
                        {episode.source === "youtube" ? (
                          <>
                            <Youtube className="w-3 h-3 mr-1" /> YouTube
                          </>
                        ) : episode.source === "file" ? (
                          <>
                            <FileAudio className="w-3 h-3 mr-1" /> Audio
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" /> Demo
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 truncate">
                      {episode.title}
                    </h3>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {new Date(
                          episode.createdAt || Date.now(),
                        ).toLocaleDateString()}
                      </span>
                      <span>{episode.duration || "00:00"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Technical Implementation */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
              Technical Implementation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Backend Services</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Supabase Edge Functions for YouTube processing</li>
                  <li>• OpenAI Whisper API for audio transcription</li>
                  <li>• GPT-4 for content generation and summarization</li>
                  <li>• Real-time progress tracking and error handling</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Frontend Features</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• React with TypeScript for type safety</li>
                  <li>• Real file upload with drag & drop</li>
                  <li>• Live content editing and auto-save</li>
                  <li>• Multi-format export system</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            The app is now fully functional with real AI processing, file
            uploads, and content generation.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/onboarding")}
            >
              Try Onboarding
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
