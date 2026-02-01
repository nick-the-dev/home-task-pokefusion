import { z } from "zod";

export const BattleJudgmentSchema = z.object({
  winner: z.enum(["child1", "child2"]),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().min(50).max(2000),
  keyFactors: z.array(z.string()).min(1).max(5),
  ruleViolations: z.array(z.string()).optional(),
});

export type BattleJudgment = z.infer<typeof BattleJudgmentSchema>;
