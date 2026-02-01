import { z } from "zod";
import { OpenRouter } from "@openrouter/sdk";
import { withRetry, validateWithSchema } from "../utils/retry.js";

// Models - required via environment variables
const GENERATOR_MODEL = process.env.GENERATOR_MODEL;
const JUDGE_MODEL = process.env.JUDGE_MODEL;

if (!GENERATOR_MODEL || !JUDGE_MODEL) {
  throw new Error("GENERATOR_MODEL and JUDGE_MODEL environment variables must be set");
}

const validatedGeneratorModel: string = GENERATOR_MODEL;
const validatedJudgeModel: string = JUDGE_MODEL;

// Initialize OpenRouter client
function getClient(): OpenRouter {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  return new OpenRouter({
    apiKey,
  });
}

async function callOpenRouter(prompt: string, model: string): Promise<unknown> {
  const client = getClient();

  const response = await client.chat.send({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    maxTokens: 4000,
    responseFormat: { type: "json_object" },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("No content in response");
  }

  // With responseFormat: json_object, the content IS valid JSON
  return JSON.parse(content);
}

export async function callLLMWithRetry<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  model: string,
  maxRetries: number = 3
): Promise<T> {
  return withRetry(
    async () => {
      const parsed = await callOpenRouter(prompt, model);
      return validateWithSchema(parsed, schema);
    },
    { maxRetries, delayMs: 1000 }
  );
}

export async function generateChild<T>(
  prompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  return callLLMWithRetry(prompt, schema, validatedGeneratorModel);
}

export async function judgeMatch<T>(
  prompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  return callLLMWithRetry(prompt, schema, validatedJudgeModel);
}
