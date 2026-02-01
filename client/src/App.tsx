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

interface ParentSelection {
  id: number | null;
  locked: boolean;
}

function App() {
  const { pokemon, loading: pokemonLoading, error: pokemonError } = usePokemon();
  const { battle, loading: battleLoading, error: battleError, runBattle, reset } = useBattle();

  const [pairA, setPairA] = useState<{ parent1: ParentSelection; parent2: ParentSelection }>({
    parent1: { id: null, locked: false },
    parent2: { id: null, locked: false },
  });

  const [pairB, setPairB] = useState<{ parent1: ParentSelection; parent2: ParentSelection }>({
    parent1: { id: null, locked: false },
    parent2: { id: null, locked: false },
  });

  const canBattle =
    pairA.parent1.id !== null &&
    pairA.parent2.id !== null &&
    pairB.parent1.id !== null &&
    pairB.parent2.id !== null;

  const handleBattle = async () => {
    if (!canBattle) return;

    const request: BattleRequest = {
      pairA: {
        parent1Id: pairA.parent1.id!,
        parent2Id: pairA.parent2.id!,
      },
      pairB: {
        parent1Id: pairB.parent1.id!,
        parent2Id: pairB.parent2.id!,
      },
    };

    await runBattle(request);
  };

  const handleReroll = () => {
    reset();
    handleBattle();
  };

  if (pokemonLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-lg">Loading Pokemon...</p>
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
                  selectedId={pairA.parent1.id}
                  locked={pairA.parent1.locked}
                  onSelect={(id) => setPairA((prev) => ({ ...prev, parent1: { ...prev.parent1, id } }))}
                  onLockChange={(locked) =>
                    setPairA((prev) => ({ ...prev, parent1: { ...prev.parent1, locked } }))
                  }
                  label="Parent 1"
                  disabled={battleLoading}
                />
                <PokemonSelector
                  pokemon={pokemon}
                  selectedId={pairA.parent2.id}
                  locked={pairA.parent2.locked}
                  onSelect={(id) => setPairA((prev) => ({ ...prev, parent2: { ...prev.parent2, id } }))}
                  onLockChange={(locked) =>
                    setPairA((prev) => ({ ...prev, parent2: { ...prev.parent2, locked } }))
                  }
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
                  selectedId={pairB.parent1.id}
                  locked={pairB.parent1.locked}
                  onSelect={(id) => setPairB((prev) => ({ ...prev, parent1: { ...prev.parent1, id } }))}
                  onLockChange={(locked) =>
                    setPairB((prev) => ({ ...prev, parent1: { ...prev.parent1, locked } }))
                  }
                  label="Parent 3"
                  disabled={battleLoading}
                />
                <PokemonSelector
                  pokemon={pokemon}
                  selectedId={pairB.parent2.id}
                  locked={pairB.parent2.locked}
                  onSelect={(id) => setPairB((prev) => ({ ...prev, parent2: { ...prev.parent2, id } }))}
                  onLockChange={(locked) =>
                    setPairB((prev) => ({ ...prev, parent2: { ...prev.parent2, locked } }))
                  }
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
                label="Child 1 (from Pair A)"
                isWinner={battle.battle.winner === "child1"}
              />
              <ChildCard
                child={battle.children.child2}
                label="Child 2 (from Pair B)"
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
