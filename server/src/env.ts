import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (two levels up from src/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Also try server/.env as fallback
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Required environment variables
const REQUIRED_ENV_VARS = [
  "OPENROUTER_API_KEY",
  "GENERATOR_MODEL",
  "JUDGE_MODEL",
] as const;

// Validate required environment variables at startup
const missingVars = REQUIRED_ENV_VARS.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error("\nPlease copy .env.example to .env and fill in the values.");
  process.exit(1);
}

// Export validated environment config
export const env = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
  GENERATOR_MODEL: process.env.GENERATOR_MODEL!,
  JUDGE_MODEL: process.env.JUDGE_MODEL!,
  PORT: process.env.PORT || "3001",
  NODE_ENV: process.env.NODE_ENV || "development",
  POKEAPI_BASE_URL: process.env.POKEAPI_BASE_URL || "https://pokeapi.co/api/v2",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
} as const;
