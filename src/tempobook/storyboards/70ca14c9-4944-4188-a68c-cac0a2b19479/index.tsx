import React, { useState } from "react";
import AutoSaveManager from "@/components/AutoSaveManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function AutoSaveDemo() {
  const { toast } = useToast();
  const [demoData, setDemoData] = useState({
    title: "Demo Episode",
    transcript:
      "This is a sample transcript. Try editing this text to see auto-save in action...",
    summary: "This is a sample summary that will be auto-saved as you type.",
    keywords: ["demo", "auto-save", "example"],
  });

  const saveDemoData = async (data: any) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate occasional save failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error("Simulated save failure - network timeout");
    }

    console.log("Data saved:", data);
    toast({
      title: "Data saved",
      description: "Your changes have been automatically saved",
    });
  };

  const handleRestore = (version: any) => {
    setDemoData(version.data);
    toast({
      title: "Version restored",
      description: `Restored content from ${version.timestamp.toLocaleString()}`,
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Auto-Save System Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Edit the content below to see auto-save in action. Changes are
              saved every 3 seconds automatically. The system also maintains
              version history and prevents data loss.
            </p>
          </CardContent>
        </Card>

        <AutoSaveManager
          data={demoData}
          onSave={saveDemoData}
          onRestore={handleRestore}
          saveInterval={3000}
          maxVersions={5}
          enabled={true}
        >
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Episode Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={demoData.title}
                    onChange={(e) =>
                      setDemoData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Episode title"
                  />
                </div>

                <div>
                  <Label htmlFor="transcript">Transcript</Label>
                  <Textarea
                    id="transcript"
                    value={demoData.transcript}
                    onChange={(e) =>
                      setDemoData((prev) => ({
                        ...prev,
                        transcript: e.target.value,
                      }))
                    }
                    placeholder="Episode transcript"
                    className="min-h-[200px]"
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={demoData.summary}
                    onChange={(e) =>
                      setDemoData((prev) => ({
                        ...prev,
                        summary: e.target.value,
                      }))
                    }
                    placeholder="Episode summary"
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    value={demoData.keywords.join(", ")}
                    onChange={(e) =>
                      setDemoData((prev) => ({
                        ...prev,
                        keywords: e.target.value
                          .split(",")
                          .map((k) => k.trim())
                          .filter((k) => k),
                      }))
                    }
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Edit any field above to trigger auto-save</li>
                  <li>Watch the save status indicator at the top</li>
                  <li>Click "History" to see previous versions</li>
                  <li>Try refreshing the page - your changes are preserved</li>
                  <li>The system prevents data loss on browser crashes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </AutoSaveManager>
      </div>
    </div>
  );
}
