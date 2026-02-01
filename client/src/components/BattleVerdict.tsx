import type { BattleJudgment, GeneratedChild } from "@pokefusion/shared";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface BattleVerdictProps {
  judgment: BattleJudgment;
  child1: GeneratedChild;
  child2: GeneratedChild;
}

export function BattleVerdict({ judgment, child1, child2 }: BattleVerdictProps) {
  const winner = judgment.winner === "child1" ? child1 : child2;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Battle Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4">
            <div className={`text-lg ${judgment.winner === "child1" ? "font-bold" : "text-muted-foreground"}`}>
              {child1.name}
            </div>
            <span className="text-2xl font-bold text-muted-foreground">VS</span>
            <div className={`text-lg ${judgment.winner === "child2" ? "font-bold" : "text-muted-foreground"}`}>
              {child2.name}
            </div>
          </div>
        </div>

        <div className="bg-secondary p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-1">Predicted Winner</p>
          <p className="text-2xl font-bold text-green-600">{winner.name}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Confidence</span>
            <span className="font-medium">{judgment.confidence}%</span>
          </div>
          <Progress value={judgment.confidence} className="h-3" />
        </div>

        <div>
          <h4 className="font-semibold mb-2">Reasoning</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{judgment.reasoning}</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Key Factors</h4>
          <ul className="space-y-1">
            {judgment.keyFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-500">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {judgment.ruleViolations && judgment.ruleViolations.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Rule Violations Detected</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                {judgment.ruleViolations.map((violation, index) => (
                  <li key={index} className="text-sm">
                    • {violation}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
