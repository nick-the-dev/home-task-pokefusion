import type { PokemonParent, PokemonListItem } from "@pokefusion/shared";
import { logStart, logEnd, logError } from "../utils/logger.js";

const POKEAPI_BASE_URL = process.env.POKEAPI_BASE_URL || "https://pokeapi.co/api/v2";

interface PokeAPIResponse {
  id: number;
  name: string;
  types: Array<{ type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  abilities: Array<{ ability: { name: string } }>;
  sprites: { front_default: string };
}

interface PokeAPIListResponse {
  count: number;
  results: Array<{ name: string; url: string }>;
}

export async function fetchPokemonById(id: number): Promise<PokemonParent> {
  const startTime = logStart("POKEAPI", `fetchPokemonById(${id})`);

  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon ${id}: ${response.statusText}`);
    }

    const data = (await response.json()) as PokeAPIResponse;
    const pokemon = transformPokemonResponse(data);

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
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${name.toLowerCase()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon ${name}: ${response.statusText}`);
    }

    const data = (await response.json()) as PokeAPIResponse;
    const pokemon = transformPokemonResponse(data);

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
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon list: ${response.statusText}`);
    }

    const data = (await response.json()) as PokeAPIListResponse;

    const pokemon: PokemonListItem[] = data.results.map((p, index) => ({
      id: offset + index + 1,
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

function transformPokemonResponse(data: PokeAPIResponse): PokemonParent {
  const statsMap: Record<string, number> = {};
  data.stats.forEach((s) => {
    statsMap[s.stat.name] = s.base_stat;
  });

  return {
    id: data.id,
    name: data.name,
    types: data.types.map((t) => t.type.name),
    stats: {
      hp: statsMap["hp"] || 0,
      attack: statsMap["attack"] || 0,
      defense: statsMap["defense"] || 0,
      specialAttack: statsMap["special-attack"] || 0,
      specialDefense: statsMap["special-defense"] || 0,
      speed: statsMap["speed"] || 0,
    },
    abilities: data.abilities.map((a) => a.ability.name),
    sprite: data.sprites.front_default || "",
  };
}
