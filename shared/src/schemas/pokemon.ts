import { z } from "zod";

// All 18 official Pokemon types
export const POKEMON_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export const PokemonTypeSchema = z.enum(POKEMON_TYPES);

export const PokemonStatsSchema = z.object({
  hp: z.number().min(1).max(255),
  attack: z.number().min(1).max(255),
  defense: z.number().min(1).max(255),
  specialAttack: z.number().min(1).max(255),
  specialDefense: z.number().min(1).max(255),
  speed: z.number().min(1).max(255),
});

export const PokemonParentSchema = z.object({
  id: z.number().min(1),
  name: z.string().min(1),
  height: z.number().min(0), // decimeters
  weight: z.number().min(0), // hectograms
  types: z.array(PokemonTypeSchema).min(1).max(2),
  stats: PokemonStatsSchema,
  abilities: z.array(z.string().min(1)).min(1),
  // Sprite can be empty string if not available, or a URL
  sprite: z.string(),
  // Species data (from /pokemon-species endpoint)
  isLegendary: z.boolean().optional(),
  isMythical: z.boolean().optional(),
  flavorText: z.string().optional(), // English Pokedex entry
  eggGroups: z.array(z.string()).optional(),
  genus: z.string().optional(), // e.g., "Seed Pokémon"
});

export type PokemonType = z.infer<typeof PokemonTypeSchema>;
export type PokemonStats = z.infer<typeof PokemonStatsSchema>;
export type PokemonParent = z.infer<typeof PokemonParentSchema>;
