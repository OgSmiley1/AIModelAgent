import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff,
  Upload,
  FileText,
  Image,
  Video,
  Brain,
  Bot,
  User,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lightbulb,
  Users,
  BarChart3,
  FileText as FileAnalytics,
  MessageSquare,
  Download
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClientProfileData } from "@/types";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  filename: string;
  type: 'document' | 'image' | 'audio' | 'video';
  url: string;
  analysisResults?: any;
}

export default function AIAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m CLOSERT AI, your advanced business assistant similar to Manus.AI. I can help you analyze clients, process documents, provide sales insights, and much more. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch clients for context
  const { data: clients = [] } = useQuery<ClientProfileData[]>({
    queryKey: ['/api/clients'],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { 
      message: string; 
      clientContext?: any; 
      attachedFiles?: FileAttachment[] 
    }) => {
      return apiRequest('POST', '/api/ai-agent/chat', messageData);
    },
    onSuccess: (response: any) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process message. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('analysisType', 'general');
      
      return apiRequest('POST', '/api/ai-agent/analyze-file', formData);
    },
    onSuccess: (response: any) => {
      const fileAttachment: FileAttachment = {
        id: Date.now().toString(),
        filename: response.filename,
        type: response.type as 'document' | 'image' | 'audio' | 'video',
        url: response.url,
        analysisResults: response.analysis
      };
      
      setUploadedFiles(prev => [...prev, fileAttachment]);
      
      // Add analysis result as a message
      const analysisMessage: ChatMessage = {
        id: Date.now().toString() + '_analysis',
        role: 'assistant',
        content: `📄 **File Analysis: ${response.filename}**\n\n${response.analysis.summary}`,
        timestamp: new Date(),
        attachments: [fileAttachment]
      };
      setMessages(prev => [...prev, analysisMessage]);
      
      toast({
        title: "File Analyzed",
        description: `Successfully analyzed ${response.filename || 'file'}`,
      });
    }
  });

  // Client analysis mutation
  const analyzeClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return apiRequest('POST', '/api/ai-agent/analyze-client', { clientId });
    },
    onSuccess: (response: any) => {
      const analysisMessage: ChatMessage = {
        id: Date.now().toString() + '_client_analysis',
        role: 'assistant',
        content: `🧠 **Client Analysis: ${response.clientName}**\n\n**Key Insights:**\n${response.insights.map((i: string) => `• ${i}`).join('\n')}\n\n**Recommendations:**\n${response.recommendations.map((r: string) => `• ${r}`).join('\n')}\n\n**Next Actions:**\n${response.nextActions.map((a: string) => `• ${a}`).join('\n')}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, analysisMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Prepare context
    const clientContext = selectedClient ? clients.find(c => c.id === selectedClient) : undefined;
    
    setIsProcessing(true);
    sendMessageMutation.mutate({
      message: inputMessage,
      clientContext,
      attachedFiles: uploadedFiles
    });
    
    setInputMessage("");
    setUploadedFiles([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      uploadFileMutation.mutate(file);
    });
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      toast({
        title: "Voice Recording",
        description: "Voice recording feature coming soon!",
      });
    } else {
      // Start recording
      setIsRecording(true);
      toast({
        title: "Voice Recording",
        description: "Voice recording feature coming soon!",
      });
      // Auto-stop after 3 seconds for demo
      setTimeout(() => setIsRecording(false), 3000);
    }
  };

  const handleAnalyzeClient = () => {
    if (!selectedClient) {
      toast({
        title: "No Client Selected",
        description: "Please select a client to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    analyzeClientMutation.mutate(selectedClient);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image size={16} />;
      case 'video': return <Video size={16} />;
      case 'audio': return <Mic size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const selectedClientData = selectedClient ? clients.find(c => c.id === selectedClient) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title="AI Agent Chat"
          subtitle="Advanced AI assistant for business operations"
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Client Context Bar */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select client for context" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No client selected</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedClientData && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        Score: {selectedClientData.leadScore || 0}
                      </Badge>
                      <Badge variant="outline">
                        {Math.round((selectedClientData.conversionProbability || 0) * 100)}% conversion
                      </Badge>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleAnalyzeClient}
                  disabled={!selectedClient || analyzeClientMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  <Brain className="mr-2" size={16} />
                  Analyze Client
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Bot size={16} className="text-primary-foreground" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {message.attachments && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.attachments.map((file) => (
                            <div key={file.id} className="flex items-center space-x-1 text-xs bg-background/20 rounded px-2 py-1">
                              {getFileIcon(file.type)}
                              <span>{file.filename}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-primary-foreground animate-pulse" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* File Uploads Display */}
            {uploadedFiles.length > 0 && (
              <div className="p-3 border-t bg-muted/50">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                  <Paperclip size={14} />
                  <span>Attached files:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center space-x-2 bg-background rounded-lg px-3 py-2">
                      {getFileIcon(file.type)}
                      <span className="text-sm">{file.filename}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t bg-card">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message here... Ask about clients, upload documents, or request analysis."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    disabled={uploadFileMutation.isPending}
                  >
                    <Paperclip size={16} />
                  </Button>
                  
                  <Button
                    onClick={handleVoiceRecording}
                    variant="outline"
                    size="sm"
                    className={isRecording ? 'bg-red-500 text-white' : ''}
                  >
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  </Button>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!inputMessage.trim() && uploadedFiles.length === 0) || sendMessageMutation.isPending}
                    size="sm"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav"
            />
          </div>

          {/* Sidebar with AI Tools */}
          <div className="w-80 border-l bg-card overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4">AI Tools & Insights</h3>
              
              <Tabs defaultValue="quick-actions" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="quick-actions">Actions</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="quick-actions" className="space-y-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <FileAnalytics className="mr-2" size={14} />
                        Analyze Documents
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Users className="mr-2" size={14} />
                        Compare Clients
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <TrendingUp className="mr-2" size={14} />
                        Sales Forecast
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <MessageSquare className="mr-2" size={14} />
                        Draft Message
                      </Button>
                    </CardContent>
                  </Card>

                  {selectedClientData && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Client Context</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm font-medium">{selectedClientData.name}</div>
                          <Badge variant="secondary" className="text-xs">
                            {selectedClientData.status}
                          </Badge>
                        </div>
                        
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Lead Score</div>
                          <div className="flex items-center space-x-2">
                            <Progress value={selectedClientData.leadScore || 0} className="flex-1" />
                            <span className="text-xs">{selectedClientData.leadScore || 0}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Conversion Probability</div>
                          <div className="flex items-center space-x-2">
                            <Progress value={(selectedClientData.conversionProbability || 0) * 100} className="flex-1" />
                            <span className="text-xs">{Math.round((selectedClientData.conversionProbability || 0) * 100)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="insights" className="space-y-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">AI Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xs space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="text-green-500" size={12} />
                          <span>3 high-priority clients need follow-up</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="text-yellow-500" size={12} />
                          <span>2 deals at risk of stalling</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="text-blue-500" size={12} />
                          <span>5 upselling opportunities identified</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Response Time</span>
                        <span className="font-medium">2.3s</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Accuracy</span>
                        <span className="font-medium">94%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Files Processed</span>
                        <span className="font-medium">{uploadedFiles.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}