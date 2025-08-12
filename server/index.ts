import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";

// Otimizações para ambiente de produção (cPanel)
if (process.env.NODE_ENV === 'production' && process.env.CPANEL_MODE === 'true') {
  // Limitar uso de memória
  process.env.NODE_OPTIONS = '--max-old-space-size=512';
  
  // Cache em memória limitado
  (global as any).cache = new Map();
  (global as any).MAX_CACHE_SIZE = 100;
  
  (global as any).setCache = function(key: string, value: any, ttl = 300000) {
    if ((global as any).cache.size >= (global as any).MAX_CACHE_SIZE) {
      const firstKey = (global as any).cache.keys().next().value;
      (global as any).cache.delete(firstKey);
    }
    (global as any).cache.set(key, { value, timestamp: Date.now(), ttl });
  };
  
  (global as any).getCache = function(key: string) {
    const item = (global as any).cache.get(key);
    if (item && (Date.now() - item.timestamp) < item.ttl) {
      return item.value;
    }
    (global as any).cache.delete(key);
    return null;
  };
  
  console.log('✅ Otimizações para cPanel ativadas');
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from photos directory
app.use('/photos', express.static(path.join(process.cwd(), 'photos')));

// Health check endpoint para monitoramento
app.get('/health', (req: Request, res: Response) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version,
    pid: process.pid,
    cache: process.env.CPANEL_MODE === 'true' ? {
      size: (global as any).cache ? (global as any).cache.size : 0,
      maxSize: (global as any).MAX_CACHE_SIZE || 0
    } : undefined
  };
  
  res.json(healthStatus);
});

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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
