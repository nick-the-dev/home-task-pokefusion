import { BattleJudgmentSchema, type GeneratedChild, type BattleJudgment } from "@pokefusion/shared";
import { judgeMatch } from "./openrouter.js";
import { buildJudgePrompt } from "../prompts/judge.js";

export async function judgeBattle(
  child1: GeneratedChild,
  child2: GeneratedChild
): Promise<BattleJudgment> {
  const prompt = buildJudgePrompt(child1, child2);
  return judgeMatch(prompt, BattleJudgmentSchema);
}
