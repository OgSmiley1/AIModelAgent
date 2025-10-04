import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for system authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Watch Collection table for luxury watch catalog
export const watchCollection = pgTable("watch_collection", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reference: text("reference").notNull().unique(), // Watch reference number
  collectionName: text("collection_name"), // Collection series name
  brand: text("brand").default("Vacheron Constantin"),
  model: text("model"),
  description: text("description"),
  price: real("price").default(0),
  currency: text("currency").default("USD"),
  available: boolean("available").default(false),
  stock: text("stock"),
  category: text("category").default("Luxury Watch"),
  specifications: jsonb("specifications"), // Technical specs, materials, etc.
  images: text("images").array(), // Array of image URLs
  tags: text("tags").array(), // Searchable tags
  popularity: integer("popularity").default(0), // Number of client interests
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table for managing business contacts
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  whatsappNumber: text("whatsapp_number"),
  status: text("status").default("prospect"), // prospect, active, inactive, vip, requested_callback, changed_mind, confirmed, sold, hesitant, shared_with_boutique
  statusSince: timestamp("status_since").defaultNow(), // For status duration counter
  boutiqueSalesAssociateName: text("boutique_sales_associate_name"), // Required when status = shared_with_boutique
  assignedSalespersonId: varchar("assigned_salesperson_id").references(() => users.id), // Assigned sales associate
  priority: text("priority").default("medium"), // low, medium, high, critical, vip
  interests: text("interests"),
  preferences: jsonb("preferences"),
  behaviorPatterns: jsonb("behavior_patterns"),
  lastInteraction: timestamp("last_interaction"),
  lastTouchChannel: text("last_touch_channel"), // whatsapp, call, email, in_boutique, other
  nextTouchChannel: text("next_touch_channel"), // whatsapp, call, email, in_boutique, other
  totalInteractions: integer("total_interactions").default(0),
  conversionStage: text("conversion_stage").default("awareness"), // awareness, interest, consideration, intent, purchase
  lifetimeValue: real("lifetime_value").default(0),
  sentimentScore: real("sentiment_score").default(0),
  leadScore: real("lead_score").default(0), // AI-calculated lead score 0-100
  conversionProbability: real("conversion_probability").default(0), // Predicted conversion probability 0-1
  predictedValue: real("predicted_value").default(0), // Predicted deal value
  engagementLevel: text("engagement_level").default("low"), // low, medium, high, very_high
  buyingSignals: text("buying_signals").array(), // Array of detected buying signals
  riskFactors: text("risk_factors").array(), // Array of risk factors
  nextBestAction: text("next_best_action"), // AI-suggested next action
  location: text("location"),
  budget: real("budget"),
  timeframe: text("timeframe"), // immediate, short_term, medium_term, long_term
  decisionMaker: boolean("decision_maker").default(false),
  notes: text("notes"),
  tags: text("tags").array(),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  lastScoreUpdate: timestamp("last_score_update").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversations table for storing WhatsApp and other conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  platform: text("platform").default("whatsapp"), // whatsapp, email, phone, chat
  messageCount: integer("message_count").default(0),
  lastMessageAt: timestamp("last_message_at"),
  status: text("status").default("active"), // active, closed, archived
  summary: text("summary"),
  sentiment: text("sentiment").default("neutral"), // positive, neutral, negative
  sentimentScore: real("sentiment_score").default(0),
  urgency: text("urgency").default("medium"), // low, medium, high, urgent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table for individual messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id),
  clientId: varchar("client_id").references(() => clients.id),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, image, document, audio, video
  direction: text("direction").notNull(), // incoming, outgoing
  platform: text("platform").default("whatsapp"),
  sentiment: text("sentiment"),
  sentimentScore: real("sentiment_score"),
  analyzed: boolean("analyzed").default(false),
  autoGenerated: boolean("auto_generated").default(false),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Follow-ups table for managing reminders and scheduled actions
export const followUps = pgTable("follow_ups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  type: text("type").notNull(), // reminder, call, email, meeting, task
  channel: text("channel").default("call"), // whatsapp, call, email, in_boutique, other
  title: text("title").notNull(),
  description: text("description"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  reminderState: text("reminder_state").default("scheduled"), // scheduled, snoozed, completed, dismissed
  snoozedUntil: timestamp("snoozed_until"), // When snoozed, reschedule to this time
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  priority: text("priority").default("medium"),
  automatedAction: text("automated_action"), // send_message, create_task, notify_team
  createdBy: varchar("created_by").references(() => users.id), // Who created this follow-up
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Interactions table for tracking all client touchpoints
export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  type: text("type").notNull(), // message, call, email, meeting, document_share, trip_planning
  summary: text("summary"),
  outcome: text("outcome"), // positive, neutral, negative, follow_up_needed
  sentiment: text("sentiment"),
  duration: integer("duration"), // in minutes
  value: real("value"), // business value score
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Activities table - immutable audit trail for all client actions
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  actorId: varchar("actor_id").references(() => users.id), // Who performed the action
  type: text("type").notNull(), // status_changed, field_edited, follow_up_created, reminder_fired, reminder_snoozed, reminder_dismissed, follow_up_completed, auto_ingest, system
  payload: jsonb("payload").notNull(), // Details: old_value, new_value, field, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents table for file management
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  filePath: text("file_path").notNull(),
  category: text("category"), // contract, proposal, invoice, report, image
  tags: text("tags").array(),
  analyzed: boolean("analyzed").default(false),
  analysisResults: jsonb("analysis_results"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip plans table for travel planning feature
export const tripPlans = pgTable("trip_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  title: text("title").notNull(),
  destination: text("destination").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").default("planning"), // planning, confirmed, completed, cancelled
  budget: real("budget"),
  itinerary: jsonb("itinerary"),
  preferences: jsonb("preferences"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI conversations table for chat history
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title"),
  messages: jsonb("messages").notNull(),
  context: jsonb("context"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System settings table
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  category: text("category").default("general"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales forecasting table
export const salesForecasts = pgTable("sales_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  period: text("period").notNull(), // weekly, monthly, quarterly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  predictedRevenue: real("predicted_revenue").notNull(),
  predictedDeals: integer("predicted_deals").notNull(),
  confidence: real("confidence").notNull(), // 0-1
  actualRevenue: real("actual_revenue").default(0),
  actualDeals: integer("actual_deals").default(0),
  factors: jsonb("factors"), // Factors influencing the forecast
  methodology: text("methodology").default("ai_model"), // ai_model, historical, pipeline
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead scoring history table
export const leadScoringHistory = pgTable("lead_scoring_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  score: real("score").notNull(),
  factors: jsonb("factors").notNull(), // Detailed scoring factors
  triggerEvent: text("trigger_event"), // What caused the score update
  previousScore: real("previous_score"),
  scoreChange: real("score_change"),
  confidence: real("confidence").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Deals/opportunities table
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  title: text("title").notNull(),
  description: text("description"),
  value: real("value").notNull(),
  currency: text("currency").default("USD"),
  stage: text("stage").default("prospecting"), // prospecting, qualification, proposal, negotiation, closed_won, closed_lost
  probability: real("probability").default(0.5), // 0-1
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  source: text("source"), // whatsapp, email, referral, cold_outreach
  assignedTo: varchar("assigned_to").references(() => users.id),
  competitorInfo: text("competitor_info"),
  nextSteps: text("next_steps"),
  lostReason: text("lost_reason"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertFollowUpSchema = createInsertSchema(followUps).omit({
  id: true,
  createdAt: true,
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  timestamp: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertTripPlanSchema = createInsertSchema(tripPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertSalesForecastSchema = createInsertSchema(salesForecasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadScoringHistorySchema = createInsertSchema(leadScoringHistory).omit({
  id: true,
  createdAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// GitHub repository management table
export const githubRepositories = pgTable("github_repositories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(), // owner/repo
  url: text("url").notNull(),
  description: text("description"),
  defaultBranch: text("default_branch").default("main"),
  isActive: boolean("is_active").default(true),
  accessToken: text("access_token"), // Encrypted GitHub access token
  webhookSecret: text("webhook_secret"),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Self-editing history table for tracking autonomous code changes
export const selfEditingHistory = pgTable("self_editing_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").references(() => githubRepositories.id),
  commitHash: text("commit_hash"),
  branchName: text("branch_name").default("main"),
  editType: text("edit_type").notNull(), // bug_fix, feature_addition, optimization, refactor, security_patch
  description: text("description").notNull(),
  filesModified: text("files_modified").array(),
  changesDetails: jsonb("changes_details"), // Detailed breakdown of changes
  triggerEvent: text("trigger_event"), // error_detected, performance_issue, security_alert, scheduled_maintenance
  aiAnalysis: jsonb("ai_analysis"), // AI reasoning for the changes
  status: text("status").default("pending"), // pending, applied, failed, reverted
  riskLevel: text("risk_level").default("low"), // low, medium, high, critical
  testsPassed: boolean("tests_passed").default(false),
  reviewRequired: boolean("review_required").default(true),
  autoApproved: boolean("auto_approved").default(false),
  rollbackPlan: jsonb("rollback_plan"),
  createdAt: timestamp("created_at").defaultNow(),
  appliedAt: timestamp("applied_at"),
});

// AI learning documents table for knowledge base
export const aiLearningDocuments = pgTable("ai_learning_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(), // pdf, txt, md, docx, json
  fileSize: integer("file_size"),
  filePath: text("file_path").notNull(),
  content: text("content"), // Extracted text content
  vectorEmbedding: text("vector_embedding"), // For semantic search
  category: text("category").default("general"), // technical, business, procedures, policies
  topics: text("topics").array(), // Extracted topics/keywords
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  learningContext: text("learning_context"), // How this document should be used for AI learning
  priority: text("priority").default("medium"), // low, medium, high, critical
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Code analysis reports table
export const codeAnalysisReports = pgTable("code_analysis_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").references(() => githubRepositories.id),
  analysisType: text("analysis_type").notNull(), // security, performance, code_quality, dependencies
  results: jsonb("results").notNull(),
  issues: jsonb("issues").array(), // Array of identified issues
  recommendations: jsonb("recommendations").array(), // AI-generated recommendations
  severity: text("severity").default("info"), // info, warning, error, critical
  autoFixable: boolean("auto_fixable").default(false),
  fixSuggestions: jsonb("fix_suggestions"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertGithubRepositorySchema = createInsertSchema(githubRepositories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSelfEditingHistorySchema = createInsertSchema(selfEditingHistory).omit({
  id: true,
  createdAt: true,
  appliedAt: true,
});

export const insertAiLearningDocumentSchema = createInsertSchema(aiLearningDocuments).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertCodeAnalysisReportSchema = createInsertSchema(codeAnalysisReports).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertFollowUp = z.infer<typeof insertFollowUpSchema>;
export type FollowUp = typeof followUps.$inferSelect;

export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertTripPlan = z.infer<typeof insertTripPlanSchema>;
export type TripPlan = typeof tripPlans.$inferSelect;

export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

export type InsertSalesForecast = z.infer<typeof insertSalesForecastSchema>;
export type SalesForecast = typeof salesForecasts.$inferSelect;

export type InsertLeadScoringHistory = z.infer<typeof insertLeadScoringHistorySchema>;
export type LeadScoringHistory = typeof leadScoringHistory.$inferSelect;

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

export type InsertGithubRepository = z.infer<typeof insertGithubRepositorySchema>;
export type GithubRepository = typeof githubRepositories.$inferSelect;

export type InsertSelfEditingHistory = z.infer<typeof insertSelfEditingHistorySchema>;
export type SelfEditingHistory = typeof selfEditingHistory.$inferSelect;

export type InsertAiLearningDocument = z.infer<typeof insertAiLearningDocumentSchema>;
export type AiLearningDocument = typeof aiLearningDocuments.$inferSelect;

export type InsertCodeAnalysisReport = z.infer<typeof insertCodeAnalysisReportSchema>;
export type CodeAnalysisReport = typeof codeAnalysisReports.$inferSelect;

// Watch Collection schema
export const insertWatchSchema = createInsertSchema(watchCollection).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWatch = z.infer<typeof insertWatchSchema>;
export type Watch = typeof watchCollection.$inferSelect;
