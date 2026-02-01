import { Router, type Request, type Response } from "express";
import {
  BattleRequestSchema,
  type BattleRequest,
  type BattleResponse,
  type PokemonListResponse,
  type PokemonParent,
} from "@pokefusion/shared";
import { fetchPokemonById, fetchPokemonList } from "../services/pokeapi.js";
import { generateChildFromPair } from "../services/generator.js";
import { judgeBattle } from "../services/judge.js";

export const apiRouter = Router();

// GET /api/pokemon - List available Pokemon
apiRouter.get("/pokemon", async (_req: Request, res: Response) => {
  try {
    const limit = 151; // Gen 1 Pokemon
    const offset = 0;

    const { pokemon, total } = await fetchPokemonList(limit, offset);

    const response: PokemonListResponse = {
      pokemon,
      total,
      limit,
      offset,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching Pokemon list:", error);
    res.status(500).json({
      error: "Failed to fetch Pokemon list",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/pokemon/:id - Get single Pokemon details
apiRouter.get("/pokemon/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid Pokemon ID" });
      return;
    }

    const pokemon = await fetchPokemonById(id);
    res.json(pokemon);
  } catch (error) {
    console.error("Error fetching Pokemon:", error);
    res.status(500).json({
      error: "Failed to fetch Pokemon",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/battle - Generate children and judge battle
apiRouter.post("/battle", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parseResult = BattleRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      });
      return;
    }

    const battleRequest: BattleRequest = parseResult.data;

    console.log("Fetching parent Pokemon...");

    // Fetch all parent Pokemon in parallel
    const [pairAParent1, pairAParent2, pairBParent1, pairBParent2] = await Promise.all([
      fetchPokemonById(battleRequest.pairA.parent1Id),
      fetchPokemonById(battleRequest.pairA.parent2Id),
      fetchPokemonById(battleRequest.pairB.parent1Id),
      fetchPokemonById(battleRequest.pairB.parent2Id),
    ]);

    console.log("Generating children...");

    // Generate children in parallel
    const [child1, child2] = await Promise.all([
      generateChildFromPair(pairAParent1, pairAParent2),
      generateChildFromPair(pairBParent1, pairBParent2),
    ]);

    console.log("Judging battle...");

    // Judge the battle
    const battle = await judgeBattle(child1, child2);

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
        // Add winner name for convenience
      },
    };

    console.log("Battle complete!");
    res.json(response);
  } catch (error) {
    console.error("Error in battle:", error);
    res.status(500).json({
      error: "Failed to complete battle",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
