export type UserRole = 'host' | 'editor' | 'marketer' | 'va';

export type WorkflowStatus = 'draft' | 'in_review' | 'needs_changes' | 'approved' | 'published';

export type CommentStatus = 'open' | 'resolved' | 'archived';

export type CommentPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationType = 
  | 'episode_assigned'
  | 'comment_added'
  | 'status_changed'
  | 'approval_requested'
  | 'mention'
  | 'deadline_reminder';

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: UserRole;
  permissions: Record<string, boolean>;
  invited_by: string | null;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface EpisodeCollaborator {
  id: string;
  episode_id: string;
  user_id: string;
  role: UserRole;
  permissions: Record<string, boolean>;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface VersionHistory {
  id: string;
  episode_id: string;
  content_snapshot: Record<string, any>;
  changed_by: string;
  timestamp: string;
  change_description: string | null;
  version_number: number;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface EpisodeComment {
  id: string;
  episode_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  text_selection: {
    start: number;
    end: number;
    text: string;
  } | null;
  status: CommentStatus;
  priority: CommentPriority;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  replies?: EpisodeComment[];
  reactions?: EpisodeReaction[];
}

export interface EpisodeReaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
  };
}

export interface WorkflowState {
  id: string;
  episode_id: string;
  status: WorkflowStatus;
  changed_by: string;
  notes: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
  };
}

export interface NotificationData {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface UserPresence {
  id: string;
  user_id: string;
  episode_id: string;
  cursor_position: {
    section: string;
    position: number;
  } | null;
  last_seen: string;
  is_active: boolean;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface CollaborativeEpisode {
  id: string;
  title: string;
  workspace_id: string;
  current_status: WorkflowStatus;
  assigned_to: string | null;
  due_date: string | null;
  collaborators: EpisodeCollaborator[];
  comments: EpisodeComment[];
  workflow_history: WorkflowState[];
  version_history: VersionHistory[];
  active_users: UserPresence[];
}

// Permission definitions for each role
export const ROLE_PERMISSIONS = {
  host: {
    canCreateEpisodes: true,
    canDeleteEpisodes: true,
    canInviteMembers: true,
    canManageTeam: true,
    canPublish: true,
    canApprove: true,
    canEditAll: true,
    canViewAnalytics: true,
    canManageWorkspace: true,
  },
  editor: {
    canCreateEpisodes: false,
    canDeleteEpisodes: false,
    canInviteMembers: false,
    canManageTeam: false,
    canPublish: false,
    canApprove: true,
    canEditAll: true,
    canViewAnalytics: true,
    canManageWorkspace: false,
  },
  marketer: {
    canCreateEpisodes: false,
    canDeleteEpisodes: false,
    canInviteMembers: false,
    canManageTeam: false,
    canPublish: false,
    canApprove: false,
    canEditAll: false,
    canViewAnalytics: true,
    canManageWorkspace: false,
  },
  va: {
    canCreateEpisodes: true,
    canDeleteEpisodes: false,
    canInviteMembers: false,
    canManageTeam: false,
    canPublish: false,
    canApprove: false,
    canEditAll: false,
    canViewAnalytics: false,
    canManageWorkspace: false,
  },
} as const;

export const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ['in_review'],
  in_review: ['needs_changes', 'approved'],
  needs_changes: ['draft', 'in_review'],
  approved: ['published', 'needs_changes'],
  published: [],
};

export const COMMENT_COLORS = {
  low: 'bg-gray-100 border-gray-300',
  medium: 'bg-blue-100 border-blue-300',
  high: 'bg-orange-100 border-orange-300',
  critical: 'bg-red-100 border-red-300',
} as const;

export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  in_review: 'bg-blue-100 text-blue-800',
  needs_changes: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  published: 'bg-purple-100 text-purple-800',
} as const;