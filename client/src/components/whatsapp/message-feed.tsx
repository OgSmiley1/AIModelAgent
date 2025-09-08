import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import type { LiveMessage } from "@/types";

interface MessageFeedProps {
  messages: LiveMessage[];
  isLive?: boolean;
}

export function MessageFeed({ messages, isLive = true }: MessageFeedProps) {
  const getSentimentColor = (sentiment: LiveMessage['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return 'border-l-chart-1 bg-chart-1/5';
      case 'negative':
        return 'border-l-chart-3 bg-chart-3/5';
      case 'neutral':
      default:
        return 'border-l-muted-foreground bg-muted';
    }
  };

  const getSentimentBadge = (sentiment: LiveMessage['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return <Badge className="bg-chart-1 text-white text-xs">Positive</Badge>;
      case 'negative':
        return <Badge className="bg-chart-3 text-white text-xs">Frustrated</Badge>;
      case 'neutral':
      default:
        return <Badge variant="secondary" className="text-xs">Neutral</Badge>;
    }
  };

  const getIntentBadge = (urgency: LiveMessage['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800 text-xs">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">High Intent</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medium</Badge>;
      case 'low':
      default:
        return <Badge className="bg-green-100 text-green-800 text-xs">Low</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (name: string) => {
    const colors = ['bg-primary', 'bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-purple-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <Card data-testid="message-feed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Live Message Feed</CardTitle>
          {isLive && (
            <div className="flex items-center space-x-2">
              <Circle 
                size={8} 
                className="text-chart-1 animate-pulse-slow" 
                data-testid="live-indicator"
              />
              <span className="text-sm text-muted-foreground">Real-time</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Messages will appear here when clients send WhatsApp messages
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto" data-testid="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-lg p-3 border-l-4",
                  getSentimentColor(message.sentiment)
                )}
                data-testid={`message-${message.id}`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={cn(
                      "text-white text-xs font-semibold",
                      getRandomColor(message.clientName)
                    )}>
                      {getInitials(message.clientName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm" data-testid="client-name">
                        {message.clientName}
                      </span>
                      <span className="text-xs text-muted-foreground" data-testid="client-phone">
                        {message.clientPhone}
                      </span>
                      <span className="text-xs text-muted-foreground" data-testid="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-2 break-words" data-testid="message-content">
                      {message.content}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      {getSentimentBadge(message.sentiment)}
                      {getIntentBadge(message.urgency)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
