import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeTelegramBot } from "./services/telegram-bot";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // 🚨 Auto-import Excel data on startup
  console.log("📊 Auto-importing Excel data with retry mechanism...");
  
  const importExcelData = async () => {
    try {
      const fs = await import('fs');
      const excelPath = 'attached_assets/Vacheron_Constantin V1 tracker_1760191439139.xlsm';
      
      if (fs.existsSync(excelPath)) {
        console.log("📄 Excel file found, importing client and appointment data...");
        
        // Give server time to fully start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Import Excel data with retry mechanism
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`🔄 Excel import attempt ${attempt}/3...`);
            
            const response = await fetch('http://localhost:5000/api/clients/import-excel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response?.ok) {
              const result = await response.json();
              console.log(`✅ SUCCESS: ${result.imported} clients and ${result.appointments} appointments imported!`);
              return true;
            } else {
              console.log(`⚠️ Import attempt ${attempt} failed, retrying...`);
            }
          } catch (error) {
            console.log(`⚠️ Import attempt ${attempt} error:`, (error as Error).message);
          }
          
          // Wait before retry
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log("❌ All import attempts failed - manual intervention required");
        return false;
      } else {
        console.log("⚠️ Excel file not found");
        return false;
      }
    } catch (error) {
      console.log("⚠️ Excel auto-import error:", (error as Error).message);
      return false;
    }
  };
  
  // Run import in background after server starts
  setTimeout(importExcelData, 3000);

  // Start Telegram reminder system (check every 15 minutes for appointments)
  const { startReminderSystem } = await import('./services/telegram-bot');
  const ADMIN_CHAT_ID = parseInt(process.env.TELEGRAM_ADMIN_CHAT_ID || '0');
  if (ADMIN_CHAT_ID) {
    startReminderSystem(ADMIN_CHAT_ID);
  } else {
    console.log('⚠️ TELEGRAM_ADMIN_CHAT_ID not set - Reminders disabled. Set it to your Telegram chat ID to enable.');
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize Telegram bot
    initializeTelegramBot();
  });
})();
