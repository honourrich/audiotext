import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Music,
  Plus,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSocialMediaProfiles, useSocialMediaAnalysis, usePrivacyConsents } from '@/hooks/useSocialMedia';
import { SocialMediaProfile } from '@/lib/socialMedia';

const PLATFORM_ICONS = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music,
};

const PLATFORM_COLORS = {
  twitter: 'bg-blue-500',
  linkedin: 'bg-blue-700',
  instagram: 'bg-pink-500',
  youtube: 'bg-red-500',
  tiktok: 'bg-black',
};

const SocialMediaIntegration: React.FC = () => {
  const { profiles, loading, addProfile, updateProfile, deleteProfile } = useSocialMediaProfiles();
  const { analysis, analyzing, runAnalysis, deleteAnalysis } = useSocialMediaAnalysis();
  const { recordConsent, hasConsent } = usePrivacyConsents();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProfile, setNewProfile] = useState({
    platform: 'twitter' as const,
    handle: '',
    profile_url: '',
    consent_given: false,
    analysis_enabled: true
  });
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);

  const handleAddProfile = async () => {
    if (!newProfile.handle.trim()) return;
    
    try {
      await addProfile(newProfile);
      setNewProfile({
        platform: 'twitter',
        handle: '',
        profile_url: '',
        consent_given: false,
        analysis_enabled: true
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to add profile:', error);
    }
  };

  const handleConsentChange = async (consentGiven: boolean) => {
    try {
      await recordConsent('social_media_analysis', consentGiven);
    } catch (error) {
      console.error('Failed to record consent:', error);
    }
  };

  const handleRunAnalysis = async () => {
    if (!hasConsent('social_media_analysis')) {
      setShowPrivacyDialog(true);
      return;
    }
    
    try {
      await runAnalysis();
      setShowAnalysisResults(true);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const Icon = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS] || Twitter;
    return Icon;
  };

  const getPlatformColor = (platform: string) => {
    return PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          We only analyze public posts from your social media profiles. Your data is processed securely and can be deleted at any time.
          <Button 
            variant="link" 
            className="p-0 h-auto ml-2"
            onClick={() => setShowPrivacyDialog(true)}
          >
            Learn more about privacy
          </Button>
        </AlertDescription>
      </Alert>

      {/* Connected Profiles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Social Media Profiles</CardTitle>
              <CardDescription>
                Add your social media profiles to analyze your writing style across platforms
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Social Media Profile</DialogTitle>
                  <DialogDescription>
                    Connect a social media profile for writing style analysis
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <select
                      id="platform"
                      value={newProfile.platform}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, platform: e.target.value as any }))}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="twitter">Twitter/X</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="handle">Username/Handle</Label>
                    <Input
                      id="handle"
                      placeholder="@username"
                      value={newProfile.handle}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, handle: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile_url">Profile URL (optional)</Label>
                    <Input
                      id="profile_url"
                      placeholder="https://..."
                      value={newProfile.profile_url}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, profile_url: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="consent"
                      checked={newProfile.consent_given}
                      onCheckedChange={(checked) => setNewProfile(prev => ({ ...prev, consent_given: !!checked }))}
                    />
                    <Label htmlFor="consent" className="text-sm">
                      I consent to analysis of my public posts for writing style personalization
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProfile} disabled={!newProfile.handle.trim() || !newProfile.consent_given}>
                    Add Profile
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Twitter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No social media profiles connected yet</p>
              <p className="text-sm">Add profiles to enable writing style analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => {
                const Icon = getPlatformIcon(profile.platform);
                const colorClass = getPlatformColor(profile.platform);
                
                return (
                  <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium capitalize">{profile.platform}</div>
                        <div className="text-sm text-muted-foreground">{profile.handle}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={profile.analysis_enabled ? "default" : "secondary"}>
                        {profile.analysis_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Switch
                        checked={profile.analysis_enabled}
                        onCheckedChange={(checked) => updateProfile(profile.id, { analysis_enabled: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProfile(profile.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Style Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Writing Style Analysis</CardTitle>
              <CardDescription>
                AI-powered analysis of your social media writing patterns
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {analysis && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalysisResults(!showAnalysisResults)}
                >
                  {showAnalysisResults ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAnalysisResults ? "Hide" : "View"} Results
                </Button>
              )}
              <Button
                onClick={handleRunAnalysis}
                disabled={analyzing || profiles.length === 0}
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4 mr-2" />
                )}
                {analyzing ? "Analyzing..." : "Run Analysis"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Add social media profiles to enable writing style analysis
              </AlertDescription>
            </Alert>
          ) : !analysis ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No analysis available yet</p>
              <p className="text-sm">Run analysis to discover your writing style patterns</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Analysis Complete</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {analysis.posts_analyzed} posts analyzed • {Math.round(analysis.confidence_score * 100)}% confidence
                </div>
              </div>
              
              {showAnalysisResults && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Writing Characteristics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Tone:</span>
                          <Badge variant="outline">{analysis.analysis_data.tone}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Formality:</span>
                          <Badge variant="outline">{Math.round(analysis.analysis_data.formality * 100)}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Vocabulary:</span>
                          <Badge variant="outline">{analysis.analysis_data.vocabulary_level}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Sentence Structure:</span>
                          <Badge variant="outline">{analysis.analysis_data.sentence_structure}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Style Profile</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Writing Style:</span>
                          <p className="text-muted-foreground mt-1">{analysis.style_profile.writing_style}</p>
                        </div>
                        <div>
                          <span className="font-medium">Personality Traits:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysis.style_profile.personality_traits.map((trait, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {trait}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {analysis.analysis_data.common_phrases.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Common Phrases</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.analysis_data.common_phrases.slice(0, 10).map((phrase, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            "{phrase}"
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Controls</CardTitle>
          <CardDescription>
            Manage your data and privacy preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Social Media Analysis Consent</div>
              <div className="text-sm text-muted-foreground">
                Allow analysis of your public social media posts
              </div>
            </div>
            <Switch
              checked={hasConsent('social_media_analysis')}
              onCheckedChange={handleConsentChange}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Delete All Data</div>
              <div className="text-sm text-muted-foreground">
                Permanently delete all scraped posts and analysis data
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure? This action cannot be undone.')) {
                  deleteAnalysis();
                }
              }}
            >
              Delete Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Social Media Privacy Policy</DialogTitle>
            <DialogDescription>
              How we handle your social media data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">What We Collect</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Public posts from your connected social media profiles</li>
                <li>Post text content, dates, and basic engagement metrics</li>
                <li>We do NOT collect private messages, personal information, or follower data</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">How We Use Your Data</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Analyze writing patterns to personalize AI-generated content</li>
                <li>Identify tone, style, and vocabulary preferences</li>
                <li>Improve content generation to match your authentic voice</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Your Rights</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>View all data we've collected about you</li>
                <li>Delete your data at any time</li>
                <li>Opt out of analysis while keeping profiles connected</li>
                <li>Data is automatically deleted after 90 days of inactivity</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Security</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>All data is encrypted in transit and at rest</li>
                <li>Access is limited to authorized personnel only</li>
                <li>We never share your data with third parties</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrivacyDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              handleConsentChange(true);
              setShowPrivacyDialog(false);
            }}>
              I Understand & Consent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocialMediaIntegration;