import { BattleJudgmentSchema, type GeneratedChild, type BattleJudgment } from "@pokefusion/shared";
import { judgeMatch } from "./openrouter.js";
import { buildJudgePrompt } from "../prompts/judge.js";
import { logStart, logEnd, logInfo, logError } from "../utils/logger.js";

export async function judgeBattle(
  child1: GeneratedChild,
  child2: GeneratedChild
): Promise<BattleJudgment> {
  const startTime = logStart("JUDGE", `judgeBattle(${child1.name}, ${child2.name})`);
  logInfo("JUDGE", "Contestants:", {
    child1: { name: child1.name, types: child1.types, signatureMove: child1.signatureMove.name },
    child2: { name: child2.name, types: child2.types, signatureMove: child2.signatureMove.name },
  });

  try {
    const prompt = buildJudgePrompt(child1, child2);
    const judgment = await judgeMatch(prompt, BattleJudgmentSchema);

    const winnerName = judgment.winner === "child1" ? child1.name : child2.name;
    logEnd("JUDGE", `judgeBattle(${child1.name}, ${child2.name})`, startTime, `Winner: ${winnerName} (${judgment.confidence}% confidence)`);
    logInfo("JUDGE", "Judgment details:", {
      winner: winnerName,
      confidence: judgment.confidence,
      keyFactors: judgment.keyFactors,
      reasoning: judgment.reasoning.substring(0, 200) + (judgment.reasoning.length > 200 ? "..." : ""),
    });

    return judgment;
  } catch (error) {
    logError("JUDGE", `judgeBattle(${child1.name}, ${child2.name}) failed`, error);
    throw error;
  }
}
