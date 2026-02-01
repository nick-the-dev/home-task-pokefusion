import { useState } from "react";
import type { BattleRequest } from "@pokefusion/shared";
import { usePokemon } from "./hooks/usePokemon";
import { useBattle } from "./hooks/useBattle";
import { PokemonSelector } from "./components/PokemonSelector";
import { ChildCard } from "./components/ChildCard";
import { BattleVerdict } from "./components/BattleVerdict";
import { LoadingState } from "./components/LoadingState";
import { Button } from "./components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

interface PairSelection {
  parent1: number | null;
  parent2: number | null;
}

function App() {
  const { pokemon, loading: pokemonLoading, error: pokemonError } = usePokemon();
  const { battle, loading: battleLoading, error: battleError, runBattle, reset } = useBattle();

  const [pairA, setPairA] = useState<PairSelection>({ parent1: null, parent2: null });
  const [pairB, setPairB] = useState<PairSelection>({ parent1: null, parent2: null });

  const canBattle =
    pairA.parent1 !== null &&
    pairA.parent2 !== null &&
    pairB.parent1 !== null &&
    pairB.parent2 !== null;

  const handleBattle = async () => {
    if (!canBattle) return;

    const request: BattleRequest = {
      pairA: {
        parent1Id: pairA.parent1!,
        parent2Id: pairA.parent2!,
      },
      pairB: {
        parent1Id: pairB.parent1!,
        parent2Id: pairB.parent2!,
      },
    };

    await runBattle(request);
  };

  const handleReroll = async () => {
    if (!canBattle) return;

    reset();
    const request: BattleRequest = {
      pairA: {
        parent1Id: pairA.parent1!,
        parent2Id: pairA.parent2!,
      },
      pairB: {
        parent1Id: pairB.parent1!,
        parent2Id: pairB.parent2!,
      },
    };
    await runBattle(request);
  };

  if (pokemonLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-lg">Loading Pokefusion...</p>
        </div>
      </div>
    );
  }

  if (pokemonError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error Loading Pokemon</AlertTitle>
          <AlertDescription>{pokemonError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">POKEFUSION</h1>
          <p className="text-muted-foreground">Pokemon Breeding Battle Arena</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Parent Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pair A */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pair A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <PokemonSelector
                  pokemon={pokemon}
                  selectedId={pairA.parent1}
                  onSelect={(id) => setPairA((prev) => ({ ...prev, parent1: id }))}
                  label="Parent 1"
                  disabled={battleLoading}
                />
                <PokemonSelector
                  pokemon={pokemon}
                  selectedId={pairA.parent2}
                  onSelect={(id) => setPairA((prev) => ({ ...prev, parent2: id }))}
                  label="Parent 2"
                  disabled={battleLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pair B */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pair B</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <PokemonSelector
                  pokemon={pokemon}
                  selectedId={pairB.parent1}
                  onSelect={(id) => setPairB((prev) => ({ ...prev, parent1: id }))}
                  label="Parent 3"
                  disabled={battleLoading}
                />
                <PokemonSelector
                  pokemon={pokemon}
                  selectedId={pairB.parent2}
                  onSelect={(id) => setPairB((prev) => ({ ...prev, parent2: id }))}
                  label="Parent 4"
                  disabled={battleLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Battle Button */}
        <div className="flex justify-center">
          <Button size="lg" onClick={handleBattle} disabled={!canBattle || battleLoading} className="px-8">
            {battleLoading ? "Generating..." : "Generate Children & Battle"}
          </Button>
        </div>

        {/* Error Display */}
        {battleError && (
          <Alert variant="destructive">
            <AlertTitle>Battle Error</AlertTitle>
            <AlertDescription>{battleError}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {battleLoading && <LoadingState message="Generating Children & Judging Battle..." />}

        {/* Battle Results */}
        {battle && !battleLoading && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-center">Generated Offspring</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChildCard
                child={battle.children.child1}
                label={`Child 1 (from ${battle.parents.pairA.parent1.name} & ${battle.parents.pairA.parent2.name})`}
                isWinner={battle.battle.winner === "child1"}
              />
              <ChildCard
                child={battle.children.child2}
                label={`Child 2 (from ${battle.parents.pairB.parent1.name} & ${battle.parents.pairB.parent2.name})`}
                isWinner={battle.battle.winner === "child2"}
              />
            </div>

            <BattleVerdict
              judgment={battle.battle}
              child1={battle.children.child1}
              child2={battle.children.child2}
            />

            <div className="flex justify-center">
              <Button variant="outline" size="lg" onClick={handleReroll} className="px-8">
                Reroll
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
