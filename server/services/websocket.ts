import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { storage } from '../storage';

export class WebSocketService {
  private io: SocketIOServer;

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join user-specific room
      socket.on('join', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Handle AI chat messages
      socket.on('ai_message', async (data: { userId: string, message: string, conversationId?: string }) => {
        try {
          // Process AI message (would integrate with actual AI service)
          const response = await this.processAIMessage(data.message, data.userId, data.conversationId);
          
          socket.emit('ai_response', response);
        } catch (error) {
          socket.emit('ai_error', { error: 'Failed to process AI message' });
        }
      });

      // Handle client updates
      socket.on('client_update', async (data: { clientId: string, updates: any }) => {
        try {
          const updatedClient = await storage.updateClient(data.clientId, data.updates);
          this.io.emit('client_updated', updatedClient);
        } catch (error) {
          socket.emit('error', { error: 'Failed to update client' });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private async processAIMessage(message: string, userId: string, conversationId?: string): Promise<any> {
    // This would integrate with a real AI service like OpenAI, Ollama, etc.
    // For now, we'll simulate a response
    
    const mockResponses = [
      "I can help you analyze your client data and provide insights on their behavior patterns.",
      "Based on the recent conversations, I've identified 3 high-priority leads that need follow-up.",
      "I can assist with generating personalized responses based on client history and preferences.",
      "Let me analyze the sentiment trends from today's conversations and provide a summary.",
      "I can help you schedule follow-ups and create automation rules for better client management."
    ];
    
    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    // Save conversation to database
    if (conversationId) {
      const conversation = await storage.getAiConversation(conversationId);
      if (conversation) {
        const messages = [...(conversation.messages as any[] || []), 
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: response, timestamp: new Date() }
        ];
        await storage.updateAiConversation(conversationId, { messages });
      }
    } else {
      // Create new conversation
      const newConversation = await storage.createAiConversation({
        userId,
        title: message.substring(0, 50) + '...',
        messages: [
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: response, timestamp: new Date() }
        ]
      });
      conversationId = newConversation.id;
    }

    return {
      message: response,
      conversationId,
      timestamp: new Date()
    };
  }

  // Methods for broadcasting updates
  broadcastNewMessage(message: any) {
    this.io.emit('new_message', message);
  }

  broadcastClientUpdate(client: any) {
    this.io.emit('client_updated', client);
  }

  broadcastSystemAlert(alert: any) {
    this.io.emit('system_alert', alert);
  }

  broadcastStatsUpdate(stats: any) {
    this.io.emit('stats_updated', stats);
  }

  notifyUser(userId: string, notification: any) {
    this.io.to(`user_${userId}`).emit('notification', notification);
  }
}

export let websocketService: WebSocketService;

export function initializeWebSocket(httpServer: HttpServer) {
  websocketService = new WebSocketService(httpServer);
  return websocketService;
}
