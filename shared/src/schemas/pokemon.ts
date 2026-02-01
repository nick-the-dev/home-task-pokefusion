import { z } from "zod";

export const PokemonStatsSchema = z.object({
  hp: z.number(),
  attack: z.number(),
  defense: z.number(),
  specialAttack: z.number(),
  specialDefense: z.number(),
  speed: z.number(),
});

export const PokemonParentSchema = z.object({
  id: z.number(),
  name: z.string(),
  types: z.array(z.string()).min(1).max(2),
  stats: PokemonStatsSchema,
  abilities: z.array(z.string()),
  sprite: z.string().url(),
});

export type PokemonStats = z.infer<typeof PokemonStatsSchema>;
export type PokemonParent = z.infer<typeof PokemonParentSchema>;
