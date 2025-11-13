import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { 
  Download, 
  Copy, 
  FileText, 
  Hash, 
  MessageSquare,
  Globe,
  Code,
  Twitter,
  Linkedin,
  Youtube,
  Eye,
  Check,
  X,
  HelpCircle,
  Users,
  BookOpen,
  Lightbulb
} from 'lucide-react';

interface ExportManagerProps {
  episode: {
    title: string;
    transcript: string;
    summary: string;
    chapters: string;
    keywords: string;
  };
}

interface PreviewData {
  title: string;
  content: string;
  type: 'text' | 'html' | 'json' | 'markdown';
}

export default function ExportManager({ episode }: ExportManagerProps) {
  const [previewDialog, setPreviewDialog] = useState<PreviewData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Generate different content formats
  const generateShortSummary = () => {
    const sentences = episode.summary.split('.').filter(s => s.trim());
    return sentences.slice(0, 2).join('.') + '.';
  };

  const generateDetailedSummary = () => {
    return episode.summary;
  };

  const generateAllQuotes = () => {
    // Extract potential quotes from transcript (sentences in quotes or notable statements)
    const quotes = episode.transcript
      .split(/[.!?]/)
      .filter(sentence => sentence.length > 50 && sentence.length < 200)
      .slice(0, 5)
      .map((quote, index) => `"${quote.trim()}."`)
      .join('\n\n');
    return quotes || 'No notable quotes found in this episode.';
  };

  const generateMarkdown = () => {
    return `# ${episode.title}

## Summary
${episode.summary}

## Chapters
${episode.chapters}

## Keywords
${episode.keywords}

## Full Transcript
${episode.transcript}`;
  };

  const generateHTML = () => {
    return `<!DOCTYPE html>
<html>
<head>
    <title>${episode.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; }
        h2 { color: #666; margin-top: 30px; }
        .keywords { background: #f8f9fa; padding: 10px; border-radius: 5px; }
        .chapters { line-height: 1.6; }
    </style>
</head>
<body>
    <h1>${episode.title}</h1>
    
    <h2>Summary</h2>
    <p>${episode.summary}</p>
    
    <h2>Chapters</h2>
    <div class="chapters">
        ${episode.chapters.split('\n').map(chapter => `<p>${chapter}</p>`).join('')}
    </div>
    
    <h2>Keywords</h2>
    <div class="keywords">${episode.keywords}</div>
    
    <h2>Full Transcript</h2>
    <p>${episode.transcript}</p>
</body>
</html>`;
  };

  const generateJSON = () => {
    return JSON.stringify({
      title: episode.title,
      summary: episode.summary,
      chapters: episode.chapters.split('\n').filter(c => c.trim()),
      keywords: episode.keywords.split(',').map(k => k.trim()),
      transcript: episode.transcript,
      exportedAt: new Date().toISOString()
    }, null, 2);
  };

  const generateTwitterThread = () => {
    const summary = generateShortSummary();
    const keyPoints = episode.chapters.split('\n').slice(0, 3);
    
    return `🎙️ New episode: "${episode.title}"

${summary}

Key topics covered:
${keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

#podcast #${episode.keywords.split(',')[0]?.trim().replace(/\s+/g, '')}

🧵 Thread below 👇`;
  };

  const generateLinkedInPost = () => {
    return `🎙️ Just released: "${episode.title}"

${episode.summary}

Key takeaways:
${episode.chapters.split('\n').slice(0, 4).map(chapter => `• ${chapter}`).join('\n')}

What resonated most with you? Share your thoughts in the comments!

#podcast #content #${episode.keywords.split(',')[0]?.trim().replace(/\s+/g, '')}`;
  };

  const generateYouTubeDescription = () => {
    return `${episode.summary}

📋 CHAPTERS:
${episode.chapters}

🏷️ TAGS:
${episode.keywords}

---

Don't forget to like, subscribe, and hit the notification bell for more content!

Connect with us:
• Website: [Your Website]
• Twitter: [Your Twitter]
• LinkedIn: [Your LinkedIn]

#podcast #${episode.keywords.split(',').slice(0, 3).map(k => k.trim().replace(/\s+/g, '')).join(' #')}`;
  };

  // Q&A Extraction Functions
  const extractQuestionsAndAnswers = () => {
    const transcript = episode.transcript;
    const qaPairs = [];
    
    // Split transcript into sentences
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (let i = 0; i < sentences.length - 1; i++) {
      const currentSentence = sentences[i].trim();
      const nextSentence = sentences[i + 1].trim();
      
      // Look for question patterns
      const isQuestion = /^(what|how|why|when|where|who|can|could|would|should|do|does|did|is|are|was|were|have|has|had)\b/i.test(currentSentence) ||
                        currentSentence.includes('?') ||
                        /^(tell me|explain|describe|share|walk me through)\b/i.test(currentSentence);
      
      if (isQuestion && nextSentence.length > 20) {
        qaPairs.push({
          question: currentSentence + (currentSentence.endsWith('?') ? '' : '?'),
          answer: nextSentence + '.'
        });
      }
    }
    
    return qaPairs.slice(0, 10); // Limit to 10 Q&A pairs
  };

  const extractInterviewQuestions = () => {
    const transcript = episode.transcript;
    const questions = [];
    
    // Look for direct questions in the transcript
    const questionPatterns = [
      /[^.!?]*\?/g, // Direct questions ending with ?
      /(what|how|why|when|where|who|can|could|would|should|do|does|did|is|are|was|were|have|has|had)\s+[^.!?]*[.!?]/gi, // Questions without ?
      /(tell me|explain|describe|share|walk me through)\s+[^.!?]*[.!?]/gi // Imperative questions
    ];
    
    questionPatterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanQuestion = match.trim();
          if (cleanQuestion.length > 15 && cleanQuestion.length < 200) {
            questions.push(cleanQuestion);
          }
        });
      }
    });
    
    // Remove duplicates and limit
    return [...new Set(questions)].slice(0, 15);
  };

  const extractKeyInsights = () => {
    const transcript = episode.transcript;
    const insights = [];
    
    // Look for insight patterns
    const insightPatterns = [
      /(the key|important|crucial|essential|main|primary|fundamental)\s+[^.!?]*[.!?]/gi,
      /(remember|note|keep in mind|don't forget)\s+[^.!?]*[.!?]/gi,
      /(insight|lesson|takeaway|learning)\s+[^.!?]*[.!?]/gi,
      /(pro tip|tip|advice|recommendation)\s+[^.!?]*[.!?]/gi
    ];
    
    insightPatterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanInsight = match.trim();
          if (cleanInsight.length > 20 && cleanInsight.length < 300) {
            insights.push(cleanInsight);
          }
        });
      }
    });
    
    return [...new Set(insights)].slice(0, 8);
  };

  // Q&A Template Generators using extracted content
  const generateFAQ = () => {
    const qaPairs = extractQuestionsAndAnswers();
    
    if (qaPairs.length === 0) {
      return `# Frequently Asked Questions - ${episode.title}

No direct Q&A pairs found in the transcript. This might be a monologue-style episode.

## Episode Summary
${episode.summary}

## Key Topics Covered
${episode.chapters.split('\n').filter(c => c.trim()).map((chapter, index) => `${index + 1}. ${chapter}`).join('\n')}`;
    }
    
    const faq = qaPairs.map((qa, index) => {
      return `Q${index + 1}: ${qa.question}\nA${index + 1}: ${qa.answer}\n`;
    }).join('\n');
    
    return `# Frequently Asked Questions - ${episode.title}

${faq}

Based on the actual conversation in this episode.`;
  };

  const generateInterviewQuestions = () => {
    const questions = extractInterviewQuestions();
    
    if (questions.length === 0) {
      return `# Interview Questions - ${episode.title}

No direct questions found in the transcript. This might be a monologue-style episode.

## Episode Summary
${episode.summary}`;
    }
    
    const questionList = questions.map((question, index) => {
      return `${index + 1}. ${question}`;
    }).join('\n');
    
    return `# Interview Questions - ${episode.title}

These are actual questions that came up during the episode:

${questionList}

## Episode Context
${episode.summary}`;
  };

  const generateStudyGuide = () => {
    const insights = extractKeyInsights();
    const chapters = episode.chapters.split('\n').filter(c => c.trim());
    const keywords = episode.keywords.split(',').map(k => k.trim()).slice(0, 10);
    
    return `# Study Guide - ${episode.title}

## Key Topics Covered
${chapters.map((chapter, index) => `${index + 1}. ${chapter}`).join('\n')}

## Important Terms & Concepts
${keywords.map(keyword => `• ${keyword}`).join('\n')}

## Key Insights from the Episode
${insights.map((insight, index) => `${index + 1}. ${insight}`).join('\n')}

## Discussion Questions
1. How does the main topic relate to current industry trends?
2. What are the practical applications of the concepts discussed?
3. How would you implement these ideas in your own work?
4. What questions do you still have about this topic?

## Episode Summary
${episode.summary}`;
  };

  const generateQuizQuestions = () => {
    const qaPairs = extractQuestionsAndAnswers();
    
    if (qaPairs.length === 0) {
      return `# Quiz Questions - ${episode.title}

No Q&A pairs found in the transcript to create quiz questions from.

## Episode Summary
${episode.summary}`;
    }
    
    const questions = qaPairs.slice(0, 5).map((qa, index) => {
      return `Question ${index + 1}: ${qa.question.replace('?', '')}?
A) [Option A - based on episode content]
B) [Option B - based on episode content] 
C) [Option C - based on episode content]
D) [Option D - based on episode content]

Correct Answer: [Answer based on: ${qa.answer}]

`;
    }).join('');
    
    return `# Quiz Questions - ${episode.title}

${questions}

## Instructions
• Answer all questions based on the episode content
• Review the explanations for any incorrect answers
• Use this as a self-assessment tool

## Episode Summary
${episode.summary}`;
  };

  const generateDiscussionPrompts = () => {
    const questions = extractInterviewQuestions();
    const insights = extractKeyInsights();
    
    const discussionQuestions = questions.slice(0, 5).map((question, index) => {
      return `${index + 1}. **${question.replace('?', '')}**: Share your thoughts on this question. How does it relate to your experience?`;
    }).join('\n\n');
    
    const insightPrompts = insights.slice(0, 3).map((insight, index) => {
      return `${index + 1}. **Insight**: "${insight}" - How do you see this applying to your work or life?`;
    }).join('\n\n');
    
    return `# Discussion Prompts - ${episode.title}

Use these prompts to facilitate group discussions or personal reflection based on the actual content from this episode.

## Questions from the Episode
${discussionQuestions}

## Insights to Discuss
${insightPrompts}

## General Discussion Questions
• What was the most surprising insight from this episode?
• How has this episode changed your perspective on the topic?
• What action steps will you take based on what you learned?
• What questions would you ask the guest if you could speak with them directly?

## Episode Context
${episode.summary}`;
  };

  const handlePreview = (title: string, content: string, type: 'text' | 'html' | 'json' | 'markdown' = 'text') => {
    console.log('Opening preview for:', title); // Debug log
    setPreviewDialog({ title, content, type });
  };

  const handleCopy = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 bg-background">
      {/* Export & Share Header */}
      <div className="flex items-center space-x-2 text-foreground">
        <Download className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Export & Share</h2>
      </div>
      <p className="text-muted-foreground text-sm">Export your content in various formats or copy sections to clipboard</p>

      {/* Quick Copy Section */}
      <div>
        <h3 className="font-medium text-foreground mb-3">Quick Copy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Short Summary', generateShortSummary())}
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Short Summary</div>
                <div className="text-xs text-muted-foreground">Brief overview</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Detailed Summary', generateDetailedSummary())}
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Detailed Summary</div>
                <div className="text-xs text-muted-foreground">Complete summary</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Keywords', episode.keywords)}
          >
            <div className="flex items-center space-x-3">
              <Hash className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Keywords</div>
                <div className="text-xs text-muted-foreground">SEO tags</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('All Quotes', generateAllQuotes())}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">All Quotes</div>
                <div className="text-xs text-muted-foreground">Notable statements</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>
        </div>
      </div>

      {/* Download Files Section */}
      <div>
        <h3 className="font-medium text-foreground mb-3">Download Files</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Markdown Preview', generateMarkdown(), 'markdown')}
          >
            <div className="flex items-center space-x-3">
              <Download className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Markdown (.md)</div>
                <div className="text-xs text-muted-foreground">Formatted text</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('HTML Preview', generateHTML(), 'html')}
          >
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">HTML (.html)</div>
                <div className="text-xs text-muted-foreground">Web page</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('JSON Preview', generateJSON(), 'json')}
          >
            <div className="flex items-center space-x-3">
              <Code className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">JSON (.json)</div>
                <div className="text-xs text-muted-foreground">Structured data</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Transcript Preview', episode.transcript)}
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Transcript (.txt)</div>
                <div className="text-xs text-muted-foreground">Plain text</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>
        </div>
      </div>

      {/* Social Media Templates Section */}
      <div>
        <h3 className="font-medium text-foreground mb-3">Social Media Templates</h3>
        <div className="space-y-3">
          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Twitter Thread', generateTwitterThread())}
          >
            <div className="flex items-center space-x-3">
              <Twitter className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Copy Twitter Thread</div>
                <div className="text-xs text-muted-foreground">Optimized for Twitter</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('LinkedIn Post', generateLinkedInPost())}
          >
            <div className="flex items-center space-x-3">
              <Linkedin className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Copy LinkedIn Post</div>
                <div className="text-xs text-muted-foreground">Professional format</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('YouTube Description', generateYouTubeDescription())}
          >
            <div className="flex items-center space-x-3">
              <Youtube className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Copy YouTube Description</div>
                <div className="text-xs text-muted-foreground">Video description</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>
        </div>
      </div>

      {/* Q&A Templates Section */}
      <div>
        <h3 className="font-medium text-foreground mb-3">Q&A Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('FAQ Template', generateFAQ(), 'markdown')}
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">FAQ Template</div>
                <div className="text-xs text-muted-foreground">Frequently asked questions</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Interview Questions', generateInterviewQuestions(), 'markdown')}
          >
            <div className="flex items-center space-x-3">
              <Users className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Interview Questions</div>
                <div className="text-xs text-muted-foreground">For guest interviews</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Study Guide', generateStudyGuide(), 'markdown')}
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Study Guide</div>
                <div className="text-xs text-muted-foreground">Educational material</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Quiz Questions', generateQuizQuestions(), 'markdown')}
          >
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Quiz Questions</div>
                <div className="text-xs text-muted-foreground">Assessment questions</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-4 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Discussion Prompts', generateDiscussionPrompts(), 'markdown')}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Discussion Prompts</div>
                <div className="text-xs text-muted-foreground">Group discussion starters</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>
        </div>
      </div>

      {/* Preview Dialog - Simple Modal */}
      {previewDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <h2 className="text-lg font-semibold">{previewDialog.title}</h2>
              </div>
              <button
                className="p-1 hover:bg-muted rounded"
                onClick={() => setPreviewDialog(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden p-6">
              {previewDialog.type === 'html' ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">HTML Preview:</div>
                  <div 
                    className="border rounded-lg p-4 bg-background max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: previewDialog.content }}
                  />
                  <div className="text-sm text-muted-foreground">Raw HTML:</div>
                  <Textarea
                    value={previewDialog.content}
                    readOnly
                    className="font-mono text-sm max-h-32 overflow-y-auto"
                  />
                </div>
              ) : (
                <Textarea
                  value={previewDialog.content}
                  readOnly
                  className={`w-full h-96 resize-none ${
                    previewDialog.type === 'json' || previewDialog.type === 'markdown' 
                      ? 'font-mono text-sm' 
                      : ''
                  }`}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t">
              <Button variant="outline" onClick={() => setPreviewDialog(null)}>
                Close
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleCopy(previewDialog.content, previewDialog.title);
                  }}
                  className="flex items-center space-x-2"
                >
                  {copied === previewDialog.title ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
                
                {previewDialog.type !== 'text' && (
                  <Button
                    onClick={() => {
                      const extension = previewDialog.type === 'html' ? 'html' : 
                                     previewDialog.type === 'json' ? 'json' : 
                                     previewDialog.type === 'markdown' ? 'md' : 'txt';
                      const mimeType = previewDialog.type === 'html' ? 'text/html' :
                                     previewDialog.type === 'json' ? 'application/json' :
                                     'text/plain';
                      
                      handleDownload(
                        previewDialog.content,
                        `${episode.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`,
                        mimeType
                      );
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}