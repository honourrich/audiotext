import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MoreHorizontal,
  Reply,
  Smile
} from 'lucide-react';
import { usePresence, useComments, useAutoSave } from '../hooks/useCollaboration';
import type { UserPresence, EpisodeComment } from '../types/collaboration';
import { COMMENT_COLORS } from '../types/collaboration';

interface CollaborativeEditorProps {
  episodeId: string;
  content: {
    transcript?: string;
    summary?: string;
    chapters?: string;
    keywords?: string;
  };
  onContentChange: (content: any) => void;
  currentUserId: string;
  readOnly?: boolean;
}

interface UserCursor {
  userId: string;
  userName: string;
  color: string;
  position: number;
  section: string;
}

const CURSOR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export default function CollaborativeEditor({
  episodeId,
  content,
  onContentChange,
  currentUserId,
  readOnly = false
}: CollaborativeEditorProps) {
  const [activeSection, setActiveSection] = useState<string>('transcript');
  const [selectedText, setSelectedText] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentPriority, setCommentPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const cursorPositions = useRef<{ [key: string]: number }>({});

  // Collaboration hooks
  const { activeUsers, updatePresence } = usePresence(episodeId, currentUserId);
  const { comments, addComment, updateCommentStatus, addReaction } = useComments(episodeId);
  const { isSaving, lastSaved } = useAutoSave(episodeId, content);

  // Generate user cursors with colors
  const userCursors: UserCursor[] = activeUsers.map((user, index) => ({
    userId: user.user_id,
    userName: user.user?.full_name || 'Unknown',
    color: CURSOR_COLORS[index % CURSOR_COLORS.length],
    position: user.cursor_position?.position || 0,
    section: user.cursor_position?.section || 'transcript'
  }));

  const handleTextChange = useCallback((section: string, value: string) => {
    onContentChange({
      ...content,
      [section]: value
    });
  }, [content, onContentChange]);

  const handleCursorMove = useCallback((section: string, position: number) => {
    cursorPositions.current[section] = position;
    updatePresence({ section, position });
  }, [updatePresence]);

  const handleTextSelection = useCallback(() => {
    const textarea = textareaRefs.current[activeSection];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedText = textarea.value.substring(start, end);
      setSelectedText({ start, end, text: selectedText });
      setShowCommentForm(true);
    }
  }, [activeSection]);

  const handleAddComment = useCallback(async () => {
    if (!commentContent.trim()) return;

    try {
      await addComment(
        commentContent,
        selectedText || undefined,
        undefined,
        commentPriority
      );
      
      setCommentContent('');
      setSelectedText(null);
      setShowCommentForm(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, [commentContent, selectedText, commentPriority, addComment]);

  const renderUserCursors = (section: string) => {
    return userCursors
      .filter(cursor => cursor.section === section)
      .map(cursor => (
        <div
          key={cursor.userId}
          className="absolute pointer-events-none z-10"
          style={{
            left: `${Math.min(cursor.position * 0.5, 95)}%`, // Approximate position
            top: '0.5rem',
          }}
        >
          <div
            className="w-0.5 h-6 animate-pulse"
            style={{ backgroundColor: cursor.color }}
          />
          <div
            className="absolute -top-8 left-0 px-2 py-1 text-xs text-white rounded whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </div>
        </div>
      ));
  };

  const renderComments = (section: string) => {
    const sectionComments = comments.filter(comment => 
      comment.text_selection?.text && 
      content[section as keyof typeof content]?.includes(comment.text_selection.text)
    );

    return sectionComments.map(comment => (
      <CommentThread
        key={comment.id}
        comment={comment}
        onStatusChange={updateCommentStatus}
        onReaction={addReaction}
      />
    ));
  };

  return (
    <div className="flex h-full bg-white">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {activeUsers.length} active
              </span>
            </div>
            
            {/* Active users avatars */}
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 5).map((user, index) => (
                <Avatar key={user.user_id} className="w-6 h-6 border-2 border-white">
                  <AvatarImage src={user.user?.avatar_url} />
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: CURSOR_COLORS[index % CURSOR_COLORS.length] }}
                  >
                    {user.user?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {activeUsers.length > 5 && (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                  +{activeUsers.length - 5}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isSaving && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Clock className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {lastSaved && !isSaving && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b">
          {['transcript', 'summary', 'chapters', 'keywords'].map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 text-sm font-medium capitalize ${
                activeSection === section
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {section}
              {comments.filter(c => 
                c.text_selection?.text && 
                content[section as keyof typeof content]?.includes(c.text_selection.text)
              ).length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {comments.filter(c => 
                    c.text_selection?.text && 
                    content[section as keyof typeof content]?.includes(c.text_selection.text)
                  ).length}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-4">
          <div className="relative">
            {renderUserCursors(activeSection)}
            <Textarea
              ref={(el) => textareaRefs.current[activeSection] = el}
              value={content[activeSection as keyof typeof content] || ''}
              onChange={(e) => handleTextChange(activeSection, e.target.value)}
              onSelect={handleTextSelection}
              onKeyUp={(e) => {
                const target = e.target as HTMLTextAreaElement;
                handleCursorMove(activeSection, target.selectionStart);
              }}
              onClick={(e) => {
                const target = e.target as HTMLTextAreaElement;
                handleCursorMove(activeSection, target.selectionStart);
              }}
              placeholder={`Enter ${activeSection} content...`}
              className="min-h-[400px] resize-none"
              readOnly={readOnly}
            />
          </div>

          {/* Comments for current section */}
          <div className="mt-4 space-y-2">
            {renderComments(activeSection)}
          </div>
        </div>
      </div>

      {/* Comments Sidebar */}
      <div className="w-80 border-l bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h3 className="font-medium flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Comments ({comments.length})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              onStatusChange={updateCommentStatus}
              onReaction={addReaction}
            />
          ))}
        </div>
      </div>

      {/* Comment Form Modal */}
      {showCommentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Add Comment</h3>
              {selectedText && (
                <div className="mb-3 p-2 bg-gray-100 rounded text-sm">
                  "{selectedText.text}"
                </div>
              )}
              
              <div className="mb-3">
                <select
                  value={commentPriority}
                  onChange={(e) => setCommentPriority(e.target.value as any)}
                  className="w-full p-2 border rounded"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Enter your comment..."
                className="mb-3"
              />

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommentForm(false);
                    setCommentContent('');
                    setSelectedText(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddComment}>
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Comment Thread Component
function CommentThread({
  comment,
  onStatusChange,
  onReaction
}: {
  comment: EpisodeComment;
  onStatusChange: (id: string, status: 'open' | 'resolved' | 'archived') => void;
  onReaction: (id: string, emoji: string) => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <Card className={`${COMMENT_COLORS[comment.priority]} border-l-4`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={comment.user?.avatar_url} />
              <AvatarFallback className="text-xs">
                {comment.user?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {comment.user?.full_name || 'Unknown'}
            </span>
            <Badge variant="outline" className="text-xs">
              {comment.priority}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(
                comment.id, 
                comment.status === 'resolved' ? 'open' : 'resolved'
              )}
            >
              {comment.status === 'resolved' ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <AlertCircle className="w-3 h-3 text-orange-500" />
              )}
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {comment.text_selection && (
          <div className="mb-2 p-2 bg-gray-100 rounded text-xs">
            "{comment.text_selection.text}"
          </div>
        )}

        <p className="text-sm mb-2">{comment.content}</p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{new Date(comment.created_at).toLocaleString()}</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReaction(comment.id, '👍')}
            >
              <Smile className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Reactions */}
        {comment.reactions && comment.reactions.length > 0 && (
          <div className="flex items-center space-x-1 mt-2">
            {comment.reactions.map(reaction => (
              <Badge key={reaction.id} variant="outline" className="text-xs">
                {reaction.emoji} {reaction.user?.full_name}
              </Badge>
            ))}
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
            {comment.replies.map(reply => (
              <div key={reply.id} className="text-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={reply.user?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {reply.user?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{reply.user?.full_name}</span>
                  <span className="text-gray-500">
                    {new Date(reply.created_at).toLocaleString()}
                  </span>
                </div>
                <p>{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}