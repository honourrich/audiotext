import SocialMediaIntegration from "@/components/SocialMediaIntegration";

export default function SocialMediaIntegrationDemo() {
  return (
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Social Media Integration
          </h1>
          <p className="text-gray-600">
            Connect your social profiles for AI-powered writing style analysis
          </p>
        </div>
        <SocialMediaIntegration />
      </div>
    </div>
  );
}
