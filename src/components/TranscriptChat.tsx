import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Loader2, Copy, Check, AlertCircle, Download, ChevronDown } from 'lucide-react';
import { usageService } from '@/lib/usageService';
import { useUser } from '@clerk/clerk-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TranscriptChatProps {
  transcript: string;
  onClose: () => void;
  onUpdateTranscript: (updatedTranscript: string) => void;
}

const TranscriptChat: React.FC<TranscriptChatProps> = ({
  transcript,
  onClose,
  onUpdateTranscript
}) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number | null>(null);
  const [isRestoringHistory, setIsRestoringHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate a unique key for this transcript chat session
  const getChatHistoryKey = () => {
    // Use transcript hash or first 50 characters as unique identifier
    const transcriptHash = transcript.substring(0, 50).replace(/\s+/g, '-');
    return `transcript-chat-${transcriptHash}`;
  };

  // Save chat history to localStorage
  const saveChatHistory = (messages: Message[]) => {
    try {
      const historyKey = getChatHistoryKey();
      localStorage.setItem(historyKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  // Load chat history from localStorage
  const loadChatHistory = (): Message[] => {
    try {
      const historyKey = getChatHistoryKey();
      const saved = localStorage.getItem(historyKey);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      // Convert timestamp strings back to Date objects
      return parsed.map((msg: Message) => ({
        ...msg,
        timestamp: typeof msg.timestamp === 'string' 
          ? new Date(msg.timestamp) 
          : msg.timestamp instanceof Date 
            ? msg.timestamp 
            : new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  };

  // Clear chat history
  const clearChatHistory = () => {
    try {
      const historyKey = getChatHistoryKey();
      localStorage.removeItem(historyKey);
      const welcomeMessage = {
        id: 'welcome',
        role: 'assistant' as const,
        content: "Hello! I'm here to help you refine your transcript. You can ask me to:\n\n• Summarize key points\n• Fix grammar and clarity\n• Restructure content\n• Extract important quotes\n• Improve readability\n\nWhat would you like me to help you with?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  // Load chat history on component mount
  useEffect(() => {
    const savedHistory = loadChatHistory();
    if (savedHistory.length > 0) {
      setIsRestoringHistory(true);
      setMessages(savedHistory);
      setTimeout(() => setIsRestoringHistory(false), 500); // Brief loading state
    } else {
      // Initialize with welcome message if no history
      const welcomeMessage = {
        id: 'welcome',
        role: 'assistant' as const,
        content: "Hello! I'm here to help you refine your transcript. You can ask me to:\n\n• Summarize key points\n• Fix grammar and clarity\n• Restructure content\n• Extract important quotes\n• Improve readability\n\nWhat would you like me to help you with?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [transcript]);

  // Validate transcript prop
  useEffect(() => {
    if (!transcript || transcript.trim().length === 0) {
      setError('No transcript content available. Please ensure your transcript is properly loaded.');
      console.error('TranscriptChat: Empty or missing transcript prop');
    } else {
      setError(null);
    }
  }, [transcript]);

  // Quick action prompts
  const quickPrompts = [
    "Create a summary of key points",
    "Extract the best quotes",
    "Write show notes",
    "Create chapter markers"
  ];

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitRetryAfter && rateLimitRetryAfter > 0) {
      const timer = setInterval(() => {
        setRateLimitRetryAfter(prev => {
          if (prev && prev <= 1) {
            return null; // Timer finished
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [rateLimitRetryAfter]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Validate input length
    if (input.trim().length > 2000) {
      setError('Message too long. Please keep messages under 2000 characters.');
      return;
    }


    // Check usage limits before proceeding
    if (user?.id) {
      try {
        const canUseGpt = await usageService.canPerformAction(user.id, 'useGpt', 1);
        if (!canUseGpt.canPerform) {
          setError(canUseGpt.reason || 'You have reached your GPT usage limit for this month.');
          return;
        }
      } catch (usageError) {
        console.error('Error checking GPT usage limits:', usageError);
        // Continue anyway if check fails - don't block user
      }
    }

    // Clear any previous errors
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if transcript is available
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('No transcript content available. Please ensure your transcript is properly loaded.');
      }

      // SECURITY: Use Supabase Edge Function instead of direct OpenAI API call
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase configuration missing. Please check your environment variables.');
      }

      console.log('TranscriptChat: Making API call to Supabase Edge Function...');

      // Prepare conversation messages for OpenAI API
      const conversationMessages = [
        {
          role: 'system' as const,
          content: `You are a helpful AI assistant that specializes in refining and improving transcripts. You have access to the following transcript content:

TRANSCRIPT:
${transcript}

Your task is to help the user refine this transcript by:
- Summarizing key points
- Fixing grammar and clarity issues
- Restructuring content for better flow
- Extracting important quotes
- Improving readability
- Answering questions about the content

Be helpful, accurate, and maintain the original meaning while improving the transcript's quality.`
        },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: userMessage.content
        }
      ];

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      // Call Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/chat-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: conversationMessages,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 1200,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'API request failed';
        
        try {
          const errorData = await response.json();
          console.error('Edge Function error response:', errorData);
          
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Please check your configuration.';
          } else if (response.status === 429) {
            // Extract rate limit info if available
            const retryAfter = response.headers.get('retry-after');
            const retrySeconds = retryAfter ? parseInt(retryAfter) : 60;
            setRateLimitRetryAfter(retrySeconds);
            const rateLimitInfo = retryAfter 
              ? ` Please wait ${retryAfter} seconds before trying again.`
              : ' Please wait a few minutes before trying again.';
            errorMessage = `Rate limit exceeded.${rateLimitInfo}`;
          } else {
            errorMessage = errorData.error || `API error (${response.status})`;
          }
        } catch (parseError) {
          console.error('Error parsing API response:', parseError);
          errorMessage = `API error (${response.status}): Unable to parse error response`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Edge Function response received:', { 
        success: data.success
      });

      if (!data.success || !data.content) {
        console.error('No content in Edge Function response:', data);
        throw new Error(data.error || 'No response content. Please try again.');
      }

      const aiContent = data.content;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save updated chat history
      const updatedMessages = [...messages, userMessage, assistantMessage];
      saveChatHistory(updatedMessages);
      
      // Update usage tracking for successful GPT prompt
      if (user?.id) {
        try {
          const success = await usageService.updateUsage(user.id, { gptPromptsUsed: 1 });
          if (success) {
            // Dispatch event to update usage display
            window.dispatchEvent(new CustomEvent('usageUpdated'));
            console.log('✅ GPT usage updated: +1 prompt');
          }
        } catch (usageError) {
          console.error('Failed to update GPT usage:', usageError);
          // Don't fail the request if usage tracking fails
        }
      }
      
      console.log('TranscriptChat: Successfully received AI response');

    } catch (error) {
      console.error('TranscriptChat: Error calling OpenAI API:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again with a shorter message.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('API key')) {
          errorMessage = 'API key issue. Please check your OpenAI API key configuration.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorResponse]);
      setError(errorMessage);
      setLastFailedMessage(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Download functions for AI messages
  const downloadAsText = (content: string, messageId: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${messageId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsMarkdown = (content: string, messageId: string) => {
    const markdownContent = `# AI Response\n\n${content}`;
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${messageId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsHTML = (content: string, messageId: string) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Response</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
        .content { white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1 class="header">AI Response</h1>
    <div class="content">${content.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${messageId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsJSON = (content: string, messageId: string) => {
    const jsonContent = {
      id: messageId,
      role: 'assistant',
      content: content,
      timestamp: new Date().toISOString(),
      source: 'Transcript Chat AI Assistant'
    };
    const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${messageId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      setInput(lastFailedMessage);
      setError(null);
      setLastFailedMessage(null);
      textareaRef.current?.focus();
    }
  };

  const formatTimestamp = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300 sm:max-w-2xl lg:max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Transcript Chat</h2>
            {messages.length > 1 && (
              <button
                onClick={clearChatHistory}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                title="Clear chat history"
              >
                Clear Chat
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Close chat"
          >
            <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700 font-medium">Error</p>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            {rateLimitRetryAfter && rateLimitRetryAfter > 0 && (
              <p className="text-xs text-red-500 mt-2">
                ⏱️ You can try again in {rateLimitRetryAfter} seconds
              </p>
            )}
            <div className="flex space-x-3 mt-3">
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                Dismiss
              </button>
              {lastFailedMessage && !rateLimitRetryAfter && (
                <button
                  onClick={handleRetry}
                  className="text-xs text-red-600 hover:text-red-800 underline font-medium"
                >
                  Retry Last Message
                </button>
              )}
              {rateLimitRetryAfter && rateLimitRetryAfter > 0 && (
                <span className="text-xs text-gray-500">
                  Retry available in {rateLimitRetryAfter}s
                </span>
              )}
            </div>
          </div>
        )}

        {/* History Restoration Indicator */}
        {isRestoringHistory && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <p className="text-sm text-blue-700">Restoring chat history...</p>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-xl px-4 py-3 shadow-sm relative ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="whitespace-pre-wrap pr-12">{message.content}</p>
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className={`p-1 rounded transition-colors ${
                      message.role === 'user'
                        ? 'hover:bg-purple-700'
                        : 'hover:bg-gray-200'
                    }`}
                    title="Copy message"
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs ${
                    message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                  
                  {/* Download dropdown for AI messages - positioned at bottom right */}
                  {message.role === 'assistant' && (
                    <div className="relative group">
                      <button
                        className="p-1.5 rounded transition-all duration-200 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105"
                        title="Download AI response"
                      >
                        <Download className="h-4 w-4 text-white" />
                      </button>
                      
                      {/* Download dropdown menu */}
                      <div className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => downloadAsText(message.content, message.id)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <span>📄</span>
                            <span>Download as TXT</span>
                          </button>
                          <button
                            onClick={() => downloadAsMarkdown(message.content, message.id)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <span>📝</span>
                            <span>Download as Markdown</span>
                          </button>
                          <button
                            onClick={() => downloadAsHTML(message.content, message.id)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <span>🌐</span>
                            <span>Download as HTML</span>
                          </button>
                          <button
                            onClick={() => downloadAsJSON(message.content, message.id)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <span>📊</span>
                            <span>Download as JSON</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl px-4 py-3 max-w-[85%] sm:max-w-[80%] shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {/* Quick Action Prompts - Only show when it's the first message */}
          {messages.length === 1 && (
            <div className="mt-6 px-2">
              <p className="text-sm text-gray-500 mb-4 font-medium">Quick actions:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:shadow-sm transition-all duration-200 text-left text-sm font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to help refine your transcript..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                rows={1}
                disabled={isLoading || (rateLimitRetryAfter && rateLimitRetryAfter > 0)}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || (rateLimitRetryAfter && rateLimitRetryAfter > 0)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </p>
            <p className={`text-xs ${input.length > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
              {input.length}/2000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptChat;
