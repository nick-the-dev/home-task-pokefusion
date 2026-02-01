import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch before importing the module
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import {
  loadTypeMatchups,
  getTypeMatchups,
  calculateEffectiveness,
  getTypeEffectivenessSummary,
  _resetCacheForTesting,
} from "../src/services/typeMatchups";

describe("Type Matchups Service", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    _resetCacheForTesting();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createMockTypeResponse = (
    typeName: string,
    damageRelations: {
      double_damage_to?: string[];
      half_damage_to?: string[];
      no_damage_to?: string[];
      double_damage_from?: string[];
      half_damage_from?: string[];
      no_damage_from?: string[];
    } = {}
  ) => ({
    name: typeName,
    damage_relations: {
      double_damage_to: (damageRelations.double_damage_to || []).map((name) => ({ name })),
      half_damage_to: (damageRelations.half_damage_to || []).map((name) => ({ name })),
      no_damage_to: (damageRelations.no_damage_to || []).map((name) => ({ name })),
      double_damage_from: (damageRelations.double_damage_from || []).map((name) => ({ name })),
      half_damage_from: (damageRelations.half_damage_from || []).map((name) => ({ name })),
      no_damage_from: (damageRelations.no_damage_from || []).map((name) => ({ name })),
    },
  });

  describe("loadTypeMatchups", () => {
    it("fetches all 18 type matchups", async () => {
      // Mock responses for all types
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              createMockTypeResponse("normal", {
                no_damage_to: ["ghost"],
                double_damage_from: ["fighting"],
                no_damage_from: ["ghost"],
              })
            ),
        })
      );

      const matchups = await loadTypeMatchups();

      // Should have fetched all 18 types
      expect(mockFetch).toHaveBeenCalledTimes(18);
      expect(Object.keys(matchups).length).toBe(18);
    });

    it("handles failed type fetch gracefully", async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        // Fail the first call, succeed the rest
        if (callCount === 1) {
          return Promise.resolve({ ok: false, statusText: "Not Found" });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTypeResponse("fire")),
        });
      });

      const matchups = await loadTypeMatchups();

      // Should still have loaded the other types
      expect(Object.keys(matchups).length).toBe(17);
    });
  });

  describe("calculateEffectiveness", () => {
    beforeEach(async () => {
      // Set up mock type data
      mockFetch.mockImplementation((url: string) => {
        const typeName = url.split("/").filter(Boolean).pop();

        const typeData: Record<string, ReturnType<typeof createMockTypeResponse>> = {
          fire: createMockTypeResponse("fire", {
            double_damage_to: ["grass", "ice", "bug", "steel"],
            half_damage_to: ["fire", "water", "rock", "dragon"],
            no_damage_to: [],
          }),
          water: createMockTypeResponse("water", {
            double_damage_to: ["fire", "ground", "rock"],
            half_damage_to: ["water", "grass", "dragon"],
            no_damage_to: [],
          }),
          grass: createMockTypeResponse("grass", {
            double_damage_to: ["water", "ground", "rock"],
            half_damage_to: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
            no_damage_to: [],
          }),
          electric: createMockTypeResponse("electric", {
            double_damage_to: ["water", "flying"],
            half_damage_to: ["electric", "grass", "dragon"],
            no_damage_to: ["ground"],
          }),
          ground: createMockTypeResponse("ground", {
            double_damage_to: ["fire", "electric", "poison", "rock", "steel"],
            half_damage_to: ["grass", "bug"],
            no_damage_to: ["flying"],
          }),
          normal: createMockTypeResponse("normal", {
            double_damage_to: [],
            half_damage_to: ["rock", "steel"],
            no_damage_to: ["ghost"],
          }),
        };

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(typeData[typeName!] || createMockTypeResponse(typeName!)),
        });
      });

      await loadTypeMatchups();
    });

    it("returns 2 for super effective attacks", () => {
      const effectiveness = calculateEffectiveness("fire", ["grass"]);
      expect(effectiveness).toBe(2);
    });

    it("returns 0.5 for not very effective attacks", () => {
      const effectiveness = calculateEffectiveness("fire", ["water"]);
      expect(effectiveness).toBe(0.5);
    });

    it("returns 0 for immune attacks", () => {
      const effectiveness = calculateEffectiveness("ground", ["flying"]);
      expect(effectiveness).toBe(0);
    });

    it("returns 1 for neutral attacks", () => {
      const effectiveness = calculateEffectiveness("fire", ["normal"]);
      expect(effectiveness).toBe(1);
    });

    it("returns 4 for double super effective (dual type)", () => {
      // Fire is super effective against both grass and ice
      const effectiveness = calculateEffectiveness("fire", ["grass", "ice"]);
      expect(effectiveness).toBe(4);
    });

    it("returns 0.25 for double not very effective (dual type)", () => {
      // Fire is not very effective against both water and rock
      const effectiveness = calculateEffectiveness("fire", ["water", "rock"]);
      expect(effectiveness).toBe(0.25);
    });

    it("returns 0 when one type is immune (dual type)", () => {
      // Normal does no damage to ghost
      const effectiveness = calculateEffectiveness("normal", ["ghost", "poison"]);
      expect(effectiveness).toBe(0);
    });
  });

  describe("getTypeEffectivenessSummary", () => {
    beforeEach(async () => {
      // Set up comprehensive mock data
      mockFetch.mockImplementation((url: string) => {
        const typeName = url.split("/").filter(Boolean).pop();

        const typeData: Record<string, ReturnType<typeof createMockTypeResponse>> = {
          fire: createMockTypeResponse("fire", {
            double_damage_to: ["grass", "ice"],
          }),
          water: createMockTypeResponse("water", {
            double_damage_to: ["fire"],
          }),
          grass: createMockTypeResponse("grass", {
            double_damage_to: ["water"],
          }),
          electric: createMockTypeResponse("electric", {
            no_damage_to: ["ground"],
          }),
          ground: createMockTypeResponse("ground", {
            double_damage_to: ["electric"],
            no_damage_to: ["flying"],
          }),
          flying: createMockTypeResponse("flying", {}),
        };

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(typeData[typeName!] || createMockTypeResponse(typeName!)),
        });
      });

      await loadTypeMatchups();
    });

    it("identifies types the Pokemon is weak to", () => {
      const summary = getTypeEffectivenessSummary(["grass"]);
      expect(summary.weakTo).toContain("fire");
    });

    it("identifies types the Pokemon is immune to", () => {
      const summary = getTypeEffectivenessSummary(["flying"]);
      expect(summary.immuneTo).toContain("ground");
    });
  });

  describe("getTypeMatchups", () => {
    it("returns null when matchups are not loaded", () => {
      // Cache is reset in beforeEach, so should be null
      const matchups = getTypeMatchups();
      expect(matchups).toBeNull();
    });

    it("returns matchups after loading", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockTypeResponse("normal")),
        })
      );

      await loadTypeMatchups();
      const matchups = getTypeMatchups();
      expect(matchups).not.toBeNull();
      expect(Object.keys(matchups!).length).toBe(18);
    });
  });
});
