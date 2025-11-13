import { supabase } from './supabase';
import type { 
  Workspace, 
  TeamMember, 
  EpisodeCollaborator, 
  EpisodeComment, 
  WorkflowState, 
  VersionHistory,
  UserPresence,
  NotificationData,
  UserRole,
  WorkflowStatus,
  CommentStatus,
  CommentPriority
} from '../types/collaboration';

export class CollaborationAPI {
  // Workspace Management
  static async createWorkspace(name: string, ownerId: string): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, owner_id: ownerId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getWorkspaces(userId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .or(`owner_id.eq.${userId},id.in.(${await this.getUserWorkspaceIds(userId)})`);

    if (error) throw error;
    return data || [];
  }

  private static async getUserWorkspaceIds(userId: string): Promise<string> {
    const { data } = await supabase
      .from('team_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    return data?.map(tm => tm.workspace_id).join(',') || '';
  }

  // Team Management
  static async inviteTeamMember(
    workspaceId: string, 
    email: string, 
    role: UserRole, 
    invitedBy: string
  ): Promise<void> {
    // First, check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      throw new Error('User not found. They need to sign up first.');
    }

    const { error } = await supabase
      .from('team_members')
      .insert({
        user_id: user.id,
        workspace_id: workspaceId,
        role,
        invited_by: invitedBy,
        status: 'pending'
      });

    if (error) throw error;

    // Send notification
    await this.createNotification(user.id, {
      type: 'team_invitation',
      title: 'Team Invitation',
      message: `You've been invited to join a workspace as ${role}`,
      data: { workspace_id: workspaceId, role }
    });
  }

  static async getTeamMembers(workspaceId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users(id, email, full_name, avatar_url)
      `)
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data || [];
  }

  static async updateTeamMemberRole(memberId: string, role: UserRole): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('id', memberId);

    if (error) throw error;
  }

  static async removeTeamMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  // Episode Collaboration
  static async addEpisodeCollaborator(
    episodeId: string, 
    userId: string, 
    role: UserRole
  ): Promise<void> {
    const { error } = await supabase
      .from('episode_collaborators')
      .insert({
        episode_id: episodeId,
        user_id: userId,
        role
      });

    if (error) throw error;
  }

  static async getEpisodeCollaborators(episodeId: string): Promise<EpisodeCollaborator[]> {
    const { data, error } = await supabase
      .from('episode_collaborators')
      .select(`
        *,
        user:users(id, email, full_name, avatar_url)
      `)
      .eq('episode_id', episodeId);

    if (error) throw error;
    return data || [];
  }

  // Comments System
  static async addComment(
    episodeId: string,
    userId: string,
    content: string,
    textSelection?: { start: number; end: number; text: string },
    parentId?: string,
    priority: CommentPriority = 'medium'
  ): Promise<EpisodeComment> {
    const { data, error } = await supabase
      .from('episode_comments')
      .insert({
        episode_id: episodeId,
        user_id: userId,
        content,
        text_selection: textSelection,
        parent_id: parentId,
        priority
      })
      .select(`
        *,
        user:users(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Notify collaborators
    const collaborators = await this.getEpisodeCollaborators(episodeId);
    for (const collaborator of collaborators) {
      if (collaborator.user_id !== userId) {
        await this.createNotification(collaborator.user_id, {
          type: 'comment_added',
          title: 'New Comment',
          message: `New comment on episode`,
          data: { episode_id: episodeId, comment_id: data.id }
        });
      }
    }

    return data;
  }

  static async getEpisodeComments(episodeId: string): Promise<EpisodeComment[]> {
    const { data, error } = await supabase
      .from('episode_comments')
      .select(`
        *,
        user:users(id, full_name, avatar_url),
        reactions:episode_reactions(
          id,
          emoji,
          user:users(id, full_name)
        )
      `)
      .eq('episode_id', episodeId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Organize comments into threads
    const comments = data || [];
    const threaded = comments.filter(c => !c.parent_id);
    
    threaded.forEach(comment => {
      comment.replies = comments.filter(c => c.parent_id === comment.id);
    });

    return threaded;
  }

  static async updateCommentStatus(commentId: string, status: CommentStatus): Promise<void> {
    const { error } = await supabase
      .from('episode_comments')
      .update({ status })
      .eq('id', commentId);

    if (error) throw error;
  }

  static async addCommentReaction(commentId: string, userId: string, emoji: string): Promise<void> {
    const { error } = await supabase
      .from('episode_reactions')
      .upsert({
        comment_id: commentId,
        user_id: userId,
        emoji
      });

    if (error) throw error;
  }

  // Workflow Management
  static async updateEpisodeStatus(
    episodeId: string,
    status: WorkflowStatus,
    userId: string,
    notes?: string
  ): Promise<void> {
    // Update episode status
    const { error: episodeError } = await supabase
      .from('episodes')
      .update({ current_status: status })
      .eq('id', episodeId);

    if (episodeError) throw episodeError;

    // Add to workflow history
    const { error: workflowError } = await supabase
      .from('workflow_states')
      .insert({
        episode_id: episodeId,
        status,
        changed_by: userId,
        notes
      });

    if (workflowError) throw workflowError;

    // Notify relevant users
    const collaborators = await this.getEpisodeCollaborators(episodeId);
    for (const collaborator of collaborators) {
      if (collaborator.user_id !== userId) {
        await this.createNotification(collaborator.user_id, {
          type: 'status_changed',
          title: 'Status Updated',
          message: `Episode status changed to ${status}`,
          data: { episode_id: episodeId, status }
        });
      }
    }
  }

  static async getWorkflowHistory(episodeId: string): Promise<WorkflowState[]> {
    const { data, error } = await supabase
      .from('workflow_states')
      .select(`
        *,
        user:users(id, full_name)
      `)
      .eq('episode_id', episodeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Version History
  static async saveVersion(
    episodeId: string,
    contentSnapshot: Record<string, any>,
    userId: string,
    description?: string
  ): Promise<void> {
    // Get current version number
    const { data: lastVersion } = await supabase
      .from('version_history')
      .select('version_number')
      .eq('episode_id', episodeId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const versionNumber = (lastVersion?.version_number || 0) + 1;

    const { error } = await supabase
      .from('version_history')
      .insert({
        episode_id: episodeId,
        content_snapshot: contentSnapshot,
        changed_by: userId,
        change_description: description,
        version_number: versionNumber
      });

    if (error) throw error;
  }

  static async getVersionHistory(episodeId: string): Promise<VersionHistory[]> {
    const { data, error } = await supabase
      .from('version_history')
      .select(`
        *,
        user:users(id, full_name, avatar_url)
      `)
      .eq('episode_id', episodeId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async restoreVersion(episodeId: string, versionId: string): Promise<VersionHistory> {
    const { data, error } = await supabase
      .from('version_history')
      .select('content_snapshot')
      .eq('id', versionId)
      .single();

    if (error) throw error;

    // Update episode with restored content
    const { error: updateError } = await supabase
      .from('episodes')
      .update(data.content_snapshot)
      .eq('id', episodeId);

    if (updateError) throw updateError;

    return data;
  }

  // Real-time Presence
  static async updateUserPresence(
    userId: string,
    episodeId: string,
    cursorPosition?: { section: string; position: number }
  ): Promise<void> {
    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        episode_id: episodeId,
        cursor_position: cursorPosition,
        last_seen: new Date().toISOString(),
        is_active: true
      });

    if (error) throw error;
  }

  static async getUserPresence(episodeId: string): Promise<UserPresence[]> {
    const { data, error } = await supabase
      .from('user_presence')
      .select(`
        *,
        user:users(id, full_name, avatar_url)
      `)
      .eq('episode_id', episodeId)
      .eq('is_active', true)
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

    if (error) throw error;
    return data || [];
  }

  static async setUserInactive(userId: string, episodeId: string): Promise<void> {
    const { error } = await supabase
      .from('user_presence')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('episode_id', episodeId);

    if (error) throw error;
  }

  // Notifications
  static async createNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      data?: Record<string, any>;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        ...notification
      });

    if (error) throw error;
  }

  static async getUserNotifications(userId: string): Promise<NotificationData[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  static async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  static async markAllNotificationsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  }
}