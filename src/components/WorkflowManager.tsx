import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  History,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useWorkflow } from '../hooks/useCollaboration';
import type { WorkflowStatus, UserRole } from '../types/collaboration';
import { STATUS_COLORS, WORKFLOW_TRANSITIONS, ROLE_PERMISSIONS } from '../types/collaboration';

interface WorkflowManagerProps {
  episodeId: string;
  currentUserRole: UserRole;
  onStatusChange?: (status: WorkflowStatus) => void;
}

export default function WorkflowManager({ 
  episodeId, 
  currentUserRole,
  onStatusChange 
}: WorkflowManagerProps) {
  const { currentStatus, workflowHistory, updateStatus, loading } = useWorkflow(episodeId);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const permissions = ROLE_PERMISSIONS[currentUserRole];
  const availableTransitions = WORKFLOW_TRANSITIONS[currentStatus] || [];

  const handleStatusChange = async (newStatus: WorkflowStatus) => {
    if (!canChangeToStatus(newStatus)) return;

    setSelectedStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedStatus) return;

    try {
      await updateStatus(selectedStatus, statusNotes);
      onStatusChange?.(selectedStatus);
      setShowStatusModal(false);
      setSelectedStatus(null);
      setStatusNotes('');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const canChangeToStatus = (status: WorkflowStatus): boolean => {
    // Check if transition is allowed
    if (!availableTransitions.includes(status)) return false;

    // Check role permissions
    switch (status) {
      case 'in_review':
        return permissions.canEditAll || permissions.canCreateEpisodes;
      case 'approved':
        return permissions.canApprove;
      case 'published':
        return permissions.canPublish;
      case 'needs_changes':
        return permissions.canApprove;
      default:
        return true;
    }
  };

  const getStatusIcon = (status: WorkflowStatus) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4" />;
      case 'in_review':
        return <AlertTriangle className="w-4 h-4" />;
      case 'needs_changes':
        return <XCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'published':
        return <Play className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusDescription = (status: WorkflowStatus): string => {
    switch (status) {
      case 'draft':
        return 'Episode is being created and edited';
      case 'in_review':
        return 'Episode is waiting for editor approval';
      case 'needs_changes':
        return 'Episode requires changes before approval';
      case 'approved':
        return 'Episode is approved and ready for publishing';
      case 'published':
        return 'Episode is live and publicly available';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Workflow Status</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status Display */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(currentStatus)}
              <Badge className={STATUS_COLORS[currentStatus]}>
                {currentStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-gray-600">{getStatusDescription(currentStatus)}</p>
          </div>

          {/* Available Actions */}
          {availableTransitions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Available Actions:</h4>
              <div className="flex flex-wrap gap-2">
                {availableTransitions.map(status => (
                  <Button
                    key={status}
                    variant={canChangeToStatus(status) ? "default" : "outline"}
                    size="sm"
                    disabled={!canChangeToStatus(status)}
                    onClick={() => handleStatusChange(status)}
                    className="flex items-center space-x-2"
                  >
                    {getStatusIcon(status)}
                    <span>{getActionLabel(currentStatus, status)}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Workflow Progress */}
          <WorkflowProgress currentStatus={currentStatus} />
        </CardContent>
      </Card>

      {/* Workflow History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Workflow History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflowHistory.map((state, index) => (
                <div key={state.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {getStatusIcon(state.status)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={index === 0 ? STATUS_COLORS[state.status] : 'bg-gray-100'}
                      >
                        {state.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(state.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {state.user?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700">
                        {state.user?.full_name || 'Unknown'}
                      </span>
                    </div>
                    {state.notes && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                        {state.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-w-full mx-4">
            <CardHeader>
              <CardTitle>
                Change Status to {selectedStatus.replace('_', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-muted rounded">
                {getStatusIcon(selectedStatus)}
                <span className="font-medium">
                  {getStatusDescription(selectedStatus)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (optional)
                </label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add any notes about this status change..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedStatus(null);
                    setStatusNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={confirmStatusChange}>
                  Confirm Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Workflow Progress Component
function WorkflowProgress({ currentStatus }: { currentStatus: WorkflowStatus }) {
  const steps: { status: WorkflowStatus; label: string }[] = [
    { status: 'draft', label: 'Draft' },
    { status: 'in_review', label: 'Review' },
    { status: 'approved', label: 'Approved' },
    { status: 'published', label: 'Published' }
  ];

  const currentIndex = steps.findIndex(step => step.status === currentStatus);
  const isNeedsChanges = currentStatus === 'needs_changes';

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900">Progress</h4>
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => {
          const isActive = index <= currentIndex && !isNeedsChanges;
          const isCurrent = step.status === currentStatus;
          
          return (
            <React.Fragment key={step.status}>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isCurrent 
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
              }`}>
                {isActive && !isCurrent ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <div className={`w-3 h-3 rounded-full ${
                    isCurrent ? 'bg-blue-500' : isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                )}
                <span>{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className={`w-4 h-4 ${
                  isActive ? 'text-green-500' : 'text-gray-400'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {isNeedsChanges && (
        <div className="flex items-center space-x-2 mt-2">
          <XCircle className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-orange-600">
            Changes requested - episode returned to draft
          </span>
        </div>
      )}
    </div>
  );
}

const ACTION_LABELS: Record<WorkflowStatus, string> = {
  draft: 'Return to Draft',
  in_review: 'Submit for Review',
  needs_changes: 'Request Changes',
  approved: 'Approve',
  published: 'Publish',
};

function getActionLabel(_: WorkflowStatus, targetStatus: WorkflowStatus): string {
  return ACTION_LABELS[targetStatus] ?? targetStatus;
}