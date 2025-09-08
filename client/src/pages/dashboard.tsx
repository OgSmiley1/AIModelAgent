import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { MessageFeed } from "@/components/whatsapp/message-feed";
import { ResponseGenerator } from "@/components/whatsapp/response-generator";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import type { DashboardStats, LiveMessage, SystemAlert } from "@/types";

export default function Dashboard() {
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [aiMessages, setAiMessages] = useState<Array<{role: 'assistant' | 'user', content: string, timestamp: Date}>>([
    {
      role: 'assistant',
      content: "I've analyzed today's conversations and identified 3 high-priority leads that need immediate follow-up. Would you like me to draft personalized responses?",
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/analytics/dashboard'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch WhatsApp status
  const { data: whatsappStatus } = useQuery({
    queryKey: ['/api/whatsapp/status'],
    refetchInterval: 10000, // Check every 10 seconds
  });

  // WebSocket connection for real-time updates
  const { connected, on, send } = useWebSocket();

  useEffect(() => {
    if (connected) {
      // Listen for new messages
      on('new_message', (message: LiveMessage) => {
        setLiveMessages(prev => [message, ...prev.slice(0, 9)]); // Keep last 10 messages
      });

      // Listen for system alerts
      on('system_alert', (alert: SystemAlert) => {
        setAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep last 5 alerts
      });

      // Listen for stats updates
      on('stats_updated', (newStats: DashboardStats) => {
        // Stats will be updated by React Query refetch
      });
    }
  }, [connected, on]);

  const handleSendAiMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      role: 'user' as const,
      content: newMessage,
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);
    setNewMessage("");

    // Send to AI via WebSocket
    send('ai_message', {
      userId: 'demo-user', // Would be actual user ID in real app
      message: newMessage
    });
  };

  const handleSendResponse = (response: string) => {
    // Would send actual WhatsApp message here
    console.log('Sending response:', response);
  };

  const handleGenerateAlternative = () => {
    // Would trigger AI to generate alternative response
    console.log('Generating alternative response');
  };

  const mockSuggestedResponse = liveMessages.length > 0 ? {
    message: "Thank you for your inquiry! I'd be happy to help you with information about our services. Based on your interest, I can provide detailed information about our premium features and schedule a consultation if you'd like.",
    clientName: liveMessages[0]?.clientName || "Client",
    intent: "inquiry",
    urgency: "medium"
  } : undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        whatsappConnected={whatsappStatus?.connected || false}
        aiOnline={connected}
        databaseActive={true}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar stats={stats} />
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Main Dashboard Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Stats Cards */}
              {stats && <StatsCards stats={stats} />}
              
              {/* Main Content Tabs */}
              <Card>
                <CardHeader>
                  <div className="flex space-x-6">
                    <Button variant="ghost" className="text-primary border-b-2 border-primary pb-2" data-testid="whatsapp-monitor-tab">
                      WhatsApp Monitor
                    </Button>
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground pb-2" data-testid="client-profiles-tab">
                      Client Profiles
                    </Button>
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground pb-2" data-testid="ai-conversations-tab">
                      AI Conversations
                    </Button>
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground pb-2" data-testid="automation-tab">
                      Automation
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Live Messages Feed */}
                    <MessageFeed 
                      messages={liveMessages}
                      isLive={connected}
                    />
                    
                    {/* Auto-Response Panel */}
                    <ResponseGenerator
                      suggestedResponse={mockSuggestedResponse}
                      onSendResponse={handleSendResponse}
                      onGenerateAlternative={handleGenerateAlternative}
                      autoResponseEnabled={true}
                      sentimentMonitoringEnabled={true}
                      followUpRemindersEnabled={true}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Sidebar - AI Chat */}
            <div className="w-80 bg-card border-l border-border overflow-y-auto">
              {/* AI Assistant */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center space-x-2 mb-4">
                  <Bot className="text-primary" size={16} />
                  <h3 className="font-semibold">CLOSERT Assistant</h3>
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-chart-1 animate-pulse' : 'bg-muted-foreground'}`} />
                </div>
                
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto" data-testid="ai-chat-messages">
                  {aiMessages.map((message, index) => (
                    <div 
                      key={index}
                      className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-secondary' 
                          : 'bg-primary'
                      }`}>
                        {message.role === 'user' ? (
                          <span className="text-secondary-foreground text-xs">U</span>
                        ) : (
                          <Bot className="text-primary-foreground" size={12} />
                        )}
                      </div>
                      <div className={`rounded-lg p-2 text-sm max-w-xs ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p>{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask CLOSERT anything..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendAiMessage()}
                    className="flex-1"
                    data-testid="ai-chat-input"
                  />
                  <Button 
                    size="sm"
                    onClick={handleSendAiMessage}
                    data-testid="ai-chat-send"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="p-4">
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-sm" data-testid="export-reports-btn">
                    <span className="mr-2">📊</span>
                    Export Today's Reports
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" data-testid="schedule-followups-btn">
                    <span className="mr-2">📅</span>
                    Schedule Follow-ups
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" data-testid="plan-trip-btn">
                    <span className="mr-2">🗺️</span>
                    Plan Client Trip
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" data-testid="sync-database-btn">
                    <span className="mr-2">🔄</span>
                    Sync Client Database
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" data-testid="train-ai-btn">
                    <span className="mr-2">🧠</span>
                    Train AI Model
                  </Button>
                </div>
              </div>
              
              {/* Recent Alerts */}
              <div className="p-4 border-t border-border">
                <AlertPanel alerts={alerts} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
