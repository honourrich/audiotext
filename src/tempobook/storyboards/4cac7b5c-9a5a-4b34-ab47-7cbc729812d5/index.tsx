import ContentEditor from "@/components/ContentEditor";

export default function ContentEditorWithGeneratedContent() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <ContentEditor episodeId="demo" />
    </div>
  );
}
