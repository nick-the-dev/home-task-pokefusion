import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (two levels up from src/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Also try server/.env as fallback
dotenv.config({ path: path.resolve(__dirname, "../.env") });
