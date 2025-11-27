import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Clock, Calendar, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ContentEditor from '@/components/ContentEditor';
import Logo from '@/components/Logo';

const EpisodePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEpisode = () => {
      try {
        console.log('Loading episode with ID:', id);
        const storedEpisodes = localStorage.getItem('episodes');
        console.log('Stored episodes raw data:', storedEpisodes);
        
        if (storedEpisodes) {
          try {
            const episodes = JSON.parse(storedEpisodes);
            console.log('Parsed episodes successfully:', episodes);
            console.log('Looking for episode ID:', id);
            console.log('Available episode IDs:', episodes.map((ep: any) => ep.id));
            const foundEpisode = episodes.find((ep: any) => ep.id === id);
            console.log('Found episode:', foundEpisode);
            
            // If episode not found, try again after a short delay (for timing issues)
            if (!foundEpisode) {
              console.log('Episode not found, retrying in 1 second...');
              setTimeout(() => {
                const retryEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
                const retryFound = retryEpisodes.find((ep: any) => ep.id === id);
                console.log('Retry - Found episode:', retryFound);
                if (retryFound) {
                  setEpisode(retryFound);
                } else {
                  setError(`Episode not found after retry. Looking for ID: ${id}. Available episodes: ${retryEpisodes.map((ep: any) => ep.id).join(', ')}`);
                }
              }, 1000);
              return;
            }
          
          if (foundEpisode) {
            setEpisode(foundEpisode);
          }
          } catch (parseError) {
            console.error('Failed to parse episodes from localStorage:', parseError);
            setError('Failed to load episodes - data corruption detected');
          }
        } else {
          setError('No episodes found in localStorage');
        }
      } catch (error) {
        console.error('Failed to load episode:', error);
        setError('Failed to load episode data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEpisode();
    } else {
      setError('No episode ID provided');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Episode Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <Logo size="md" />
            </div>

            <div className="flex items-center space-x-4">
              <Badge 
                className={`${
                  episode.processingStatus === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                  episode.processingStatus === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                  'bg-muted text-muted-foreground'
                }`}
              >
                {episode.processingStatus || 'pending'}
              </Badge>
              
              {episode.youtubeUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(episode.youtubeUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Original
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episode Info - Removed duplicate title section */}

      {/* Content Editor */}
      <ContentEditor episodeId={id} />
    </div>
  );
};

export default EpisodePage;
