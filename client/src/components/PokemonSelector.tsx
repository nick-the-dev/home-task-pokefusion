import { useState, useMemo, useRef, useCallback, useEffect, useId, type SyntheticEvent, type KeyboardEvent } from "react";
import type { PokemonListItem } from "@pokefusion/shared";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandInput } from "./ui/command";

interface PokemonSelectorProps {
  pokemon: PokemonListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  label: string;
  disabled?: boolean;
}

function formatPokemonName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatPokemonId(id: number): string {
  return `#${id.toString().padStart(3, "0")}`;
}

const ITEM_HEIGHT = 32;
const LIST_HEIGHT = 300;

// Pokeball placeholder for failed image loads
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23f0f0f0' stroke='%23ccc' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='15' fill='%23fff' stroke='%23ccc' stroke-width='2'/%3E%3Cline x1='5' y1='50' x2='35' y2='50' stroke='%23ccc' stroke-width='2'/%3E%3Cline x1='65' y1='50' x2='95' y2='50' stroke='%23ccc' stroke-width='2'/%3E%3C/svg%3E";

export function PokemonSelector({
  pokemon,
  selectedId,
  onSelect,
  label,
  disabled = false,
}: PokemonSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);
  const selectedPokemon = pokemon.find((p) => p.id === selectedId);
  const labelId = useId();
  const buttonId = useId();

  // Filter Pokemon based on search input
  const filteredPokemon = useMemo(() => {
    if (!search) {
      return pokemon;
    }
    const searchLower = search.toLowerCase();
    return pokemon.filter((p) => p.name.toLowerCase().includes(searchLower));
  }, [pokemon, search]);

  const virtualizer = useVirtualizer({
    count: filteredPokemon.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  // Re-measure when popover opens or filtered list changes
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        virtualizer.measure();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, filteredPokemon.length, virtualizer]);

  const handleSelect = useCallback((p: PokemonListItem) => {
    onSelect(p.id);
    setOpen(false);
    setSearch("");
  }, [onSelect]);

  const handleImageError = useCallback((e: SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  }, []);

  // Keyboard navigation for list items
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, p: PokemonListItem) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(p);
    }
  }, [handleSelect]);

  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-3">
        <label id={labelId} htmlFor={buttonId} className="text-sm font-medium text-muted-foreground">
          {label}
        </label>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={buttonId}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-labelledby={labelId}
              disabled={disabled}
              className="w-full justify-between"
            >
              {selectedPokemon
                ? `${formatPokemonId(selectedPokemon.id)} ${formatPokemonName(selectedPokemon.name)}`
                : "Select Pokemon..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search Pokemon..."
                value={search}
                onValueChange={setSearch}
              />
              <div
                ref={parentRef}
                style={{ height: LIST_HEIGHT, overflow: "auto" }}
              >
                {filteredPokemon.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No Pokemon found.
                  </p>
                ) : (
                  <div
                    style={{
                      height: virtualizer.getTotalSize(),
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const p = filteredPokemon[virtualItem.index];
                      const isSelected = selectedId === p.id;
                      return (
                        <div
                          key={p.id}
                          role="option"
                          aria-selected={isSelected}
                          tabIndex={0}
                          className={cn(
                            "absolute left-0 right-0 flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                            isSelected && "bg-accent text-accent-foreground"
                          )}
                          style={{
                            height: ITEM_HEIGHT,
                            top: 0,
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                          onClick={() => handleSelect(p)}
                          onKeyDown={(e) => handleKeyDown(e, p)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 flex-shrink-0",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            {formatPokemonId(p.id)} {formatPokemonName(p.name)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedPokemon && (
          <div className="text-center space-y-2">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPokemon.id}.png`}
              alt={`${selectedPokemon.name} sprite`}
              className="w-24 h-24 mx-auto"
              style={{ imageRendering: "pixelated" }}
              onError={handleImageError}
            />
            <p className="font-semibold capitalize">{selectedPokemon.name}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
