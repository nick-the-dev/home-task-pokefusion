import { Router, type Request, type Response } from "express";
import {
  BattleRequestSchema,
  type BattleRequest,
  type BattleResponse,
  type PokemonListResponse,
} from "@pokefusion/shared";
import { fetchPokemonById, fetchPokemonList } from "../services/pokeapi.js";
import { generateChildFromPair } from "../services/generator.js";
import { judgeBattle } from "../services/judge.js";
import { logStart, logEnd, logPhase, logInfo, logError } from "../utils/logger.js";

export const apiRouter = Router();

// GET /api/pokemon - List available Pokemon
apiRouter.get("/pokemon", async (_req: Request, res: Response) => {
  const startTime = logStart("API", "GET /api/pokemon", { limit: 5000, offset: 0 });

  try {
    const limit = 5000;
    const offset = 0;

    const { pokemon, total } = await fetchPokemonList(limit, offset);

    const response: PokemonListResponse = {
      pokemon,
      total,
      limit,
      offset,
    };

    logEnd("API", "GET /api/pokemon", startTime, `${pokemon.length} pokemon returned`);
    res.json(response);
  } catch (error) {
    logError("API", "GET /api/pokemon failed", error);
    res.status(500).json({
      error: "Failed to fetch Pokemon list",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Valid Pokemon ID range (Gen 1-9 as of 2024)
const MIN_POKEMON_ID = 1;
const MAX_POKEMON_ID = 1025;

// GET /api/pokemon/:id - Get single Pokemon details
apiRouter.get("/pokemon/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const startTime = logStart("API", `GET /api/pokemon/${id}`);

  try {
    if (isNaN(id) || id < MIN_POKEMON_ID || id > MAX_POKEMON_ID) {
      logError("API", `Invalid Pokemon ID: ${req.params.id} (must be ${MIN_POKEMON_ID}-${MAX_POKEMON_ID})`);
      res.status(400).json({
        error: "Invalid Pokemon ID",
        details: `ID must be between ${MIN_POKEMON_ID} and ${MAX_POKEMON_ID}`,
      });
      return;
    }

    const pokemon = await fetchPokemonById(id);
    logEnd("API", `GET /api/pokemon/${id}`, startTime, `${pokemon.name} (${pokemon.types.join(", ")})`);
    res.json(pokemon);
  } catch (error) {
    logError("API", `GET /api/pokemon/${id} failed`, error);
    res.status(500).json({
      error: "Failed to fetch Pokemon",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/battle - Generate children and judge battle
apiRouter.post("/battle", async (req: Request, res: Response) => {
  const startTime = logStart("API", "POST /api/battle");
  // Log only IDs for security (avoid logging full payload)
  logInfo("API", "Battle request IDs:", {
    pairA: { parent1Id: req.body?.pairA?.parent1Id, parent2Id: req.body?.pairA?.parent2Id },
    pairB: { parent1Id: req.body?.pairB?.parent1Id, parent2Id: req.body?.pairB?.parent2Id },
  });

  try {
    // Validate request body
    const parseResult = BattleRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorDetails = parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      logError("API", "Invalid request body", { errors: errorDetails });
      res.status(400).json({
        error: "Invalid request body",
        details: errorDetails,
      });
      return;
    }

    const battleRequest: BattleRequest = parseResult.data;

    // Phase 1: Fetch parent Pokemon
    logPhase("API", "Phase 1: Fetching parent Pokemon");

    const [pairAParent1, pairAParent2, pairBParent1, pairBParent2] = await Promise.all([
      fetchPokemonById(battleRequest.pairA.parent1Id),
      fetchPokemonById(battleRequest.pairA.parent2Id),
      fetchPokemonById(battleRequest.pairB.parent1Id),
      fetchPokemonById(battleRequest.pairB.parent2Id),
    ]);

    logInfo("API", "Parents fetched:", {
      pairA: [pairAParent1.name, pairAParent2.name],
      pairB: [pairBParent1.name, pairBParent2.name],
    });

    // Phase 2: Generate children
    logPhase("API", "Phase 2: Generating children");

    const [child1, child2] = await Promise.all([
      generateChildFromPair(pairAParent1, pairAParent2),
      generateChildFromPair(pairBParent1, pairBParent2),
    ]);

    logInfo("API", "Children generated:", {
      child1: { name: child1.name, types: child1.types },
      child2: { name: child2.name, types: child2.types },
    });

    // Phase 3: Judge battle
    logPhase("API", "Phase 3: Judging battle");

    const battle = await judgeBattle(child1, child2);

    logInfo("API", "Battle judged:", {
      winner: battle.winner,
      confidence: battle.confidence,
      keyFactors: battle.keyFactors,
    });

    const response: BattleResponse = {
      parents: {
        pairA: { parent1: pairAParent1, parent2: pairAParent2 },
        pairB: { parent1: pairBParent1, parent2: pairBParent2 },
      },
      children: {
        child1,
        child2,
      },
      battle: {
        ...battle,
      },
    };

    const winnerName = battle.winner === "child1" ? child1.name : child2.name;
    logEnd("API", "POST /api/battle", startTime, `Winner: ${winnerName} (${battle.confidence}% confidence)`);
    res.json(response);
  } catch (error) {
    logError("API", "POST /api/battle failed", error);
    res.status(500).json({
      error: "Failed to complete battle",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
