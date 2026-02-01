import type { PokemonListItem } from "@pokefusion/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Card, CardContent } from "./ui/card";

interface PokemonSelectorProps {
  pokemon: PokemonListItem[];
  selectedId: number | null;
  locked: boolean;
  onSelect: (id: number) => void;
  onLockChange: (locked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function PokemonSelector({
  pokemon,
  selectedId,
  locked,
  onSelect,
  onLockChange,
  label,
  disabled = false,
}: PokemonSelectorProps) {
  const selectedPokemon = pokemon.find((p) => p.id === selectedId);

  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className="flex items-center gap-2">
            <Checkbox id={`lock-${label}`} checked={locked} onCheckedChange={(c) => onLockChange(c === true)} />
            <label htmlFor={`lock-${label}`} className="text-sm text-muted-foreground cursor-pointer">
              Lock
            </label>
          </div>
        </div>

        <Select
          value={selectedId?.toString() || ""}
          onValueChange={(v) => onSelect(parseInt(v, 10))}
          disabled={disabled || locked}
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
