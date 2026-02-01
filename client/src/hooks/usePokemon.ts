import { useState, useEffect } from "react";
import type { PokemonListItem } from "@pokefusion/shared";
import { fetchPokemonList } from "../lib/api";

interface UsePokemonResult {
  pokemon: PokemonListItem[];
  loading: boolean;
  error: string | null;
}

export function usePokemon(): UsePokemonResult {
  const [pokemon, setPokemon] = useState<PokemonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPokemon() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchPokemonList();
        setPokemon(response.pokemon);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Pokemon");
      } finally {
        setLoading(false);
      }
    }

    loadPokemon();
  }, []);

  return { pokemon, loading, error };
}
