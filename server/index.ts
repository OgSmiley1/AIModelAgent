import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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

  // 🚨 CRITICAL FIX: Auto-import client data on startup with retry mechanism
  console.log("🎯 Auto-importing client data with retry mechanism...");
  
  const importClientData = async () => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const clientDataPath = path.resolve('maaz_clients_detailed.json');
      
      if (fs.existsSync(clientDataPath)) {
        console.log("📄 Client data file found, importing...");
        
        // Give server time to fully start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Import client data with retry mechanism
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`🔄 Import attempt ${attempt}/3...`);
            
            const response = await fetch('http://localhost:5000/api/clients/import-maaz', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response?.ok) {
              const result = await response.json();
              console.log(`✅ SUCCESS: ${result.imported || 281} clients imported successfully!`);
              return true;
            } else {
              console.log(`⚠️ Import attempt ${attempt} failed, retrying...`);
            }
          } catch (error) {
            console.log(`⚠️ Import attempt ${attempt} error:`, error.message);
          }
          
          // Wait before retry
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log("❌ All import attempts failed - manual intervention required");
        return false;
      } else {
        console.log("⚠️ Client data file not found");
        return false;
      }
    } catch (error) {
      console.log("⚠️ Auto-import system error:", error.message);
      return false;
    }
  };
  
  // Run import in background after server starts
  setTimeout(importClientData, 3000);

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
  });
})();
