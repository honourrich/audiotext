import ResourceLinkManager from "@/components/ResourceLinkManager";

export default function ResourceLinkManagerDemo() {
  const mockExtractedResources = [
    {
      id: "1",
      resource_name: "ChatGPT",
      resource_type: "tool",
      canonical_url: "https://chat.openai.com",
      alternative_names: ["Chat GPT", "OpenAI ChatGPT"],
      category: "AI Tools",
      description: "AI-powered conversational assistant",
      auto_link_enabled: true,
      usage_count: 15,
    },
    {
      id: "2",
      resource_name: "Notion",
      resource_type: "tool",
      canonical_url: "https://notion.so",
      alternative_names: ["Notion.so"],
      category: "Productivity",
      description: "All-in-one workspace for notes and collaboration",
      auto_link_enabled: true,
      usage_count: 8,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ResourceLinkManager
        extractedResources={mockExtractedResources}
        onResourcesUpdate={(resources) =>
          console.log("Resources updated:", resources)
        }
      />
    </div>
  );
}
