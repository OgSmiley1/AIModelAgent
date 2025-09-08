import { 
  type User, type InsertUser, 
  type Client, type InsertClient,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type FollowUp, type InsertFollowUp,
  type Interaction, type InsertInteraction,
  type Document, type InsertDocument,
  type TripPlan, type InsertTripPlan,
  type AiConversation, type InsertAiConversation,
  type SystemSetting, type InsertSystemSetting
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Client operations
  getClient(id: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  getClientsByStatus(status: string): Promise<Client[]>;
  getClientsByPriority(priority: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<Client>): Promise<Client>;
  deleteClient(id: string): Promise<boolean>;

  // Conversation operations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByClient(clientId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;

  // Message operations
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  getRecentMessages(limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, updates: Partial<Message>): Promise<Message>;

  // Follow-up operations
  getFollowUp(id: string): Promise<FollowUp | undefined>;
  getFollowUpsByClient(clientId: string): Promise<FollowUp[]>;
  getPendingFollowUps(): Promise<FollowUp[]>;
  createFollowUp(followUp: InsertFollowUp): Promise<FollowUp>;
  updateFollowUp(id: string, updates: Partial<FollowUp>): Promise<FollowUp>;

  // Interaction operations
  getInteraction(id: string): Promise<Interaction | undefined>;
  getInteractionsByClient(clientId: string): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;

  // Document operations
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByClient(clientId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;

  // Trip plan operations
  getTripPlan(id: string): Promise<TripPlan | undefined>;
  getTripPlansByClient(clientId: string): Promise<TripPlan[]>;
  createTripPlan(tripPlan: InsertTripPlan): Promise<TripPlan>;
  updateTripPlan(id: string, updates: Partial<TripPlan>): Promise<TripPlan>;

  // AI conversation operations
  getAiConversation(id: string): Promise<AiConversation | undefined>;
  getAiConversationsByUser(userId: string): Promise<AiConversation[]>;
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  updateAiConversation(id: string, updates: Partial<AiConversation>): Promise<AiConversation>;

  // System settings operations
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;

  // Analytics operations
  getDashboardStats(): Promise<any>;
  getClientAnalytics(clientId: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message> = new Map();
  private followUps: Map<string, FollowUp> = new Map();
  private interactions: Map<string, Interaction> = new Map();
  private documents: Map<string, Document> = new Map();
  private tripPlans: Map<string, TripPlan> = new Map();
  private aiConversations: Map<string, AiConversation> = new Map();
  private systemSettings: Map<string, SystemSetting> = new Map();

  constructor() {
    // Initialize with some default system settings
    this.initializeDefaults();
  }

  private initializeDefaults() {
    const defaultSettings = [
      { key: "whatsapp_connected", value: false, category: "whatsapp", description: "WhatsApp connection status" },
      { key: "ai_auto_response", value: true, category: "ai", description: "Enable AI auto-responses" },
      { key: "sentiment_monitoring", value: true, category: "ai", description: "Enable sentiment monitoring" },
      { key: "follow_up_reminders", value: true, category: "automation", description: "Enable follow-up reminders" },
    ];

    defaultSettings.forEach(setting => {
      const id = randomUUID();
      this.systemSettings.set(setting.key, {
        id,
        ...setting,
        updatedAt: new Date(),
      });
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      role: insertUser.role || null,
      email: insertUser.email || null,
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Client operations
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClientsByStatus(status: string): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(client => client.status === status);
  }

  async getClientsByPriority(priority: string): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(client => client.priority === priority);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const now = new Date();
    const client: Client = {
      ...insertClient,
      notes: insertClient.notes || null,
      status: insertClient.status || null,
      email: insertClient.email || null,
      phone: insertClient.phone || null,
      whatsappNumber: insertClient.whatsappNumber || null,
      priority: insertClient.priority || null,
      interests: insertClient.interests || null,
      tags: insertClient.tags || null,
      purchaseHistory: insertClient.purchaseHistory || null,
      preferences: insertClient.preferences || null,
      lastContactDate: insertClient.lastContactDate || null,
      followUpDate: insertClient.followUpDate || null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const client = this.clients.get(id);
    if (!client) {
      throw new Error(`Client with id ${id} not found`);
    }
    const updatedClient = { 
      ...client, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Conversation operations
  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByClient(clientId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(conv => conv.clientId === clientId);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      summary: insertConversation.summary || null,
      status: insertConversation.status || null,
      sentimentScore: insertConversation.sentimentScore || null,
      sentiment: insertConversation.sentiment || null,
      urgency: insertConversation.urgency || null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error(`Conversation with id ${id} not found`);
    }
    const updatedConversation = { 
      ...conversation, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  // Message operations
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async getRecentMessages(limit: number = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      metadata: insertMessage.metadata || {},
      sentimentScore: insertMessage.sentimentScore || null,
      clientId: insertMessage.clientId || null,
      platform: insertMessage.platform || null,
      sentiment: insertMessage.sentiment || null,
      conversationId: insertMessage.conversationId || null,
      messageType: insertMessage.messageType || null,
      analyzed: insertMessage.analyzed || null,
      autoGenerated: insertMessage.autoGenerated || null,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);

    // Update conversation last message time and count
    if (message.conversationId) {
      const conversation = this.conversations.get(message.conversationId);
      if (conversation) {
        await this.updateConversation(message.conversationId, {
          lastMessageAt: message.timestamp,
          messageCount: (conversation.messageCount || 0) + 1,
        });
      }
    }

    return message;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
    const message = this.messages.get(id);
    if (!message) {
      throw new Error(`Message with id ${id} not found`);
    }
    const updatedMessage = { ...message, ...updates };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Follow-up operations
  async getFollowUp(id: string): Promise<FollowUp | undefined> {
    return this.followUps.get(id);
  }

  async getFollowUpsByClient(clientId: string): Promise<FollowUp[]> {
    return Array.from(this.followUps.values()).filter(fu => fu.clientId === clientId);
  }

  async getPendingFollowUps(): Promise<FollowUp[]> {
    const now = new Date();
    return Array.from(this.followUps.values())
      .filter(fu => !fu.completed && fu.scheduledFor <= now)
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  async createFollowUp(insertFollowUp: InsertFollowUp): Promise<FollowUp> {
    const id = randomUUID();
    const followUp: FollowUp = {
      ...insertFollowUp,
      metadata: insertFollowUp.metadata || {},
      description: insertFollowUp.description || null,
      priority: insertFollowUp.priority || null,
      completed: insertFollowUp.completed || null,
      completedAt: insertFollowUp.completedAt || null,
      automatedAction: insertFollowUp.automatedAction || null,
      id,
      createdAt: new Date(),
    };
    this.followUps.set(id, followUp);
    return followUp;
  }

  async updateFollowUp(id: string, updates: Partial<FollowUp>): Promise<FollowUp> {
    const followUp = this.followUps.get(id);
    if (!followUp) {
      throw new Error(`FollowUp with id ${id} not found`);
    }
    const updatedFollowUp = { ...followUp, ...updates };
    this.followUps.set(id, updatedFollowUp);
    return updatedFollowUp;
  }

  // Interaction operations
  async getInteraction(id: string): Promise<Interaction | undefined> {
    return this.interactions.get(id);
  }

  async getInteractionsByClient(clientId: string): Promise<Interaction[]> {
    return Array.from(this.interactions.values())
      .filter(interaction => interaction.clientId === clientId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const id = randomUUID();
    const interaction: Interaction = {
      ...insertInteraction,
      summary: insertInteraction.summary || null,
      metadata: insertInteraction.metadata || {},
      value: insertInteraction.value || null,
      duration: insertInteraction.duration || null,
      clientId: insertInteraction.clientId || null,
      sentiment: insertInteraction.sentiment || null,
      outcome: insertInteraction.outcome || null,
      id,
      timestamp: new Date(),
    };
    this.interactions.set(id, interaction);

    // Update client interaction count and last interaction time
    if (interaction.clientId) {
      const client = this.clients.get(interaction.clientId);
      if (client) {
        await this.updateClient(interaction.clientId, {
          lastInteraction: interaction.timestamp,
          totalInteractions: (client.totalInteractions || 0) + 1,
        });
      }
    }

    return interaction;
  }

  // Document operations
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByClient(clientId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.clientId === clientId);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      tags: insertDocument.tags || null,
      clientId: insertDocument.clientId || null,
      analyzed: insertDocument.analyzed || null,
      category: insertDocument.category || null,
      fileSize: insertDocument.fileSize || null,
      analysisResults: insertDocument.analysisResults || {},
      id,
      createdAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Trip plan operations
  async getTripPlan(id: string): Promise<TripPlan | undefined> {
    return this.tripPlans.get(id);
  }

  async getTripPlansByClient(clientId: string): Promise<TripPlan[]> {
    return Array.from(this.tripPlans.values()).filter(trip => trip.clientId === clientId);
  }

  async createTripPlan(insertTripPlan: InsertTripPlan): Promise<TripPlan> {
    const id = randomUUID();
    const now = new Date();
    const tripPlan: TripPlan = {
      ...insertTripPlan,
      notes: insertTripPlan.notes || null,
      status: insertTripPlan.status || null,
      preferences: insertTripPlan.preferences || {},
      clientId: insertTripPlan.clientId || null,
      startDate: insertTripPlan.startDate || null,
      endDate: insertTripPlan.endDate || null,
      budget: insertTripPlan.budget || null,
      itinerary: insertTripPlan.itinerary || {},
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.tripPlans.set(id, tripPlan);
    return tripPlan;
  }

  async updateTripPlan(id: string, updates: Partial<TripPlan>): Promise<TripPlan> {
    const tripPlan = this.tripPlans.get(id);
    if (!tripPlan) {
      throw new Error(`TripPlan with id ${id} not found`);
    }
    const updatedTripPlan = { 
      ...tripPlan, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.tripPlans.set(id, updatedTripPlan);
    return updatedTripPlan;
  }

  // AI conversation operations
  async getAiConversation(id: string): Promise<AiConversation | undefined> {
    return this.aiConversations.get(id);
  }

  async getAiConversationsByUser(userId: string): Promise<AiConversation[]> {
    return Array.from(this.aiConversations.values()).filter(conv => conv.userId === userId);
  }

  async createAiConversation(insertAiConversation: InsertAiConversation): Promise<AiConversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: AiConversation = {
      ...insertAiConversation,
      title: insertAiConversation.title || null,
      userId: insertAiConversation.userId || null,
      context: insertAiConversation.context || {},
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.aiConversations.set(id, conversation);
    return conversation;
  }

  async updateAiConversation(id: string, updates: Partial<AiConversation>): Promise<AiConversation> {
    const conversation = this.aiConversations.get(id);
    if (!conversation) {
      throw new Error(`AiConversation with id ${id} not found`);
    }
    const updatedConversation = { 
      ...conversation, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.aiConversations.set(id, updatedConversation);
    return updatedConversation;
  }

  // System settings operations
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    return this.systemSettings.get(key);
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return Array.from(this.systemSettings.values());
  }

  async setSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const existing = this.systemSettings.get(insertSetting.key);
    if (existing) {
      const updated = { 
        ...existing, 
        ...insertSetting, 
        updatedAt: new Date() 
      };
      this.systemSettings.set(insertSetting.key, updated);
      return updated;
    } else {
      const id = randomUUID();
      const setting: SystemSetting = {
        ...insertSetting,
        id,
        updatedAt: new Date(),
      };
      this.systemSettings.set(insertSetting.key, setting);
      return setting;
    }
  }

  // Analytics operations
  async getDashboardStats(): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const todayMessages = Array.from(this.messages.values())
      .filter(msg => msg.timestamp && msg.timestamp >= today).length;
    
    const yesterdayMessages = Array.from(this.messages.values())
      .filter(msg => msg.timestamp && msg.timestamp >= yesterday && msg.timestamp < today).length;

    const totalClients = this.clients.size;
    const activeConversations = Array.from(this.conversations.values())
      .filter(conv => conv.status === 'active').length;
    
    const pendingReminders = Array.from(this.followUps.values())
      .filter(fu => !fu.completed && fu.scheduledFor <= now).length;

    const avgSentiment = Array.from(this.messages.values())
      .filter(msg => msg.sentimentScore !== null && msg.sentimentScore !== undefined)
      .reduce((sum, msg) => sum + (msg.sentimentScore || 0), 0) / 
      Array.from(this.messages.values()).filter(msg => msg.sentimentScore !== null).length || 0;

    return {
      todayMessages,
      yesterdayMessages,
      messageGrowth: yesterdayMessages > 0 ? ((todayMessages - yesterdayMessages) / yesterdayMessages * 100).toFixed(1) : "0",
      totalClients,
      activeChats: activeConversations,
      pendingReminders,
      avgResponseTime: "2.3s", // Mock for now - would need real calculation
      conversionRate: 68, // Mock for now - would calculate based on client journey
      satisfaction: (avgSentiment * 2 + 3).toFixed(1), // Convert sentiment score to 1-5 scale
    };
  }

  async getClientAnalytics(clientId: string): Promise<any> {
    const client = this.clients.get(clientId);
    if (!client) return null;

    const interactions = await this.getInteractionsByClient(clientId);
    const conversations = await this.getConversationsByClient(clientId);
    const followUps = await this.getFollowUpsByClient(clientId);

    return {
      client,
      totalInteractions: interactions.length,
      totalConversations: conversations.length,
      pendingFollowUps: followUps.filter(fu => !fu.completed).length,
      avgSentiment: client.sentimentScore || 0,
      lastInteraction: client.lastInteraction,
    };
  }
}

export const storage = new MemStorage();
