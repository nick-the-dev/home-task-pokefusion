import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { useState, useEffect } from "react";

const STAGES = [
  "Analyzing parent Pokemon...",
  "Creating Pair A offspring...",
  "Creating Pair B offspring...",
  "Judging battle outcome...",
] as const;

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Generating..." }: LoadingStateProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 500);

    const stageInterval = setInterval(() => {
      setStage((prev) => (prev + 1) % STAGES.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, []);

  return (
    <Card>
      <CardContent className="p-8 text-center space-y-6">
        <div className="space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-lg font-semibold">{message}</p>
          <p className="text-sm text-muted-foreground">{STAGES[stage]}</p>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="space-y-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
