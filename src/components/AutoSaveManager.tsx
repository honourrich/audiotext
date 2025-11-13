import React, { useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Save, Clock, AlertCircle, History, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export interface AutoSaveState {
  status: 'saved' | 'saving' | 'error' | 'unsaved';
  lastSaved?: Date;
  hasUnsavedChanges: boolean;
  isOnline: boolean;
}

export interface VersionInfo {
  id: string;
  timestamp: Date;
  changes: string;
  content: any;
}

interface AutoSaveManagerProps {
  data: any;
  onSave: (data: any) => Promise<void>;
  onRestore?: (version: VersionInfo) => void;
  saveInterval?: number; // milliseconds
  maxVersions?: number;
  children?: React.ReactNode;
}

export default function AutoSaveManager({
  data,
  onSave,
  onRestore,
  saveInterval = 3000, // 3 seconds
  maxVersions = 10,
  children
}: AutoSaveManagerProps) {
  const [saveState, setSaveState] = React.useState<AutoSaveState>({
    status: 'saved',
    hasUnsavedChanges: false,
    isOnline: navigator.onLine
  });
  
  const [versions, setVersions] = React.useState<VersionInfo[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = React.useState(-1);
  
  const lastDataRef = useRef(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setSaveState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSaveState(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save logic
  const performSave = useCallback(async (dataToSave: any) => {
    if (!saveState.isOnline) {
      setSaveState(prev => ({ ...prev, status: 'error' }));
      toast({
        title: "Offline",
        description: "Changes will be saved when connection is restored.",
        variant: "destructive"
      });
      return;
    }

    setSaveState(prev => ({ ...prev, status: 'saving' }));
    
    try {
      await onSave(dataToSave);
      
      // Create version entry
      const newVersion: VersionInfo = {
        id: Date.now().toString(),
        timestamp: new Date(),
        changes: 'Auto-saved changes',
        content: JSON.parse(JSON.stringify(dataToSave))
      };
      
      setVersions(prev => {
        const updated = [newVersion, ...prev].slice(0, maxVersions);
        return updated;
      });
      
      setCurrentVersionIndex(0);
      
      setSaveState(prev => ({
        ...prev,
        status: 'saved',
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }));
      
    } catch (error) {
      setSaveState(prev => ({ ...prev, status: 'error' }));
      toast({
        title: "Save Failed",
        description: "Your changes couldn't be saved. They're stored locally.",
        variant: "destructive"
      });
    }
  }, [onSave, saveState.isOnline, toast, maxVersions]);

  // Detect changes and trigger auto-save
  useEffect(() => {
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
    
    if (hasChanged) {
      setSaveState(prev => ({ ...prev, hasUnsavedChanges: true, status: 'unsaved' }));
      lastDataRef.current = data;
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        performSave(data);
      }, saveInterval);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, performSave, saveInterval]);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    performSave(data);
  }, [data, performSave]);

  // Undo/Redo functionality
  const handleUndo = useCallback(() => {
    if (currentVersionIndex < versions.length - 1) {
      const newIndex = currentVersionIndex + 1;
      const version = versions[newIndex];
      setCurrentVersionIndex(newIndex);
      onRestore?.(version);
    }
  }, [currentVersionIndex, versions, onRestore]);

  const handleRedo = useCallback(() => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      const version = versions[newIndex];
      setCurrentVersionIndex(newIndex);
      onRestore?.(version);
    }
  }, [currentVersionIndex, versions, onRestore]);

  // Prevent data loss on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState.hasUnsavedChanges]);

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusConfig = () => {
    switch (saveState.status) {
      case 'saving':
        return {
          icon: Save,
          text: 'Saving...',
          variant: 'secondary' as const,
          className: 'animate-pulse'
        };
      case 'saved':
        return {
          icon: Save,
          text: 'Saved',
          variant: 'secondary' as const,
          className: 'text-green-600'
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Error',
          variant: 'destructive' as const,
          className: ''
        };
      case 'unsaved':
        return {
          icon: Clock,
          text: 'Unsaved',
          variant: 'outline' as const,
          className: 'text-orange-600'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-background min-h-screen">
      {/* Auto-save Status Bar */}
      <div className="sticky top-0 z-50 bg-background border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant={statusConfig.variant} className={statusConfig.className}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.text}
          </Badge>
          
          {saveState.lastSaved && (
            <span className="text-sm text-muted-foreground">
              Last saved {formatLastSaved(saveState.lastSaved)}
            </span>
          )}
          
          {!saveState.isOnline && (
            <Badge variant="destructive">
              Offline
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Version Control */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={currentVersionIndex >= versions.length - 1}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={currentVersionIndex <= 0}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSave}
            disabled={saveState.status === 'saving' || !saveState.hasUnsavedChanges}
            title="Save now"
          >
            <Save className="w-4 h-4" />
          </Button>
          
          {versions.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <History className="w-3 h-3 mr-1" />
              {versions.length} versions
            </Badge>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
      
      {/* Version History Panel (could be expanded) */}
      {versions.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="font-medium text-sm mb-2">Recent Changes</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {versions.slice(0, 3).map((version, index) => (
              <div
                key={version.id}
                className={`text-xs p-2 rounded cursor-pointer hover:bg-gray-50 ${
                  index === currentVersionIndex ? 'bg-blue-50 border border-blue-200' : ''
                }`}
                onClick={() => {
                  setCurrentVersionIndex(index);
                  onRestore?.(version);
                }}
              >
                <div className="font-medium">{version.changes}</div>
                <div className="text-muted-foreground">
                  {formatLastSaved(version.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}