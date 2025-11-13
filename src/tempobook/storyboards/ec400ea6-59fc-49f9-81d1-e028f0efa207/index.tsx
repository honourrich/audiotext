import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CollaborativeEditor from "@/components/CollaborativeEditor";
import RoleDashboard from "@/components/RoleDashboard";
import WorkflowManager from "@/components/WorkflowManager";
import { NotificationBell } from "@/components/NotificationCenter";
import { Users, FileText, MessageSquare, Settings } from "lucide-react";

export default function CollaborationDemo() {
  const [activeTab, setActiveTab] = useState("editor");
  const [currentRole, setCurrentRole] = useState<
    "host" | "editor" | "marketer" | "va"
  >("host");

  // Mock data
  const mockContent = {
    transcript:
      "Welcome to this episode of our podcast. Today we're discussing the future of AI and how it will impact our daily lives. Our guest is Dr. Sarah Johnson, a leading researcher in artificial intelligence...",
    summary:
      "In this episode, we explore the transformative potential of AI with Dr. Sarah Johnson. Key topics include machine learning applications, ethical considerations, and the future job market.",
    chapters:
      "00:00 - Introduction\n05:30 - AI in Healthcare\n15:45 - Ethical Considerations\n25:20 - Future Predictions\n35:00 - Q&A Session",
    keywords:
      "artificial intelligence, machine learning, healthcare AI, ethics, future technology, automation, job market, innovation",
  };

  const mockEpisodeId = "demo-episode-123";
  const mockUserId = "demo-user-456";
  const mockWorkspaceId = "demo-workspace-789";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Podjust Collaboration Demo
            </h1>
            <p className="text-gray-600">
              Advanced team collaboration features for podcast content creation
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Role Switcher */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View as:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="host">Host</option>
                <option value="editor">Editor</option>
                <option value="marketer">Marketer</option>
                <option value="va">Virtual Assistant</option>
              </select>
            </div>

            <NotificationBell />

            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">3 active</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="dashboard"
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Collaborative Editor</span>
            </TabsTrigger>
            <TabsTrigger
              value="workflow"
              className="flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Workflow</span>
            </TabsTrigger>
            <TabsTrigger
              value="features"
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Features</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <RoleDashboard
              currentUserId={mockUserId}
              userRole={currentRole}
              workspaceId={mockWorkspaceId}
            />
          </TabsContent>

          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Collaborative Editor</CardTitle>
                <p className="text-sm text-gray-600">
                  Edit content together with your team in real-time. See live
                  cursors, comments, and changes.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <CollaborativeEditor
                    episodeId={mockEpisodeId}
                    content={mockContent}
                    onContentChange={(newContent) =>
                      console.log("Content changed:", newContent)
                    }
                    currentUserId={mockUserId}
                    readOnly={false}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4">
            <WorkflowManager
              episodeId={mockEpisodeId}
              currentUserRole={currentRole}
              onStatusChange={(status) =>
                console.log("Status changed to:", status)
              }
            />
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Real-time Collaboration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span>Real-time Collaboration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Live cursor positions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Real-time text editing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Auto-save every 3 seconds</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Conflict resolution</span>
                  </div>
                </CardContent>
              </Card>

              {/* Role-based Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-green-500" />
                    <span>Role-based Access</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-100 text-purple-800">
                      Host
                    </Badge>
                    <span className="text-sm">Full control & publishing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-800">Editor</Badge>
                    <span className="text-sm">Content review & approval</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-orange-100 text-orange-800">
                      Marketer
                    </Badge>
                    <span className="text-sm">Marketing content access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-gray-100 text-gray-800">VA</Badge>
                    <span className="text-sm">Upload & draft creation</span>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                    <span>Workflow System</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Draft</Badge>
                    <span className="text-sm">→</span>
                    <Badge variant="outline">Review</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Approved</Badge>
                    <span className="text-sm">→</span>
                    <Badge variant="outline">Published</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Automated notifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Approval tracking</span>
                  </div>
                </CardContent>
              </Card>

              {/* Comments & Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-red-500" />
                    <span>Comments & Feedback</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Threaded comments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Text selection comments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Priority levels</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">@mentions & notifications</span>
                  </div>
                </CardContent>
              </Card>

              {/* Version Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <span>Version Control</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Automatic snapshots</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Change tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Restore any version</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Diff view</span>
                  </div>
                </CardContent>
              </Card>

              {/* Team Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-teal-500" />
                    <span>Team Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Invite team members</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Role assignment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Permission management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✓</Badge>
                    <span className="text-sm">Activity tracking</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Implementation Status */}
            <Card>
              <CardHeader>
                <CardTitle>Implementation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">✅ Completed</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Database schema with all collaboration tables</li>
                      <li>• Real-time collaboration hooks</li>
                      <li>• Collaborative text editor component</li>
                      <li>• Role-based dashboard views</li>
                      <li>• Workflow management system</li>
                      <li>• Notification center</li>
                      <li>• Comments and feedback system</li>
                      <li>• Version history tracking</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-600">🔄 Next Steps</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• WebSocket integration for real-time updates</li>
                      <li>• Team invitation email system</li>
                      <li>• Advanced conflict resolution</li>
                      <li>• Export tools for different formats</li>
                      <li>• Integration with external tools</li>
                      <li>• Mobile-responsive collaboration</li>
                      <li>• Analytics and reporting</li>
                      <li>• White-label options</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
