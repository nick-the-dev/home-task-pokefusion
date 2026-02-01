/**
 * Pokemon type colors for consistent styling across components
 */
export const TYPE_COLORS: Record<string, string> = {
  normal: "bg-gray-400",
  fire: "bg-orange-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-cyan-300",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-amber-600",
  flying: "bg-indigo-300",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-stone-500",
  ghost: "bg-purple-700",
  dragon: "bg-violet-600",
  dark: "bg-gray-700",
  steel: "bg-slate-400",
  fairy: "bg-pink-300",
};

/**
 * Get the Tailwind background color class for a Pokemon type
 * Returns a default gray color if type is not found
 */
export function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? "bg-gray-500";
}

/**
 * Get stat bar color based on stat value (1-255 range)
 */
export function getStatColor(value: number): string {
  if (value < 30) return "bg-red-500";
  if (value < 50) return "bg-orange-400";
  if (value < 70) return "bg-yellow-400";
  if (value < 90) return "bg-lime-400";
  return "bg-green-500";
}
