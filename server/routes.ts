import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { whatsAppService } from "./services/whatsapp";
import { aiAnalyzer } from "./services/ai-analyzer";
import { leadScoringService } from "./services/lead-scoring";
import { salesForecastingService } from "./services/sales-forecasting";
import { AIAgentService } from "./services/ai-agent";
import { AdvancedAI } from "./services/advanced-ai";
import { authenticateAdvancedAI, requireAdvancedAuth, AuthenticatedRequest } from "./middleware/auth";
import { initializeWebSocket } from "./services/websocket";
import { initializeGitHubService, getGitHubService } from "./services/github-service";
import { selfEditingService } from "./services/self-editing-service";
import { 
  insertClientSchema, 
  insertMessageSchema, 
  insertFollowUpSchema, 
  insertInteractionSchema,
  insertDocumentSchema,
  insertTripPlanSchema,
  insertAiConversationSchema,
  insertSystemSettingSchema,
  insertDealSchema,
  insertSalesForecastSchema,
  insertLeadScoringHistorySchema,
  insertGithubRepositorySchema,
  insertSelfEditingHistorySchema,
  insertAiLearningDocumentSchema,
  insertCodeAnalysisReportSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket
  const websocketService = initializeWebSocket(httpServer);

  // WhatsApp Webhook
  app.get("/webhook/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verified = whatsAppService.verifyWebhook(mode as string, token as string, challenge as string);
    if (verified) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
  });

  app.post("/webhook/whatsapp", async (req, res) => {
    try {
      const messages = whatsAppService.parseWebhookData(req.body);
      
      for (const msg of messages) {
        // Find or create client
        let client = (await storage.getAllClients()).find(c => c.whatsappNumber === msg.from);
        if (!client) {
          client = await storage.createClient({
            name: msg.fromName,
            whatsappNumber: msg.from,
            phone: msg.from,
            status: "prospect"
          });
        }

        // Find or create conversation
        let conversation = (await storage.getConversationsByClient(client.id))[0];
        if (!conversation) {
          conversation = await storage.createConversation({
            clientId: client.id,
            platform: "whatsapp"
          });
        }

        // Create message
        const message = await storage.createMessage({
          conversationId: conversation.id,
          clientId: client.id,
          content: msg.body,
          direction: "incoming",
          platform: "whatsapp"
        });

        // Analyze sentiment
        const sentimentAnalysis = aiAnalyzer.analyzeSentiment(msg.body);
        await storage.updateMessage(message.id, {
          sentiment: sentimentAnalysis.sentiment,
          sentimentScore: sentimentAnalysis.score,
          analyzed: true
        });

        // Update client sentiment
        await storage.updateClient(client.id, {
          sentimentScore: sentimentAnalysis.score
        });

        // Create interaction record
        await storage.createInteraction({
          clientId: client.id,
          type: "message",
          summary: msg.body.substring(0, 100),
          sentiment: sentimentAnalysis.sentiment,
          outcome: sentimentAnalysis.sentiment === 'negative' ? 'follow_up_needed' : 'neutral'
        });

        // Broadcast new message
        websocketService.broadcastNewMessage({
          id: message.id,
          clientName: client.name,
          clientPhone: msg.from,
          content: msg.body,
          sentiment: sentimentAnalysis.sentiment,
          timestamp: msg.timestamp,
          urgency: sentimentAnalysis.sentiment === 'negative' ? 'high' : 'medium'
        });

        // Generate follow-up suggestions if needed
        if (sentimentAnalysis.sentiment === 'negative' || sentimentAnalysis.score < -0.3) {
          const followUp = await storage.createFollowUp({
            clientId: client.id,
            type: "reminder",
            title: "Follow up on negative sentiment",
            description: `Client expressed negative sentiment in recent message: "${msg.body.substring(0, 100)}"`,
            scheduledFor: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            priority: "high"
          });

          websocketService.broadcastSystemAlert({
            type: "negative_sentiment",
            client: client.name,
            message: "Negative sentiment detected - immediate attention required"
          });
        }
      }

      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("WhatsApp webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Watch Collection API Routes
  app.get("/api/watches", async (req, res) => {
    try {
      const watches = await storage.getAllWatches();
      res.json(watches);
    } catch (error) {
      console.error("❌ Error fetching watches:", error);
      res.status(500).json({ error: "Failed to fetch watches" });
    }
  });

  app.get("/api/watches/available", async (req, res) => {
    try {
      const availableWatches = await storage.getAvailableWatches();
      res.json(availableWatches);
    } catch (error) {
      console.error("❌ Error fetching available watches:", error);
      res.status(500).json({ error: "Failed to fetch available watches" });
    }
  });

  app.get("/api/watches/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query required" });
      }
      const watches = await storage.searchWatches(q);
      res.json(watches);
    } catch (error) {
      console.error("❌ Error searching watches:", error);
      res.status(500).json({ error: "Failed to search watches" });
    }
  });

  app.get("/api/watches/reference/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const watch = await storage.getWatchByReference(reference);
      if (!watch) {
        return res.status(404).json({ error: "Watch not found" });
      }
      res.json(watch);
    } catch (error) {
      console.error("❌ Error fetching watch:", error);
      res.status(500).json({ error: "Failed to fetch watch" });
    }
  });

  app.post("/api/watches/import", async (req, res) => {
    try {
      console.log("📦 Starting watch collection import...");
      
      const watchesData = req.body;
      if (!Array.isArray(watchesData)) {
        return res.status(400).json({ error: "Expected array of watches" });
      }
      
      console.log(`📊 Importing ${watchesData.length} watches`);
      
      let importedCount = 0;
      let errorCount = 0;
      
      for (const watchData of watchesData) {
        try {
          await storage.createWatch({
            reference: watchData.reference,
            collectionName: watchData.collectionName || null,
            brand: watchData.brand || 'Vacheron Constantin',
            model: watchData.model || null,
            description: watchData.description || null,
            price: watchData.price || 0,
            currency: watchData.currency || 'USD',
            available: watchData.available || false,
            stock: watchData.stock || null,
            category: watchData.category || 'Luxury Watch',
            specifications: watchData.specifications || null,
            images: watchData.images || [],
            tags: watchData.tags || [],
            popularity: 0
          });
          
          importedCount++;
          
          if (importedCount % 50 === 0) {
            console.log(`📈 Imported ${importedCount}/${watchesData.length} watches...`);
          }
        } catch (error) {
          console.error(`❌ Error importing watch ${watchData.reference}:`, error);
          errorCount++;
        }
      }
      
      console.log(`✅ Import completed: ${importedCount} watches imported, ${errorCount} errors`);
      
      res.json({
        success: true,
        message: "Watch collection imported successfully",
        imported: importedCount,
        errors: errorCount,
        total: watchesData.length
      });
      
    } catch (error) {
      console.error("❌ Watch import error:", error);
      res.status(500).json({ error: "Import failed", details: error.message });
    }
  });

  // Generic Clients Import Route (for Maaz SHARIF data)
  app.post("/api/clients/import", async (req, res) => {
    try {
      console.log("🎯 Starting client import...");
      
      const clientsData = req.body;
      if (!Array.isArray(clientsData)) {
        return res.status(400).json({ error: "Expected array of clients" });
      }
      
      console.log(`📊 Importing ${clientsData.length} client records`);
      
      let importedCount = 0;
      let errorCount = 0;
      
      for (const clientData of clientsData) {
        try {
          // Create client using the provided data structure
          const clientId = await storage.createClient({
            name: clientData.name || 'Unknown Client',
            phone: clientData.phone || null,
            email: clientData.email || null,
            whatsappNumber: clientData.whatsappNumber || clientData.phone || null,
            status: clientData.status || 'prospect',
            priority: clientData.priority || 'medium',
            interests: clientData.interests || '',
            notes: clientData.notes || '',
            budget: clientData.budget || 0,
            timeframe: clientData.timeframe || 'medium_term',
            location: clientData.location || '',
            decisionMaker: clientData.decisionMaker || false,
            leadScore: clientData.leadScore || 0,
            conversionProbability: clientData.conversionProbability || 0,
            engagementLevel: clientData.engagementLevel || 'medium',
            followUpRequired: clientData.followUpRequired || false,
            followUpDate: clientData.followUpDate || null,
            tags: clientData.tags || [],
            source: clientData.source || 'import',
            originalData: {
              salesAssociate: clientData.salesAssociate,
              originalReference: clientData.originalReference,
              requestDate: clientData.requestDate
            }
          });

          // If followUpRequired, create a follow-up record
          if (clientData.followUpRequired && clientData.followUpDate) {
            await storage.createFollowUp({
              clientId: clientId,
              type: "reminder",
              title: `Follow-up for ${clientData.name}`,
              description: `Scheduled follow-up based on import data`,
              scheduledFor: new Date(clientData.followUpDate),
              priority: clientData.priority === 'vip' ? 'high' : 'medium'
            });
          }

          importedCount++;
          
          if (importedCount % 10 === 0) {
            console.log(`📈 Imported ${importedCount}/${clientsData.length} clients...`);
          }
        } catch (error) {
          console.error(`❌ Error importing client:`, error);
          errorCount++;
        }
      }
      
      console.log(`✅ Import completed: ${importedCount} imported, ${errorCount} errors`);
      
      res.json({
        success: true,
        message: "Clients imported successfully",
        imported: importedCount,
        errors: errorCount,
        total: clientsData.length
      });
      
    } catch (error) {
      console.error("❌ Import error:", error);
      res.status(500).json({ error: "Import failed", details: error.message });
    }
  });

  // Import Maaz Clients Route
  app.post("/api/clients/import-maaz", async (req, res) => {
    try {
      console.log("🎯 Starting Maaz client import...");
      
      // Load the extracted Maaz client data
      const fs = await import('fs');
      const maazClientsData = JSON.parse(fs.readFileSync('maaz_clients_detailed.json', 'utf8'));
      console.log(`📊 Loaded ${maazClientsData.length} Maaz client records`);
      
      let importedCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < maazClientsData.length; i++) {
        const clientData = maazClientsData[i];
        
        try {
          // Extract key client information
          const clientId = clientData['CLIENT ID'] || '';
          const name = clientId ? `Client ${clientId}` : `Maaz Client ${i + 1}`;
          
          // Get phone from any phone-related field
          let phone = null;
          for (const [key, value] of Object.entries(clientData)) {
            if (key.toLowerCase().includes('phone') && value) {
              phone = String(value);
              break;
            }
          }
          
          // Get email from any email-related field  
          let email = null;
          for (const [key, value] of Object.entries(clientData)) {
            if (key.toLowerCase().includes('email') && value) {
              email = String(value);
              break;
            }
          }
          
          // Get status
          let status = (clientData['STATUS'] || 'prospect').toLowerCase();
          if (!['prospect', 'active', 'inactive', 'vip'].includes(status)) {
            status = 'prospect';
          }
          
          // Get segment/priority
          const segment = (clientData['CLIENT SEGMENT'] || 'medium').toLowerCase();
          let priority = 'medium';
          if (segment.includes('vip')) {
            priority = 'vip';
          } else if (segment.includes('high')) {
            priority = 'high';
          } else if (segment.includes('low')) {
            priority = 'low';
          }
          
          // Get interests (product references)
          let interests = clientData['REFERENCE'] || '';
          if (!interests) {
            // Look for any product/reference fields
            for (const [key, value] of Object.entries(clientData)) {
              if (['reference', 'product', 'model'].some(term => key.toLowerCase().includes(term)) && value) {
                interests = String(value);
                break;
              }
            }
          }
          
          // Get notes/comments
          let notes = clientData['COMMENTS'] || '';
          if (!notes) {
            // Combine other relevant fields as notes
            const noteParts = [];
            for (const [key, value] of Object.entries(clientData)) {
              if (!['CLIENT ID', 'STATUS', 'CLIENT SEGMENT', 'REFERENCE'].includes(key) && value) {
                noteParts.push(`${key}: ${value}`);
              }
            }
            notes = noteParts.slice(0, 3).join(' | '); // First 3 fields only
          }
          
          // Get boutique/location
          const location = clientData['BOUTIQUE'] || 'Phone sales Middle East';
          
          // Get dates
          const requestDateStr = clientData['REQUEST DATE'] || '';
          let lastInteraction = null;
          if (requestDateStr) {
            try {
              // Parse date (format: 29/8/2025)
              const [day, month, year] = requestDateStr.split('/');
              lastInteraction = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            } catch (e) {
              // Date parsing failed, leave as null
            }
          }
          
          // Calculate lead score based on available data
          let leadScore = 50; // Base score
          if (status === 'active') leadScore += 20;
          if (priority === 'vip') leadScore += 30;
          else if (priority === 'high') leadScore += 15;
          if (interests) leadScore += 10;
          if (phone) leadScore += 10;
          if (email) leadScore += 10;
          
          // Create client using storage
          const clientToInsert = {
            name,
            phone,
            email,
            status,
            priority,
            interests,
            location,
            notes,
            leadScore,
            conversionProbability: leadScore > 70 ? 0.7 : 0.5,
            lastInteraction,
            tags: ['maaz', 'luxury_watches', 'vacheron_constantin'],
            totalInteractions: 1,
            followUpRequired: true,
            followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
          };
          
          await storage.createClient(clientToInsert);
          importedCount++;
          
        } catch (error) {
          errorCount++;
          console.log(`   ❌ Error importing client ${i + 1}: ${error.message}`);
          continue;
        }
      }
      
      console.log(`✅ Import complete: ${importedCount} imported, ${errorCount} errors`);
      
      res.json({
        success: true,
        message: "Maaz clients imported successfully",
        imported: importedCount,
        errors: errorCount,
        total: maazClientsData.length
      });
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      res.status(500).json({
        success: false,
        error: "Failed to import Maaz clients",
        message: error.message
      });
    }
  });

  // Client management routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      websocketService.broadcastClientUpdate(client);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const updates = req.body;
      const client = await storage.updateClient(req.params.id, updates);
      websocketService.broadcastClientUpdate(client);
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const success = await storage.deleteClient(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Conversation routes
  app.get("/api/conversations", async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      if (clientId) {
        const conversations = await storage.getConversationsByClient(clientId);
        res.json(conversations);
      } else {
        res.status(400).json({ error: "clientId parameter required" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    try {
      const conversationId = req.query.conversationId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (conversationId) {
        const messages = await storage.getMessagesByConversation(conversationId);
        res.json(messages);
      } else {
        const messages = await storage.getRecentMessages(limit);
        res.json(messages);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);

      // Send WhatsApp message if it's outgoing
      if (message.direction === 'outgoing' && message.clientId) {
        const client = await storage.getClient(message.clientId);
        if (client?.whatsappNumber) {
          const sent = await whatsAppService.sendMessage(client.whatsappNumber, message.content);
          if (!sent) {
            console.error("Failed to send WhatsApp message");
          }
        }
      }

      websocketService.broadcastNewMessage(message);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Follow-up routes
  app.get("/api/followups", async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      const pending = req.query.pending === 'true';
      
      if (clientId) {
        const followUps = await storage.getFollowUpsByClient(clientId);
        res.json(followUps);
      } else if (pending) {
        const followUps = await storage.getPendingFollowUps();
        res.json(followUps);
      } else {
        res.status(400).json({ error: "clientId or pending parameter required" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch follow-ups" });
    }
  });

  app.post("/api/followups", async (req, res) => {
    try {
      const followUpData = insertFollowUpSchema.parse(req.body);
      const followUp = await storage.createFollowUp(followUpData);
      res.json(followUp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create follow-up" });
    }
  });

  app.put("/api/followups/:id", async (req, res) => {
    try {
      const updates = req.body;
      const followUp = await storage.updateFollowUp(req.params.id, updates);
      res.json(followUp);
    } catch (error) {
      res.status(500).json({ error: "Failed to update follow-up" });
    }
  });

  // Automated follow-up routes
  app.post("/api/followups/generate-recommendations", async (req, res) => {
    try {
      const { clientId } = req.body;
      const client = await storage.getClient(clientId);
      const interactions = await storage.getInteractionsByClient(clientId);
      const deals = await storage.getDealsByClient(clientId);
      
      const recommendations = FollowUpAutomationService.generateFollowUpRecommendations(
        client, 
        interactions, 
        deals
      );
      
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate follow-up recommendations" });
    }
  });

  app.post("/api/followups/bulk-generate", async (req, res) => {
    try {
      const clients = await storage.getClients();
      const interactions = await storage.getInteractions();
      const messages = await storage.getMessages();
      const deals = await storage.getDeals();
      
      const followUps = FollowUpAutomationService.createBulkFollowUps(
        clients,
        interactions,
        messages,
        deals
      );
      
      // Create the follow-ups in storage
      const createdFollowUps = [];
      for (const followUp of followUps) {
        const created = await storage.createFollowUp(followUp);
        createdFollowUps.push(created);
      }
      
      res.json({
        message: `Generated ${createdFollowUps.length} automated follow-ups`,
        followUps: createdFollowUps
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate bulk follow-ups" });
    }
  });

  // Interaction routes
  app.get("/api/interactions", async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      if (clientId) {
        const interactions = await storage.getInteractionsByClient(clientId);
        res.json(interactions);
      } else {
        res.status(400).json({ error: "clientId parameter required" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });

  app.post("/api/interactions", async (req, res) => {
    try {
      const interactionData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(interactionData);
      res.json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create interaction" });
    }
  });

  // AI Conversation routes
  app.get("/api/ai-conversations", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (userId) {
        const conversations = await storage.getAiConversationsByUser(userId);
        res.json(conversations);
      } else {
        res.status(400).json({ error: "userId parameter required" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI conversations" });
    }
  });

  app.post("/api/ai-conversations", async (req, res) => {
    try {
      const conversationData = insertAiConversationSchema.parse(req.body);
      const conversation = await storage.createAiConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create AI conversation" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/analytics/client/:id", async (req, res) => {
    try {
      const analytics = await storage.getClientAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client analytics" });
    }
  });

  // WhatsApp status route
  app.get("/api/whatsapp/status", (req, res) => {
    const status = whatsAppService.getConnectionStatus();
    res.json(status);
  });

  // System settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const settingData = insertSystemSettingSchema.parse(req.body);
      const setting = await storage.setSystemSetting(settingData);
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // AI response generation
  app.post("/api/ai/generate-response", async (req, res) => {
    try {
      const { messageText, clientId } = req.body;
      
      if (!messageText) {
        return res.status(400).json({ error: "messageText is required" });
      }

      const client = clientId ? await storage.getClient(clientId) : null;
      const messages = clientId ? await storage.getMessagesByConversation(clientId) : [];
      
      // Analyze conversation
      const analysis = aiAnalyzer.analyzeConversation(messages);
      
      res.json({
        suggestedResponse: analysis.suggestedResponse,
        intent: analysis.intent,
        urgency: analysis.urgency,
        actionRequired: analysis.actionRequired,
        topics: analysis.topics
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // Deal management routes
  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await storage.getAllDeals();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/:id", async (req, res) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deal" });
    }
  });

  app.post("/api/deals", async (req, res) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(dealData);
      res.json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  app.put("/api/deals/:id", async (req, res) => {
    try {
      const updates = req.body;
      const deal = await storage.updateDeal(req.params.id, updates);
      res.json(deal);
    } catch (error) {
      if (error.message === "Deal not found") {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  app.delete("/api/deals/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDeal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  app.get("/api/clients/:clientId/deals", async (req, res) => {
    try {
      const deals = await storage.getDealsByClient(req.params.clientId);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client deals" });
    }
  });

  // Sales forecasting routes
  app.get("/api/forecasts", async (req, res) => {
    try {
      const forecasts = await storage.getAllSalesForecasts();
      res.json(forecasts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch forecasts" });
    }
  });

  app.post("/api/forecasts/generate", async (req, res) => {
    try {
      const { period = "monthly" } = req.body;
      
      const clients = await storage.getAllClients();
      const deals = await storage.getAllDeals();
      const messages = await storage.getRecentMessages(1000);
      const interactions = [];
      const historicalForecasts = await storage.getAllSalesForecasts();
      
      // Generate forecast using the service
      const forecastData = await salesForecastingService.generateForecast(
        period as 'weekly' | 'monthly' | 'quarterly',
        clients,
        deals,
        messages,
        interactions,
        historicalForecasts
      );
      
      // Save the forecast
      const startDate = new Date();
      const endDate = new Date();
      if (period === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (period === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 3);
      }
      
      const forecast = await storage.createSalesForecast({
        period: forecastData.period,
        startDate,
        endDate,
        predictedRevenue: forecastData.predictedRevenue,
        predictedDeals: forecastData.predictedDeals,
        confidence: forecastData.confidence,
        factors: forecastData.factors,
        methodology: 'ai_model'
      });
      
      res.json({ ...forecast, recommendations: forecastData.recommendations });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate forecast" });
    }
  });

  // Lead scoring routes
  app.get("/api/clients/:clientId/lead-score", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const messages = await storage.getMessagesByConversation(req.params.clientId);
      const interactions = await storage.getInteractionsByClient(req.params.clientId);
      const deals = await storage.getDealsByClient(req.params.clientId);
      
      const leadScoreData = await leadScoringService.calculateLeadScore(
        client,
        messages,
        interactions,
        deals
      );
      
      res.json(leadScoreData);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate lead score" });
    }
  });

  app.post("/api/clients/:clientId/update-lead-score", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const messages = await storage.getMessagesByConversation(req.params.clientId);
      const interactions = await storage.getInteractionsByClient(req.params.clientId);
      const deals = await storage.getDealsByClient(req.params.clientId);
      
      const leadScoreData = await leadScoringService.calculateLeadScore(
        client,
        messages,
        interactions,
        deals
      );
      
      // Update client with new score and related data
      const updatedClient = await storage.updateClientLeadScore(
        req.params.clientId,
        leadScoreData.score,
        leadScoreData.factors,
        0.85 // confidence
      );
      
      // Calculate conversion probability and next best action
      const conversionProbability = await leadScoringService.predictConversionProbability(
        updatedClient,
        []
      );
      
      const nextBestAction = leadScoringService.generateNextBestAction(
        updatedClient,
        leadScoreData.factors
      );
      
      // Update client with additional AI insights
      await storage.updateClient(req.params.clientId, {
        conversionProbability,
        nextBestAction,
        buyingSignals: leadScoreData.insights.filter(insight => insight.includes("buying")),
        engagementLevel: leadScoreData.score > 80 ? 'very_high' : 
                       leadScoreData.score > 60 ? 'high' :
                       leadScoreData.score > 40 ? 'medium' : 'low'
      });
      
      res.json({
        ...leadScoreData,
        conversionProbability,
        nextBestAction
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead score" });
    }
  });

  app.get("/api/clients/:clientId/scoring-history", async (req, res) => {
    try {
      const history = await storage.getLeadScoringHistory(req.params.clientId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scoring history" });
    }
  });

  // Predict deal outcome
  app.post("/api/deals/:dealId/predict-outcome", async (req, res) => {
    try {
      const deal = await storage.getDeal(req.params.dealId);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      
      const client = await storage.getClient(deal.clientId!);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const allDeals = await storage.getAllDeals();
      const similarDeals = allDeals.filter(d => 
        d.value >= deal.value * 0.7 && 
        d.value <= deal.value * 1.3 &&
        d.id !== deal.id
      );
      
      const prediction = await salesForecastingService.predictDealOutcome(
        deal,
        client,
        similarDeals
      );
      
      res.json(prediction);
    } catch (error) {
      res.status(500).json({ error: "Failed to predict deal outcome" });
    }
  });

  // AI Agent routes
  app.post("/api/ai-agent/chat", async (req, res) => {
    try {
      const { message, clientContext, attachedFiles = [], aiModel = 'openai' } = req.body;
      
      // Get conversation history and client data for context
      const clients = await storage.getClients();
      const context = {
        clientData: clients,
        currentClient: clientContext,
        attachedFiles,
        aiModel
      };
      
      const response = await AIAgentService.processMessage(message, context);
      
      res.json({ response });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.post("/api/ai-agent/analyze-file", async (req, res) => {
    try {
      // Mock file upload and analysis for now
      const file = req.files?.[0] || req.body;
      const aiModel = req.body.aiModel || 'openai';
      
      const mockFileAttachment = {
        id: Date.now().toString(),
        filename: file.filename || 'uploaded-file.pdf',
        type: 'document',
        url: '/mock-file-url',
      };
      
      const analysis = await AIAgentService.analyzeFile(mockFileAttachment, 'general', aiModel);
      
      res.json({
        filename: mockFileAttachment.filename,
        type: mockFileAttachment.type,
        url: mockFileAttachment.url,
        analysis
      });
    } catch (error) {
      console.error('File analysis error:', error);
      res.status(500).json({ error: "Failed to analyze file" });
    }
  });

  app.post("/api/ai-agent/analyze-client", async (req, res) => {
    try {
      const { clientId, aiModel = 'openai' } = req.body;
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const interactions = await storage.getInteractionsByClient(clientId);
      const messages = await storage.getMessagesByClient(clientId);
      const deals = await storage.getDealsByClient(clientId);
      
      const analysis = await AIAgentService.analyzeClient(client, interactions, messages, deals, aiModel);
      
      res.json({
        clientName: client.name,
        ...analysis
      });
    } catch (error) {
      console.error('Client analysis error:', error);
      res.status(500).json({ error: "Failed to analyze client" });
    }
  });

  app.post("/api/ai-agent/voice-input", async (req, res) => {
    try {
      const { audioText, clientContext } = req.body;
      
      const response = await AIAgentService.processVoiceInput(audioText, {
        currentClient: clientContext
      });
      
      res.json({ response });
    } catch (error) {
      console.error('Voice input error:', error);
      res.status(500).json({ error: "Failed to process voice input" });
    }
  });

  app.post("/api/ai-agent/generate-outreach", async (req, res) => {
    try {
      const { clientId, purpose, context } = req.body;
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const message = await AIAgentService.generateOutreachMessage(client, {
        purpose,
        ...context
      });
      
      res.json({ message });
    } catch (error) {
      console.error('Outreach generation error:', error);
      res.status(500).json({ error: "Failed to generate outreach message" });
    }
  });

  // Advanced AI Authentication Route
  app.post("/api/auth/advanced-ai", authenticateAdvancedAI, (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      message: "Advanced AI access granted",
      user: req.user,
      capabilities: [
        "Unlimited AI processing",
        "Advanced psychological analysis", 
        "Real-time internet search",
        "Self-learning capabilities",
        "Advanced persuasion techniques"
      ]
    });
  });

  // Advanced AI Processing Routes
  app.post("/api/advanced-ai/process", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { 
        message, 
        context = {}, 
        aiModel = 'gemini',
        userKnowledge = [],
        learnedInsights = []
      } = req.body;

      const advancedContext = {
        userKnowledge,
        learnedInsights,
        conversationHistory: context.conversationHistory || [],
        internetSearchResults: context.internetSearchResults || [],
        clientProfiles: context.clientProfiles || [],
        persuasionTechniques: context.persuasionTechniques || []
      };

      const response = await AdvancedAI.processAdvancedRequest(message, advancedContext, aiModel);
      
      res.json({ 
        response,
        aiModel,
        capabilities: "unlimited",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Advanced AI processing error:', error);
      res.status(500).json({ error: "Advanced AI processing failed" });
    }
  });

  // Client Psychology Analysis Route
  app.post("/api/advanced-ai/analyze-psychology", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { clientId, background, goals } = req.body;
      
      let client = null;
      if (clientId) {
        client = await storage.getClient(clientId);
        if (!client) {
          return res.status(404).json({ error: "Client not found" });
        }
      }

      const analysis = await AdvancedAI.analyzeClientPsychology(
        client,
        background || "Professional background",
        goals || ["Business success", "Efficiency", "Recognition"]
      );
      
      res.json({
        clientId,
        clientName: client?.name || "Target Analysis",
        analysis,
        advanced: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Psychology analysis error:', error);
      res.status(500).json({ error: "Psychology analysis failed" });
    }
  });

  // Persuasive Content Generation Route
  app.post("/api/advanced-ai/generate-content", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { target, objective, context, techniques = [] } = req.body;
      
      const content = await AdvancedAI.generatePersuasiveContent(
        target,
        objective,
        context,
        techniques
      );
      
      res.json({
        ...content,
        generated: new Date().toISOString(),
        advanced: true
      });
    } catch (error) {
      console.error('Content generation error:', error);
      res.status(500).json({ error: "Content generation failed" });
    }
  });

  // Internet Search Route
  app.post("/api/advanced-ai/search", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { query } = req.body;
      
      const results = await AdvancedAI.searchInternet(query);
      
      res.json({
        query,
        results,
        timestamp: new Date().toISOString(),
        source: "Advanced AI Search"
      });
    } catch (error) {
      console.error('Internet search error:', error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // GitHub Integration Routes
  
  // Initialize GitHub repository
  app.post("/api/github/initialize", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { token, owner, repo } = req.body;
      
      if (!token || !owner || !repo) {
        return res.status(400).json({ error: "Token, owner, and repo are required" });
      }

      const githubService = initializeGitHubService(token, owner, repo);
      const repository = await githubService.initializeRepository();
      
      res.json({
        success: true,
        repository,
        message: "GitHub repository initialized successfully"
      });
    } catch (error) {
      console.error('GitHub initialization error:', error);
      res.status(500).json({ error: "Failed to initialize GitHub repository" });
    }
  });

  // Get repository information
  app.get("/api/github/repository", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const githubService = getGitHubService();
      const repoInfo = await githubService.getRepositoryInfo();
      const analysis = await githubService.analyzeRepository();
      
      res.json({
        repository: repoInfo,
        analysis,
        lastAnalyzed: new Date().toISOString()
      });
    } catch (error) {
      console.error('Repository info error:', error);
      res.status(500).json({ error: "Failed to get repository information" });
    }
  });

  // Analyze codebase for issues
  app.post("/api/github/analyze", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { repositoryId } = req.body;
      
      const analysis = await selfEditingService.analyzeCodebase(repositoryId);
      
      res.json({
        analysis,
        timestamp: new Date().toISOString(),
        repositoryId
      });
    } catch (error) {
      console.error('Codebase analysis error:', error);
      res.status(500).json({ error: "Codebase analysis failed" });
    }
  });

  // Generate automated fix plan
  app.post("/api/github/generate-fix", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { repositoryId, analysisResult, triggerEvent = 'manual_request' } = req.body;
      
      if (!repositoryId || !analysisResult) {
        return res.status(400).json({ error: "Repository ID and analysis result are required" });
      }

      const editPlan = await selfEditingService.generateAutomatedFix(
        repositoryId,
        analysisResult,
        triggerEvent
      );
      
      res.json({
        editPlan,
        generated: new Date().toISOString(),
        repositoryId
      });
    } catch (error) {
      console.error('Fix generation error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Fix generation failed" });
    }
  });

  // Apply automated fixes
  app.post("/api/github/apply-fix", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { repositoryId, editPlan, triggerEvent = 'manual_application' } = req.body;
      
      if (!repositoryId || !editPlan) {
        return res.status(400).json({ error: "Repository ID and edit plan are required" });
      }

      const editHistory = await selfEditingService.applySelfEdit(
        repositoryId,
        editPlan,
        triggerEvent
      );
      
      res.json({
        success: true,
        editHistory,
        applied: new Date().toISOString(),
        repositoryId
      });
    } catch (error) {
      console.error('Fix application error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Fix application failed" });
    }
  });

  // Monitor system for issues
  app.get("/api/github/monitor", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const monitoring = await selfEditingService.monitorForIssues();
      
      res.json({
        monitoring,
        timestamp: new Date().toISOString(),
        systemStatus: "monitoring_active"
      });
    } catch (error) {
      console.error('System monitoring error:', error);
      res.status(500).json({ error: "System monitoring failed" });
    }
  });

  // Get self-editing history
  app.get("/api/github/history/:repositoryId?", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { repositoryId } = req.params;
      
      let history;
      if (repositoryId) {
        history = await storage.getSelfEditingHistory(repositoryId);
      } else {
        history = await storage.getAllSelfEditingHistory();
      }
      
      res.json({
        history,
        count: history.length,
        repositoryId: repositoryId || "all"
      });
    } catch (error) {
      console.error('History retrieval error:', error);
      res.status(500).json({ error: "Failed to retrieve history" });
    }
  });

  // Upload and process AI learning documents
  app.post("/api/ai-learning/upload", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertAiLearningDocumentSchema.parse(req.body);
      
      const document = await storage.createAiLearningDocument(validatedData);
      
      // TODO: Process document for AI learning (extract content, create embeddings, etc.)
      
      res.json({
        success: true,
        document,
        message: "Document uploaded and queued for processing"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid document data", details: error.errors });
      }
      console.error('Document upload error:', error);
      res.status(500).json({ error: "Document upload failed" });
    }
  });

  // Get AI learning documents
  app.get("/api/ai-learning/documents", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.query;
      
      let documents;
      if (category && typeof category === 'string') {
        documents = await storage.getAiLearningDocumentsByCategory(category);
      } else {
        documents = await storage.getAllAiLearningDocuments();
      }
      
      res.json({
        documents,
        count: documents.length,
        category: category || "all"
      });
    } catch (error) {
      console.error('Documents retrieval error:', error);
      res.status(500).json({ error: "Failed to retrieve documents" });
    }
  });

  // Get code analysis reports
  app.get("/api/github/analysis-reports/:repositoryId?", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { repositoryId } = req.params;
      
      let reports;
      if (repositoryId) {
        reports = await storage.getCodeAnalysisReportsByRepository(repositoryId);
      } else {
        // Get all repositories and their reports
        const repositories = await storage.getAllGithubRepositories();
        reports = [];
        for (const repo of repositories) {
          const repoReports = await storage.getCodeAnalysisReportsByRepository(repo.id);
          reports.push(...repoReports);
        }
      }
      
      res.json({
        reports,
        count: reports.length,
        repositoryId: repositoryId || "all"
      });
    } catch (error) {
      console.error('Analysis reports retrieval error:', error);
      res.status(500).json({ error: "Failed to retrieve analysis reports" });
    }
  });

  // Get all GitHub repositories
  app.get("/api/github/repositories", requireAdvancedAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const repositories = await storage.getAllGithubRepositories();
      
      res.json({
        repositories,
        count: repositories.length
      });
    } catch (error) {
      console.error('Repositories retrieval error:', error);
      res.status(500).json({ error: "Failed to retrieve repositories" });
    }
  });

  // Excel workbook download endpoint
  app.get("/api/excel/download/:filename?", (req, res) => {
    try {
      const filename = req.params.filename || "CRC_Warroom_AI_Enhanced_Workbook_20250912_052543.xlsx";
      const fs = require('fs');
      const path = require('path');
      
      const filePath = path.resolve(filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Excel file not found" });
      }
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Excel download error:', error);
      res.status(500).json({ error: "Download failed" });
    }
  });

  // List available Excel files
  app.get("/api/excel/list", (req, res) => {
    try {
      const fs = require('fs');
      const files = fs.readdirSync('.').filter(file => file.endsWith('.xlsx') || file.endsWith('.xlsm'));
      
      const fileList = files.map(file => {
        const stats = fs.statSync(file);
        return {
          filename: file,
          size: stats.size,
          modified: stats.mtime,
          downloadUrl: `/api/excel/download/${file}`
        };
      });
      
      res.json({ 
        files: fileList,
        count: fileList.length,
        latest: fileList.find(f => f.filename.includes('052543')) || fileList[0]
      });
    } catch (error) {
      console.error('Excel list error:', error);
      res.status(500).json({ error: "Failed to list Excel files" });
    }
  });

  // Export current system data to Excel
  app.get("/api/export/excel", async (req, res) => {
    try {
      console.log("🔄 Starting Excel export of current system data...");
      
      // Get all system data
      const clients = await storage.getAllClients();
      const deals = await storage.getAllDeals();
      const followUps = await storage.getPendingFollowUps();
      
      // Create export data structure
      const exportData = {
        timestamp: new Date().toISOString(),
        summary: {
          totalClients: clients.length,
          totalDeals: deals.length,
          pendingFollowUps: followUps.length
        },
        clients: clients.map(client => ({
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email,
          status: client.status,
          priority: client.priority,
          leadScore: client.leadScore,
          notes: client.notes,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        })),
        deals: deals.map(deal => ({
          id: deal.id,
          clientId: deal.clientId,
          value: deal.value,
          status: deal.status,
          stage: deal.stage,
          description: deal.description,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt
        })),
        followUps: followUps.map(followUp => ({
          id: followUp.id,
          clientId: followUp.clientId,
          type: followUp.type,
          title: followUp.title,
          description: followUp.description,
          scheduledFor: followUp.scheduledFor,
          completed: followUp.completed
        }))
      };
      
      console.log(`📊 Export prepared: ${clients.length} clients, ${deals.length} deals, ${followUps.length} follow-ups`);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="CRC_System_Export_${new Date().toISOString().slice(0,10)}.json"`);
      
      res.json(exportData);
      
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: "Export failed", details: error.message });
    }
  });

  return httpServer;
}
