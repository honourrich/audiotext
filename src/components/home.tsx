import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileAudio,
  Youtube,
  Zap,
  Edit3,
  BarChart3,
  Brain,
  Settings,
  Sparkles,
  FileText,
} from "lucide-react";
import UploadModal from "./UploadModal";
import EpisodeList from "./EpisodeList";
import { UserButton, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { OnboardingAPI } from "@/lib/onboarding";
import Logo from './Logo';

function Home() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useUser();
  const navigate = useNavigate();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  const [stats, setStats] = useState({
    totalEpisodes: 0,
    processingTime: "0 hours",
    subscriptionTier: "Free",
    usageThisMonth: 0,
    usageLimit: 2,
  });

  // Check onboarding status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user?.id) {
        try {
          const completed = await OnboardingAPI.hasCompletedOnboarding(user.id);
          setHasCompletedOnboarding(completed);
          
          // Redirect to onboarding if not completed
          if (!completed) {
            navigate('/onboarding');
          }
        } catch (error) {
          console.error('Failed to check onboarding status:', error);
          setHasCompletedOnboarding(true); // Default to completed on error
        }
      }
    };

    checkOnboardingStatus();
  }, [user?.id, navigate]);

  // Load real stats from localStorage
  useEffect(() => {
    const loadStats = () => {
      try {
        // Get episodes from localStorage
        const episodesData = localStorage.getItem('episodes');
        const episodes = episodesData ? JSON.parse(episodesData) : [];
        
        // Filter episodes for current user
        const userEpisodes = episodes.filter((ep: any) => ep.userId === user?.id);
        
        // Calculate total processing time (simulated from episode durations)
        const totalMinutes = userEpisodes.reduce((acc: number, ep: any) => {
          const duration = ep.duration || '0:00';
          const [mins] = duration.split(':').map(Number);
          return acc + (mins || 0);
        }, 0);
        
        const hours = Math.floor(totalMinutes / 60);
        const processingTime = hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : `${totalMinutes} min`;

        setStats({
          totalEpisodes: userEpisodes.length,
          processingTime,
          subscriptionTier: "Free",
          usageThisMonth: userEpisodes.length,
          usageLimit: 5, // Free tier limit
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    if (user?.id) {
      loadStats();
      
      // Listen for episodes updates
      const handleEpisodesUpdate = () => {
        loadStats();
      };
      window.addEventListener('episodesUpdated', handleEpisodesUpdate);
      
      return () => {
        window.removeEventListener('episodesUpdated', handleEpisodesUpdate);
      };
    }
  }, [user?.id]);

  // Show loading while checking onboarding status
  if (hasCompletedOnboarding === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">{stats.subscriptionTier} Plan</Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/personalization')}
                className="flex items-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>Personalization</span>
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800">
                  <Sparkles className="w-3 h-3" />
                </Badge>
              </Button>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
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

      {/* Welcome Message */}
      {user && (
        <div className="bg-blue-50 border-b">
          <div className="container mx-auto px-4 py-3">
            <p className="text-blue-800">
              Welcome back,{" "}
              {user.firstName || user.emailAddresses[0].emailAddress}!
              <span className="ml-2 text-blue-600">
                Ready to create amazing show notes?
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex space-x-4 border-b mb-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 ${
              activeTab === "dashboard"
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("episodes")}
            className={`px-4 py-2 ${
              activeTab === "episodes"
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Episodes
          </button>
        </div>

        {activeTab === "dashboard" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Episodes
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalEpisodes}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.usageThisMonth}/{stats.usageLimit} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Processing Time
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.processingTime}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total content processed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Subscription
                  </CardTitle>
                  <Badge variant="outline">{stats.subscriptionTier}</Badge>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/billing')}
                  >
                    Upgrade Plan
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Get more episodes and features
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setShowUploadModal(true)}>
                  <CardHeader>
                    <Upload className="w-8 h-8 text-blue-600 mb-2" />
                    <CardTitle>Upload Audio</CardTitle>
                    <CardDescription>
                      Upload your podcast or audio file
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setShowUploadModal(true)}>
                  <CardHeader>
                    <FileAudio className="w-8 h-8 text-blue-600 mb-2" />
                    <CardTitle>Add New Episode</CardTitle>
                    <CardDescription>
                      Upload audio files or import from YouTube
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate('/analytics')}>
                  <CardHeader>
                    <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
                    <CardTitle>View Analytics</CardTitle>
                    <CardDescription>
                      See insights about your content
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Recent Episodes */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Episodes</h2>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("episodes")}
                >
                  View All
                </Button>
              </div>
              <EpisodeList limit={5} />
            </div>
          </>
        )}

        {activeTab === "episodes" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">All Episodes</h2>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                New Episode
              </Button>
            </div>
            <EpisodeList />
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
      />
    </div>
  );
}

export default Home;
