import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  X,
  MessageSquare,
  UserPlus,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useNotifications } from '../hooks/useCollaboration';
import type { NotificationData, NotificationType } from '../types/collaboration';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.read
  );

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'episode_assigned':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'status_changed':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'approval_requested':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-red-500" />;
      case 'deadline_reminder':
        return <Clock className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case 'comment_added':
        return 'border-l-blue-500';
      case 'episode_assigned':
        return 'border-l-green-500';
      case 'status_changed':
        return 'border-l-orange-500';
      case 'approval_requested':
        return 'border-l-purple-500';
      case 'mention':
        return 'border-l-red-500';
      case 'deadline_reminder':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'comment_added':
      case 'episode_assigned':
      case 'status_changed':
        if (notification.data.episode_id) {
          // Navigate to episode
          window.location.href = `/episode/${notification.data.episode_id}`;
        }
        break;
      case 'approval_requested':
        // Navigate to approval queue
        window.location.href = '/dashboard?tab=approvals';
        break;
      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end pt-16 pr-4 z-50">
      <Card className="w-96 max-h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
            </div>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-700"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start space-x-3 p-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onMarkRead={() => markAsRead(notification.id)}
                  icon={getNotificationIcon(notification.type as NotificationType)}
                  colorClass={getNotificationColor(notification.type as NotificationType)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Notification Bell Component
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 text-xs min-w-[1.25rem] h-5 flex items-center justify-center p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}

// Individual Notification Item
function NotificationItem({
  notification,
  onClick,
  onMarkRead,
  icon,
  colorClass
}: {
  notification: NotificationData;
  onClick: () => void;
  onMarkRead: () => void;
  icon: React.ReactNode;
  colorClass: string;
}) {
  const timeAgo = getTimeAgo(new Date(notification.created_at));

  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${colorClass} ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                !notification.read ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                !notification.read ? 'text-gray-700' : 'text-gray-500'
              }`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {timeAgo}
              </p>
            </div>
            
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Check className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
        )}
      </div>
    </div>
  );
}

// Utility function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return date.toLocaleDateString();
}