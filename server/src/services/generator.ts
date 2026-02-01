import { GeneratedChildSchema, type PokemonParent, type GeneratedChild } from "@pokefusion/shared";
import { generateChild } from "./openrouter.js";
import { buildGeneratorPrompt } from "../prompts/generator.js";

export async function generateChildFromPair(
  parent1: PokemonParent,
  parent2: PokemonParent
): Promise<GeneratedChild> {
  const prompt = buildGeneratorPrompt(parent1, parent2);
  return generateChild(prompt, GeneratedChildSchema);
}
