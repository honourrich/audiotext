import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CollaborationAPI } from '../lib/collaboration';
import type { 
  UserPresence, 
  EpisodeComment, 
  WorkflowState, 
  NotificationData,
  UserRole,
  WorkflowStatus 
} from '../types/collaboration';

// Real-time presence hook
export function usePresence(episodeId: string, userId: string) {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const presenceRef = useRef<NodeJS.Timeout>();

  const updatePresence = useCallback(async (cursorPosition?: { section: string; position: number }) => {
    if (!userId || !episodeId) return;
    
    try {
      await CollaborationAPI.updateUserPresence(userId, episodeId, cursorPosition);
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, [userId, episodeId]);

  const setInactive = useCallback(async () => {
    if (!userId || !episodeId) return;
    
    try {
      await CollaborationAPI.setUserInactive(userId, episodeId);
    } catch (error) {
      console.error('Failed to set inactive:', error);
    }
  }, [userId, episodeId]);

  useEffect(() => {
    if (!episodeId) return;

    // Initial load
    const loadPresence = async () => {
      try {
        const presence = await CollaborationAPI.getUserPresence(episodeId);
        setActiveUsers(presence);
      } catch (error) {
        console.error('Failed to load presence:', error);
      }
    };

    loadPresence();

    // Set up real-time subscription
    const channel = supabase
      .channel(`presence:${episodeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `episode_id=eq.${episodeId}`
        },
        () => {
          loadPresence();
        }
      )
      .subscribe();

    // Update presence every 30 seconds
    presenceRef.current = setInterval(() => {
      updatePresence();
    }, 30000);

    // Initial presence update
    updatePresence();

    return () => {
      if (presenceRef.current) {
        clearInterval(presenceRef.current);
      }
      setInactive();
      supabase.removeChannel(channel);
    };
  }, [episodeId, updatePresence, setInactive]);

  return {
    activeUsers: activeUsers.filter(user => user.user_id !== userId),
    updatePresence,
    setInactive
  };
}

// Real-time comments hook
export function useComments(episodeId: string) {
  const [comments, setComments] = useState<EpisodeComment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    if (!episodeId) return;
    
    try {
      const data = await CollaborationAPI.getEpisodeComments(episodeId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }, [episodeId]);

  const addComment = useCallback(async (
    content: string,
    textSelection?: { start: number; end: number; text: string },
    parentId?: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    if (!episodeId) return;
    
    try {
      // Get current user ID (you'll need to implement this based on your auth)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await CollaborationAPI.addComment(
        episodeId,
        user.id,
        content,
        textSelection,
        parentId,
        priority
      );
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }, [episodeId]);

  const updateCommentStatus = useCallback(async (
    commentId: string,
    status: 'open' | 'resolved' | 'archived'
  ) => {
    try {
      await CollaborationAPI.updateCommentStatus(commentId, status);
    } catch (error) {
      console.error('Failed to update comment status:', error);
      throw error;
    }
  }, []);

  const addReaction = useCallback(async (commentId: string, emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await CollaborationAPI.addCommentReaction(commentId, user.id, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadComments();

    // Set up real-time subscription
    const channel = supabase
      .channel(`comments:${episodeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'episode_comments',
          filter: `episode_id=eq.${episodeId}`
        },
        () => {
          loadComments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'episode_reactions'
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [episodeId, loadComments]);

  return {
    comments,
    loading,
    addComment,
    updateCommentStatus,
    addReaction,
    refresh: loadComments
  };
}

// Workflow management hook
export function useWorkflow(episodeId: string) {
  const [currentStatus, setCurrentStatus] = useState<WorkflowStatus>('draft');
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowState[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkflow = useCallback(async () => {
    if (!episodeId) return;
    
    try {
      const [episode, history] = await Promise.all([
        supabase.from('episodes').select('current_status').eq('id', episodeId).single(),
        CollaborationAPI.getWorkflowHistory(episodeId)
      ]);

      if (episode.data) {
        setCurrentStatus(episode.data.current_status);
      }
      setWorkflowHistory(history);
    } catch (error) {
      console.error('Failed to load workflow:', error);
    } finally {
      setLoading(false);
    }
  }, [episodeId]);

  const updateStatus = useCallback(async (
    status: WorkflowStatus,
    notes?: string
  ) => {
    if (!episodeId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await CollaborationAPI.updateEpisodeStatus(episodeId, status, user.id, notes);
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  }, [episodeId]);

  useEffect(() => {
    loadWorkflow();

    // Set up real-time subscription
    const channel = supabase
      .channel(`workflow:${episodeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_states',
          filter: `episode_id=eq.${episodeId}`
        },
        () => {
          loadWorkflow();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'episodes',
          filter: `id=eq.${episodeId}`
        },
        (payload) => {
          if (payload.new.current_status) {
            setCurrentStatus(payload.new.current_status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [episodeId, loadWorkflow]);

  return {
    currentStatus,
    workflowHistory,
    loading,
    updateStatus,
    refresh: loadWorkflow
  };
}

// Notifications hook
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await CollaborationAPI.getUserNotifications(user.id);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await CollaborationAPI.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await CollaborationAPI.markAllNotificationsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications
  };
}

// Auto-save hook for collaborative editing
export function useAutoSave(
  episodeId: string,
  content: Record<string, any>,
  delay: number = 3000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastContentRef = useRef<string>('');

  const saveVersion = useCallback(async (description?: string) => {
    if (!episodeId) return;
    
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await CollaborationAPI.saveVersion(episodeId, content, user.id, description);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save version:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [episodeId, content]);

  useEffect(() => {
    const contentString = JSON.stringify(content);
    
    // Only save if content has actually changed
    if (contentString === lastContentRef.current) return;
    lastContentRef.current = contentString;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveVersion('Auto-save');
    }, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, delay, saveVersion]);

  return {
    isSaving,
    lastSaved,
    saveVersion
  };
}