import ExportManager from "@/components/ExportManager";

export default function ExportManagerStoryboard() {
  const mockData = {
    title: "The Future of AI in Content Creation",
    author: "Tech Innovator",
    transcript: `**The Future of AI in Content Creation**
*Featuring: Tech Innovator*

**[ACTUAL TRANSCRIPT - DIALOGUE FORMAT]**

**Tech Innovator:** Welcome everyone to today's discussion about the future of AI in content creation. I'm excited to dive into this topic with you.

**Tech Innovator:** The landscape of content creation is changing rapidly. We're seeing AI tools that can generate text, images, videos, and even entire podcasts. But what does this mean for creators?

**Tech Innovator:** First, let's talk about the opportunities. AI can help creators work faster, generate ideas, and overcome creative blocks. It's like having a creative assistant that never gets tired.

**Tech Innovator:** However, there are also challenges we need to address. Questions about authenticity, originality, and the human touch in creative work are more important than ever.

**Tech Innovator:** The key is finding the right balance between leveraging AI capabilities and maintaining human creativity and connection with audiences.

**[END OF TRANSCRIPT]**

*Actual transcript from: The Future of AI in Content Creation*`,
    summary: {
      short:
        "An insightful discussion about how AI is transforming content creation, exploring both opportunities and challenges for creators in the digital age.",
      long: "This comprehensive discussion explores the rapidly evolving landscape of AI in content creation. The conversation covers how AI tools are revolutionizing the way creators work, from generating text and images to producing entire multimedia experiences. Key topics include the opportunities AI presents for increased productivity and creativity, as well as the challenges around authenticity and maintaining human connection in an AI-driven world. The discussion emphasizes finding the right balance between leveraging AI capabilities and preserving the human element that audiences value.",
    },
    chapters: [
      {
        timestamp: "00:00:00",
        title: "Introduction to AI in Content Creation",
        content:
          "Setting the stage for discussing how AI is transforming the creative landscape and what it means for content creators.",
      },
      {
        timestamp: "00:05:30",
        title: "Opportunities and Benefits",
        content:
          "Exploring how AI tools can enhance productivity, generate ideas, and help creators overcome creative blocks.",
      },
      {
        timestamp: "00:12:15",
        title: "Challenges and Concerns",
        content:
          "Addressing questions about authenticity, originality, and maintaining the human touch in AI-assisted content.",
      },
      {
        timestamp: "00:18:45",
        title: "Finding the Right Balance",
        content:
          "Discussing strategies for leveraging AI while preserving human creativity and audience connection.",
      },
    ],
    keywords: [
      "artificial intelligence",
      "content creation",
      "creative tools",
      "digital marketing",
      "automation",
      "creativity",
      "technology trends",
      "content strategy",
      "AI tools",
      "creative process",
      "innovation",
      "digital transformation",
    ],
    quotes: [
      {
        text: "AI can help creators work faster, generate ideas, and overcome creative blocks. It's like having a creative assistant that never gets tired.",
        speaker: "Tech Innovator",
      },
      {
        text: "Questions about authenticity, originality, and the human touch in creative work are more important than ever.",
        speaker: "Tech Innovator",
      },
      {
        text: "The key is finding the right balance between leveraging AI capabilities and maintaining human creativity and connection with audiences.",
        speaker: "Tech Innovator",
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Export Manager Demo</h1>
          <p className="text-gray-600">
            Comprehensive export and sharing functionality for AI-generated
            content
          </p>
        </div>

        <ExportManager data={mockData} />
      </div>
    </div>
  );
}
