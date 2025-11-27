import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Download,
  Trash2,
  Save,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const SettingsPage: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      processing: true,
      marketing: false,
      security: true
    },
    privacy: {
      analytics: true,
      dataSharing: false,
      publicProfile: false
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      autoSave: true,
      defaultQuality: 'high'
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const persistSettings = (updatedSettings: typeof settings) => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to persist settings to localStorage:', error);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category as keyof typeof prev],
          [key]: value
        }
      };

      // Handle theme changes immediately
      if (category === 'preferences' && key === 'language') {
        i18n.changeLanguage(value);
      }

      // Persist to localStorage
      persistSettings(updated);
      return updated;
    });
  };

  const exportData = () => {
    try {
      const episodes = localStorage.getItem('episodes') || '[]';
      const userSettings = localStorage.getItem('userSettings') || '{}';
      
      const exportData = {
        episodes: JSON.parse(episodes),
        settings: JSON.parse(userSettings),
        exportDate: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.emailAddresses[0]?.emailAddress,
          name: user?.fullName
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shownote-ai-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteAllData = () => {
    try {
      localStorage.removeItem('episodes');
      localStorage.removeItem('userSettings');
      localStorage.removeItem(`onboarding_completed_${user?.id}`);
      
      toast({
        title: "Data deleted",
        description: "All your data has been permanently deleted.",
      });
      
      // Reset settings to default
      setSettings({
        notifications: {
          email: true,
          processing: true,
          marketing: false,
          security: true
        },
        privacy: {
          analytics: true,
          dataSharing: false,
          publicProfile: false
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          autoSave: true,
          defaultQuality: 'high'
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>
              <p className="text-muted-foreground">{t('settings.subtitle')}</p>
            </div>
              <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('settings.goToDashboard')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">{t('settings.tabs.general')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('settings.tabs.notifications')}</TabsTrigger>
            <TabsTrigger value="privacy">{t('settings.tabs.privacy')}</TabsTrigger>
            <TabsTrigger value="data">{t('settings.tabs.data')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>{t('settings.profile.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t('settings.profile.fullName')}</Label>
                    <Input 
                      id="name" 
                      value={user?.fullName || ''} 
                      disabled 
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('settings.profile.managedByProvider')}</p>
                  </div>
                  <div>
                    <Label htmlFor="email">{t('settings.profile.emailAddress')}</Label>
                    <Input 
                      id="email" 
                      value={user?.emailAddresses[0]?.emailAddress || ''} 
                      disabled 
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('settings.profile.managedByProvider')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>{t('settings.preferences.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('settings.preferences.theme')}</Label>
                    <p className="text-sm text-muted-foreground mt-1">Dark mode coming soon.</p>
                  </div>
                  <div>
                    <Label htmlFor="language">{t('settings.preferences.language')}</Label>
                    <select 
                      id="language"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      value={settings.preferences.language}
                      onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('settings.preferences.autoSave')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.preferences.autoSaveDescription')}</p>
                  </div>
                  <Switch
                    checked={settings.preferences.autoSave}
                    onCheckedChange={(checked) => updateSetting('preferences', 'autoSave', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="quality">{t('settings.preferences.defaultQuality')}</Label>
                  <select 
                    id="quality"
                    className="w-full mt-1 px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    value={settings.preferences.defaultQuality}
                    onChange={(e) => updateSetting('preferences', 'defaultQuality', e.target.value)}
                  >
                    <option value="standard">{t('settings.preferences.qualities.standard')}</option>
                    <option value="high">{t('settings.preferences.qualities.high')}</option>
                    <option value="premium">{t('settings.preferences.qualities.premium')}</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Processing Updates</Label>
                    <p className="text-sm text-gray-500">Get notified when your content is ready</p>
                  </div>
                  <Switch
                    checked={settings.notifications.processing}
                    onCheckedChange={(checked) => updateSetting('notifications', 'processing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-gray-500">Important security and account updates</p>
                  </div>
                  <Switch
                    checked={settings.notifications.security}
                    onCheckedChange={(checked) => updateSetting('notifications', 'security', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Communications</Label>
                    <p className="text-sm text-gray-500">Product updates and promotional content</p>
                  </div>
                  <Switch
                    checked={settings.notifications.marketing}
                    onCheckedChange={(checked) => updateSetting('notifications', 'marketing', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Privacy Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics</Label>
                    <p className="text-sm text-gray-500">Help improve our service with usage analytics</p>
                  </div>
                  <Switch
                    checked={settings.privacy.analytics}
                    onCheckedChange={(checked) => updateSetting('privacy', 'analytics', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Sharing</Label>
                    <p className="text-sm text-gray-500">Share anonymized data for research purposes</p>
                  </div>
                  <Switch
                    checked={settings.privacy.dataSharing}
                    onCheckedChange={(checked) => updateSetting('privacy', 'dataSharing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Profile</Label>
                    <p className="text-sm text-gray-500">Make your profile visible to other users</p>
                  </div>
                  <Switch
                    checked={settings.privacy.publicProfile}
                    onCheckedChange={(checked) => updateSetting('privacy', 'publicProfile', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Export Your Data</h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    Download all your episodes, settings, and account data in JSON format.
                  </p>
                  <Button onClick={exportData} variant="outline" className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Delete All Data</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    Permanently delete all your episodes, settings, and account data. This action cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all your episodes, 
                          settings, and remove all data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAllData} className="bg-red-600 hover:bg-red-700">
                          Yes, delete everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">Data Usage</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Episodes stored:</span>
                      <Badge variant="secondary">
                        {JSON.parse(localStorage.getItem('episodes') || '[]').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account created:</span>
                      <span className="font-medium text-foreground">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;