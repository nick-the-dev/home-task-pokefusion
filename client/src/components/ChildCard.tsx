import type { GeneratedChild } from "@pokefusion/shared";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { getTypeColor, getStatColor } from "@/lib/typeColors";

interface ChildCardProps {
  child: GeneratedChild;
  label: string;
  isWinner?: boolean;
}

export function ChildCard({ child, label, isWinner = false }: ChildCardProps) {
  return (
    <Card className={`h-full ${isWinner ? "ring-2 ring-green-500" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          {isWinner && <Badge className="bg-green-500 text-white">Winner</Badge>}
        </div>
        <CardTitle className="text-xl">{child.name}</CardTitle>
        <div className="flex gap-1">
          {child.types.map((type) => (
            <Badge key={type} className={`${getTypeColor(type)} text-white text-xs`}>
              {type}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Stats</h4>
          <div className="space-y-2 text-sm">
            {[
              { label: "HP", value: child.stats.hp },
              { label: "ATK", value: child.stats.attack },
              { label: "DEF", value: child.stats.defense },
              { label: "Sp.Atk", value: child.stats.specialAttack },
              { label: "Sp.Def", value: child.stats.specialDefense },
              { label: "Speed", value: child.stats.speed },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-muted-foreground w-12 text-xs">{label}</span>
                <Progress
                  value={value}
                  className="h-2 flex-1"
                  indicatorClassName={getStatColor(value)}
                />
                <span className="w-6 text-right text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-1">Abilities</h4>
          <div className="flex flex-wrap gap-1">
            {child.abilities.map((ability) => (
              <Badge key={ability} variant="outline" className="text-xs">
                {ability}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-1">Signature Move</h4>
          <div className="p-2 sm:p-3 bg-secondary rounded-md">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="font-medium">{child.signatureMove.name}</span>
              <Badge className={`${getTypeColor(child.signatureMove.type)} text-white text-xs`}>
                {child.signatureMove.type}
              </Badge>
              <span className="text-xs text-muted-foreground">Power: {child.signatureMove.power}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{child.signatureMove.description}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground italic">{child.description}</p>
      </CardContent>
    </Card>
  );
}
