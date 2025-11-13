import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  FileText, 
  Users, 
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const AnalyticsPage: React.FC = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const loadEpisodes = () => {
      try {
        const storedEpisodes = localStorage.getItem('episodes');
        if (storedEpisodes) {
          setEpisodes(JSON.parse(storedEpisodes));
        }
      } catch (error) {
        console.error('Failed to load episodes:', error);
      }
    };

    loadEpisodes();
  }, []);

  // Calculate analytics data
  const totalEpisodes = episodes.length;
  const completedEpisodes = episodes.filter(ep => ep.status === 'completed').length;
  const processingEpisodes = episodes.filter(ep => ep.status === 'processing').length;
  
  const totalDuration = episodes.reduce((acc, ep) => {
    if (ep.duration) {
      const [minutes, seconds] = ep.duration.split(':').map(Number);
      return acc + (minutes * 60) + (seconds || 0);
    }
    return acc;
  }, 0);

  const avgDuration = totalEpisodes > 0 ? Math.round(totalDuration / totalEpisodes / 60) : 0;
  
  const recentEpisodes = episodes
    .filter(ep => {
      const episodeDate = new Date(ep.createdAt || Date.now());
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return episodeDate >= thirtyDaysAgo;
    })
    .length;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getChangeIndicator = (current: number, previous: number) => {
    if (current > previous) return { icon: ArrowUp, color: 'text-green-600', text: 'increase' };
    if (current < previous) return { icon: ArrowDown, color: 'text-red-600', text: 'decrease' };
    return { icon: Minus, color: 'text-gray-600', text: 'no change' };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('navigation.dashboard')}</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-muted-foreground">Track your content creation progress</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                {timeRange === '7d' ? 'Last 7 days' : 
                 timeRange === '30d' ? 'Last 30 days' : 
                 'Last 90 days'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEpisodes}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUp className="w-3 h-3 mr-1 text-green-600" />
                <span>+{recentEpisodes} this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedEpisodes}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>{totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0}% completion rate</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>Avg: {avgDuration}m per episode</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{processingEpisodes}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>Currently in queue</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Episode Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-foreground">Completed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-foreground">{completedEpisodes}</span>
                        <Badge variant="secondary">{totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0}%</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-foreground">Processing</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-foreground">{processingEpisodes}</span>
                        <Badge variant="secondary">{totalEpisodes > 0 ? Math.round((processingEpisodes / totalEpisodes) * 100) : 0}%</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['audio', 'youtube', 'demo'].map(source => {
                      const count = episodes.filter(ep => ep.type === source || ep.source === source).length;
                      const percentage = totalEpisodes > 0 ? Math.round((count / totalEpisodes) * 100) : 0;
                      
                      return (
                        <div key={source} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              source === 'audio' ? 'bg-purple-500' :
                              source === 'youtube' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}></div>
                            <span className="text-sm capitalize text-foreground">{source}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-foreground">{count}</span>
                            <Badge variant="secondary">{percentage}%</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="episodes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Episodes</CardTitle>
              </CardHeader>
              <CardContent>
                {episodes.length > 0 ? (
                  <div className="space-y-4">
                    {episodes.slice(0, 10).map((episode) => (
                      <div key={episode.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{episode.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span>{new Date(episode.createdAt || Date.now()).toLocaleDateString()}</span>
                            <span>{episode.duration || '00:00'}</span>
                            <Badge variant={
                              episode.status === 'completed' ? 'default' :
                              episode.status === 'processing' ? 'secondary' :
                              'outline'
                            }>
                              {episode.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {episode.type || episode.source || 'unknown'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No episodes found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Processing Time</span>
                      <span className="font-medium text-foreground">~3-5 minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-medium text-foreground">{totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 100}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Queue Length</span>
                      <span className="font-medium text-foreground">{processingEpisodes} episodes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Most Active Day</span>
                      <span className="font-medium text-foreground">Today</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Preferred Format</span>
                      <span className="font-medium text-foreground">
                        {episodes.filter(ep => ep.type === 'audio').length > episodes.filter(ep => ep.type === 'youtube').length ? 'Audio Files' : 'YouTube'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Content Created</span>
                      <span className="font-medium text-foreground">{formatDuration(totalDuration)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsPage;