import PersonalizationSettings from "@/components/PersonalizationSettings";

export default function PersonalizationSettingsDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PersonalizationSettings userId="demo-user-123" />
    </div>
  );
}
