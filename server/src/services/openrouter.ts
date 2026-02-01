import { z } from "zod";
import { withRetry, validateWithSchema } from "../utils/retry.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

// Models - required via environment variables
const GENERATOR_MODEL = process.env.GENERATOR_MODEL;
const JUDGE_MODEL = process.env.JUDGE_MODEL;

if (!GENERATOR_MODEL || !JUDGE_MODEL) {
  throw new Error("GENERATOR_MODEL and JUDGE_MODEL environment variables must be set");
}

// After validation, these are guaranteed to be strings
const validatedGeneratorModel: string = GENERATOR_MODEL;
const validatedJudgeModel: string = JUDGE_MODEL;

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    code: string;
  };
}

async function callOpenRouter(
  prompt: string,
  model: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3001",
      "X-Title": "Pokefusion",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;

  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }

  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from OpenRouter");
  }

  return data.choices[0].message.content;
}

function extractJson(content: string): string {
  // Try to find JSON object in the content
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  throw new Error("No JSON object found in response");
}

export async function callLLMWithRetry<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  model: string,
  maxRetries: number = 3
): Promise<T> {
  return withRetry(
    async () => {
      const content = await callOpenRouter(prompt, model);
      const jsonString = extractJson(content);

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        throw new Error(`Invalid JSON in response: ${jsonString.substring(0, 200)}`);
      }

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
