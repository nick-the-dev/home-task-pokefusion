import { GeneratedChildSchema, type PokemonParent, type GeneratedChild } from "@pokefusion/shared";
import { generateChild } from "./openrouter.js";
import { buildGeneratorPrompt } from "../prompts/generator.js";
import { logStart, logEnd, logInfo, logError } from "../utils/logger.js";

export async function generateChildFromPair(
  parent1: PokemonParent,
  parent2: PokemonParent
): Promise<GeneratedChild> {
  const startTime = logStart("GENERATOR", `generateChildFromPair(${parent1.name}, ${parent2.name})`);
  logInfo("GENERATOR", "Parent stats:", {
    parent1: { name: parent1.name, types: parent1.types, totalStats: Object.values(parent1.stats).reduce((a, b) => a + b, 0) },
    parent2: { name: parent2.name, types: parent2.types, totalStats: Object.values(parent2.stats).reduce((a, b) => a + b, 0) },
  });

  try {
    const prompt = buildGeneratorPrompt(parent1, parent2);
    const child = await generateChild(prompt, GeneratedChildSchema);

    logEnd("GENERATOR", `generateChildFromPair(${parent1.name}, ${parent2.name})`, startTime, `${child.name} (${child.types.join(", ")})`);
    logInfo("GENERATOR", "Generated child details:", {
      name: child.name,
      types: child.types,
      abilities: child.abilities,
      signatureMove: child.signatureMove.name,
      totalStats: Object.values(child.stats).reduce((a, b) => a + b, 0),
    });

    return child;
  } catch (error) {
    logError("GENERATOR", `generateChildFromPair(${parent1.name}, ${parent2.name}) failed`, error);
    throw error;
  }
}
