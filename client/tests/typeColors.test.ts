import { describe, it, expect } from "vitest";
import { TYPE_COLORS, getTypeColor, getStatColor } from "../src/lib/typeColors";

describe("TYPE_COLORS", () => {
  it("contains all 18 Pokemon types", () => {
    const expectedTypes = [
      "normal", "fire", "water", "electric", "grass", "ice",
      "fighting", "poison", "ground", "flying", "psychic", "bug",
      "rock", "ghost", "dragon", "dark", "steel", "fairy",
    ];

    expectedTypes.forEach((type) => {
      expect(TYPE_COLORS[type]).toBeDefined();
    });
  });

  it("maps each type to a Tailwind bg- class", () => {
    Object.values(TYPE_COLORS).forEach((colorClass) => {
      expect(colorClass).toMatch(/^bg-/);
    });
  });
});

describe("getTypeColor", () => {
  it("returns the correct color for known types", () => {
    expect(getTypeColor("fire")).toBe("bg-orange-500");
    expect(getTypeColor("water")).toBe("bg-blue-500");
    expect(getTypeColor("electric")).toBe("bg-yellow-400");
  });

  it("handles case-insensitive input", () => {
    expect(getTypeColor("FIRE")).toBe("bg-orange-500");
    expect(getTypeColor("Fire")).toBe("bg-orange-500");
    expect(getTypeColor("fIrE")).toBe("bg-orange-500");
  });

  it("returns default gray for unknown types", () => {
    expect(getTypeColor("unknown")).toBe("bg-gray-500");
    expect(getTypeColor("shadow")).toBe("bg-gray-500");
    expect(getTypeColor("")).toBe("bg-gray-500");
  });
});

describe("getStatColor", () => {
  it("returns red for very low stats", () => {
    expect(getStatColor(1)).toBe("bg-red-500");
    expect(getStatColor(29)).toBe("bg-red-500");
  });

  it("returns orange for low stats", () => {
    expect(getStatColor(30)).toBe("bg-orange-400");
    expect(getStatColor(49)).toBe("bg-orange-400");
  });

  it("returns yellow for average stats", () => {
    expect(getStatColor(50)).toBe("bg-yellow-400");
    expect(getStatColor(69)).toBe("bg-yellow-400");
  });

  it("returns lime for good stats", () => {
    expect(getStatColor(70)).toBe("bg-lime-400");
    expect(getStatColor(89)).toBe("bg-lime-400");
  });

  it("returns green for excellent stats", () => {
    expect(getStatColor(90)).toBe("bg-green-500");
    expect(getStatColor(100)).toBe("bg-green-500");
    expect(getStatColor(255)).toBe("bg-green-500");
  });
});
