import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { whatsAppService } from "./services/whatsapp";
import { aiAnalyzer } from "./services/ai-analyzer";
import { initializeWebSocket } from "./services/websocket";
import { 
  insertClientSchema, 
  insertMessageSchema, 
  insertFollowUpSchema, 
  insertInteractionSchema,
  insertDocumentSchema,
  insertTripPlanSchema,
  insertAiConversationSchema,
  insertSystemSettingSchema
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

  return httpServer;
}
