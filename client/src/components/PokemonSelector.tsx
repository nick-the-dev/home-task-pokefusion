import type { PokemonListItem } from "@pokefusion/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";

interface PokemonSelectorProps {
  pokemon: PokemonListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  label: string;
  disabled?: boolean;
}

export function PokemonSelector({
  pokemon,
  selectedId,
  onSelect,
  label,
  disabled = false,
}: PokemonSelectorProps) {
  const selectedPokemon = pokemon.find((p) => p.id === selectedId);

  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>

        <Select
          value={selectedId?.toString() || ""}
          onValueChange={(v) => onSelect(parseInt(v, 10))}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Pokemon" />
          </SelectTrigger>
          <SelectContent>
            {pokemon.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                #{p.id.toString().padStart(3, "0")} {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPokemon && (
          <div className="text-center space-y-2">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPokemon.id}.png`}
              alt={selectedPokemon.name}
              className="w-24 h-24 mx-auto"
              style={{ imageRendering: "pixelated" }}
            />
            <p className="font-semibold capitalize">{selectedPokemon.name}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
