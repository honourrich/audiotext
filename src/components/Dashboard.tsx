import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  FileText, 
  Upload, 
  Settings, 
  User, 
  CreditCard, 
  BarChart3,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  Youtube,
  FileAudio,
  Clock,
  CheckCircle,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import UploadModal from './UploadModal';
import Logo from './Logo';
import UsageDisplay from './UsageDisplay';
// import { EpisodeService, EpisodeData } from '@/lib/episodeService'; // Disabled - using localStorage only
import { migrateLocalStorageToSupabase, hasLocalStorageData } from '@/lib/migrationHelper';

// Local EpisodeData interface for localStorage mode
interface EpisodeData {
  id: string;
  userId: string;
  title: string;
  transcript: string;
  summary: string;
  chapters: any[];
  keywords: string[];
  references: any[];
  quotes?: any[];
  duration: string | number; // Can be either string (formatted) or number (seconds)
  audioUrl?: string;
  youtubeUrl?: string;
  fileSize?: number;
  processingStatus: string;
  processingProgress?: number;
  processingError?: string;
  createdAt: number;
  updatedAt: number;
  wordCount?: number;
  processingTime?: number;
  apiCost?: number;
  hasAIContent?: boolean;
  aiGeneratedAt?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const handleSignOut = () => {
    signOut({ redirectUrl: '/' });
  };
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format duration (handles both number and string)
  const formatDuration = (duration: any): string => {
    // If it's already a formatted string, return it
    if (typeof duration === 'string' && duration.match(/^\d{1,2}:\d{2}$/)) {
      return duration;
    }
    
    // If it's a number (seconds), format it properly
    if (typeof duration === 'number' && duration > 0) {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = Math.floor(duration % 60);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    
    // If duration is 0 or invalid, show error state
    if (typeof duration === 'number' && duration === 0) {
      return '⚠️ No duration';
    }
    
    // Default fallback for undefined/null/invalid
    return 'Unknown';
  };



  // Extract episode loading logic into a reusable function
  const loadEpisodesFromStorage = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      console.log('Loading episodes from localStorage...');
      console.log('User authentication status:', { isSignedIn: !!user, userId: user?.id });
      
      // Load episodes from localStorage first
      const storedEpisodes = localStorage.getItem('episodes');
      const episodesOwner = localStorage.getItem('episodes_owner');
      console.log('Raw stored episodes:', storedEpisodes);
      
      // Wait for user to be loaded before filtering
      if (!user?.id) {
        console.log('No authenticated user yet – waiting for user to load...');
        // Don't clear episodes if user is just not loaded yet
        // Load episodes anyway but don't filter by userId yet
        if (storedEpisodes) {
          try {
            const parsedEpisodes = JSON.parse(storedEpisodes);
            console.log('📦 Loading episodes without user filter (user not loaded yet):', parsedEpisodes.length);
            // Load all episodes temporarily until user loads
            setEpisodes(Array.isArray(parsedEpisodes) ? parsedEpisodes : []);
          } catch (error) {
            console.error('Failed to parse episodes:', error);
            setEpisodes([]);
          }
        } else {
          setEpisodes([]);
        }
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      if (episodesOwner && episodesOwner !== user.id) {
        console.log('Episode cache belongs to another user, clearing it');
        localStorage.removeItem('episodes');
        localStorage.setItem('episodes_owner', user.id);
        setEpisodes([]);
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      if (!episodesOwner) {
        localStorage.setItem('episodes_owner', user.id);
      }
      
      if (storedEpisodes) {
        try {
          const parsedEpisodes = JSON.parse(storedEpisodes);
          console.log('📦 Parsed episodes successfully:', parsedEpisodes);
          console.log('📦 Number of episodes:', parsedEpisodes.length);
          // Filter episodes: include if no userId (legacy) OR userId matches current user
          const parsedForUser = Array.isArray(parsedEpisodes)
            ? parsedEpisodes.filter((ep: any) => {
                // Include episodes without userId (legacy episodes)
                if (!ep?.userId) {
                  return true;
                }
                // Include episodes that match current user
                if (ep.userId === user.id) {
                  return true;
                }
                // Exclude episodes from other users
                console.log(`Excluding episode "${ep.title}" - belongs to user ${ep.userId}, current user is ${user.id}`);
                return false;
              })
            : [];
          
          // List all episodes to debug
          console.log(`📋 Filtered ${parsedForUser.length} episodes for user ${user.id} out of ${parsedEpisodes.length} total`);
          parsedForUser.forEach((ep: any, idx: number) => {
            console.log(`Episode ${idx + 1}: "${ep.title}" (ID: ${ep.id}, userId: ${ep.userId}, status: ${ep.processingStatus})`);
          });
          
          if (parsedForUser.length === 0 && parsedEpisodes.length > 0) {
            console.warn('⚠️ WARNING: All episodes were filtered out!');
            console.warn('Episodes in storage:', parsedEpisodes.map((ep: any) => ({
              title: ep.title,
              userId: ep.userId,
              id: ep.id
            })));
            console.warn('Current user ID:', user.id);
          }
        
        // Deduplicate and merge episodes by checking for same title
        console.log('🔍 Checking for duplicate episodes...');
        const uniqueEpisodesMap = new Map();
        const duplicateCount = new Map<string, number>();
        
        parsedForUser.forEach((ep: any) => {
          // Create a normalized key by removing extra spaces and converting to lowercase
          const key = ep.title.toLowerCase().trim().replace(/\s+/g, ' ');
          
          // Count occurrences
          duplicateCount.set(key, (duplicateCount.get(key) || 0) + 1);
          
          console.log(`Checking episode: "${ep.title}" -> key: "${key}"`);
          
          // If we've seen this title before, merge the data
          if (uniqueEpisodesMap.has(key)) {
            console.log(`⚠️ DUPLICATE FOUND: "${ep.title}"`);
            const existing = uniqueEpisodesMap.get(key);
            
            // Merge properties - keep the more complete version of each property
            const merged = { ...existing };
            
            // Merge transcript - keep the longer one
            if (ep.transcript && (!existing.transcript || ep.transcript.length > existing.transcript.length)) {
              merged.transcript = ep.transcript;
            }
            
            // Merge duration - keep the one with actual duration
            if (ep.duration && (!existing.duration || existing.duration === 0 || existing.duration === '00:00')) {
              merged.duration = ep.duration;
            }
            
            // Merge URLs - keep both
            if (ep.youtubeUrl && !existing.youtubeUrl) {
              merged.youtubeUrl = ep.youtubeUrl;
            }
            if (ep.audioUrl && !existing.audioUrl) {
              merged.audioUrl = ep.audioUrl;
            }
            
            // Merge timestamps - keep the most recent
            if (ep.updatedAt && (!existing.updatedAt || new Date(ep.updatedAt) > new Date(existing.updatedAt))) {
              merged.updatedAt = ep.updatedAt;
            }
            if (ep.createdAt && (!existing.createdAt || new Date(ep.createdAt) > new Date(existing.createdAt))) {
              merged.createdAt = ep.createdAt;
            }
            
            // Merge other properties
            if (ep.summary && !existing.summary) merged.summary = ep.summary;
            if (ep.chapters?.length > 0 && (!existing.chapters?.length || ep.chapters.length > existing.chapters.length)) {
              merged.chapters = ep.chapters;
            }
            if (ep.keywords?.length > 0 && (!existing.keywords?.length || ep.keywords.length > existing.keywords.length)) {
              merged.keywords = ep.keywords;
            }
            
            // Merge processing status
            if (ep.processingStatus === 'completed' && existing.processingStatus !== 'completed') {
              merged.processingStatus = ep.processingStatus;
              merged.processingProgress = ep.processingProgress;
            }
            
            console.log(`🔄 Merging duplicate episode "${ep.title}"`);
            uniqueEpisodesMap.set(key, merged);
          } else {
            uniqueEpisodesMap.set(key, ep);
          }
        });
        
        const deduplicatedEpisodes = Array.from(uniqueEpisodesMap.values());
        
        if (deduplicatedEpisodes.length < parsedEpisodes.length) {
          console.log(`✅ Deduplicated episodes: ${parsedEpisodes.length} -> ${deduplicatedEpisodes.length}`);
          
          // Show which duplicates were removed
          duplicateCount.forEach((count, key) => {
            if (count > 1) {
              console.log(`🗑️ Removed ${count - 1} duplicate(s) for: "${key}"`);
            }
          });
        } else {
          console.log('✅ No duplicates found');
        }
        
        // Fix any episodes with old structure
        const fixedEpisodes = deduplicatedEpisodes.map((ep: any) => {
          // Convert old structure to new structure
          if (ep.source || ep.type || ep.status) {
            console.log('Fixing old episode structure:', ep);
            const fixed = {
              ...ep,
              processingStatus: ep.status || ep.processingStatus || 'completed',
              createdAt: ep.createdAt || ep.created_at || new Date().toISOString(),
              updatedAt: ep.updatedAt || ep.updated_at || new Date().toISOString(),
              // Remove old properties
              source: undefined,
              type: undefined,
              status: undefined,
              created_at: undefined,
              updated_at: undefined
            };
            return fixed;
          }
          
          // Fix missing duration for YouTube episodes
          if (ep.sourceType === 'youtube' && (ep.duration === undefined || ep.duration === null)) {
            console.log('⚠️  Fixing missing duration for YouTube episode:', ep.title);
            ep.duration = 0; // Set to 0 as fallback
            ep.updatedAt = new Date().toISOString();
          }
          
          return ep;
        });
        
        // Always save deduplicated episodes back to localStorage
        console.log(`📊 Original episodes: ${parsedEpisodes.length}, Deduplicated: ${deduplicatedEpisodes.length}, Fixed: ${fixedEpisodes.length}`);
        
        // Save fixed/deduplicated episodes back to localStorage
        localStorage.setItem('episodes', JSON.stringify(fixedEpisodes));
        console.log('💾 Saved deduplicated episodes to localStorage');
        
        setEpisodes(fixedEpisodes);
        } catch (parseError) {
          console.error('Failed to parse episodes from localStorage:', parseError);
          console.error('Raw data:', storedEpisodes);
          setError('Failed to load episodes - data corruption detected');
          setEpisodes([]);
        }
      } else {
        console.log('No episodes found in localStorage, initializing empty episode list.');
        setEpisodes([]);
      }
      
      // TODO: Later migrate to Supabase once RLS is properly configured
      if (user?.id && hasLocalStorageData()) {
        console.log('User authenticated, will migrate to Supabase later...');
        // await migrateLocalStorageToSupabase(user.id);
      }
      
    } catch (error) {
      console.error('Failed to load episodes:', error);
      setError(`Failed to load episodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setEpisodes([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  // Load episodes from localStorage first (temporary fix)
  useEffect(() => {
    loadEpisodesFromStorage(true);
  }, [loadEpisodesFromStorage]);

  // Listen for storage changes (when new episodes are added)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔄 Storage change detected, reloading episodes...');
      loadEpisodesFromStorage(false); // Don't show loading spinner on updates
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when episodes are updated
    window.addEventListener('episodesUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('episodesUpdated', handleStorageChange);
    };
  }, [loadEpisodesFromStorage]);

  // Filter episodes based on search query
  const filteredEpisodes = episodes.filter(episode => 
    episode.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewEpisode = () => {
    setUploadModalOpen(true);
  };

  // Selection handlers
  const handleSelectEpisode = (episodeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEpisodes(prev => [...prev, episodeId]);
    } else {
      setSelectedEpisodes(prev => prev.filter(id => id !== episodeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEpisodes(filteredEpisodes.map(ep => ep.id));
    } else {
      setSelectedEpisodes([]);
    }
  };

  const isAllSelected = filteredEpisodes.length > 0 && selectedEpisodes.length === filteredEpisodes.length;
  const isIndeterminate = selectedEpisodes.length > 0 && selectedEpisodes.length < filteredEpisodes.length;

  // Delete handlers
  const handleDeleteSingle = (episodeId: string) => {
    setEpisodeToDelete(episodeId);
    setDeleteDialogOpen(true);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmDeleteSingle = () => {
    if (episodeToDelete) {
      const updatedEpisodes = episodes.filter(ep => ep.id !== episodeToDelete);
      setEpisodes(updatedEpisodes);
      localStorage.setItem('episodes', JSON.stringify(updatedEpisodes));
      
      // Remove from selection if it was selected
      setSelectedEpisodes(prev => prev.filter(id => id !== episodeToDelete));
      
      // Dispatch custom event to update other components
      window.dispatchEvent(new CustomEvent('episodesUpdated'));
      
      setEpisodeToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const confirmBulkDelete = () => {
    const updatedEpisodes = episodes.filter(ep => !selectedEpisodes.includes(ep.id));
    setEpisodes(updatedEpisodes);
    localStorage.setItem('episodes', JSON.stringify(updatedEpisodes));
    
    // Clear selection
    setSelectedEpisodes([]);
    
    // Dispatch custom event to update other components
    window.dispatchEvent(new CustomEvent('episodesUpdated'));
    
    setBulkDeleteDialogOpen(false);
  };

  // Calculate usage stats
  const completedEpisodes = episodes.filter(ep => ep.processingStatus === 'completed').length;
  const processingEpisodes = episodes.filter(ep => ep.processingStatus === 'processing').length;
  const totalEpisodes = episodes.length;
  const usagePercentage = Math.min((totalEpisodes / 5) * 100, 100); // Assuming 5 episode limit for free tier

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Logo size="md" />

            {/* Search - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder={t('dashboard.searchPlaceholder')}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('navigation.settings')}
                </Link>
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                <span className="sr-only">{t('navigation.notifications')}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <span className="sr-only">{t('navigation.openUserMenu')}</span>
                    <div className="h-full w-full rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 p-3 border-b">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-medium">
                      {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user?.emailAddresses[0]?.emailAddress}</p>
                      <p className="text-xs text-muted-foreground">{t('navigation.freePlan')}</p>
                    </div>
                  </div>


                  {/* Menu Items */}
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('navigation.manageAccount')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/billing" className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t('navigation.billing')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <X className="mr-2 h-4 w-4" />
                    {t('navigation.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-card">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* Search - Mobile */}
                <div className="relative w-full mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    placeholder={t('dashboard.searchPlaceholder')}
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      {t('navigation.settings')}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Bell className="h-4 w-4 mr-2" />
                    {t('navigation.notifications')}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                        <span className="sr-only">{t('navigation.openUserMenu')}</span>
                        <div className="h-full w-full rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                          {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="end">
                      {/* User Info */}
                      <div className="flex items-center space-x-3 p-3 border-b">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-medium">
                          {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user?.emailAddresses[0]?.emailAddress}</p>
                          <p className="text-xs text-muted-foreground">{t('navigation.freePlan')}</p>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          {t('navigation.manageAccount')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/billing" className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4" />
                          {t('navigation.billing')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>
                        <X className="mr-2 h-4 w-4" />
                        {t('navigation.signOut')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <UsageDisplay />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Welcome Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-100 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-bold text-foreground">{t('dashboard.welcome', { name: user?.firstName || 'Creator' })}</h2>
                    <p className="text-muted-foreground">{t('dashboard.welcomeSubtitle')}</p>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleNewEpisode}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('dashboard.newEpisode')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Episodes */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground">{t('dashboard.yourEpisodes')}</h2>
                <div className="flex items-center space-x-2">
                  {selectedEpisodes.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('common.delete')} Selected ({selectedEpisodes.length})
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    {t('dashboard.viewAll')}
                  </Button>
                </div>
              </div>

              {/* Selection Controls */}
              {filteredEpisodes.length > 0 && (
                <div className="flex items-center space-x-2 mb-4 p-3 bg-muted rounded-lg">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(ref) => {
                      if (ref && 'indeterminate' in ref) {
                        (ref as any).indeterminate = isIndeterminate;
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedEpisodes.length === 0 
                      ? t('dashboard.selectAll')
                      : `${selectedEpisodes.length} of ${filteredEpisodes.length} selected`
                    }
                  </span>
                </div>
              )}

              {loading ? (
                <Card className="p-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">Loading episodes...</h3>
                  <p className="text-muted-foreground">Please wait while we load your episodes</p>
                </Card>
              ) : error ? (
                <Card className="p-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">Error loading episodes</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <div className="space-x-2">
                    <Button onClick={() => window.location.reload()}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                    {error?.includes('corruption') && (
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          localStorage.removeItem('episodes');
                          window.location.reload();
                        }}
                      >
                        Clear Data & Restart
                      </Button>
                    )}
                  </div>
                </Card>
              ) : filteredEpisodes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEpisodes.map((episode) => (
                    <Card key={episode.id} className="overflow-hidden hover:shadow-md transition-shadow relative">
                      {/* Selection Checkbox */}
                      <div className="absolute top-3 left-3 z-10">
                        <Checkbox
                          checked={selectedEpisodes.includes(episode.id)}
                          onCheckedChange={(checked) => handleSelectEpisode(episode.id, checked as boolean)}
                          className="bg-background/80 backdrop-blur-sm"
                        />
                      </div>

                      {/* Episode Actions */}
                      <div className="absolute top-3 right-3 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="bg-background/80 backdrop-blur-sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/episode/${episode.id}`} className="flex items-center">
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSingle(episode.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <Link to={`/episode/${episode.id}`}>
                        <div className="relative h-40">
                          <img 
                            src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80" 
                            alt={episode.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 right-2">
                            <Badge className={`${
                              episode.processingStatus === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                              episode.processingStatus === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                              'bg-muted text-muted-foreground'
                            }`}>
                              {episode.processingStatus === 'completed' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Complete</>
                              ) : episode.processingStatus === 'processing' ? (
                                <><Clock className="w-3 h-3 mr-1 animate-spin" /> Processing</>
                              ) : (
                                episode.processingStatus
                              )}
                            </Badge>
                          </div>
                          {(episode.youtubeUrl || episode.audioUrl) && (
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="outline" className="bg-black/50 text-white border-none">
                                {episode.youtubeUrl ? (
                                  <><Youtube className="w-3 h-3 mr-1" /> YouTube</>
                                ) : (
                                  <><FileAudio className="w-3 h-3 mr-1" /> Audio</>
                                )}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium text-foreground mb-1 truncate">{episode.title}</h3>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{new Date(episode.createdAt || Date.now()).toLocaleDateString()}</span>
                            <span>{formatDuration(episode.duration)}</span>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">{t('dashboard.noEpisodes')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try a different search term' : t('dashboard.noEpisodesDescription')}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleNewEpisode}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('dashboard.createEpisode')}
                    </Button>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen}
      />

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this episode? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSingle}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Episodes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedEpisodes.length} selected episode{selectedEpisodes.length > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedEpisodes.length} Episode{selectedEpisodes.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="bg-card border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
            <div className="mb-2 md:mb-0">
              © 2024 audiotext. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
              <a href="#" className="hover:text-foreground">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;