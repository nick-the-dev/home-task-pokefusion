import { useState, useCallback } from "react";
import type { BattleRequest, BattleResponse } from "@pokefusion/shared";
import { startBattle, ApiError } from "../lib/api";

interface UseBattleResult {
  battle: BattleResponse | null;
  loading: boolean;
  error: string | null;
  runBattle: (request: BattleRequest) => Promise<void>;
  reset: () => void;
}

export function useBattle(): UseBattleResult {
  const [battle, setBattle] = useState<BattleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBattle = useCallback(async (request: BattleRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await startBattle(request);
      setBattle(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.message}${err.details ? `: ${err.details}` : ""}`);
      } else {
        setError(err instanceof Error ? err.message : "Battle failed");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setBattle(null);
    setError(null);
  }, []);

  return { battle, loading, error, runBattle, reset };
}
