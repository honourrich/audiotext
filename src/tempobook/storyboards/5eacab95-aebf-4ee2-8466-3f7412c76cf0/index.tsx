import AutoSaveManager from "@/components/AutoSaveManager";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AutoSaveDemo() {
  const [formData, setFormData] = useState({
    title: "My Podcast Episode",
    transcript:
      "This is a sample transcript that will auto-save as you type...",
    summary: "A brief summary of the episode content.",
    keywords: ["podcast", "AI", "transcription"],
  });

  const handleSave = async (data: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Saved:", data);
  };

  const handleRestore = (version: any) => {
    setFormData(version.content);
    console.log("Restored version:", version);
  };

  return (
    <AutoSaveManager
      data={formData}
      onSave={handleSave}
      onRestore={handleRestore}
      saveInterval={3000}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Episode Editor with Auto-Save</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Episode title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Transcript
              </label>
              <Textarea
                value={formData.transcript}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    transcript: e.target.value,
                  }))
                }
                placeholder="Start typing your transcript..."
                rows={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Summary</label>
              <Textarea
                value={formData.summary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, summary: e.target.value }))
                }
                placeholder="Episode summary..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              💡 Try editing the content above. Changes will auto-save every 3
              seconds. Use the undo/redo buttons in the top bar to navigate
              through versions.
            </p>
          </CardContent>
        </Card>
      </div>
    </AutoSaveManager>
  );
}
