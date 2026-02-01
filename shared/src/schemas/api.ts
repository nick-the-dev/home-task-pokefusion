import { z } from "zod";
import { PokemonParentSchema } from "./pokemon";
import { GeneratedChildSchema } from "./child";
import { BattleJudgmentSchema } from "./battle";

// Battle request schema
export const BattleRequestSchema = z.object({
  pairA: z.object({
    parent1Id: z.number(),
    parent2Id: z.number(),
  }),
  pairB: z.object({
    parent1Id: z.number(),
    parent2Id: z.number(),
  }),
});

// Battle response schema
export const BattleResponseSchema = z.object({
  parents: z.object({
    pairA: z.object({
      parent1: PokemonParentSchema,
      parent2: PokemonParentSchema,
    }),
    pairB: z.object({
      parent1: PokemonParentSchema,
      parent2: PokemonParentSchema,
    }),
  }),
  children: z.object({
    child1: GeneratedChildSchema,
    child2: GeneratedChildSchema,
  }),
  battle: BattleJudgmentSchema,
});

// Pokemon list response for the selection dropdown
export const PokemonListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const PokemonListResponseSchema = z.object({
  pokemon: z.array(PokemonListItemSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

export type BattleRequest = z.infer<typeof BattleRequestSchema>;
export type BattleResponse = z.infer<typeof BattleResponseSchema>;
export type PokemonListItem = z.infer<typeof PokemonListItemSchema>;
export type PokemonListResponse = z.infer<typeof PokemonListResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
