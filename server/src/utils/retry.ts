import { z } from "zod";
import { logRetry, logInfo, logError } from "./logger.js";

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000 } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        logInfo("RETRY", `Succeeded on attempt ${attempt + 1}/${maxRetries}`);
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        logRetry(attempt + 1, maxRetries, lastError.message, delayMs);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        logRetry(attempt + 1, maxRetries, lastError.message);
      }
    }
  }

  logError("RETRY", `All ${maxRetries} attempts failed`);
  throw lastError || new Error("Max retries exceeded");
}

export function validateWithSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    logError("RETRY", `Schema validation failed: ${errors.join(", ")}`);
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }

  return result.data;
}
