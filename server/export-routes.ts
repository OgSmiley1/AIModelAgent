import type { Express } from "express";
import { storage } from "./storage";

export function registerExportRoutes(app: Express) {
  // Export all clients
  app.get("/api/export/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json({
        total: clients.length,
        data: clients,
        generatedAt: new Date().toISOString(),
        warning: "Contains sensitive PII data - handle with care"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export clients" });
    }
  });

  // Export all watches
  app.get("/api/export/watches", async (req, res) => {
    try {
      const watches = await storage.getAllWatches();
      res.json({
        total: watches.length,
        data: watches,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export watches" });
    }
  });

  // Export all FAQs
  app.get("/api/export/faqs", async (req, res) => {
    try {
      const faqs = await storage.getAllFaqs();
      res.json({
        total: faqs.length,
        data: faqs,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export FAQs" });
    }
  });

  // Export all appointments
  app.get("/api/export/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json({
        total: appointments.length,
        data: appointments,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export appointments" });
    }
  });

  // Export system schemas
  app.get("/api/export/schemas", async (req, res) => {
    try {
      const fs = await import('fs');
      const schemaContent = fs.readFileSync('shared/schema.ts', 'utf-8');
      res.json({
        schema: schemaContent,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export schemas" });
    }
  });

  // Export full system snapshot
  app.get("/api/export/full", async (req, res) => {
    try {
      const [clients, watches, faqs, appointments] = await Promise.all([
        storage.getAllClients(),
        storage.getAllWatches(),
        storage.getAllFaqs(),
        storage.getAllAppointments()
      ]);

      const fs = await import('fs');
      const schemaContent = fs.readFileSync('shared/schema.ts', 'utf-8');

      res.json({
        metadata: {
          generatedAt: new Date().toISOString(),
          system: "Vacheron Constantin CRM",
          warning: "Contains sensitive PII data - handle with care"
        },
        counts: {
          clients: clients.length,
          watches: watches.length,
          faqs: faqs.length,
          appointments: appointments.length
        },
        data: {
          clients,
          watches,
          faqs,
          appointments
        },
        schema: schemaContent
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export full system data" });
    }
  });

  // Export system architecture and prompts
  app.get("/api/export/architecture", async (req, res) => {
    try {
      const fs = await import('fs');
      const replitMd = fs.existsSync('replit.md') ? fs.readFileSync('replit.md', 'utf-8') : '';
      const handoverMd = fs.existsSync('HANDOVER.md') ? fs.readFileSync('HANDOVER.md', 'utf-8') : '';

      res.json({
        architecture: {
          overview: replitMd,
          handover: handoverMd
        },
        telegram: {
          commands: [
            "/stats - View CRM statistics",
            "/list_vip - List VIP clients",
            "/list_confirmed - List confirmed clients",
            "/list_sold - List sold clients",
            "/price <watch> - Get watch price & availability",
            "/available - List all available watches",
            "/clients_for <ambassador> - List clients by ambassador",
            "/watch <reference> - Get watch details",
            "/faq <query> - Search FAQ database"
          ],
          naturalLanguage: "Powered by Google Gemini API for AI-driven client management"
        },
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export architecture" });
    }
  });
}
