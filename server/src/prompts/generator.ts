import type { PokemonParent } from "@pokefusion/shared";

export function buildGeneratorPrompt(parent1: PokemonParent, parent2: PokemonParent): string {
  return `You are a Pokemon breeding expert. Given two parent Pokemon, create a unique offspring that combines their traits.

Parent 1:
- Name: ${parent1.name}
- Types: ${parent1.types.join(", ")}
- Stats: HP=${parent1.stats.hp}, Attack=${parent1.stats.attack}, Defense=${parent1.stats.defense}, Sp.Atk=${parent1.stats.specialAttack}, Sp.Def=${parent1.stats.specialDefense}, Speed=${parent1.stats.speed}
- Abilities: ${parent1.abilities.join(", ")}

Parent 2:
- Name: ${parent2.name}
- Types: ${parent2.types.join(", ")}
- Stats: HP=${parent2.stats.hp}, Attack=${parent2.stats.attack}, Defense=${parent2.stats.defense}, Sp.Atk=${parent2.stats.specialAttack}, Sp.Def=${parent2.stats.specialDefense}, Speed=${parent2.stats.speed}
- Abilities: ${parent2.abilities.join(", ")}

Generate a child Pokemon with:
1. A creative fusion name combining both parents (max 50 characters)
2. 1-2 types inherited or combined from parents
3. Stats that blend parent stats creatively (each stat between 1-255)
4. 1-2 abilities derived from or inspired by parent abilities
5. A unique signature move that combines parent typings with:
   - A creative name
   - A type (should relate to the child's types)
   - Power between 0-200
   - A brief description of the move
6. A short description of the child Pokemon (2-3 sentences)

Respond with ONLY valid JSON in this exact format:
{
  "name": "string",
  "types": ["string"],
  "stats": {
    "hp": number,
    "attack": number,
    "defense": number,
    "specialAttack": number,
    "specialDefense": number,
    "speed": number
  },
  "abilities": ["string"],
  "signatureMove": {
    "name": "string",
    "type": "string",
    "power": number,
    "description": "string"
  },
  "description": "string"
}`;
}
