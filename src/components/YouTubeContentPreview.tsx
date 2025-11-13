import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Download, 
  ExternalLink, 
  CheckCircle,
  Eye,
  EyeOff,
  Youtube,
  Clock,
  User
} from 'lucide-react';
import { GeneratedContent } from '@/types';

interface YouTubeContentPreviewProps {
  generatedContent: GeneratedContent;
  transcript?: string;
  videoTitle?: string;
  videoUrl?: string;
  onCopy?: (text: string, type: string) => void;
  onDownload?: () => void;
}

const YouTubeContentPreview: React.FC<YouTubeContentPreviewProps> = ({
  generatedContent,
  transcript,
  videoTitle,
  videoUrl,
  onCopy,
  onDownload
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(type));
      
      // Remove from copied items after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(type);
          return newSet;
        });
      }, 2000);
      
      onCopy?.(text, type);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Download as JSON
  const downloadAsJson = () => {
    const dataStr = JSON.stringify(generatedContent, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `youtube-content-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  const CopyButton: React.FC<{ text: string; type: string; className?: string }> = ({ 
    text, 
    type, 
    className = "w-6 h-6" 
  }) => (
    <Button
      onClick={() => copyToClipboard(text, type)}
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
    >
      {copiedItems.has(type) ? (
        <CheckCircle className={`${className} text-green-600`} />
      ) : (
        <Copy className={`${className} text-gray-500`} />
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Youtube className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Generated Content</h2>
            {videoTitle && (
              <p className="text-sm text-gray-600">{videoTitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={downloadAsJson}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          
          {videoUrl && (
            <Button
              onClick={() => window.open(videoUrl, '_blank')}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Video
            </Button>
          )}
        </div>
      </div>

      {/* Episode Title */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center">
              <User className="w-4 h-4 mr-2" />
              Episode Title
            </CardTitle>
            <CopyButton text={generatedContent.title} type="title" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-900 font-medium">{generatedContent.title}</p>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Summary</CardTitle>
            <CopyButton text={generatedContent.summary} type="summary" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {generatedContent.summary}
          </p>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Key Takeaways</CardTitle>
            <CopyButton 
              text={generatedContent.takeaways.map(t => `• ${t}`).join('\n')} 
              type="takeaways" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {generatedContent.takeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                </div>
                <p className="text-gray-700">{takeaway}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Topics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Topics Covered</CardTitle>
            <CopyButton 
              text={generatedContent.topics.join(', ')} 
              type="topics" 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {generatedContent.topics.map((topic, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-3 py-1 text-sm"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Call to Action</CardTitle>
            <CopyButton text={generatedContent.cta} type="cta" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-900 font-medium">{generatedContent.cta}</p>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Section */}
      {transcript && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Full Transcript
              </CardTitle>
              <div className="flex space-x-2">
                <CopyButton text={transcript} type="transcript" />
                <Button
                  onClick={() => setShowTranscript(!showTranscript)}
                  variant="outline"
                  size="sm"
                >
                  {showTranscript ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showTranscript ? (
              <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {transcript}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  Click "Show" to view the full transcript
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success Indicator */}
      <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
        <span className="text-green-800 font-medium">
          Content generated successfully! All sections are ready to use.
        </span>
      </div>
    </div>
  );
};

export default YouTubeContentPreview;
