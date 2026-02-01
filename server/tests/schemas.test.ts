import { describe, it, expect } from "vitest";
import {
  GeneratedChildSchema,
  BattleJudgmentSchema,
  PokemonParentSchema,
} from "@pokefusion/shared";

describe("GeneratedChildSchema", () => {
  const validChild = {
    name: "Pikazard",
    types: ["electric", "fire"],
    stats: {
      hp: 58,
      attack: 72,
      defense: 60,
      specialAttack: 95,
      specialDefense: 65,
      speed: 88,
    },
    abilities: ["Static Blaze"],
    signatureMove: {
      name: "Thunder Flare",
      type: "electric",
      power: 90,
      description: "A powerful electric fire attack",
    },
    description: "A fusion of Pikachu and Charizard",
  };

  it("accepts valid child data", () => {
    const result = GeneratedChildSchema.safeParse(validChild);
    expect(result.success).toBe(true);
  });

  it("rejects stats out of range (hp > 255)", () => {
    const invalidChild = {
      ...validChild,
      stats: { ...validChild.stats, hp: 300 },
    };
    const result = GeneratedChildSchema.safeParse(invalidChild);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("hp");
    }
  });

  it("rejects stats out of range (attack < 1)", () => {
    const invalidChild = {
      ...validChild,
      stats: { ...validChild.stats, attack: 0 },
    };
    const result = GeneratedChildSchema.safeParse(invalidChild);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("attack");
    }
  });

  it("rejects missing required fields", () => {
    const incompleteChild = {
      name: "Pikazard",
      types: ["electric"],
      // Missing stats, abilities, signatureMove, description
    };
    const result = GeneratedChildSchema.safeParse(incompleteChild);
    expect(result.success).toBe(false);
  });

  it("rejects more than 2 types", () => {
    const invalidChild = {
      ...validChild,
      types: ["electric", "fire", "water"],
    };
    const result = GeneratedChildSchema.safeParse(invalidChild);
    expect(result.success).toBe(false);
  });

  it("rejects empty types array", () => {
    const invalidChild = {
      ...validChild,
      types: [],
    };
    const result = GeneratedChildSchema.safeParse(invalidChild);
    expect(result.success).toBe(false);
  });
});

describe("BattleJudgmentSchema", () => {
  const validJudgment = {
    winner: "child1" as const,
    confidence: 72,
    reasoning:
      "Pikazard's superior Speed stat allows it to strike first and its Electric/Fire typing gives it good coverage.",
    keyFactors: ["Speed advantage", "Type coverage"],
    ruleViolations: [],
  };

  it("accepts valid judgment data", () => {
    const result = BattleJudgmentSchema.safeParse(validJudgment);
    expect(result.success).toBe(true);
  });

  it("rejects invalid winner value", () => {
    const invalidJudgment = {
      ...validJudgment,
      winner: "child3",
    };
    const result = BattleJudgmentSchema.safeParse(invalidJudgment);
    expect(result.success).toBe(false);
  });

  it("rejects confidence out of range", () => {
    const invalidJudgment = {
      ...validJudgment,
      confidence: 150,
    };
    const result = BattleJudgmentSchema.safeParse(invalidJudgment);
    expect(result.success).toBe(false);
  });

  it("rejects reasoning that is too short", () => {
    const invalidJudgment = {
      ...validJudgment,
      reasoning: "Too short",
    };
    const result = BattleJudgmentSchema.safeParse(invalidJudgment);
    expect(result.success).toBe(false);
  });
});

describe("PokemonParentSchema", () => {
  const validPokemon = {
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
    abilities: ["static", "lightning-rod"],
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
  };

  it("accepts valid Pokemon data", () => {
    const result = PokemonParentSchema.safeParse(validPokemon);
    expect(result.success).toBe(true);
  });

  it("rejects invalid sprite URL", () => {
    const invalidPokemon = {
      ...validPokemon,
      sprite: "not-a-url",
    };
    const result = PokemonParentSchema.safeParse(invalidPokemon);
    expect(result.success).toBe(false);
  });
});
