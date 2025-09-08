import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  Send, 
  ArrowLeft,
  Settings,
  Users,
  MessageSquare,
  Archive,
  Star,
  Check,
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar?: string;
  online?: boolean;
  typing?: boolean;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'me' | 'other';
  status: 'sent' | 'delivered' | 'read';
}

interface WhatsAppWebInterfaceProps {
  onBack: () => void;
}

export function WhatsAppWebInterface({ onBack }: WhatsAppWebInterfaceProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Mock conversations data
  const [conversations] = useState<Conversation[]>([
    {
      id: "1",
      name: "James Rodriguez",
      lastMessage: "Interested in the Rolex Submariner. Can we schedule a viewing?",
      timestamp: "10:30 AM",
      unreadCount: 2,
      online: true
    },
    {
      id: "2", 
      name: "Sarah Chen",
      lastMessage: "Thank you for the detailed information about the Patek Philippe",
      timestamp: "9:45 AM",
      unreadCount: 0,
      typing: true
    },
    {
      id: "3",
      name: "Michael Thompson",
      lastMessage: "I'll take the Vacheron Constantin. Please hold it for me.",
      timestamp: "Yesterday",
      unreadCount: 1
    },
    {
      id: "4",
      name: "Emma Wilson",
      lastMessage: "Can you show me more luxury watches in that price range?",
      timestamp: "Yesterday",
      unreadCount: 0
    },
    {
      id: "5",
      name: "David Kim",
      lastMessage: "Perfect! I'll transfer the payment today.",
      timestamp: "Monday",
      unreadCount: 0
    }
  ]);

  // Mock messages for selected conversation
  const [messages] = useState<Record<string, Message[]>>({
    "1": [
      {
        id: "1",
        content: "Hello! I saw your post about luxury watches.",
        timestamp: "10:25 AM",
        sender: 'other',
        status: 'read'
      },
      {
        id: "2",
        content: "Hi James! Yes, we have an excellent collection. What type of watch interests you?",
        timestamp: "10:26 AM", 
        sender: 'me',
        status: 'read'
      },
      {
        id: "3",
        content: "I'm particularly interested in the Rolex Submariner. Do you have it in stock?",
        timestamp: "10:28 AM",
        sender: 'other',
        status: 'read'
      },
      {
        id: "4",
        content: "Yes, we have several models available. I can send you photos and arrange a private viewing.",
        timestamp: "10:29 AM",
        sender: 'me',
        status: 'read'
      },
      {
        id: "5",
        content: "Interested in the Rolex Submariner. Can we schedule a viewing?",
        timestamp: "10:30 AM",
        sender: 'other',
        status: 'delivered'
      }
    ],
    "2": [
      {
        id: "1",
        content: "Thank you for the detailed information about the Patek Philippe",
        timestamp: "9:45 AM",
        sender: 'other',
        status: 'read'
      }
    ]
  });

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // Would integrate with real WhatsApp API here
    console.log('Sending message:', newMessage);
    setNewMessage("");
  };

  return (
    <div className="h-screen bg-gray-100 flex relative overflow-hidden">
      {/* Custom Cursor */}
      <div 
        className="fixed w-4 h-4 pointer-events-none z-50 transition-all duration-100 ease-out"
        style={{ 
          left: cursorPosition.x - 8, 
          top: cursorPosition.y - 8,
          transform: 'translate(0, 0)'
        }}
      >
        <div className="w-full h-full bg-primary rounded-full shadow-lg border-2 border-white opacity-80" />
      </div>

      {/* Left Sidebar - Conversations */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
              data-testid="whatsapp-back-btn"
            >
              <ArrowLeft size={20} />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gray-300">S</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Users size={20} className="text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <MessageSquare size={20} className="text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <MoreVertical size={20} className="text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
              data-testid="search-conversations"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={cn(
                "p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors",
                selectedConversation === conv.id && "bg-gray-100"
              )}
              data-testid={`conversation-${conv.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.avatar} />
                    <AvatarFallback className="bg-gray-300 text-gray-600">
                      {conv.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {conv.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">{conv.name}</h3>
                    <span className="text-xs text-gray-500">{conv.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {conv.typing ? (
                        <span className="text-green-600 italic">typing...</span>
                      ) : (
                        conv.lastMessage
                      )}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConv.avatar} />
                  <AvatarFallback className="bg-gray-300 text-gray-600">
                    {selectedConv.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-medium text-gray-900">{selectedConv.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedConv.online ? 'online' : 'last seen recently'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="p-2">
                  <Video size={20} className="text-gray-600" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Phone size={20} className="text-gray-600" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Search size={20} className="text-gray-600" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreVertical size={20} className="text-gray-600" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto p-4 bg-gray-50"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.1'%3E%3Ccircle cx='60' cy='60' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
              data-testid="messages-area"
            >
              <div className="space-y-4">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === 'me' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-md px-4 py-2 rounded-lg shadow-sm",
                        message.sender === 'me'
                          ? 'bg-green-500 text-white rounded-br-none'
                          : 'bg-white text-gray-900 rounded-bl-none'
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={cn(
                        "flex items-center justify-end space-x-1 mt-1",
                        message.sender === 'me' ? 'text-green-100' : 'text-gray-500'
                      )}>
                        <span className="text-xs">{message.timestamp}</span>
                        {message.sender === 'me' && (
                          <div className="text-xs">
                            {message.status === 'sent' && <Check size={12} />}
                            {message.status === 'delivered' && <CheckCheck size={12} />}
                            {message.status === 'read' && <CheckCheck size={12} className="text-blue-200" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="p-2">
                  <Smile size={20} className="text-gray-600" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Paperclip size={20} className="text-gray-600" />
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="Type a message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="border-gray-200"
                    data-testid="message-input"
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  className="bg-green-500 hover:bg-green-600 text-white p-2"
                  data-testid="send-message-btn"
                >
                  <Send size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-8 bg-gray-200 rounded-full flex items-center justify-center">
                <MessageSquare size={80} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-light text-gray-600 mb-2">
                WhatsApp Web
              </h2>
              <p className="text-gray-500 max-w-md">
                Send and receive messages without keeping your phone online.
                <br />
                Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}