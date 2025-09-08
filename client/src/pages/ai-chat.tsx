import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ChatInterface } from "@/components/ai/chat-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Plus, MessageSquare, Zap, BarChart3, Users } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import type { AIConversationData } from "@/types";

export default function AIChat() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AIConversationData[]>([]);
  const { connected } = useWebSocket();

  // Fetch AI conversations
  const { data: conversationsData = [], isLoading } = useQuery<AIConversationData[]>({
    queryKey: ['/api/ai-conversations'],
    enabled: false, // Disabled for now since we need user auth
  });

  const quickActions = [
    {
      title: "Analyze Client Sentiment",
      description: "Get insights on client mood and satisfaction levels",
      icon: BarChart3,
      action: "analyze_sentiment",
      color: "bg-blue-100 text-blue-800"
    },
    {
      title: "Generate Follow-up Messages",
      description: "Create personalized follow-up messages for clients",
      icon: MessageSquare,
      action: "generate_followups",
      color: "bg-green-100 text-green-800"
    },
    {
      title: "Client Behavior Analysis",
      description: "Understand client patterns and preferences",
      icon: Users,
      action: "analyze_behavior",
      color: "bg-purple-100 text-purple-800"
    },
    {
      title: "Automate Responses",
      description: "Set up intelligent auto-responses for common queries",
      icon: Zap,
      action: "setup_automation",
      color: "bg-orange-100 text-orange-800"
    }
  ];

  const handleQuickAction = (action: string) => {
    let message = "";
    switch (action) {
      case "analyze_sentiment":
        message = "Can you analyze the sentiment of all my recent client conversations and provide insights?";
        break;
      case "generate_followups":
        message = "Please generate personalized follow-up messages for my high-priority clients who haven't responded in the last 3 days.";
        break;
      case "analyze_behavior":
        message = "Analyze my client behavior patterns and identify trends that could help improve my business strategy.";
        break;
      case "setup_automation":
        message = "Help me set up intelligent auto-responses for the most common client inquiries.";
        break;
      default:
        message = `Help me with ${action}`;
    }
    
    // This would trigger a new conversation with the message
    console.log("Starting new conversation with:", message);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="AI Assistant"
          subtitle="Intelligent automation and business insights powered by local AI"
        />
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Left Sidebar - Conversations */}
            <div className="w-80 bg-card border-r border-border">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Bot className="text-primary" size={20} />
                    <h3 className="font-semibold">CLOSERT AI</h3>
                    <Badge className={connected ? "bg-chart-1 text-white" : "bg-muted text-muted-foreground"}>
                      {connected ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  
                  <Button 
                    size="sm" 
                    onClick={handleNewConversation}
                    data-testid="new-conversation-btn"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Quick Actions</h4>
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.action}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3"
                        onClick={() => handleQuickAction(action.action)}
                        data-testid={`quick-action-${action.action}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-1 rounded ${action.color}`}>
                            <Icon size={14} />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">{action.title}</div>
                            <div className="text-xs text-muted-foreground">{action.description}</div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Conversations</h4>
                {isLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Loading conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto mb-2 text-muted-foreground" size={32} />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Start a new conversation to get AI assistance</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <Button
                        key={conversation.id}
                        variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => setActiveConversationId(conversation.id)}
                        data-testid={`conversation-${conversation.id}`}
                      >
                        <div className="text-left truncate">
                          <div className="font-medium text-sm truncate">
                            {conversation.title || "Untitled Conversation"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(conversation.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {activeConversationId || !connected ? (
                <ChatInterface 
                  conversationId={activeConversationId}
                  connected={connected}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <Card className="w-full max-w-2xl mx-6">
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bot className="text-primary" size={32} />
                      </div>
                      <CardTitle className="text-2xl">Welcome to CLOSERT AI</CardTitle>
                      <p className="text-muted-foreground">
                        Your intelligent business assistant for client management, automation, and insights
                      </p>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Client Management</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Analyze client sentiment and behavior</li>
                            <li>• Generate personalized responses</li>
                            <li>• Track conversation patterns</li>
                            <li>• Identify high-value opportunities</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Business Automation</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Automated follow-up scheduling</li>
                            <li>• Smart response suggestions</li>
                            <li>• Document analysis and insights</li>
                            <li>• Trip planning assistance</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                          Start a conversation or choose a quick action to get started
                        </p>
                        <Button onClick={handleNewConversation} data-testid="start-conversation-btn">
                          <MessageSquare size={16} className="mr-2" />
                          Start New Conversation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
