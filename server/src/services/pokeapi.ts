import type { PokemonParent, PokemonListItem, PokemonType } from "@pokefusion/shared";
import { POKEMON_TYPES } from "@pokefusion/shared";
import { logStart, logEnd, logError } from "../utils/logger.js";

const POKEAPI_BASE_URL = process.env.POKEAPI_BASE_URL || "https://pokeapi.co/api/v2";
const FETCH_TIMEOUT_MS = 10000; // 10 second timeout for PokeAPI calls

/**
 * Creates a fetch request with timeout using AbortController
 */
async function fetchWithTimeout(url: string, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

interface PokeAPIResponse {
  id: number;
  name: string;
  height: number; // decimeters
  weight: number; // hectograms
  types: Array<{ type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  abilities: Array<{ ability: { name: string } }>;
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: {
        front_default: string | null;
      };
    };
  };
}

interface PokeAPIListResponse {
  count: number;
  results: Array<{ name: string; url: string }>;
}

interface PokeAPISpeciesResponse {
  is_legendary: boolean;
  is_mythical: boolean;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
  egg_groups: Array<{ name: string }>;
  genera: Array<{
    genus: string;
    language: { name: string };
  }>;
}

interface SpeciesData {
  isLegendary: boolean;
  isMythical: boolean;
  flavorText: string;
  eggGroups: string[];
  genus: string;
}

/**
 * Fetches species data (legendary status, flavor text, etc.) for a Pokemon
 */
async function fetchSpeciesData(id: number): Promise<SpeciesData | null> {
  try {
    const response = await fetchWithTimeout(`${POKEAPI_BASE_URL}/pokemon-species/${id}`);

    if (!response.ok) {
      // Species data is optional, so we just return null if it fails
      return null;
    }

    const data = (await response.json()) as PokeAPISpeciesResponse;

    // Find English flavor text and clean up escape characters
    const englishFlavorText = data.flavor_text_entries.find(
      (entry) => entry.language.name === "en"
    );
    const flavorText = englishFlavorText?.flavor_text
      .replace(/\f/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "";

    // Find English genus
    const englishGenus = data.genera.find(
      (entry) => entry.language.name === "en"
    );

    return {
      isLegendary: data.is_legendary,
      isMythical: data.is_mythical,
      flavorText,
      eggGroups: data.egg_groups.map((g) => g.name),
      genus: englishGenus?.genus || "",
    };
  } catch {
    // Species data is optional, don't fail the whole request
    return null;
  }
}

export async function fetchPokemonById(id: number): Promise<PokemonParent> {
  const startTime = logStart("POKEAPI", `fetchPokemonById(${id})`);

  try {
    // Fetch Pokemon data and species data in parallel
    const [pokemonResponse, speciesData] = await Promise.all([
      fetchWithTimeout(`${POKEAPI_BASE_URL}/pokemon/${id}`),
      fetchSpeciesData(id),
    ]);

    if (!pokemonResponse.ok) {
      throw new Error(`Failed to fetch Pokemon ${id}: ${pokemonResponse.statusText}`);
    }

    const data = (await pokemonResponse.json()) as PokeAPIResponse;
    const pokemon = transformPokemonResponse(data, speciesData);

    logEnd("POKEAPI", `fetchPokemonById(${id})`, startTime, `${pokemon.name} (${pokemon.types.join(", ")})`);
    return pokemon;
  } catch (error) {
    logError("POKEAPI", `fetchPokemonById(${id}) failed`, error);
    throw error;
  }
}

export async function fetchPokemonByName(name: string): Promise<PokemonParent> {
  const startTime = logStart("POKEAPI", `fetchPokemonByName("${name}")`);

  try {
    const response = await fetchWithTimeout(`${POKEAPI_BASE_URL}/pokemon/${name.toLowerCase()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon ${name}: ${response.statusText}`);
    }

    const data = (await response.json()) as PokeAPIResponse;

    // Fetch species data using the Pokemon ID
    const speciesData = await fetchSpeciesData(data.id);
    const pokemon = transformPokemonResponse(data, speciesData);

    logEnd("POKEAPI", `fetchPokemonByName("${name}")`, startTime, `id:${pokemon.id} (${pokemon.types.join(", ")})`);
    return pokemon;
  } catch (error) {
    logError("POKEAPI", `fetchPokemonByName("${name}") failed`, error);
    throw error;
  }
}

export async function fetchPokemonList(limit: number = 151, offset: number = 0): Promise<{
  pokemon: PokemonListItem[];
  total: number;
}> {
  const startTime = logStart("POKEAPI", `fetchPokemonList(limit=${limit}, offset=${offset})`);

  try {
    const response = await fetchWithTimeout(`${POKEAPI_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon list: ${response.statusText}`);
    }

    const data = (await response.json()) as PokeAPIListResponse;

    // Extract ID from URL (e.g., "https://pokeapi.co/api/v2/pokemon/25/" -> 25)
    const pokemon: PokemonListItem[] = data.results.map((p) => ({
      id: parseInt(p.url.split('/').filter(Boolean).pop()!, 10),
      name: p.name,
    }));

    logEnd("POKEAPI", `fetchPokemonList(limit=${limit}, offset=${offset})`, startTime, `${pokemon.length} pokemon, total: ${data.count}`);
    return {
      pokemon,
      total: data.count,
    };
  } catch (error) {
    logError("POKEAPI", `fetchPokemonList(limit=${limit}, offset=${offset}) failed`, error);
    throw error;
  }
}

// Type guard to check if a string is a valid Pokemon type
function isValidPokemonType(type: string): type is PokemonType {
  return (POKEMON_TYPES as readonly string[]).includes(type);
}

function transformPokemonResponse(
  data: PokeAPIResponse,
  speciesData: SpeciesData | null = null
): PokemonParent {
  const statsMap: Record<string, number> = {};
  data.stats.forEach((s) => {
    statsMap[s.stat.name] = s.base_stat;
  });

  // Filter to only valid Pokemon types (in case PokeAPI adds new types)
  const validTypes = data.types
    .map((t) => t.type.name)
    .filter(isValidPokemonType);

  // Prefer official artwork, fall back to front_default
  const sprite =
    data.sprites.other?.["official-artwork"]?.front_default ||
    data.sprites.front_default ||
    "";

  const pokemon: PokemonParent = {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    types: validTypes.length > 0 ? validTypes : ["normal"], // Default to normal if no valid types
    stats: {
      hp: statsMap["hp"] || 0,
      attack: statsMap["attack"] || 0,
      defense: statsMap["defense"] || 0,
      specialAttack: statsMap["special-attack"] || 0,
      specialDefense: statsMap["special-defense"] || 0,
      speed: statsMap["speed"] || 0,
    },
    abilities: data.abilities.map((a) => a.ability.name),
    sprite,
  };

  // Add species data if available
  if (speciesData) {
    pokemon.isLegendary = speciesData.isLegendary;
    pokemon.isMythical = speciesData.isMythical;
    pokemon.flavorText = speciesData.flavorText;
    pokemon.eggGroups = speciesData.eggGroups;
    pokemon.genus = speciesData.genus;
  }

  return pokemon;
}
