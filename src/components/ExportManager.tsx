import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { 
  Download, 
  Copy, 
  FileText, 
  Globe,
  Code,
  Eye,
  Check,
  X,
  Sparkles,
  File,
  FileSpreadsheet,
  BookOpen,
  MessageSquare,
  Rss,
  Twitter,
  Linkedin,
  FileType,
  Layers
} from 'lucide-react';

interface ExportManagerProps {
  episode: {
    title: string;
    transcript: string;
    summary: string;
    chapters: string;
    keywords: string;
    quotes?: Array<{
      text: string;
      speaker?: string;
      timestamp?: string;
    }>;
  };
}

interface PreviewData {
  title: string;
  content: string;
  type: 'text' | 'html' | 'json' | 'markdown' | 'pdf' | 'docx' | 'csv' | 'xml' | 'rtf' | 'epub' | 'twitter' | 'linkedin' | 'rss' | 'show-notes';
}

export default function ExportManager({ episode }: ExportManagerProps) {
  const [previewDialog, setPreviewDialog] = useState<PreviewData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);



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

  const generateCSV = () => {
    const chapters = episode.chapters.split('\n').filter(c => c.trim());
    const keywords = episode.keywords.split(',').map(k => k.trim());
    
    let csv = 'Type,Content\n';
    csv += `Title,"${episode.title.replace(/"/g, '""')}"\n`;
    csv += `Summary,"${episode.summary.replace(/"/g, '""')}"\n`;
    csv += `Transcript,"${episode.transcript.replace(/"/g, '""')}"\n`;
    
    chapters.forEach((chapter, index) => {
      csv += `Chapter ${index + 1},"${chapter.replace(/"/g, '""')}"\n`;
    });
    
    keywords.forEach((keyword, index) => {
      csv += `Keyword ${index + 1},"${keyword.replace(/"/g, '""')}"\n`;
    });
    
    return csv;
  };

  const generateXML = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<episode>
  <title><![CDATA[${episode.title}]]></title>
  <summary><![CDATA[${episode.summary}]]></summary>
  <chapters>
    ${episode.chapters.split('\n').filter(c => c.trim()).map((chapter, index) => 
      `    <chapter number="${index + 1}"><![CDATA[${chapter}]]></chapter>`
    ).join('\n')}
  </chapters>
  <keywords>
    ${episode.keywords.split(',').map(k => k.trim()).map(keyword => 
      `    <keyword><![CDATA[${keyword}]]></keyword>`
    ).join('\n')}
  </keywords>
  <transcript><![CDATA[${episode.transcript}]]></transcript>
  <exportedAt>${new Date().toISOString()}</exportedAt>
</episode>`;
  };

  const generateRTF = () => {
    return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\f0\\fs24\\cf1
{\\b ${episode.title}}\\par\\par
{\\b Summary:}\\par
${episode.summary}\\par\\par
{\\b Chapters:}\\par
${episode.chapters.split('\n').map(chapter => `${chapter}\\par`).join('')}\\par
{\\b Keywords:}\\par
${episode.keywords}\\par\\par
{\\b Full Transcript:}\\par
${episode.transcript}\\par
}`;
  };

  const generateTwitterThread = () => {
    const maxLength = 280;
    const sentences = episode.transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const tweets = [];
    
    let currentTweet = `🧵 Thread: ${episode.title}\n\n`;
    
    sentences.forEach((sentence, index) => {
      const cleanSentence = sentence.trim();
      if (currentTweet.length + cleanSentence.length + 3 < maxLength) {
        currentTweet += cleanSentence + '. ';
      } else {
        tweets.push(currentTweet.trim());
        currentTweet = `${index + 1}/${sentences.length} ` + cleanSentence + '. ';
      }
    });
    
    if (currentTweet.trim()) {
      tweets.push(currentTweet.trim());
    }
    
    return tweets.join('\n\n---\n\n');
  };

  const generateLinkedInPost = () => {
    return `🎙️ ${episode.title}

${episode.summary}

📝 Key Takeaways:
${episode.chapters.split('\n').filter(c => c.trim()).slice(0, 3).map((chapter, index) => 
  `• ${chapter}`
).join('\n')}

🔍 Keywords: ${episode.keywords.split(',').slice(0, 5).join(', ')}

#Podcast #Content #Insights #ProfessionalDevelopment`;
  };

  const generateRSS = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${episode.title}</title>
    <description>${episode.summary}</description>
    <language>en-us</language>
    <item>
      <title>${episode.title}</title>
      <description><![CDATA[${episode.summary}]]></description>
      <content:encoded><![CDATA[${episode.transcript}]]></content:encoded>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <guid isPermaLink="false">${Date.now()}</guid>
    </item>
  </channel>
</rss>`;
  };

  const generateShowNotes = () => {
    return `# ${episode.title} - Show Notes

## Episode Summary
${episode.summary}

## Chapters & Timestamps
${episode.chapters.split('\n').filter(c => c.trim()).map((chapter, index) => 
  `${index + 1}. ${chapter}`
).join('\n')}

## Key Topics Discussed
${episode.keywords.split(',').map(k => k.trim()).map(keyword => 
  `• ${keyword}`
).join('\n')}

## Full Transcript
${episode.transcript}

---
*Generated on ${new Date().toLocaleDateString()}*`;
  };

  const generateEPUB = () => {
    // Simplified EPUB structure (would need proper EPUB library for full implementation)
    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata>
    <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">${episode.title}</dc:title>
    <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">Podcast Host</dc:creator>
    <dc:language xmlns:dc="http://purl.org/dc/elements/1.1/">en</dc:language>
    <dc:date xmlns:dc="http://purl.org/dc/elements/1.1/">${new Date().toISOString()}</dc:date>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>

<!-- Chapter Content -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${episode.title}</title>
</head>
<body>
  <h1>${episode.title}</h1>
  <h2>Summary</h2>
  <p>${episode.summary}</p>
  <h2>Transcript</h2>
  <p>${episode.transcript}</p>
</body>
</html>`;
  };



  const handlePreview = (title: string, content: string, type: 'text' | 'html' | 'json' | 'markdown' | 'pdf' | 'docx' | 'csv' | 'xml' | 'rtf' | 'epub' | 'twitter' | 'linkedin' | 'rss' | 'show-notes' = 'text') => {
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


      {/* Export Options */}
      <div>
        <h3 className="font-medium text-foreground mb-3">Export Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Basic Formats */}
          <button
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
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

          <button
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
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
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
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
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
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
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('CSV Preview', generateCSV(), 'csv')}
          >
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">CSV (.csv)</div>
                <div className="text-xs text-muted-foreground">Spreadsheet data</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('XML Preview', generateXML(), 'xml')}
          >
            <div className="flex items-center space-x-3">
              <FileType className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">XML (.xml)</div>
                <div className="text-xs text-muted-foreground">Structured markup</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('RTF Preview', generateRTF(), 'rtf')}
          >
            <div className="flex items-center space-x-3">
              <File className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">RTF (.rtf)</div>
                <div className="text-xs text-muted-foreground">Rich text format</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('EPUB Preview', generateEPUB(), 'epub')}
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">EPUB (.epub)</div>
                <div className="text-xs text-muted-foreground">E-book format</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Show Notes Preview', generateShowNotes(), 'show-notes')}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Show Notes (.md)</div>
                <div className="text-xs text-muted-foreground">Podcast notes</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>
          <button
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Twitter Thread Preview', generateTwitterThread(), 'twitter')}
          >
            <div className="flex items-center space-x-3">
              <Twitter className="w-4 h-4 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Twitter Thread</div>
                <div className="text-xs text-muted-foreground">Tweet series</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('LinkedIn Post Preview', generateLinkedInPost(), 'linkedin')}
          >
            <div className="flex items-center space-x-3">
              <Linkedin className="w-4 h-4 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">LinkedIn Post</div>
                <div className="text-xs text-muted-foreground">Professional post</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('RSS Feed Preview', generateRSS(), 'rss')}
          >
            <div className="flex items-center space-x-3">
              <Rss className="w-4 h-4 text-orange-500" />
              <div className="text-left">
                <div className="font-medium">RSS Feed (.xml)</div>
                <div className="text-xs text-muted-foreground">Podcast feed</div>
              </div>
              <Eye className="w-4 h-4 ml-auto" />
            </div>
          </button>

          <button
            className="flex items-center justify-start h-auto p-3 border border-input rounded-lg hover:bg-muted transition-colors w-full"
            onClick={() => handlePreview('Show Notes Preview', generateShowNotes(), 'show-notes')}
          >
            <div className="flex items-center space-x-3">
              <Layers className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Podcast Show Notes</div>
                <div className="text-xs text-muted-foreground">Episode summary</div>
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
              ) : previewDialog.type === 'twitter' || previewDialog.type === 'linkedin' ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    {previewDialog.type === 'twitter' ? 'Twitter Thread Preview:' : 'LinkedIn Post Preview:'}
                  </div>
                  <div className="border rounded-lg p-4 bg-blue-50 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{previewDialog.content}</pre>
                  </div>
                  <div className="text-sm text-muted-foreground">Raw Content:</div>
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
                    ['json', 'markdown', 'csv', 'xml', 'rtf', 'epub', 'rss', 'show-notes'].includes(previewDialog.type)
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
                
                <Button
                  onClick={() => {
                    const getExtensionAndMimeType = (type: string) => {
                      switch (type) {
                        case 'html': return { ext: 'html', mime: 'text/html' };
                        case 'json': return { ext: 'json', mime: 'application/json' };
                        case 'markdown': return { ext: 'md', mime: 'text/markdown' };
                        case 'csv': return { ext: 'csv', mime: 'text/csv' };
                        case 'xml': return { ext: 'xml', mime: 'application/xml' };
                        case 'rtf': return { ext: 'rtf', mime: 'application/rtf' };
                        case 'epub': return { ext: 'epub', mime: 'application/epub+zip' };
                        case 'twitter': return { ext: 'txt', mime: 'text/plain' };
                        case 'linkedin': return { ext: 'txt', mime: 'text/plain' };
                        case 'rss': return { ext: 'xml', mime: 'application/rss+xml' };
                        case 'show-notes': return { ext: 'md', mime: 'text/markdown' };
                        default: return { ext: 'txt', mime: 'text/plain' };
                      }
                    };
                    
                    const { ext, mime } = getExtensionAndMimeType(previewDialog.type);
                    
                    handleDownload(
                      previewDialog.content,
                      `${episode.title.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`,
                      mime
                    );
                  }}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}