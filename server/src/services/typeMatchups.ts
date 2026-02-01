import type { PokemonType } from "@pokefusion/shared";
import { POKEMON_TYPES } from "@pokefusion/shared";
import { logStart, logEnd, logError, logInfo } from "../utils/logger.js";

const POKEAPI_BASE_URL = process.env.POKEAPI_BASE_URL || "https://pokeapi.co/api/v2";
const FETCH_TIMEOUT_MS = 10000;

interface PokeAPITypeResponse {
  name: string;
  damage_relations: {
    double_damage_to: Array<{ name: string }>;
    half_damage_to: Array<{ name: string }>;
    no_damage_to: Array<{ name: string }>;
    double_damage_from: Array<{ name: string }>;
    half_damage_from: Array<{ name: string }>;
    no_damage_from: Array<{ name: string }>;
  };
}

export interface TypeMatchup {
  doubleDamageTo: string[];
  halfDamageTo: string[];
  noDamageTo: string[];
  doubleDamageFrom: string[];
  halfDamageFrom: string[];
  noDamageFrom: string[];
}

export type TypeMatchups = Record<string, TypeMatchup>;

// Cached type matchups - populated on server startup
let cachedMatchups: TypeMatchups | null = null;

/**
 * Resets the cached matchups. Only use for testing.
 */
export function _resetCacheForTesting(): void {
  cachedMatchups = null;
}

/**
 * Fetches a single type's matchup data from PokeAPI
 */
async function fetchTypeData(typeName: string): Promise<TypeMatchup | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(`${POKEAPI_BASE_URL}/type/${typeName}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as PokeAPITypeResponse;
    const relations = data.damage_relations;

    return {
      doubleDamageTo: relations.double_damage_to.map((t) => t.name),
      halfDamageTo: relations.half_damage_to.map((t) => t.name),
      noDamageTo: relations.no_damage_to.map((t) => t.name),
      doubleDamageFrom: relations.double_damage_from.map((t) => t.name),
      halfDamageFrom: relations.half_damage_from.map((t) => t.name),
      noDamageFrom: relations.no_damage_from.map((t) => t.name),
    };
  } catch {
    return null;
  }
}

/**
 * Loads all type matchups from PokeAPI.
 * Call this on server startup to cache the data.
 */
export async function loadTypeMatchups(): Promise<TypeMatchups> {
  if (cachedMatchups) {
    return cachedMatchups;
  }

  const startTime = logStart("TYPE_MATCHUPS", "Loading all type matchups");

  const matchups: TypeMatchups = {};

  // Fetch all 18 types in parallel
  const results = await Promise.all(
    POKEMON_TYPES.map(async (typeName) => {
      const matchup = await fetchTypeData(typeName);
      return { typeName, matchup };
    })
  );

  for (const { typeName, matchup } of results) {
    if (matchup) {
      matchups[typeName] = matchup;
    } else {
      logError("TYPE_MATCHUPS", `Failed to load matchup for type: ${typeName}`);
    }
  }

  cachedMatchups = matchups;
  logEnd("TYPE_MATCHUPS", "Loading all type matchups", startTime, `${Object.keys(matchups).length} types loaded`);

  return matchups;
}

/**
 * Gets the cached type matchups. Returns null if not loaded yet.
 */
export function getTypeMatchups(): TypeMatchups | null {
  return cachedMatchups;
}

/**
 * Calculates the effectiveness multiplier for an attack type against defense types.
 * Returns a multiplier: 0 (immune), 0.25, 0.5, 1, 2, or 4
 */
export function calculateEffectiveness(
  attackType: PokemonType,
  defenseTypes: PokemonType[]
): number {
  if (!cachedMatchups) {
    logInfo("TYPE_MATCHUPS", "Type matchups not loaded, returning neutral effectiveness");
    return 1;
  }

  const matchup = cachedMatchups[attackType];
  if (!matchup) {
    return 1;
  }

  let multiplier = 1;

  for (const defenseType of defenseTypes) {
    if (matchup.noDamageTo.includes(defenseType)) {
      multiplier *= 0;
    } else if (matchup.doubleDamageTo.includes(defenseType)) {
      multiplier *= 2;
    } else if (matchup.halfDamageTo.includes(defenseType)) {
      multiplier *= 0.5;
    }
  }

  return multiplier;
}

/**
 * Gets a summary of type effectiveness for display purposes.
 * Returns an object with super effective, not very effective, and immune types.
 */
export function getTypeEffectivenessSummary(types: PokemonType[]): {
  weakTo: string[];
  resistantTo: string[];
  immuneTo: string[];
} {
  if (!cachedMatchups) {
    return { weakTo: [], resistantTo: [], immuneTo: [] };
  }

  const weakTo: Set<string> = new Set();
  const resistantTo: Set<string> = new Set();
  const immuneTo: Set<string> = new Set();

  // For each attacking type, calculate effectiveness against our types
  for (const attackType of POKEMON_TYPES) {
    const effectiveness = calculateEffectiveness(attackType, types);

    if (effectiveness === 0) {
      immuneTo.add(attackType);
    } else if (effectiveness >= 2) {
      weakTo.add(attackType);
    } else if (effectiveness <= 0.5) {
      resistantTo.add(attackType);
    }
  }

  return {
    weakTo: Array.from(weakTo),
    resistantTo: Array.from(resistantTo),
    immuneTo: Array.from(immuneTo),
  };
}
