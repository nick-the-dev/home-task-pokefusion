import { z } from "zod";
import { OpenRouter } from "@openrouter/sdk";
import { withRetry, validateWithSchema } from "../utils/retry.js";
import { logStart, logEnd, logInfo, logError } from "../utils/logger.js";

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
  const promptPreview = prompt.length > 100 ? `${prompt.substring(0, 100)}...` : prompt;
  const startTime = logStart("LLM", `callOpenRouter(${model})`, { promptPreview });

  try {
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
    const parsed = JSON.parse(content);

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
  logInfo("LLM", `Using generator model: ${validatedGeneratorModel}`);
  return callLLMWithRetry(prompt, schema, validatedGeneratorModel);
}

export async function judgeMatch<T>(
  prompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  logInfo("LLM", `Using judge model: ${validatedJudgeModel}`);
  return callLLMWithRetry(prompt, schema, validatedJudgeModel);
}
