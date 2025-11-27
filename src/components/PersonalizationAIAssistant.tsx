import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  CheckCircle,
  Loader2,
  Lightbulb,
  Target,
  BookOpen,
  Zap
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/components/ui/use-toast';
import { usageService } from '@/lib/usageService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PersonalizationAIAssistantProps {
  className?: string;
}

const PersonalizationAIAssistant: React.FC<PersonalizationAIAssistantProps> = ({ className }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your personalization AI assistant. I can help you:\n\n• Optimize your writing style settings\n• Analyze your brand voice consistency\n• Suggest improvements to your content templates\n• Answer questions about personalization features\n• Help you understand your personality profile\n\nWhat would you like to know about personalizing your content?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick action prompts for personalization
  const quickPrompts = [
    "How can I improve my writing style consistency?",
    "What does my personality profile tell me?",
    "How do I optimize my brand voice settings?",
    "Explain my genre detection results"
  ];

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check usage limits before proceeding
    if (user?.id) {
      try {
        const canUseGpt = await usageService.canPerformAction(user.id, 'useGpt', 1);
        if (!canUseGpt.canPerform) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: canUseGpt.reason || 'You have reached your GPT usage limit for this month. Please upgrade your plan or wait until next month.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
      } catch (usageError) {
        console.error('Error checking GPT usage limits:', usageError);
        // Continue anyway if check fails - don't block user
      }
    }

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
      // SECURITY: Use Supabase Edge Function instead of direct OpenAI API call
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase configuration missing. Please check your environment variables.');
      }

      // Prepare conversation messages for OpenAI API
      const conversationMessages = [
        {
          role: 'system' as const,
          content: `You are a helpful AI assistant specializing in content personalization and writing style optimization. You help users understand and improve their personalization settings, brand voice, writing style, and content templates.

Your expertise includes:
- Writing style analysis and optimization
- Brand voice consistency
- Personality profiling for content creation
- Genre detection and template recommendations
- Social media style analysis
- Content personalization best practices

Be helpful, specific, and provide actionable advice. When discussing personalization features, explain how they work and provide concrete examples.`
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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.content) {
        throw new Error(data.error || 'No response content. Please try again.');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'Sorry, I could not generate a response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update usage tracking for successful GPT prompt
      if (user?.id) {
        try {
          const success = await usageService.updateUsage(user.id, { gptPromptsUsed: 1 });
          if (success) {
            // Dispatch event to update usage display
            window.dispatchEvent(new CustomEvent('usageUpdated'));
            console.log('✅ GPT usage updated: +1 prompt (Personalization AI)');
          }
        } catch (usageError) {
          console.error('Failed to update GPT usage:', usageError);
          // Don't fail the request if usage tracking fails
        }
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check your API configuration.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied to your clipboard.",
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <span>Personalization AI Assistant</span>
        </CardTitle>
        <CardDescription>
          Get personalized help with your content style, brand voice, and writing preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Prompts */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Lightbulb className="w-4 h-4" />
            <span>Quick suggestions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrompt(prompt)}
                className="text-xs h-8"
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/20">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-background border'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  {message.role === 'user' && (
                    <User className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                        >
                          {copiedMessageId === message.id ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-background border rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about personalization, writing style, or brand voice..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center space-x-2 text-sm">
            <Target className="w-4 h-4 text-green-600" />
            <span>Style Analysis</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Template Help</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Zap className="w-4 h-4 text-purple-600" />
            <span>Brand Voice</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>Optimization</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalizationAIAssistant;
