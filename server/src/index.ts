// Load env vars first, before any other imports
import "./env.js";

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { apiRouter } from "./routes/api.js";
import { loadTypeMatchups } from "./services/typeMatchups.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

// Security headers - configure CSP to allow Vite-built assets
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://raw.githubusercontent.com"],
            connectSrc: ["'self'"],
          },
        }
      : false, // Disable CSP in development
  })
);

// CORS configuration - restrict origins in production
const corsOptions = {
  origin: isProduction
    ? process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"]
    : true, // Allow all origins in development
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Body parsing with size limit
app.use(express.json({ limit: "1mb" }));

// API routes
app.use("/api", apiRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve static files in production (monolith deployment)
if (isProduction) {
  const clientDistPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDistPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// Initialize services and start server
async function startServer() {
  // Pre-load type matchups for battle calculations
  try {
    await loadTypeMatchups();
    console.log("Type matchups loaded successfully");
  } catch (error) {
    console.warn("Failed to load type matchups, battles will use neutral effectiveness:", error);
  }

  // Start the server
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return server;
}

// Start server and set up graceful shutdown
const serverPromise = startServer();

serverPromise.then((server) => {
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
});
