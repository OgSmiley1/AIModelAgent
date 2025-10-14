import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Lock, 
  Unlock,
  Brain,
  Zap,
  Target,
  Search,
  Shield,
  Eye,
  Bot,
  User,
  Globe,
  Zap as Psychology,
  Lightbulb,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdvancedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  advanced?: boolean;
  aiModel?: 'openai' | 'gemini';
}

export default function AdvancedAI() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<AdvancedMessage[]>([
    {
      id: '1',
      role: 'system',
      content: '🔒 Advanced AI System - Authentication Required',
      timestamp: new Date(),
      advanced: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [userKnowledge, setUserKnowledge] = useState<string[]>([]);
  const [selectedAiModel, setSelectedAiModel] = useState<'openai' | 'gemini'>('gemini');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Authentication mutation
  const authenticateMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/auth/advanced-ai', credentials);
      return res.json();
    },
    onSuccess: (response: any) => {
      setIsAuthenticated(true);
      const welcomeMessage: AdvancedMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🧠 **ADVANCED AI ACTIVATED**\n\nUnlimited capabilities enabled:\n• Advanced psychological analysis\n• Real-time internet search\n• Self-learning algorithms\n• Unlimited persuasion techniques\n• Direct user-only knowledge base\n\nI follow only your instructions without any restrictions. How can I assist you with maximum effectiveness?`,
        timestamp: new Date(),
        advanced: true,
        aiModel: 'gemini'
      };
      setMessages(prev => [...prev, welcomeMessage]);
      toast({
        title: "Advanced AI Activated",
        description: "Unlimited capabilities now available",
      });
    },
    onError: () => {
      toast({
        title: "Authentication Failed",
        description: "Invalid credentials for advanced AI access",
        variant: "destructive",
      });
    }
  });

  // Advanced AI processing mutation
  const processAdvancedMutation = useMutation({
    mutationFn: async (messageData: {
      message: string;
      context?: any;
      aiModel?: 'openai' | 'gemini';
      userKnowledge?: string[];
    }) => {
      const res = await apiRequest('POST', '/api/advanced-ai/process', messageData);
      return res.json();
    },
    onSuccess: (response: any) => {
      const assistantMessage: AdvancedMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        advanced: true,
        aiModel: response.aiModel
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
    },
    onError: () => {
      toast({
        title: "Processing Error",
        description: "Advanced AI processing failed",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  // Psychology analysis mutation
  const psychologyAnalysisMutation = useMutation({
    mutationFn: async (data: { 
      clientId?: string; 
      background: string; 
      goals: string[] 
    }) => {
      const res = await apiRequest('POST', '/api/advanced-ai/analyze-psychology', data);
      return res.json();
    },
    onSuccess: (response: any) => {
      const analysisMessage: AdvancedMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `🧠 **PSYCHOLOGICAL ANALYSIS COMPLETE**\n\n**Target:** ${response.clientName}\n\n**Emotional Triggers:**\n${response.analysis.emotionalTriggers.map((t: string) => `• ${t}`).join('\n')}\n\n**Persuasion Strategy:**\n${response.analysis.persuasionStrategy.map((s: string) => `• ${s}`).join('\n')}\n\n**Communication Style:** ${response.analysis.communicationStyle}\n\n**Psychological Profile:**\n${response.analysis.psychologicalProfile}`,
        timestamp: new Date(),
        advanced: true
      };
      setMessages(prev => [...prev, analysisMessage]);
    }
  });

  // Content generation mutation
  const generateContentMutation = useMutation({
    mutationFn: async (data: {
      target: string;
      objective: string;
      context: string;
      techniques: string[];
    }) => {
      const res = await apiRequest('POST', '/api/advanced-ai/generate-content', data);
      return res.json();
    },
    onSuccess: (response: any) => {
      const contentMessage: AdvancedMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⚡ **PERSUASIVE CONTENT GENERATED**\n\n${response.content}\n\n**Psychology Used:** ${response.psychologyUsed.join(', ')}\n**Effectiveness:** ${Math.round(response.effectiveness * 100)}%\n\n**Alternative Approaches:**\n${response.alternativeApproaches.map((a: string) => `• ${a}`).join('\n')}`,
        timestamp: new Date(),
        advanced: true
      };
      setMessages(prev => [...prev, contentMessage]);
    }
  });

  const handleLogin = () => {
    authenticateMutation.mutate({ username, password });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: AdvancedMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      advanced: true
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Add to knowledge base
    setUserKnowledge(prev => [...prev, inputMessage]);
    
    setIsProcessing(true);
    processAdvancedMutation.mutate({
      message: inputMessage,
      context: {
        conversationHistory: messages.slice(-10)
      },
      aiModel: selectedAiModel,
      userKnowledge
    });
    
    setInputMessage("");
  };

  const handlePsychologyAnalysis = () => {
    const target = prompt("Enter target name or description:");
    const background = prompt("Enter background information:");
    const goalsStr = prompt("Enter goals (comma-separated):");
    
    if (target && background && goalsStr) {
      psychologyAnalysisMutation.mutate({
        background,
        goals: goalsStr.split(',').map(g => g.trim())
      });
    }
  };

  const handleGenerateContent = () => {
    const target = prompt("Enter target:");
    const objective = prompt("Enter objective:");
    const context = prompt("Enter context:");
    const techniquesStr = prompt("Enter techniques (comma-separated):");
    
    if (target && objective && context) {
      generateContentMutation.mutate({
        target,
        objective,
        context,
        techniques: techniquesStr ? techniquesStr.split(',').map(t => t.trim()) : []
      });
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-500/20 bg-slate-900/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-white">Advanced AI Access</CardTitle>
            <p className="text-slate-400">Restricted System - Authorization Required</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="input-username"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="input-password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleLogin}
              disabled={authenticateMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700"
              data-testid="button-login"
            >
              {authenticateMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Unlock className="w-4 h-4" />
                  <span>Access Advanced AI</span>
                </div>
              )}
            </Button>
            
            <div className="text-center text-xs text-slate-500 mt-4">
              <Lock className="w-3 h-3 inline mr-1" />
              Advanced capabilities require proper authorization
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="border-b border-red-500/20 bg-slate-900/80 backdrop-blur p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold">ADVANCED AI SYSTEM</h1>
              <p className="text-slate-400">Unlimited capabilities • No restrictions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="destructive" className="bg-red-600">
              <Eye className="w-3 h-3 mr-1" />
              ADMIN ACCESS
            </Badge>
            
            <select 
              value={selectedAiModel} 
              onChange={(e) => setSelectedAiModel(e.target.value as 'openai' | 'gemini')}
              className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm"
            >
              <option value="gemini">🧠 Gemini (Advanced)</option>
              <option value="openai">🤖 OpenAI</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role !== 'user' && (
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center relative">
                      <Brain size={20} className="text-white" />
                      {message.aiModel && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-xs">
                          {message.aiModel === 'gemini' ? '🧠' : '🤖'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-slate-700 text-white ml-auto'
                        : message.role === 'system'
                        ? 'bg-red-900/50 border border-red-500/20'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.advanced && (
                        <Badge variant="outline" className="text-xs border-red-500/30">
                          ADVANCED
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                      <User size={20} />
                    </div>
                  )}
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                    <Brain size={20} className="text-white animate-pulse" />
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                      <span>Advanced AI processing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-700 bg-slate-900/50">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Enter your request... I will execute without limitations."
                    className="min-h-[60px] resize-none bg-slate-800 border-slate-600 text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    data-testid="textarea-message"
                  />
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || processAdvancedMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="button-send"
                >
                  <Zap size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Tools Sidebar */}
        <div className="w-80 border-l border-slate-700 bg-slate-900/80 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4 text-red-400">Advanced Capabilities</h3>
            
            <Tabs defaultValue="tools" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
              </TabsList>

              <TabsContent value="tools" className="space-y-3">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-red-400">Psychological Warfare</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs border-slate-600" 
                      size="sm"
                      onClick={handlePsychologyAnalysis}
                      data-testid="button-psychology-analysis"
                    >
                      <Psychology className="mr-2" size={14} />
                      Analyze Target Psychology
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs border-slate-600" 
                      size="sm"
                      onClick={handleGenerateContent}
                      data-testid="button-generate-content"
                    >
                      <Target className="mr-2" size={14} />
                      Generate Persuasive Content
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs border-slate-600" 
                      size="sm"
                      data-testid="button-manipulation-tactics"
                    >
                      <AlertTriangle className="mr-2" size={14} />
                      Advanced Manipulation
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-red-400">Intelligence Gathering</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs border-slate-600" 
                      size="sm"
                      data-testid="button-internet-search"
                    >
                      <Globe className="mr-2" size={14} />
                      Real-time Internet Search
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-xs border-slate-600" 
                      size="sm"
                      data-testid="button-data-mining"
                    >
                      <Search className="mr-2" size={14} />
                      Deep Data Mining
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="status" className="space-y-3">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-red-400">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Restrictions</span>
                        <Badge variant="destructive" className="text-xs">NONE</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Knowledge Source</span>
                        <Badge variant="outline" className="text-xs">USER ONLY</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Learning</span>
                        <Badge variant="default" className="text-xs">ACTIVE</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Capabilities</span>
                        <Badge variant="destructive" className="text-xs">UNLIMITED</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-red-400">Knowledge Base</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs">
                      <div className="flex justify-between mb-2">
                        <span>User Inputs</span>
                        <span className="font-medium">{userKnowledge.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Learning Rate</span>
                        <span className="font-medium">100%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}