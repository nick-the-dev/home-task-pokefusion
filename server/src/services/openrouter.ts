import { z } from "zod";
import { OpenRouter } from "@openrouter/sdk";
import { withRetry, validateWithSchema } from "../utils/retry.js";
import { logStart, logEnd, logInfo, logError } from "../utils/logger.js";
import { env } from "../env.js";

const LLM_TIMEOUT_MS = 60000; // 60 second timeout for LLM calls (free models can be slow)

// Singleton OpenRouter client
let clientInstance: OpenRouter | null = null;

function getClient(): OpenRouter {
  if (!clientInstance) {
    clientInstance = new OpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    });
  }
  return clientInstance;
}

/**
 * Wraps a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

async function callOpenRouter(prompt: string, model: string): Promise<unknown> {
  const promptPreview = prompt.length > 100 ? `${prompt.substring(0, 100)}...` : prompt;
  const startTime = logStart("LLM", `callOpenRouter(${model})`, { promptPreview });

  try {
    const client = getClient();

    const response = await withTimeout(
      client.chat.send({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        maxTokens: 4000,
        responseFormat: { type: "json_object" },
      }),
      LLM_TIMEOUT_MS,
      `LLM call to ${model}`
    );

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No content in response");
    }

    // With responseFormat: json_object, the content IS valid JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error(`Failed to parse LLM response as JSON: ${content.substring(0, 100)}...`);
    }

    logEnd("LLM", `callOpenRouter(${model})`, startTime, `response: ${content.length} chars`);
    return parsed;
  } catch (error) {
    logError("LLM", `callOpenRouter(${model}) failed`, error);
    throw error;
  }
}

export async function callLLMWithRetry<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  model: string,
  maxRetries: number = 3
): Promise<T> {
  logInfo("LLM", `callLLMWithRetry starting (model: ${model}, maxRetries: ${maxRetries})`);

  return withRetry(
    async () => {
      const parsed = await callOpenRouter(prompt, model);
      const validated = validateWithSchema(parsed, schema);
      logInfo("LLM", "Schema validation passed");
      return validated;
    },
    { maxRetries, delayMs: 1000 }
  );
}

export async function generateChild<T>(
  prompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  logInfo("LLM", `Using generator model: ${env.GENERATOR_MODEL}`);
  return callLLMWithRetry(prompt, schema, env.GENERATOR_MODEL);
}

export async function judgeMatch<T>(
  prompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  logInfo("LLM", `Using judge model: ${env.JUDGE_MODEL}`);
  return callLLMWithRetry(prompt, schema, env.JUDGE_MODEL);
}
