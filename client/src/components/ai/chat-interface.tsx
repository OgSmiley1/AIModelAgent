import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  User, 
  Send, 
  Mic, 
  Paperclip, 
  MoreVertical,
  Copy,
  RefreshCw,
  Sparkles,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import type { AIMessage } from "@/types";

interface ChatInterfaceProps {
  conversationId?: string | null;
  connected: boolean;
}

export function ChatInterface({ conversationId, connected }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm CLOSERT AI, your intelligent business assistant. I can help you with client analysis, automated responses, business insights, and much more. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { send, on, off } = useWebSocket();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!connected) return;

    const handleAiResponse = (data: { message: string; conversationId: string; timestamp: Date }) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(data.timestamp)
      }]);
      setIsGenerating(false);
      setIsTyping(false);
    };

    const handleAiError = (error: { error: string }) => {
      toast({
        title: "AI Error",
        description: error.error,
        variant: "destructive",
      });
      setIsGenerating(false);
      setIsTyping(false);
    };

    on('ai_response', handleAiResponse);
    on('ai_error', handleAiError);

    return () => {
      off('ai_response', handleAiResponse);
      off('ai_error', handleAiError);
    };
  }, [connected, on, off, toast]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !connected || isGenerating) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setIsTyping(true);

    // Send to AI via WebSocket
    send('ai_message', {
      userId: 'demo-user', // Would be actual user ID in real app
      message: newMessage,
      conversationId: conversationId
    });

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const regenerateResponse = (messageIndex: number) => {
    const userMessage = messages[messageIndex - 1];
    if (userMessage && userMessage.role === 'user') {
      setIsGenerating(true);
      setIsTyping(true);
      
      send('ai_message', {
        userId: 'demo-user',
        message: userMessage.content,
        conversationId: conversationId
      });
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Bot className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">CLOSERT AI Assistant</h3>
              <div className="flex items-center space-x-2">
                <Badge className={connected ? "bg-chart-1 text-white" : "bg-muted text-muted-foreground"}>
                  {connected ? "Online" : "Offline"}
                </Badge>
                {isTyping && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                    <span>AI is thinking...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" data-testid="chat-menu-btn">
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" data-testid="chat-messages">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start space-x-3",
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              )}
              data-testid={`message-${message.role}-${index}`}
            >
              {/* Avatar */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === 'user' 
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-primary text-primary-foreground'
              )}>
                {message.role === 'user' ? (
                  <User size={16} />
                ) : (
                  <Bot size={16} />
                )}
              </div>

              {/* Message Content */}
              <div className={cn(
                "flex-1 max-w-xs sm:max-w-md lg:max-w-lg",
                message.role === 'user' ? 'text-right' : 'text-left'
              )}>
                <div className={cn(
                  "inline-block p-3 rounded-lg text-sm",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}>
                  <p className="whitespace-pre-wrap" data-testid="message-content">
                    {message.content}
                  </p>
                </div>
                
                <div className={cn(
                  "flex items-center space-x-2 mt-1 text-xs text-muted-foreground",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}>
                  <Clock size={12} />
                  <span>{formatTime(message.timestamp)}</span>
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-muted-foreground hover:text-foreground"
                        onClick={() => copyMessage(message.content)}
                        data-testid={`copy-message-${index}`}
                      >
                        <Copy size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-muted-foreground hover:text-foreground"
                        onClick={() => regenerateResponse(index)}
                        data-testid={`regenerate-message-${index}`}
                      >
                        <RefreshCw size={12} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start space-x-3" data-testid="typing-indicator">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="text-primary-foreground" size={16} />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Input Area */}
      <div className="p-4 bg-card">
        {!connected && (
          <div className="mb-4 p-3 bg-chart-3/10 border border-chart-3/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-chart-3 rounded-full" />
              <span className="text-sm text-chart-3 font-medium">
                AI Assistant Offline
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Please check your connection and try again.
            </p>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Input
              placeholder={connected ? "Ask CLOSERT AI anything..." : "AI assistant is offline"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!connected || isGenerating}
              className="pr-20"
              data-testid="chat-input"
            />
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                disabled={!connected}
                data-testid="attach-file-btn"
              >
                <Paperclip size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                disabled={!connected}
                data-testid="voice-input-btn"
              >
                <Mic size={16} />
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !connected || isGenerating}
            className="px-4"
            data-testid="send-message-btn"
          >
            {isGenerating ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewMessage("Analyze today's client sentiment trends")}
            disabled={!connected || isGenerating}
            className="text-xs"
            data-testid="quick-action-sentiment"
          >
            <Sparkles size={12} className="mr-1" />
            Analyze Sentiment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewMessage("Generate follow-up messages for high-priority clients")}
            disabled={!connected || isGenerating}
            className="text-xs"
            data-testid="quick-action-followup"
          >
            <Bot size={12} className="mr-1" />
            Generate Follow-ups
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewMessage("Show me client behavior patterns and insights")}
            disabled={!connected || isGenerating}
            className="text-xs"
            data-testid="quick-action-insights"
          >
            <Sparkles size={12} className="mr-1" />
            Client Insights
          </Button>
        </div>

        {/* Model Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          <span>CLOSERT AI • Local Model</span>
          <span>{connected ? "Secure & Private" : "Disconnected"}</span>
        </div>
      </div>
    </div>
  );
}
