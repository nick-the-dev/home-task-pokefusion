// Load env vars first, before any other imports
import "./env.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { apiRouter } from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

// Security headers
app.use(helmet());

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

// Graceful shutdown handling
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

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
