import { 
  type User, type InsertUser, 
  type Client, type InsertClient,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type FollowUp, type InsertFollowUp,
  type Appointment, type InsertAppointment,
  type Interaction, type InsertInteraction,
  type Activity, type InsertActivity,
  type Document, type InsertDocument,
  type TripPlan, type InsertTripPlan,
  type AiConversation, type InsertAiConversation,
  type SystemSetting, type InsertSystemSetting,
  type Deal, type InsertDeal,
  type SalesForecast, type InsertSalesForecast,
  type LeadScoringHistory, type InsertLeadScoringHistory,
  type GithubRepository, type InsertGithubRepository,
  type SelfEditingHistory, type InsertSelfEditingHistory,
  type AiLearningDocument, type InsertAiLearningDocument,
  type CodeAnalysisReport, type InsertCodeAnalysisReport,
  type Watch, type InsertWatch,
  type Faq, type InsertFaq,
  type ActivityLog, type InsertActivityLog,
  users, clients, conversations, messages, followUps, appointments,
  interactions, activities, documents, tripPlans, aiConversations,
  systemSettings, deals, salesForecasts, leadScoringHistory,
  githubRepositories, selfEditingHistory, aiLearningDocuments,
  codeAnalysisReports, watchCollection, faqDatabase, activityLog
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from './db';
import { eq, and, or, desc, sql as drizzleSql } from 'drizzle-orm';

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

  // Appointment operations
  getAppointmentById(id: string): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;
  getAppointmentsByClient(clientId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<boolean>;

  // Interaction operations
  getInteraction(id: string): Promise<Interaction | undefined>;
  getInteractionsByClient(clientId: string): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;

  // Activity operations (audit trail)
  getActivity(id: string): Promise<Activity | undefined>;
  getActivitiesByClient(clientId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  logStatusChange(clientId: string, actorId: string | undefined, from: string, to: string): Promise<Activity>;
  logFieldEdit(clientId: string, actorId: string | undefined, field: string, from: any, to: any): Promise<Activity>;
  logFollowUpAction(clientId: string, actorId: string | undefined, actionType: string, followUpId: string, details?: any): Promise<Activity>;

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

  // Deal operations
  getDeal(id: string): Promise<Deal | undefined>;
  getDealsByClient(clientId: string): Promise<Deal[]>;
  getAllDeals(): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, updates: Partial<Deal>): Promise<Deal>;
  deleteDeal(id: string): Promise<boolean>;

  // Sales forecasting operations
  getSalesForecast(id: string): Promise<SalesForecast | undefined>;
  getAllSalesForecasts(): Promise<SalesForecast[]>;
  createSalesForecast(forecast: InsertSalesForecast): Promise<SalesForecast>;
  updateSalesForecast(id: string, updates: Partial<SalesForecast>): Promise<SalesForecast>;

  // Lead scoring operations
  getLeadScoringHistory(clientId: string): Promise<LeadScoringHistory[]>;
  createLeadScoringEntry(entry: InsertLeadScoringHistory): Promise<LeadScoringHistory>;
  updateClientLeadScore(clientId: string, score: number, factors: any, confidence: number): Promise<Client>;

  // GitHub repository operations
  getGithubRepository(id: string): Promise<GithubRepository | undefined>;
  getAllGithubRepositories(): Promise<GithubRepository[]>;
  createGithubRepository(repository: InsertGithubRepository): Promise<GithubRepository>;
  updateGithubRepository(id: string, updates: Partial<GithubRepository>): Promise<GithubRepository>;
  deleteGithubRepository(id: string): Promise<boolean>;

  // Self-editing history operations
  getSelfEditingHistory(repositoryId: string): Promise<SelfEditingHistory[]>;
  getSelfEditingEntry(id: string): Promise<SelfEditingHistory | undefined>;
  getAllSelfEditingHistory(): Promise<SelfEditingHistory[]>;
  createSelfEditingEntry(entry: InsertSelfEditingHistory): Promise<SelfEditingHistory>;
  updateSelfEditingEntry(id: string, updates: Partial<SelfEditingHistory>): Promise<SelfEditingHistory>;

  // AI learning document operations
  getAiLearningDocument(id: string): Promise<AiLearningDocument | undefined>;
  getAllAiLearningDocuments(): Promise<AiLearningDocument[]>;
  getAiLearningDocumentsByCategory(category: string): Promise<AiLearningDocument[]>;
  createAiLearningDocument(document: InsertAiLearningDocument): Promise<AiLearningDocument>;
  updateAiLearningDocument(id: string, updates: Partial<AiLearningDocument>): Promise<AiLearningDocument>;
  deleteAiLearningDocument(id: string): Promise<boolean>;

  // Code analysis report operations
  getCodeAnalysisReport(id: string): Promise<CodeAnalysisReport | undefined>;
  getCodeAnalysisReportsByRepository(repositoryId: string): Promise<CodeAnalysisReport[]>;
  createCodeAnalysisReport(report: InsertCodeAnalysisReport): Promise<CodeAnalysisReport>;

  // Watch collection operations
  getWatch(id: string): Promise<Watch | undefined>;
  getWatchByReference(reference: string): Promise<Watch | undefined>;
  getAllWatches(): Promise<Watch[]>;
  getAvailableWatches(): Promise<Watch[]>;
  getWatchesByCollection(collectionName: string): Promise<Watch[]>;
  getWatchesByPriceRange(minPrice: number, maxPrice: number): Promise<Watch[]>;
  searchWatches(query: string): Promise<Watch[]>;
  createWatch(watch: InsertWatch): Promise<Watch>;
  updateWatch(id: string, updates: Partial<Watch>): Promise<Watch>;
  deleteWatch(id: string): Promise<boolean>;
  incrementWatchPopularity(id: string): Promise<void>;

  // FAQ/Knowledge Base operations
  getFaq(id: string): Promise<Faq | undefined>;
  getAllFaqs(): Promise<Faq[]>;
  getFaqsByCategory(category: string): Promise<Faq[]>;
  searchFaqs(query: string): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: string, updates: Partial<Faq>): Promise<Faq>;
  deleteFaq(id: string): Promise<boolean>;
  incrementFaqUsage(id: string): Promise<Faq>;

  // Activity Log operations (for real-time dashboard)
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivities(limit?: number): Promise<ActivityLog[]>;
  getActivitiesByEntity(entityType: string, entityId: string): Promise<ActivityLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message> = new Map();
  private followUps: Map<string, FollowUp> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private interactions: Map<string, Interaction> = new Map();
  private activities: Map<string, Activity> = new Map();
  private documents: Map<string, Document> = new Map();
  private tripPlans: Map<string, TripPlan> = new Map();
  private aiConversations: Map<string, AiConversation> = new Map();
  private systemSettings: Map<string, SystemSetting> = new Map();
  private deals: Map<string, Deal> = new Map();
  private salesForecasts: Map<string, SalesForecast> = new Map();
  private leadScoringHistory: Map<string, LeadScoringHistory> = new Map();
  private githubRepositories: Map<string, GithubRepository> = new Map();
  private selfEditingHistory: Map<string, SelfEditingHistory> = new Map();
  private aiLearningDocuments: Map<string, AiLearningDocument> = new Map();
  private codeAnalysisReports: Map<string, CodeAnalysisReport> = new Map();
  private watches: Map<string, Watch> = new Map();
  private faqs: Map<string, Faq> = new Map();
  
  constructor() {
    // Initialize with some default system settings
    this.initializeDefaults();
    
    // Add periodic logging to ensure data persistence visibility
    setInterval(() => {
      const clientCount = this.clients.size;
      if (clientCount > 0) {
        console.log(`📊 Storage status: ${clientCount} clients maintained in memory`);
      }
    }, 30000); // Log every 30 seconds if data exists
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
    const clients = Array.from(this.clients.values());
    console.log(`🔍 getAllClients() called - returning ${clients.length} clients`);
    return clients;
  }

  async getClientsByStatus(status: string): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(client => client.status === status);
  }

  async getClientsByPriority(priority: string): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(client => client.priority === priority);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    // Use provided ID or generate new UUID
    const id = insertClient.id || randomUUID();
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
      preferences: insertClient.preferences || null,
      behaviorPatterns: insertClient.behaviorPatterns || null,
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
      clientId: insertConversation.clientId || null,
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
      clientId: insertFollowUp.clientId || null,
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

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(a => a.clientId === clientId);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = {
      ...insertAppointment,
      notes: insertAppointment.notes ?? null,
      reminderSent: insertAppointment.reminderSent ?? false,
      id,
      createdAt: new Date(),
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) {
      throw new Error(`Appointment with id ${id} not found`);
    }
    const updatedAppointment = { ...appointment, ...updates };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    return this.appointments.delete(id);
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

  // Activity operations (audit trail)
  async getActivity(id: string): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivitiesByClient(clientId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.clientId === clientId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async logStatusChange(clientId: string, actorId: string | undefined, from: string, to: string): Promise<Activity> {
    return this.createActivity({
      clientId,
      actorId: actorId || null,
      type: 'status_changed',
      payload: { field: 'status', from, to }
    });
  }

  async logFieldEdit(clientId: string, actorId: string | undefined, field: string, from: any, to: any): Promise<Activity> {
    return this.createActivity({
      clientId,
      actorId: actorId || null,
      type: 'field_edited',
      payload: { field, from, to }
    });
  }

  async logFollowUpAction(clientId: string, actorId: string | undefined, actionType: string, followUpId: string, details?: any): Promise<Activity> {
    return this.createActivity({
      clientId,
      actorId: actorId || null,
      type: actionType,
      payload: { followUpId, ...details }
    });
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
        description: insertSetting.description || null,
        category: insertSetting.category || null,
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

  // Deal operations
  async getDeal(id: string): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async getDealsByClient(clientId: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.clientId === clientId);
  }

  async getAllDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values());
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const id = randomUUID();
    const newDeal: Deal = {
      id,
      ...deal,
      tags: deal.tags || null,
      clientId: deal.clientId || null,
      description: deal.description || null,
      source: deal.source || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.deals.set(id, newDeal);
    return newDeal;
  }

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
    const deal = this.deals.get(id);
    if (!deal) throw new Error("Deal not found");
    
    const updatedDeal = { ...deal, ...updates, updatedAt: new Date() };
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async deleteDeal(id: string): Promise<boolean> {
    return this.deals.delete(id);
  }

  // Sales forecasting operations
  async getSalesForecast(id: string): Promise<SalesForecast | undefined> {
    return this.salesForecasts.get(id);
  }

  async getAllSalesForecasts(): Promise<SalesForecast[]> {
    return Array.from(this.salesForecasts.values());
  }

  async createSalesForecast(forecast: InsertSalesForecast): Promise<SalesForecast> {
    const id = randomUUID();
    const newForecast: SalesForecast = {
      id,
      ...forecast,
      actualRevenue: forecast.actualRevenue || null,
      actualDeals: forecast.actualDeals || null,
      factors: forecast.factors || null,
      methodology: forecast.methodology || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.salesForecasts.set(id, newForecast);
    return newForecast;
  }

  async updateSalesForecast(id: string, updates: Partial<SalesForecast>): Promise<SalesForecast> {
    const forecast = this.salesForecasts.get(id);
    if (!forecast) throw new Error("Sales forecast not found");
    
    const updatedForecast = { ...forecast, ...updates, updatedAt: new Date() };
    this.salesForecasts.set(id, updatedForecast);
    return updatedForecast;
  }

  // Lead scoring operations
  async getLeadScoringHistory(clientId: string): Promise<LeadScoringHistory[]> {
    return Array.from(this.leadScoringHistory.values())
      .filter(entry => entry.clientId === clientId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createLeadScoringEntry(entry: InsertLeadScoringHistory): Promise<LeadScoringHistory> {
    const id = randomUUID();
    const newEntry: LeadScoringHistory = {
      id,
      ...entry,
      clientId: entry.clientId || null,
      triggerEvent: entry.triggerEvent || null,
      previousScore: entry.previousScore || null,
      scoreChange: entry.scoreChange || null,
      createdAt: new Date(),
    };
    this.leadScoringHistory.set(id, newEntry);
    return newEntry;
  }

  async updateClientLeadScore(clientId: string, score: number, factors: any, confidence: number): Promise<Client> {
    const client = this.clients.get(clientId);
    if (!client) throw new Error("Client not found");

    const updates = {
      leadScore: score,
      lastScoreUpdate: new Date(),
      updatedAt: new Date(),
    };

    const updatedClient = { ...client, ...updates };
    this.clients.set(clientId, updatedClient);

    // Create scoring history entry
    await this.createLeadScoringEntry({
      clientId,
      score,
      factors,
      confidence,
      previousScore: client.leadScore || 0,
      scoreChange: score - (client.leadScore || 0),
      triggerEvent: 'manual_update'
    });

    return updatedClient;
  }

  // GitHub repository operations
  async getGithubRepository(id: string): Promise<GithubRepository | undefined> {
    return this.githubRepositories.get(id);
  }

  async getAllGithubRepositories(): Promise<GithubRepository[]> {
    return Array.from(this.githubRepositories.values());
  }

  async createGithubRepository(repository: InsertGithubRepository): Promise<GithubRepository> {
    const newRepository: GithubRepository = {
      id: randomUUID(),
      ...repository,
      isActive: repository.isActive ?? true,
      defaultBranch: repository.defaultBranch || "main",
      accessToken: repository.accessToken || null,
      webhookSecret: repository.webhookSecret || null,
      lastSync: repository.lastSync || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.githubRepositories.set(newRepository.id, newRepository);
    return newRepository;
  }

  async updateGithubRepository(id: string, updates: Partial<GithubRepository>): Promise<GithubRepository> {
    const repository = this.githubRepositories.get(id);
    if (!repository) {
      throw new Error("GitHub repository not found");
    }

    const updatedRepository = {
      ...repository,
      ...updates,
      updatedAt: new Date()
    };

    this.githubRepositories.set(id, updatedRepository);
    return updatedRepository;
  }

  async deleteGithubRepository(id: string): Promise<boolean> {
    return this.githubRepositories.delete(id);
  }

  // Self-editing history operations
  async getSelfEditingHistory(repositoryId: string): Promise<SelfEditingHistory[]> {
    return Array.from(this.selfEditingHistory.values())
      .filter(entry => entry.repositoryId === repositoryId);
  }

  async getSelfEditingEntry(id: string): Promise<SelfEditingHistory | undefined> {
    return this.selfEditingHistory.get(id);
  }

  async getAllSelfEditingHistory(): Promise<SelfEditingHistory[]> {
    return Array.from(this.selfEditingHistory.values());
  }

  async createSelfEditingEntry(entry: InsertSelfEditingHistory): Promise<SelfEditingHistory> {
    const newEntry: SelfEditingHistory = {
      id: randomUUID(),
      ...entry,
      repositoryId: entry.repositoryId || null,
      commitHash: entry.commitHash || null,
      branchName: entry.branchName || "main",
      filesModified: entry.filesModified || [],
      changesDetails: entry.changesDetails || null,
      triggerEvent: entry.triggerEvent || null,
      aiAnalysis: entry.aiAnalysis || null,
      status: entry.status || "pending",
      riskLevel: entry.riskLevel || "low",
      testsPassed: entry.testsPassed ?? false,
      reviewRequired: entry.reviewRequired ?? true,
      autoApproved: entry.autoApproved ?? false,
      rollbackPlan: entry.rollbackPlan || null,
      createdAt: new Date(),
      appliedAt: null
    };
    this.selfEditingHistory.set(newEntry.id, newEntry);
    return newEntry;
  }

  async updateSelfEditingEntry(id: string, updates: Partial<SelfEditingHistory>): Promise<SelfEditingHistory> {
    const entry = this.selfEditingHistory.get(id);
    if (!entry) {
      throw new Error("Self-editing history entry not found");
    }

    const updatedEntry = {
      ...entry,
      ...updates
    };

    this.selfEditingHistory.set(id, updatedEntry);
    return updatedEntry;
  }

  // AI learning document operations
  async getAiLearningDocument(id: string): Promise<AiLearningDocument | undefined> {
    return this.aiLearningDocuments.get(id);
  }

  async getAllAiLearningDocuments(): Promise<AiLearningDocument[]> {
    return Array.from(this.aiLearningDocuments.values());
  }

  async getAiLearningDocumentsByCategory(category: string): Promise<AiLearningDocument[]> {
    return Array.from(this.aiLearningDocuments.values())
      .filter(doc => doc.category === category);
  }

  async createAiLearningDocument(document: InsertAiLearningDocument): Promise<AiLearningDocument> {
    const newDocument: AiLearningDocument = {
      id: randomUUID(),
      ...document,
      fileSize: document.fileSize || null,
      content: document.content || null,
      vectorEmbedding: document.vectorEmbedding || null,
      category: document.category || "general",
      topics: document.topics || [],
      processed: document.processed ?? false,
      processedAt: null,
      learningContext: document.learningContext || null,
      priority: document.priority || "medium",
      metadata: document.metadata || null,
      createdAt: new Date()
    };
    this.aiLearningDocuments.set(newDocument.id, newDocument);
    return newDocument;
  }

  async updateAiLearningDocument(id: string, updates: Partial<AiLearningDocument>): Promise<AiLearningDocument> {
    const document = this.aiLearningDocuments.get(id);
    if (!document) {
      throw new Error("AI learning document not found");
    }

    const updatedDocument = {
      ...document,
      ...updates
    };

    this.aiLearningDocuments.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteAiLearningDocument(id: string): Promise<boolean> {
    return this.aiLearningDocuments.delete(id);
  }

  // Code analysis report operations
  async getCodeAnalysisReport(id: string): Promise<CodeAnalysisReport | undefined> {
    return this.codeAnalysisReports.get(id);
  }

  async getCodeAnalysisReportsByRepository(repositoryId: string): Promise<CodeAnalysisReport[]> {
    return Array.from(this.codeAnalysisReports.values())
      .filter(report => report.repositoryId === repositoryId);
  }

  async createCodeAnalysisReport(report: InsertCodeAnalysisReport): Promise<CodeAnalysisReport> {
    const newReport: CodeAnalysisReport = {
      id: randomUUID(),
      ...report,
      repositoryId: report.repositoryId || null,
      issues: report.issues || [],
      recommendations: report.recommendations || [],
      severity: report.severity || "info",
      autoFixable: report.autoFixable ?? false,
      fixSuggestions: report.fixSuggestions || null,
      createdAt: new Date()
    };
    this.codeAnalysisReports.set(newReport.id, newReport);
    return newReport;
  }

  // Watch collection operations
  async getWatch(id: string): Promise<Watch | undefined> {
    return this.watches.get(id);
  }

  async getWatchByReference(reference: string): Promise<Watch | undefined> {
    return Array.from(this.watches.values())
      .find(watch => watch.reference === reference);
  }

  async getAllWatches(): Promise<Watch[]> {
    return Array.from(this.watches.values())
      .sort((a, b) => a.reference.localeCompare(b.reference));
  }

  async getAvailableWatches(): Promise<Watch[]> {
    return Array.from(this.watches.values())
      .filter(watch => watch.available)
      .sort((a, b) => a.reference.localeCompare(b.reference));
  }

  async getWatchesByCollection(collectionName: string): Promise<Watch[]> {
    return Array.from(this.watches.values())
      .filter(watch => watch.collectionName && 
               watch.collectionName.toLowerCase().includes(collectionName.toLowerCase()))
      .sort((a, b) => a.reference.localeCompare(b.reference));
  }

  async getWatchesByPriceRange(minPrice: number, maxPrice: number): Promise<Watch[]> {
    return Array.from(this.watches.values())
      .filter(watch => watch.price >= minPrice && watch.price <= maxPrice)
      .sort((a, b) => a.price - b.price);
  }

  async searchWatches(query: string): Promise<Watch[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.watches.values())
      .filter(watch => 
        watch.reference.toLowerCase().includes(searchTerm) ||
        (watch.collectionName && watch.collectionName.toLowerCase().includes(searchTerm)) ||
        (watch.model && watch.model.toLowerCase().includes(searchTerm)) ||
        (watch.description && watch.description.toLowerCase().includes(searchTerm)) ||
        (watch.tags && watch.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      )
      .sort((a, b) => {
        // Prioritize reference matches, then collection matches
        const aRefMatch = a.reference.toLowerCase().includes(searchTerm);
        const bRefMatch = b.reference.toLowerCase().includes(searchTerm);
        if (aRefMatch && !bRefMatch) return -1;
        if (!aRefMatch && bRefMatch) return 1;
        return a.reference.localeCompare(b.reference);
      });
  }

  async createWatch(watch: InsertWatch): Promise<Watch> {
    const newWatch: Watch = {
      id: randomUUID(),
      ...watch,
      collectionName: watch.collectionName || null,
      model: watch.model || null,
      description: watch.description || null,
      specifications: watch.specifications || null,
      images: watch.images || [],
      tags: watch.tags || [],
      popularity: watch.popularity || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.watches.set(newWatch.id, newWatch);
    return newWatch;
  }

  async updateWatch(id: string, updates: Partial<Watch>): Promise<Watch> {
    const watch = this.watches.get(id);
    if (!watch) {
      throw new Error("Watch not found");
    }

    const updatedWatch = {
      ...watch,
      ...updates,
      updatedAt: new Date()
    };

    this.watches.set(id, updatedWatch);
    return updatedWatch;
  }

  async deleteWatch(id: string): Promise<boolean> {
    return this.watches.delete(id);
  }

  async incrementWatchPopularity(id: string): Promise<void> {
    const watch = this.watches.get(id);
    if (watch) {
      watch.popularity = (watch.popularity || 0) + 1;
      watch.updatedAt = new Date();
      this.watches.set(id, watch);
    }
  }

  // FAQ/Knowledge Base operations
  async getFaq(id: string): Promise<Faq | undefined> {
    return this.faqs.get(id);
  }

  async getAllFaqs(): Promise<Faq[]> {
    return Array.from(this.faqs.values())
      .filter(faq => faq.isActive)
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.usageCount - a.usageCount;
      });
  }

  async getFaqsByCategory(category: string): Promise<Faq[]> {
    return Array.from(this.faqs.values())
      .filter(faq => faq.category === category && faq.isActive)
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.usageCount - a.usageCount;
      });
  }

  async searchFaqs(query: string): Promise<Faq[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.faqs.values())
      .filter(faq => 
        faq.isActive && (
          faq.question.toLowerCase().includes(searchTerm) ||
          faq.answer.toLowerCase().includes(searchTerm) ||
          (faq.context && faq.context.toLowerCase().includes(searchTerm)) ||
          (faq.keywords && faq.keywords.some(kw => kw.toLowerCase().includes(searchTerm)))
        )
      )
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.usageCount - a.usageCount;
      });
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const id = randomUUID();
    const newFaq: Faq = {
      ...faq,
      id,
      usageCount: faq.usageCount || 0,
      isActive: faq.isActive ?? true,
      priority: faq.priority || 0,
      lastUsed: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.faqs.set(id, newFaq);
    return newFaq;
  }

  async updateFaq(id: string, updates: Partial<Faq>): Promise<Faq> {
    const faq = this.faqs.get(id);
    if (!faq) throw new Error('FAQ not found');
    
    const updatedFaq = {
      ...faq,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    
    this.faqs.set(id, updatedFaq);
    return updatedFaq;
  }

  async deleteFaq(id: string): Promise<boolean> {
    return this.faqs.delete(id);
  }

  async incrementFaqUsage(id: string): Promise<Faq> {
    const faq = this.faqs.get(id);
    if (!faq) throw new Error('FAQ not found');
    
    faq.usageCount = (faq.usageCount || 0) + 1;
    faq.lastUsed = new Date();
    this.faqs.set(id, faq);
    return faq;
  }

  // Activity Log operations (for real-time dashboard) - MemStorage stubs
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const id = Date.now();
    const newActivity: ActivityLog = {
      ...activity,
      id,
      createdAt: new Date(),
    };
    return newActivity;
  }

  async getRecentActivities(limit: number = 50): Promise<ActivityLog[]> {
    return [];
  }

  async getActivitiesByEntity(entityType: string, entityId: string): Promise<ActivityLog[]> {
    return [];
  }
}

// DatabaseStorage implementation using Drizzle ORM for persistent PostgreSQL storage
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Client operations - CRITICAL for Excel import and Telegram bot
  async getClient(id: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0];
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClientsByStatus(status: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.status, status));
  }

  async getClientsByPriority(priority: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.priority, priority));
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    // Support provided IDs for Excel import, otherwise generate UUID
    const clientData = {
      ...insertClient,
      id: insertClient.id || randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.insert(clients).values(clientData as any).returning();
    return result[0];
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const result = await db.update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Client not found');
    }
    return result[0];
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }

  // Follow-up operations - CRITICAL for reminders
  async getFollowUp(id: string): Promise<FollowUp | undefined> {
    const result = await db.select().from(followUps).where(eq(followUps.id, id)).limit(1);
    return result[0];
  }

  async getFollowUpsByClient(clientId: string): Promise<FollowUp[]> {
    return await db.select().from(followUps).where(eq(followUps.clientId, clientId));
  }

  async getPendingFollowUps(): Promise<FollowUp[]> {
    return await db.select().from(followUps)
      .where(and(
        eq(followUps.completed, false),
        eq(followUps.reminderState, 'scheduled')
      ));
  }

  async createFollowUp(followUp: InsertFollowUp): Promise<FollowUp> {
    const followUpData = {
      ...followUp,
      id: randomUUID(),
      createdAt: new Date(),
    };
    const result = await db.insert(followUps).values(followUpData as any).returning();
    return result[0];
  }

  async updateFollowUp(id: string, updates: Partial<FollowUp>): Promise<FollowUp> {
    const result = await db.update(followUps)
      .set(updates)
      .where(eq(followUps.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Follow-up not found');
    }
    return result[0];
  }

  // Activity operations - CRITICAL for audit trail
  async getActivity(id: string): Promise<Activity | undefined> {
    const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
    return result[0];
  }

  async getActivitiesByClient(clientId: string): Promise<Activity[]> {
    return await db.select().from(activities)
      .where(eq(activities.clientId, clientId))
      .orderBy(desc(activities.createdAt));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const activityData = {
      ...activity,
      id: randomUUID(),
      createdAt: new Date(),
    };
    const result = await db.insert(activities).values(activityData as any).returning();
    return result[0];
  }

  async logStatusChange(clientId: string, actorId: string | undefined, from: string, to: string): Promise<Activity> {
    return this.createActivity({
      clientId,
      actorId: actorId || null,
      type: 'status_changed',
      payload: { from, to, field: 'status' },
    });
  }

  async logFieldEdit(clientId: string, actorId: string | undefined, field: string, from: any, to: any): Promise<Activity> {
    return this.createActivity({
      clientId,
      actorId: actorId || null,
      type: 'field_edited',
      payload: { field, from, to },
    });
  }

  async logFollowUpAction(clientId: string, actorId: string | undefined, actionType: string, followUpId: string, details?: any): Promise<Activity> {
    return this.createActivity({
      clientId,
      actorId: actorId || null,
      type: actionType as any,
      payload: { followUpId, ...details },
    });
  }

  // Remaining methods - placeholder implementations for now
  async getConversation(id: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return result[0];
  }

  async getConversationsByClient(clientId: string): Promise<Conversation[]> {
    return await db.select().from(conversations).where(eq(conversations.clientId, clientId));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const convData = { ...conversation, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    const result = await db.insert(conversations).values(convData as any).returning();
    return result[0];
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const result = await db.update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    if (result.length === 0) throw new Error('Conversation not found');
    return result[0];
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return result[0];
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId));
  }

  async getRecentMessages(limit: number = 50): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.timestamp)).limit(limit);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const msgData = { ...message, id: randomUUID(), timestamp: new Date() };
    const result = await db.insert(messages).values(msgData as any).returning();
    return result[0];
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
    const result = await db.update(messages).set(updates).where(eq(messages.id, id)).returning();
    if (result.length === 0) throw new Error('Message not found');
    return result[0];
  }

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    return result[0];
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.clientId, clientId));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const apptData = { ...appointment, id: randomUUID(), createdAt: new Date() };
    const result = await db.insert(appointments).values(apptData as any).returning();
    return result[0];
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const result = await db.update(appointments).set(updates).where(eq(appointments.id, id)).returning();
    if (result.length === 0) throw new Error('Appointment not found');
    return result[0];
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    return result.length > 0;
  }

  async getInteraction(id: string): Promise<Interaction | undefined> {
    const result = await db.select().from(interactions).where(eq(interactions.id, id)).limit(1);
    return result[0];
  }

  async getInteractionsByClient(clientId: string): Promise<Interaction[]> {
    return await db.select().from(interactions).where(eq(interactions.clientId, clientId));
  }

  async createInteraction(interaction: InsertInteraction): Promise<Interaction> {
    const intData = { ...interaction, id: randomUUID(), timestamp: new Date() };
    const result = await db.insert(interactions).values(intData as any).returning();
    return result[0];
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return result[0];
  }

  async getDocumentsByClient(clientId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.clientId, clientId));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const docData = { ...document, id: randomUUID(), createdAt: new Date() };
    const result = await db.insert(documents).values(docData as any).returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  async getTripPlan(id: string): Promise<TripPlan | undefined> {
    const result = await db.select().from(tripPlans).where(eq(tripPlans.id, id)).limit(1);
    return result[0];
  }

  async getTripPlansByClient(clientId: string): Promise<TripPlan[]> {
    return await db.select().from(tripPlans).where(eq(tripPlans.clientId, clientId));
  }

  async createTripPlan(tripPlan: InsertTripPlan): Promise<TripPlan> {
    const tripData = { ...tripPlan, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    const result = await db.insert(tripPlans).values(tripData as any).returning();
    return result[0];
  }

  async updateTripPlan(id: string, updates: Partial<TripPlan>): Promise<TripPlan> {
    const result = await db.update(tripPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tripPlans.id, id))
      .returning();
    if (result.length === 0) throw new Error('Trip plan not found');
    return result[0];
  }

  async getAiConversation(id: string): Promise<AiConversation | undefined> {
    const result = await db.select().from(aiConversations).where(eq(aiConversations.id, id)).limit(1);
    return result[0];
  }

  async getAiConversationsByUser(userId: string): Promise<AiConversation[]> {
    return await db.select().from(aiConversations).where(eq(aiConversations.userId, userId));
  }

  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const convData = { ...conversation, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    const result = await db.insert(aiConversations).values(convData as any).returning();
    return result[0];
  }

  async updateAiConversation(id: string, updates: Partial<AiConversation>): Promise<AiConversation> {
    const result = await db.update(aiConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiConversations.id, id))
      .returning();
    if (result.length === 0) throw new Error('AI conversation not found');
    return result[0];
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    return result[0];
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  async setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    // Upsert logic
    const existing = await this.getSystemSetting(setting.key);
    if (existing) {
      const result = await db.update(systemSettings)
        .set({ value: setting.value, updatedAt: new Date() })
        .where(eq(systemSettings.key, setting.key))
        .returning();
      return result[0];
    } else {
      const settingData = { ...setting, id: randomUUID(), updatedAt: new Date() };
      const result = await db.insert(systemSettings).values(settingData as any).returning();
      return result[0];
    }
  }

  async getDashboardStats(): Promise<any> {
    const { getDashboardStats: getStats } = await import('./storage/stats');
    return await getStats();
  }

  async getClientAnalytics(clientId: string): Promise<any> {
    // Placeholder - implement with client-specific aggregations
    return {};
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const result = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
    return result[0];
  }

  async getDealsByClient(clientId: string): Promise<Deal[]> {
    return await db.select().from(deals).where(eq(deals.clientId, clientId));
  }

  async getAllDeals(): Promise<Deal[]> {
    return await db.select().from(deals);
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const dealData = { ...deal, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    const result = await db.insert(deals).values(dealData as any).returning();
    return result[0];
  }

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
    const result = await db.update(deals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    if (result.length === 0) throw new Error('Deal not found');
    return result[0];
  }

  async deleteDeal(id: string): Promise<boolean> {
    const result = await db.delete(deals).where(eq(deals.id, id)).returning();
    return result.length > 0;
  }

  async getSalesForecast(id: string): Promise<SalesForecast | undefined> {
    const result = await db.select().from(salesForecasts).where(eq(salesForecasts.id, id)).limit(1);
    return result[0];
  }

  async getAllSalesForecasts(): Promise<SalesForecast[]> {
    return await db.select().from(salesForecasts);
  }

  async createSalesForecast(forecast: InsertSalesForecast): Promise<SalesForecast> {
    const forecastData = { ...forecast, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    const result = await db.insert(salesForecasts).values(forecastData as any).returning();
    return result[0];
  }

  async updateSalesForecast(id: string, updates: Partial<SalesForecast>): Promise<SalesForecast> {
    const result = await db.update(salesForecasts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(salesForecasts.id, id))
      .returning();
    if (result.length === 0) throw new Error('Sales forecast not found');
    return result[0];
  }

  async getLeadScoringHistory(clientId: string): Promise<LeadScoringHistory[]> {
    return await db.select().from(leadScoringHistory).where(eq(leadScoringHistory.clientId, clientId));
  }

  async createLeadScoringEntry(entry: InsertLeadScoringHistory): Promise<LeadScoringHistory> {
    const entryData = { ...entry, id: randomUUID(), createdAt: new Date() };
    const result = await db.insert(leadScoringHistory).values(entryData as any).returning();
    return result[0];
  }

  async updateClientLeadScore(clientId: string, score: number, factors: any, confidence: number): Promise<Client> {
    // Update client score and create history entry
    await this.createLeadScoringEntry({
      clientId,
      score,
      factors,
      confidence,
      triggerEvent: 'auto_update',
      previousScore: null,
      scoreChange: null,
    });
    
    const result = await db.update(clients)
      .set({ leadScore: score, lastScoreUpdate: new Date() })
      .where(eq(clients.id, clientId))
      .returning();
    
    if (result.length === 0) throw new Error('Client not found');
    return result[0];
  }

  async getGithubRepository(id: string): Promise<GithubRepository | undefined> {
    const result = await db.select().from(githubRepositories).where(eq(githubRepositories.id, id)).limit(1);
    return result[0];
  }

  async getAllGithubRepositories(): Promise<GithubRepository[]> {
    return await db.select().from(githubRepositories);
  }

  async createGithubRepository(repository: InsertGithubRepository): Promise<GithubRepository> {
    const repoData = { ...repository, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    const result = await db.insert(githubRepositories).values(repoData as any).returning();
    return result[0];
  }

  async updateGithubRepository(id: string, updates: Partial<GithubRepository>): Promise<GithubRepository> {
    const result = await db.update(githubRepositories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(githubRepositories.id, id))
      .returning();
    if (result.length === 0) throw new Error('GitHub repository not found');
    return result[0];
  }

  async deleteGithubRepository(id: string): Promise<boolean> {
    const result = await db.delete(githubRepositories).where(eq(githubRepositories.id, id)).returning();
    return result.length > 0;
  }

  async getSelfEditingHistory(repositoryId: string): Promise<SelfEditingHistory[]> {
    return await db.select().from(selfEditingHistory).where(eq(selfEditingHistory.repositoryId, repositoryId));
  }

  async getSelfEditingEntry(id: string): Promise<SelfEditingHistory | undefined> {
    const result = await db.select().from(selfEditingHistory).where(eq(selfEditingHistory.id, id)).limit(1);
    return result[0];
  }

  async getAllSelfEditingHistory(): Promise<SelfEditingHistory[]> {
    return await db.select().from(selfEditingHistory);
  }

  async createSelfEditingEntry(entry: InsertSelfEditingHistory): Promise<SelfEditingHistory> {
    const entryData = { ...entry, id: randomUUID(), createdAt: new Date() };
    const result = await db.insert(selfEditingHistory).values(entryData as any).returning();
    return result[0];
  }

  async updateSelfEditingEntry(id: string, updates: Partial<SelfEditingHistory>): Promise<SelfEditingHistory> {
    const result = await db.update(selfEditingHistory)
      .set(updates)
      .where(eq(selfEditingHistory.id, id))
      .returning();
    if (result.length === 0) throw new Error('Self-editing entry not found');
    return result[0];
  }

  async getAiLearningDocument(id: string): Promise<AiLearningDocument | undefined> {
    const result = await db.select().from(aiLearningDocuments).where(eq(aiLearningDocuments.id, id)).limit(1);
    return result[0];
  }

  async getAllAiLearningDocuments(): Promise<AiLearningDocument[]> {
    return await db.select().from(aiLearningDocuments);
  }

  async getAiLearningDocumentsByCategory(category: string): Promise<AiLearningDocument[]> {
    return await db.select().from(aiLearningDocuments).where(eq(aiLearningDocuments.category, category));
  }

  async createAiLearningDocument(document: InsertAiLearningDocument): Promise<AiLearningDocument> {
    const docData = { ...document, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    const result = await db.insert(aiLearningDocuments).values(docData as any).returning();
    return result[0];
  }

  async updateAiLearningDocument(id: string, updates: Partial<AiLearningDocument>): Promise<AiLearningDocument> {
    const result = await db.update(aiLearningDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiLearningDocuments.id, id))
      .returning();
    if (result.length === 0) throw new Error('AI learning document not found');
    return result[0];
  }

  async deleteAiLearningDocument(id: string): Promise<boolean> {
    const result = await db.delete(aiLearningDocuments).where(eq(aiLearningDocuments.id, id)).returning();
    return result.length > 0;
  }

  async getCodeAnalysisReport(id: string): Promise<CodeAnalysisReport | undefined> {
    const result = await db.select().from(codeAnalysisReports).where(eq(codeAnalysisReports.id, id)).limit(1);
    return result[0];
  }

  async getCodeAnalysisReportsByRepository(repositoryId: string): Promise<CodeAnalysisReport[]> {
    return await db.select().from(codeAnalysisReports).where(eq(codeAnalysisReports.repositoryId, repositoryId));
  }

  async createCodeAnalysisReport(report: InsertCodeAnalysisReport): Promise<CodeAnalysisReport> {
    const reportData = { ...report, id: randomUUID(), createdAt: new Date() };
    const result = await db.insert(codeAnalysisReports).values(reportData as any).returning();
    return result[0];
  }

  async getWatch(id: string): Promise<Watch | undefined> {
    const result = await db.select().from(watchCollection).where(eq(watchCollection.id, id)).limit(1);
    return result[0];
  }

  async getWatchByReference(reference: string): Promise<Watch | undefined> {
    const result = await db.select().from(watchCollection).where(eq(watchCollection.reference, reference)).limit(1);
    return result[0];
  }

  async getAllWatches(): Promise<Watch[]> {
    return await db.select().from(watchCollection);
  }

  async getAvailableWatches(): Promise<Watch[]> {
    return await db.select().from(watchCollection).where(eq(watchCollection.available, true));
  }

  async getWatchesByCollection(collectionName: string): Promise<Watch[]> {
    return await db.select().from(watchCollection).where(eq(watchCollection.collectionName, collectionName));
  }

  async getWatchesByPriceRange(minPrice: number, maxPrice: number): Promise<Watch[]> {
    return await db.select().from(watchCollection)
      .where(and(
        drizzleSql`${watchCollection.price} >= ${minPrice}`,
        drizzleSql`${watchCollection.price} <= ${maxPrice}`
      ));
  }

  async searchWatches(query: string): Promise<Watch[]> {
    return await db.select().from(watchCollection)
      .where(or(
        drizzleSql`${watchCollection.reference} ILIKE ${'%' + query + '%'}`,
        drizzleSql`${watchCollection.model} ILIKE ${'%' + query + '%'}`,
        drizzleSql`${watchCollection.description} ILIKE ${'%' + query + '%'}`
      ));
  }

  async createWatch(watch: InsertWatch): Promise<Watch> {
    const watchData = { ...watch, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    const result = await db.insert(watchCollection).values(watchData as any).returning();
    return result[0];
  }

  async updateWatch(id: string, updates: Partial<Watch>): Promise<Watch> {
    const result = await db.update(watchCollection)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(watchCollection.id, id))
      .returning();
    if (result.length === 0) throw new Error('Watch not found');
    return result[0];
  }

  async deleteWatch(id: string): Promise<boolean> {
    const result = await db.delete(watchCollection).where(eq(watchCollection.id, id)).returning();
    return result.length > 0;
  }

  async incrementWatchPopularity(id: string): Promise<void> {
    await db.update(watchCollection)
      .set({ popularity: drizzleSql`${watchCollection.popularity} + 1` })
      .where(eq(watchCollection.id, id));
  }

  // FAQ/Knowledge Base operations
  async getFaq(id: string): Promise<Faq | undefined> {
    const result = await db.select().from(faqDatabase).where(eq(faqDatabase.id, id)).limit(1);
    return result[0];
  }

  async getAllFaqs(): Promise<Faq[]> {
    return await db.select().from(faqDatabase)
      .where(eq(faqDatabase.isActive, true))
      .orderBy(desc(faqDatabase.priority), desc(faqDatabase.usageCount));
  }

  async getFaqsByCategory(category: string): Promise<Faq[]> {
    return await db.select().from(faqDatabase)
      .where(and(
        eq(faqDatabase.category, category),
        eq(faqDatabase.isActive, true)
      ))
      .orderBy(desc(faqDatabase.priority), desc(faqDatabase.usageCount));
  }

  async searchFaqs(query: string): Promise<Faq[]> {
    return await db.select().from(faqDatabase)
      .where(and(
        eq(faqDatabase.isActive, true),
        or(
          drizzleSql`${faqDatabase.question} ILIKE ${'%' + query + '%'}`,
          drizzleSql`${faqDatabase.answer} ILIKE ${'%' + query + '%'}`,
          drizzleSql`${faqDatabase.context} ILIKE ${'%' + query + '%'}`,
          drizzleSql`array_to_string(${faqDatabase.keywords}, ' ') ILIKE ${'%' + query + '%'}`
        )
      ))
      .orderBy(desc(faqDatabase.priority), desc(faqDatabase.usageCount));
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const faqData = { ...faq, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    const result = await db.insert(faqDatabase).values(faqData as any).returning();
    return result[0];
  }

  async updateFaq(id: string, updates: Partial<Faq>): Promise<Faq> {
    const result = await db.update(faqDatabase)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(faqDatabase.id, id))
      .returning();
    if (result.length === 0) throw new Error('FAQ not found');
    return result[0];
  }

  async deleteFaq(id: string): Promise<boolean> {
    const result = await db.delete(faqDatabase).where(eq(faqDatabase.id, id)).returning();
    return result.length > 0;
  }

  async incrementFaqUsage(id: string): Promise<Faq> {
    const result = await db.update(faqDatabase)
      .set({ 
        usageCount: drizzleSql`${faqDatabase.usageCount} + 1`,
        lastUsed: new Date()
      })
      .where(eq(faqDatabase.id, id))
      .returning();
    if (result.length === 0) throw new Error('FAQ not found');
    return result[0];
  }

  // Activity Log operations (for real-time dashboard)
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLog).values(activity).returning();
    return result[0];
  }

  async getRecentActivities(limit: number = 50): Promise<ActivityLog[]> {
    return await db.select().from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  async getActivitiesByEntity(entityType: string, entityId: string): Promise<ActivityLog[]> {
    return await db.select().from(activityLog)
      .where(and(
        eq(activityLog.entityType, entityType),
        eq(activityLog.entityId, entityId)
      ))
      .orderBy(desc(activityLog.createdAt));
  }
}

// Switch to DatabaseStorage for persistent storage
export const storage = new DatabaseStorage();
