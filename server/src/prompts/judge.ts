import type { GeneratedChild } from "@pokefusion/shared";

export function buildJudgePrompt(child1: GeneratedChild, child2: GeneratedChild): string {
  return `You are a Pokemon battle analyst. Analyze a hypothetical battle between two fusion Pokemon and predict the winner.

Child 1 (from Pair A):
- Name: ${child1.name}
- Types: ${child1.types.join(", ")}
- Stats: HP=${child1.stats.hp}, Attack=${child1.stats.attack}, Defense=${child1.stats.defense}, Sp.Atk=${child1.stats.specialAttack}, Sp.Def=${child1.stats.specialDefense}, Speed=${child1.stats.speed}
- Abilities: ${child1.abilities.join(", ")}
- Signature Move: ${child1.signatureMove.name} (${child1.signatureMove.type}, Power: ${child1.signatureMove.power}) - ${child1.signatureMove.description}

Child 2 (from Pair B):
- Name: ${child2.name}
- Types: ${child2.types.join(", ")}
- Stats: HP=${child2.stats.hp}, Attack=${child2.stats.attack}, Defense=${child2.stats.defense}, Sp.Atk=${child2.stats.specialAttack}, Sp.Def=${child2.stats.specialDefense}, Speed=${child2.stats.speed}
- Abilities: ${child2.abilities.join(", ")}
- Signature Move: ${child2.signatureMove.name} (${child2.signatureMove.type}, Power: ${child2.signatureMove.power}) - ${child2.signatureMove.description}

Consider:
1. Type matchups and advantages/disadvantages
2. Stat distributions (speed determines who attacks first)
3. Signature moves and their effectiveness against the opponent
4. Ability synergies and potential counters
5. Any rule violations or unrealistic attributes

Provide your prediction with:
- Winner: either "child1" or "child2"
- Confidence level: 0-100 (how certain you are)
- Reasoning: detailed explanation (50-2000 characters)
- Key factors: 1-5 main reasons for your prediction
- Rule violations: any issues with the Pokemon attributes (empty array if none)

Respond with ONLY valid JSON in this exact format:
{
  "winner": "child1" or "child2",
  "confidence": number,
  "reasoning": "string",
  "keyFactors": ["string"],
  "ruleViolations": ["string"] or []
}`;
}
