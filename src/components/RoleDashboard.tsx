import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { CollaborationAPI } from '../lib/collaboration';
import type { 
  Workspace, 
  TeamMember, 
  UserRole,
  WorkflowStatus 
} from '../types/collaboration';
import { STATUS_COLORS, ROLE_PERMISSIONS } from '../types/collaboration';

interface RoleDashboardProps {
  currentUserId: string;
  userRole: UserRole;
  workspaceId: string;
}

export default function RoleDashboard({ 
  currentUserId, 
  userRole, 
  workspaceId 
}: RoleDashboardProps) {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<WorkflowStatus | 'all'>('all');

  const permissions = ROLE_PERMISSIONS[userRole];

  useEffect(() => {
    loadDashboardData();
  }, [workspaceId, userRole]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check if we're in demo mode (mock IDs)
      const isDemoMode = workspaceId.startsWith('demo-');
      
      const [episodesData, teamData] = await Promise.all([
        // Load episodes based on role
        loadEpisodesForRole(),
        permissions.canManageTeam && !isDemoMode ? 
          CollaborationAPI.getTeamMembers(workspaceId).catch(() => []) : 
          Promise.resolve(getMockTeamMembers())
      ]);

      setEpisodes(episodesData);
      setTeamMembers(teamData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Load mock data on error
      setEpisodes(await loadEpisodesForRole());
      setTeamMembers(getMockTeamMembers());
    } finally {
      setLoading(false);
    }
  };

  const loadEpisodesForRole = async () => {
    // This would be implemented based on your episodes table structure
    // For now, returning mock data
    return [
      {
        id: '1',
        title: 'Episode 1: Getting Started',
        current_status: 'draft',
        assigned_to: currentUserId,
        due_date: '2024-01-15',
        collaborators: [],
        updated_at: '2024-01-10'
      },
      {
        id: '2',
        title: 'Episode 2: Advanced Topics',
        current_status: 'in_review',
        assigned_to: 'other-user',
        due_date: '2024-01-20',
        collaborators: [],
        updated_at: '2024-01-12'
      }
    ];
  };

  const getMockTeamMembers = (): TeamMember[] => {
    return [
      {
        id: '1',
        user_id: 'user-1',
        workspace_id: workspaceId,
        role: 'host',
        status: 'active',
        invited_by: null,
        permissions: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: 'user-1',
          email: 'host@example.com',
          full_name: 'John Host',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=host'
        }
      },
      {
        id: '2',
        user_id: 'user-2',
        workspace_id: workspaceId,
        role: 'editor',
        status: 'active',
        invited_by: 'user-1',
        permissions: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: 'user-2',
          email: 'editor@example.com',
          full_name: 'Sarah Editor',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor'
        }
      },
      {
        id: '3',
        user_id: 'user-3',
        workspace_id: workspaceId,
        role: 'marketer',
        status: 'active',
        invited_by: 'user-1',
        permissions: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: 'user-3',
          email: 'marketer@example.com',
          full_name: 'Mike Marketer',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marketer'
        }
      }
    ];
  };

  const filteredEpisodes = episodes.filter(episode => 
    filter === 'all' || episode.current_status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
          </h1>
          <p className="text-gray-600">
            {getRoleDashboardDescription(userRole)}
          </p>
        </div>
        
        {permissions.canCreateEpisodes && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Episode
          </Button>
        )}
      </div>

      {/* Role-specific content */}
      {userRole === 'host' && <HostDashboard 
        episodes={filteredEpisodes}
        teamMembers={teamMembers}
        filter={filter}
        onFilterChange={setFilter}
      />}
      
      {userRole === 'editor' && <EditorDashboard 
        episodes={filteredEpisodes}
        filter={filter}
        onFilterChange={setFilter}
      />}
      
      {userRole === 'marketer' && <MarketerDashboard 
        episodes={filteredEpisodes}
        filter={filter}
        onFilterChange={setFilter}
      />}
      
      {userRole === 'va' && <VADashboard 
        episodes={filteredEpisodes}
        filter={filter}
        onFilterChange={setFilter}
      />}
    </div>
  );
}

// Host Dashboard Component
function HostDashboard({ 
  episodes, 
  teamMembers, 
  filter, 
  onFilterChange 
}: {
  episodes: any[];
  teamMembers: TeamMember[];
  filter: WorkflowStatus | 'all';
  onFilterChange: (filter: WorkflowStatus | 'all') => void;
}) {
  const pendingApprovals = episodes.filter(e => e.current_status === 'in_review').length;
  const publishedThisWeek = episodes.filter(e => 
    e.current_status === 'published' && 
    new Date(e.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="episodes">Episodes</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Episodes</p>
                  <p className="text-2xl font-bold">{episodes.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingApprovals}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published This Week</p>
                  <p className="text-2xl font-bold text-green-600">{publishedThisWeek}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Approval Queue */}
        {pendingApprovals > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Approval Queue ({pendingApprovals})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {episodes
                  .filter(e => e.current_status === 'in_review')
                  .map(episode => (
                    <div key={episode.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{episode.title}</h4>
                        <p className="text-sm text-gray-600">
                          Due: {new Date(episode.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                        <Button size="sm">
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="episodes">
        <EpisodesList 
          episodes={episodes} 
          filter={filter} 
          onFilterChange={onFilterChange}
          showActions={true}
        />
      </TabsContent>

      <TabsContent value="team">
        <TeamManagement teamMembers={teamMembers} />
      </TabsContent>

      <TabsContent value="analytics">
        <AnalyticsDashboard episodes={episodes} />
      </TabsContent>
    </Tabs>
  );
}

// Editor Dashboard Component
function EditorDashboard({ 
  episodes, 
  filter, 
  onFilterChange 
}: {
  episodes: any[];
  filter: WorkflowStatus | 'all';
  onFilterChange: (filter: WorkflowStatus | 'all') => void;
}) {
  const reviewQueue = episodes.filter(e => e.current_status === 'in_review');
  const needsChanges = episodes.filter(e => e.current_status === 'needs_changes');

  return (
    <div className="space-y-6">
      {/* Editor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Review Queue</p>
                <p className="text-2xl font-bold text-blue-600">{reviewQueue.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Changes</p>
                <p className="text-2xl font-bold text-orange-600">{needsChanges.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">3</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reviewQueue.map(episode => (
              <div key={episode.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">High Priority</Badge>
                  <div>
                    <h4 className="font-medium">{episode.title}</h4>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(episode.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    Request Changes
                  </Button>
                  <Button size="sm">
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EpisodesList 
        episodes={episodes} 
        filter={filter} 
        onFilterChange={onFilterChange}
        showActions={true}
      />
    </div>
  );
}

// Marketer Dashboard Component
function MarketerDashboard({ 
  episodes, 
  filter, 
  onFilterChange 
}: {
  episodes: any[];
  filter: WorkflowStatus | 'all';
  onFilterChange: (filter: WorkflowStatus | 'all') => void;
}) {
  const publishedEpisodes = episodes.filter(e => e.current_status === 'published');

  return (
    <div className="space-y-6">
      {/* Marketing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready for Marketing</p>
                <p className="text-2xl font-bold text-green-600">{publishedEpisodes.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Social Posts Created</p>
                <p className="text-2xl font-bold text-blue-600">12</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Campaigns Active</p>
                <p className="text-2xl font-bold text-purple-600">5</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="w-6 h-6 mb-2" />
              Social Media Export
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Calendar className="w-6 h-6 mb-2" />
              Campaign Planner
            </Button>
          </div>
        </CardContent>
      </Card>

      <EpisodesList 
        episodes={publishedEpisodes} 
        filter="published" 
        onFilterChange={onFilterChange}
        showActions={false}
      />
    </div>
  );
}

// VA Dashboard Component
function VADashboard({ 
  episodes, 
  filter, 
  onFilterChange 
}: {
  episodes: any[];
  filter: WorkflowStatus | 'all';
  onFilterChange: (filter: WorkflowStatus | 'all') => void;
}) {
  const myTasks = episodes.filter(e => e.assigned_to === 'current-user-id');
  const drafts = episodes.filter(e => e.current_status === 'draft');

  return (
    <div className="space-y-6">
      {/* VA Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Tasks</p>
                <p className="text-2xl font-bold text-blue-600">{myTasks.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts Created</p>
                <p className="text-2xl font-bold text-green-600">{drafts.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hours This Week</p>
                <p className="text-2xl font-bold text-purple-600">24</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Queue */}
      <Card>
        <CardHeader>
          <CardTitle>My Task Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myTasks.map(episode => (
              <div key={episode.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{episode.title}</h4>
                  <p className="text-sm text-gray-600">
                    Due: {new Date(episode.due_date).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm">
                  Start Work
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EpisodesList 
        episodes={episodes} 
        filter={filter} 
        onFilterChange={onFilterChange}
        showActions={false}
      />
    </div>
  );
}

// Shared Components
function EpisodesList({ 
  episodes, 
  filter, 
  onFilterChange, 
  showActions 
}: {
  episodes: any[];
  filter: WorkflowStatus | 'all';
  onFilterChange: (filter: WorkflowStatus | 'all') => void;
  showActions: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Episodes</CardTitle>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => onFilterChange(e.target.value as any)}
              className="px-3 py-1 border rounded"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="needs_changes">Needs Changes</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {episodes.map(episode => (
            <div key={episode.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge className={STATUS_COLORS[episode.current_status as WorkflowStatus]}>
                  {episode.current_status.replace('_', ' ')}
                </Badge>
                <div>
                  <h4 className="font-medium">{episode.title}</h4>
                  <p className="text-sm text-gray-600">
                    Updated: {new Date(episode.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {showActions && (
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                  <Button size="sm">
                    View
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TeamManagement({ teamMembers }: { teamMembers: TeamMember[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Team Members</CardTitle>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {teamMembers.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={member.user?.avatar_url} />
                  <AvatarFallback>
                    {member.user?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{member.user?.full_name}</h4>
                  <p className="text-sm text-gray-600">{member.user?.email}</p>
                </div>
                <Badge variant="outline">{member.role}</Badge>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Edit Role
                </Button>
                <Button size="sm" variant="outline">
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsDashboard({ episodes }: { episodes: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Episode Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['draft', 'in_review', 'approved', 'published'].map(status => {
              const count = episodes.filter(e => e.current_status === status).length;
              const percentage = episodes.length > 0 ? (count / episodes.length) * 100 : 0;
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Performance metrics coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function getRoleDashboardDescription(role: UserRole): string {
  switch (role) {
    case 'host':
      return 'Manage your team, approve content, and oversee all episodes';
    case 'editor':
      return 'Review and edit episodes, manage quality control';
    case 'marketer':
      return 'Create marketing content and manage social media campaigns';
    case 'va':
      return 'Upload files, create drafts, and complete assigned tasks';
    default:
      return 'Welcome to your dashboard';
  }
}