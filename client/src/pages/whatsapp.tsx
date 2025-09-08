import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MessageFeed } from "@/components/whatsapp/message-feed";
import { ResponseGenerator } from "@/components/whatsapp/response-generator";
import { ConnectionModal } from "@/components/whatsapp/connection-modal";
import { WhatsAppWebInterface } from "@/components/whatsapp/whatsapp-web-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, MessageSquare, Settings, Send } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import type { LiveMessage, MessageData, WhatsAppStatus } from "@/types";

export default function WhatsApp() {
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [showWebInterface, setShowWebInterface] = useState(false);
  const queryClient = useQueryClient();

  // Fetch WhatsApp status
  const { data: whatsappStatus, isLoading: statusLoading } = useQuery<WhatsAppStatus>({
    queryKey: ['/api/whatsapp/status'],
    refetchInterval: 5000,
  });

  // Fetch recent messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageData[]>({
    queryKey: ['/api/messages'],
    enabled: whatsappStatus?.connected,
  });

  // WebSocket for real-time messages
  const { connected, on } = useWebSocket();

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; clientId?: string; conversationId?: string }) => {
      return apiRequest('POST', '/api/messages', {
        ...data,
        direction: 'outgoing',
        platform: 'whatsapp',
        messageType: 'text',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setNewMessage("");
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      content: newMessage,
      conversationId: selectedConversation,
    });
  };

  const handleSendResponse = (response: string) => {
    if (selectedConversation) {
      sendMessageMutation.mutate({
        content: response,
        conversationId: selectedConversation,
      });
    }
  };

  const mockSuggestedResponse = {
    message: "Thank you for reaching out! I understand your inquiry and I'm here to help. Let me provide you with the information you need.",
    clientName: "John Doe",
    intent: "inquiry",
    urgency: "medium"
  };

  // Handle connection success
  const handleConnectionSuccess = () => {
    setWhatsappConnected(true);
    setShowWebInterface(true);
    setConnectionModalOpen(false);
  };

  // If WhatsApp Web interface is active, show it full screen
  if (showWebInterface) {
    return (
      <WhatsAppWebInterface 
        onBack={() => {
          setShowWebInterface(false);
          setWhatsappConnected(false);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        whatsappConnected={whatsappConnected || whatsappStatus?.connected || false}
        aiOnline={connected}
        databaseActive={true}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="WhatsApp Business Management"
          subtitle="Monitor and respond to client messages in real-time"
        />
        
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full">
            {/* Connection Status */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Smartphone className="text-primary" size={20} />
                    <span>WhatsApp Connection Status</span>
                  </CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={
                        whatsappStatus?.connected 
                          ? "bg-chart-1 text-white" 
                          : "bg-chart-3 text-white"
                      }
                      data-testid="connection-status"
                    >
                      {whatsappStatus?.connected ? "Connected" : "Disconnected"}
                    </Badge>
                    
                    {!whatsappConnected && !whatsappStatus?.connected && (
                      <Button 
                        onClick={() => setConnectionModalOpen(true)}
                        className="luxury-button"
                        data-testid="connect-whatsapp-btn"
                      >
                        Connect WhatsApp
                      </Button>
                    )}
                    
                    {(whatsappConnected || whatsappStatus?.connected) && (
                      <Button 
                        onClick={() => setShowWebInterface(true)}
                        className="luxury-button"
                        data-testid="open-whatsapp-web"
                      >
                        Open WhatsApp Web
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {whatsappStatus && (
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Access Token:</span>
                      <div className="flex items-center space-x-2">
                        <span className={whatsappStatus.accessToken ? "text-chart-1" : "text-chart-3"}>
                          {whatsappStatus.accessToken ? "✓ Valid" : "✗ Missing"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone Number:</span>
                      <div className="flex items-center space-x-2">
                        <span className={whatsappStatus.phoneNumberId ? "text-chart-1" : "text-chart-3"}>
                          {whatsappStatus.phoneNumberId ? "✓ Configured" : "✗ Not Set"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Connection:</span>
                      <div className="flex items-center space-x-2">
                        <span className={whatsappStatus.connected ? "text-chart-1" : "text-chart-3"}>
                          {whatsappStatus.connected ? "✓ Active" : "✗ Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-12 gap-6 h-full">
              {/* Left Panel - Conversations List */}
              <div className="col-span-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Active Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {messagesLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading conversations...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="mx-auto mb-4 text-muted-foreground" size={48} />
                        <p className="text-muted-foreground">No conversations yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Conversations will appear here when clients send messages
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {/* Would show conversation list here */}
                        <p className="text-muted-foreground text-sm">Conversation list would appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Center Panel - Message Thread */}
              <div className="col-span-5">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-base">Message Thread</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {selectedConversation ? (
                      <>
                        <div className="flex-1 bg-muted/30 rounded-lg p-4 mb-4 overflow-y-auto">
                          {/* Message thread would go here */}
                          <div className="text-center text-muted-foreground">
                            Select a conversation to view messages
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            data-testid="message-input"
                          />
                          <Button 
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            data-testid="send-message-btn"
                          >
                            <Send size={16} />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <MessageSquare className="mx-auto mb-4 text-muted-foreground" size={48} />
                          <p className="text-muted-foreground">Select a conversation to start messaging</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - AI Tools */}
              <div className="col-span-3">
                <div className="space-y-4 h-full">
                  <ResponseGenerator
                    suggestedResponse={mockSuggestedResponse}
                    onSendResponse={handleSendResponse}
                    onGenerateAlternative={() => console.log('Generate alternative')}
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Message Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Messages Today:</span>
                          <span className="font-medium">{messages.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Response Time:</span>
                          <span className="font-medium">2.3s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Positive Sentiment:</span>
                          <span className="font-medium text-chart-1">68%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConnectionModal 
        open={connectionModalOpen}
        onOpenChange={setConnectionModalOpen}
        onConnectionSuccess={handleConnectionSuccess}
      />
    </div>
  );
}
