// Load env vars first, before any other imports
import "./env.js";

import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api", apiRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
