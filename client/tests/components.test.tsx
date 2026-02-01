import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BattleVerdict } from "../src/components/BattleVerdict";
import { ChildCard } from "../src/components/ChildCard";
import type { GeneratedChild, BattleJudgment } from "@pokefusion/shared";

const mockChild1: GeneratedChild = {
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
    description: "A devastating electric fire attack",
  },
  description: "A fusion of Pikachu and Charizard",
};

const mockChild2: GeneratedChild = {
  name: "Bulbsquirt",
  types: ["grass", "water"],
  stats: {
    hp: 46,
    attack: 55,
    defense: 68,
    specialAttack: 78,
    specialDefense: 72,
    speed: 52,
  },
  abilities: ["Overgrow", "Torrent"],
  signatureMove: {
    name: "Hydro Seed",
    type: "grass",
    power: 85,
    description: "Launches seeds propelled by water",
  },
  description: "A fusion of Bulbasaur and Squirtle",
};

const mockJudgment: BattleJudgment = {
  winner: "child1",
  confidence: 72,
  reasoning:
    "Pikazard's superior Speed stat allows it to strike first. Its Electric/Fire typing gives it neutral matchup against Grass/Water. The signature move Thunder Flare can deal super-effective damage.",
  keyFactors: ["Speed advantage", "Type coverage", "Higher Special Attack"],
};

describe("BattleVerdict", () => {
  it("displays child1 as winner when judgment.winner is 'child1'", () => {
    render(
      <BattleVerdict judgment={mockJudgment} child1={mockChild1} child2={mockChild2} />
    );

    expect(screen.getByText(/Predicted Winner/i)).toBeInTheDocument();
    // Winner name appears multiple times (in VS section and winner section)
    const winnerElements = screen.getAllByText("Pikazard");
    expect(winnerElements.length).toBeGreaterThan(0);
    // Bulbsquirt should not be in the "winner" section text
    const winnerSection = screen.getByText(/Predicted Winner/i).closest("div");
    expect(winnerSection).toHaveTextContent("Pikazard");
  });

  it("displays child2 as winner when judgment.winner is 'child2'", () => {
    const child2WinsJudgment: BattleJudgment = {
      ...mockJudgment,
      winner: "child2",
    };

    render(
      <BattleVerdict judgment={child2WinsJudgment} child1={mockChild1} child2={mockChild2} />
    );

    // The predicted winner section should show Bulbsquirt
    const winnerSection = screen.getByText(/Predicted Winner/i).closest("div");
    expect(winnerSection).toHaveTextContent("Bulbsquirt");
  });

  it("shows confidence percentage", () => {
    render(
      <BattleVerdict judgment={mockJudgment} child1={mockChild1} child2={mockChild2} />
    );

    expect(screen.getByText("72%")).toBeInTheDocument();
  });

  it("displays reasoning text", () => {
    render(
      <BattleVerdict judgment={mockJudgment} child1={mockChild1} child2={mockChild2} />
    );

    expect(
      screen.getByText(/Pikazard's superior Speed stat allows it to strike first/i)
    ).toBeInTheDocument();
  });

  it("displays key factors", () => {
    render(
      <BattleVerdict judgment={mockJudgment} child1={mockChild1} child2={mockChild2} />
    );

    expect(screen.getByText("Speed advantage")).toBeInTheDocument();
    expect(screen.getByText("Type coverage")).toBeInTheDocument();
  });

  it("displays rule violations when present", () => {
    const judgmentWithViolations: BattleJudgment = {
      ...mockJudgment,
      ruleViolations: ["Stats exceed maximum"],
    };

    render(
      <BattleVerdict
        judgment={judgmentWithViolations}
        child1={mockChild1}
        child2={mockChild2}
      />
    );

    expect(screen.getByText(/Rule Violations/i)).toBeInTheDocument();
    expect(screen.getByText(/Stats exceed maximum/i)).toBeInTheDocument();
  });

  it("does not display rule violations when array is empty", () => {
    const judgmentWithEmptyViolations: BattleJudgment = {
      ...mockJudgment,
      ruleViolations: [],
    };

    render(
      <BattleVerdict
        judgment={judgmentWithEmptyViolations}
        child1={mockChild1}
        child2={mockChild2}
      />
    );

    expect(screen.queryByText(/Rule Violations/i)).not.toBeInTheDocument();
  });

  it("does not display rule violations when undefined", () => {
    render(
      <BattleVerdict
        judgment={mockJudgment}
        child1={mockChild1}
        child2={mockChild2}
      />
    );

    expect(screen.queryByText(/Rule Violations/i)).not.toBeInTheDocument();
  });
});

describe("ChildCard", () => {
  it("displays child name", () => {
    render(<ChildCard child={mockChild1} label="Child 1" />);

    expect(screen.getByText("Pikazard")).toBeInTheDocument();
  });

  it("displays child types", () => {
    render(<ChildCard child={mockChild1} label="Child 1" />);

    // Types appear multiple times (header and signature move), so we check they exist
    const electricBadges = screen.getAllByText("electric");
    const fireBadges = screen.getAllByText("fire");
    expect(electricBadges.length).toBeGreaterThan(0);
    expect(fireBadges.length).toBeGreaterThan(0);
  });

  it("displays stats correctly", () => {
    render(<ChildCard child={mockChild1} label="Child 1" />);

    expect(screen.getByText("58")).toBeInTheDocument(); // HP
    expect(screen.getByText("88")).toBeInTheDocument(); // Speed
  });

  it("displays signature move name", () => {
    render(<ChildCard child={mockChild1} label="Child 1" />);

    expect(screen.getByText("Thunder Flare")).toBeInTheDocument();
  });

  it("shows winner badge when isWinner is true", () => {
    render(<ChildCard child={mockChild1} label="Child 1" isWinner={true} />);

    expect(screen.getByText("Winner")).toBeInTheDocument();
  });

  it("does not show winner badge when isWinner is false", () => {
    render(<ChildCard child={mockChild1} label="Child 1" isWinner={false} />);

    expect(screen.queryByText("Winner")).not.toBeInTheDocument();
  });

  it("defaults isWinner to false when not provided", () => {
    render(<ChildCard child={mockChild1} label="Child 1" />);

    // Should not show winner badge when isWinner is not provided (defaults to false)
    expect(screen.queryByText("Winner")).not.toBeInTheDocument();
  });

  it("displays abilities", () => {
    render(<ChildCard child={mockChild2} label="Child 2" />);

    expect(screen.getByText("Overgrow")).toBeInTheDocument();
    expect(screen.getByText("Torrent")).toBeInTheDocument();
  });

  it("displays signature move power section", () => {
    render(<ChildCard child={mockChild1} label="Child 1" />);

    // Power section is displayed
    expect(screen.getByText(/Power:/)).toBeInTheDocument();
  });
});
