import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch before importing the module
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import { fetchPokemonById, fetchPokemonList } from "../src/services/pokeapi";

describe("PokéAPI Service", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("fetchPokemonById", () => {
    const mockPokemonResponse = {
      id: 25,
      name: "pikachu",
      types: [{ type: { name: "electric" } }],
      stats: [
        { base_stat: 35, stat: { name: "hp" } },
        { base_stat: 55, stat: { name: "attack" } },
        { base_stat: 40, stat: { name: "defense" } },
        { base_stat: 50, stat: { name: "special-attack" } },
        { base_stat: 50, stat: { name: "special-defense" } },
        { base_stat: 90, stat: { name: "speed" } },
      ],
      abilities: [{ ability: { name: "static" } }],
      sprites: {
        front_default:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
      },
    };

    it("fetches and transforms Pokemon data correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPokemonResponse),
      });

      const result = await fetchPokemonById(25);

      expect(result).toEqual({
        id: 25,
        name: "pikachu",
        types: ["electric"],
        stats: {
          hp: 35,
          attack: 55,
          defense: 40,
          specialAttack: 50,
          specialDefense: 50,
          speed: 90,
        },
        abilities: ["static"],
        sprite:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
      });
    });

    it("correctly maps all stat names", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPokemonResponse),
      });

      const result = await fetchPokemonById(25);

      // Verify each stat is correctly mapped
      expect(result.stats.hp).toBe(35);
      expect(result.stats.attack).toBe(55);
      expect(result.stats.defense).toBe(40);
      expect(result.stats.specialAttack).toBe(50);
      expect(result.stats.specialDefense).toBe(50);
      expect(result.stats.speed).toBe(90);
    });

    it("handles Pokemon with dual types", async () => {
      const dualTypePokemon = {
        ...mockPokemonResponse,
        types: [
          { type: { name: "fire" } },
          { type: { name: "flying" } },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dualTypePokemon),
      });

      const result = await fetchPokemonById(6);

      expect(result.types).toEqual(["fire", "flying"]);
      expect(result.types).toHaveLength(2);
    });

    it("handles Pokemon with multiple abilities", async () => {
      const multiAbilityPokemon = {
        ...mockPokemonResponse,
        abilities: [
          { ability: { name: "static" } },
          { ability: { name: "lightning-rod" } },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(multiAbilityPokemon),
      });

      const result = await fetchPokemonById(25);

      expect(result.abilities).toEqual(["static", "lightning-rod"]);
    });

    it("throws error for non-existent Pokemon", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      await expect(fetchPokemonById(9999)).rejects.toThrow(
        "Failed to fetch Pokemon 9999"
      );
    });

    it("includes Pokemon ID in error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
      });

      await expect(fetchPokemonById(123)).rejects.toThrow("123");
    });

    it("handles Pokemon with null sprite", async () => {
      const pokemonWithNullSprite = {
        ...mockPokemonResponse,
        sprites: {
          front_default: null,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(pokemonWithNullSprite),
      });

      const result = await fetchPokemonById(25);
      expect(result.sprite).toBe("");
    });

    it("handles Pokemon with missing sprite object", async () => {
      const pokemonWithoutSprite = {
        ...mockPokemonResponse,
        sprites: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(pokemonWithoutSprite),
      });

      const result = await fetchPokemonById(25);
      expect(result.sprite).toBe("");
    });

    it("includes statusText in error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      await expect(fetchPokemonById(999)).rejects.toThrow("Not Found");
    });
  });

  describe("fetchPokemonList", () => {
    it("fetches and transforms list data correctly", async () => {
      const mockResponse = {
        count: 1302,
        results: [
          { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
          { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchPokemonList(2, 0);

      expect(result).toEqual({
        pokemon: [
          { id: 1, name: "bulbasaur" },
          { id: 2, name: "ivysaur" },
        ],
        total: 1302,
      });
    });

    it("correctly calculates IDs with offset", async () => {
      const mockResponse = {
        count: 1302,
        results: [
          { name: "mew", url: "https://pokeapi.co/api/v2/pokemon/151/" },
          { name: "chikorita", url: "https://pokeapi.co/api/v2/pokemon/152/" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchPokemonList(2, 150);

      // IDs should be offset + index + 1
      expect(result.pokemon[0].id).toBe(151);
      expect(result.pokemon[1].id).toBe(152);
    });

    it("returns total count from API", async () => {
      const mockResponse = {
        count: 1302,
        results: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchPokemonList(0, 0);

      expect(result.total).toBe(1302);
    });

    it("throws error when API fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Service Unavailable",
      });

      await expect(fetchPokemonList(10, 0)).rejects.toThrow(
        "Failed to fetch Pokemon list"
      );
    });

    it("calls API with correct limit and offset parameters", async () => {
      const mockResponse = {
        count: 100,
        results: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchPokemonList(20, 40);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=20"),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("offset=40"),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it("calculates Pokemon ID from offset and index", async () => {
      const mockResponse = {
        count: 1302,
        results: [
          { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // ID is calculated as offset + index + 1
      const result = await fetchPokemonList(1, 24);

      expect(result.pokemon[0].id).toBe(25); // 24 + 0 + 1 = 25
    });

    it("includes statusText in list error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Gateway",
      });

      await expect(fetchPokemonList(10, 0)).rejects.toThrow("Bad Gateway");
    });
  });
});
