# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

- **Never mention Claude in commits** - Do not include "Claude", "AI", "Co-Authored-By: Claude", or any AI attribution in commit messages.

## Build & Run Commands

```bash
# Install dependencies (from root)
npm install

# Development - run both server and client
npm run dev

# Or run separately:
npm run dev:server    # Server at http://localhost:3001
npm run dev:client    # Client at http://localhost:5173

# Build all workspaces (must build shared first)
npm run build

# Run all tests
npm run test
npm run test:server   # Server tests only
npm run test:client   # Client tests only

# Run a single test file
cd server && npx vitest run tests/schemas.test.ts
cd client && npx vitest run tests/components.test.tsx

# Mutation testing
cd server && npm run test:mutation
cd client && npm run test:mutation
```

## Environment Setup

Copy `.env.example` to `.env` in the root directory. Required variables:
- `OPENROUTER_API_KEY` - API key for LLM calls
- `GENERATOR_MODEL` - Model for generating child Pokemon
- `JUDGE_MODEL` - Model for battle judging

## Architecture

This is a **monorepo using npm workspaces** with three packages:

### shared/ (`@pokefusion/shared`)
Zod schemas that define types and runtime validation. Both server and client import from here.
- `schemas/pokemon.ts` - Parent Pokemon data structure
- `schemas/child.ts` - Generated child structure (stats, abilities, signature move)
- `schemas/battle.ts` - Battle judgment result
- `schemas/api.ts` - Request/response schemas for all API endpoints

### server/ (`@pokefusion/server`)
Express backend that orchestrates the battle flow:
- `routes/api.ts` - Three endpoints: `GET /api/pokemon`, `GET /api/pokemon/:id`, `POST /api/battle`
- `services/pokeapi.ts` - Fetches Pokemon data from PokeAPI
- `services/openrouter.ts` - LLM client with retry logic and JSON schema validation
- `services/generator.ts` - Creates child Pokemon from parent pairs
- `services/judge.ts` - Determines battle winner
- `prompts/` - System prompts for LLM generation and judging
- `utils/retry.ts` - Generic retry utility with exponential backoff

### client/ (`@pokefusion/client`)
React + Vite frontend:
- `App.tsx` - Main UI with Pokemon selection and battle results
- `components/` - PokemonSelector, ChildCard, BattleVerdict, LoadingState
- `components/ui/` - shadcn/ui primitives (Button, Card, Select, etc.)
- `hooks/usePokemon.ts` - Fetches Pokemon list
- `hooks/useBattle.ts` - Triggers battle API call
- `lib/api.ts` - API client functions

### Data Flow
1. User selects 4 parent Pokemon (2 pairs) via PokemonSelector
2. `POST /api/battle` fetches parent data from PokeAPI
3. Generator LLM creates 2 offspring (one per pair) in parallel
4. Judge LLM evaluates both children and determines winner
5. Full response with parents, children, and battle result returned to client

## Key Patterns

- **Zod for validation**: All API responses are validated against schemas before being returned. The `callLLMWithRetry` function parses LLM JSON output and validates it.
- **Path alias**: Client uses `@/*` to import from `./src/*`
- **Vite proxy**: Client proxies `/api` requests to the server in development
- **Parallel operations**: Parent fetching and child generation run in parallel where possible
