# Pokefusion Technical Documentation

Comprehensive technical documentation for the Pokefusion Pokemon Breeding Battle Arena application.

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Flow](#2-data-flow)
3. [Server Implementation](#3-server-implementation)
4. [Client Implementation](#4-client-implementation)
5. [Shared Schemas](#5-shared-schemas)
6. [API Reference](#6-api-reference)
7. [LLM Integration](#7-llm-integration)
8. [Testing](#8-testing)
9. [Deployment](#9-deployment)

---

## 1. Architecture Overview

### Monorepo Structure

Pokefusion uses npm workspaces to manage three interconnected packages:

```
home-task-pokefusion/
├── shared/           # @pokefusion/shared - Zod schemas & types
├── server/           # @pokefusion/server - Express backend
├── client/           # @pokefusion/client - React frontend
└── package.json      # Root workspace configuration
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, Vite, TypeScript | User interface |
| UI Components | shadcn/ui, Tailwind CSS | Design system |
| Backend | Express, TypeScript, Node.js 18+ | API server |
| Validation | Zod | Runtime type checking |
| LLM | OpenRouter API | Pokemon generation & battle judging |
| External API | PokeAPI | Pokemon data source |
| Testing | Vitest, React Testing Library | Unit & component tests |
| Mutation Testing | StrykerJS | Test quality validation |

### Dependency Flow

```
shared/
  ├── exports Zod schemas & inferred types
  │
  ├──▶ server/ imports for API validation
  │
  └──▶ client/ imports for type safety
```

---

## 2. Data Flow

### Complete Battle Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT                                          │
│                                                                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌────────────┐ │
│  │ Pokemon     │    │ Pokemon     │    │ Pokemon     │    │ Pokemon    │ │
│  │ Selector 1  │    │ Selector 2  │    │ Selector 3  │    │ Selector 4 │ │
│  │   Pair A    │    │   Pair A    │    │   Pair B    │    │   Pair B   │ │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └─────┬──────┘ │
│         │                  │                  │                  │        │
│         └────────┬─────────┘                  └─────────┬────────┘        │
│                  │                                      │                 │
│                  ▼                                      ▼                 │
│         ┌───────────────┐                      ┌───────────────┐          │
│         │    Pair A     │                      │    Pair B     │          │
│         │ parent1Id: 25 │                      │ parent1Id: 1  │          │
│         │ parent2Id: 6  │                      │ parent2Id: 7  │          │
│         └───────┬───────┘                      └───────┬───────┘          │
│                 │                                      │                  │
│                 └──────────────┬───────────────────────┘                  │
│                                │                                          │
│                                ▼                                          │
│                    ┌───────────────────────┐                              │
│                    │  "Generate & Battle"  │                              │
│                    │       Button          │                              │
│                    └───────────┬───────────┘                              │
└────────────────────────────────│──────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │   POST /api/battle    │
                    │   BattleRequest       │
                    └───────────┬───────────┘
                                │
┌───────────────────────────────│───────────────────────────────────────────┐
│                           SERVER                                          │
│                               │                                           │
│                               ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                 PHASE 1: Fetch Parents (Parallel)                  │   │
│  │                                                                    │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐│   │
│  │   │PokeAPI fetch │  │PokeAPI fetch │  │PokeAPI fetch │  │PokeAPI ││   │
│  │   │  Parent 1A   │  │  Parent 2A   │  │  Parent 1B   │  │Parent 2B│   │
│  │   │  (10s timeout│  │  (10s timeout│  │  (10s timeout│  │(10s)   ││   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘  └────────┘│   │
│  │                      Promise.all()                                 │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                               │                                           │
│                               ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                PHASE 2: Generate Children (Parallel)              │   │
│  │                                                                    │   │
│  │   ┌─────────────────────────┐    ┌─────────────────────────┐      │   │
│  │   │   OpenRouter LLM        │    │   OpenRouter LLM        │      │   │
│  │   │   generateChild(A1, A2) │    │   generateChild(B1, B2) │      │   │
│  │   │   60s timeout           │    │   60s timeout           │      │   │
│  │   │   3 retries (backoff)   │    │   3 retries (backoff)   │      │   │
│  │   │                         │    │                         │      │   │
│  │   │   Output: Child 1       │    │   Output: Child 2       │      │   │
│  │   │   - name, types, stats  │    │   - name, types, stats  │      │   │
│  │   │   - abilities           │    │   - abilities           │      │   │
│  │   │   - signatureMove       │    │   - signatureMove       │      │   │
│  │   └─────────────────────────┘    └─────────────────────────┘      │   │
│  │                      Promise.all()                                 │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                               │                                           │
│                               ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                   PHASE 3: Judge Battle                            │   │
│  │                                                                    │   │
│  │   ┌─────────────────────────────────────────────────────────┐      │   │
│  │   │              OpenRouter LLM                              │      │   │
│  │   │              judgeBattle(child1, child2)                 │      │   │
│  │   │              60s timeout, 3 retries                      │      │   │
│  │   │                                                          │      │   │
│  │   │              Analyzes:                                   │      │   │
│  │   │              - Type matchups                             │      │   │
│  │   │              - Stat distributions                        │      │   │
│  │   │              - Signature move effectiveness              │      │   │
│  │   │              - Ability synergies                         │      │   │
│  │   │                                                          │      │   │
│  │   │              Output: BattleJudgment                      │      │   │
│  │   │              - winner: "child1" | "child2"               │      │   │
│  │   │              - confidence: 0-100                         │      │   │
│  │   │              - reasoning: 50-2000 chars                  │      │   │
│  │   │              - keyFactors: 1-5 items                     │      │   │
│  │   └─────────────────────────────────────────────────────────┘      │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                               │                                           │
│                               ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                    Assemble Response                               │   │
│  │                                                                    │   │
│  │   BattleResponse {                                                 │   │
│  │     parents: { pairA: {...}, pairB: {...} },                       │   │
│  │     children: { child1: {...}, child2: {...} },                    │   │
│  │     battle: { winner, confidence, reasoning, keyFactors }          │   │
│  │   }                                                                │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────│───────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           CLIENT                                          │
│                                                                           │
│  ┌─────────────────────────┐    ┌─────────────────────────┐              │
│  │      ChildCard          │    │      ChildCard          │              │
│  │      (Child 1)          │    │      (Child 2)          │              │
│  │                         │    │                         │              │
│  │   - Name & types        │    │   - Name & types        │              │
│  │   - Stats (progress)    │    │   - Stats (progress)    │              │
│  │   - Abilities           │    │   - Abilities           │              │
│  │   - Signature move      │    │   - Signature move      │              │
│  │   - Winner badge (if)   │    │   - Winner badge (if)   │              │
│  └─────────────────────────┘    └─────────────────────────┘              │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      BattleVerdict                                   │ │
│  │                                                                      │ │
│  │   - Winner name (highlighted)                                        │ │
│  │   - Confidence bar (0-100%)                                          │ │
│  │   - Reasoning text                                                   │ │
│  │   - Key factors (bullet list)                                        │ │
│  │   - Rule violations (if any)                                         │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

### Error Handling Flow

```
Request
   │
   ▼
┌─────────────────────┐
│ Zod Schema Validate │──▶ 400 Bad Request (validation errors)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   PokeAPI Fetch     │──▶ 500 Internal Error (fetch failed)
│   (10s timeout)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   LLM Generation    │──▶ Retry 1 (1s delay)
│   (attempt 1)       │    ──▶ Retry 2 (2s delay)
└──────────┬──────────┘        ──▶ Retry 3 (4s delay)
           │                        ──▶ 500 Error (all retries failed)
           ▼
┌─────────────────────┐
│   LLM Judging       │──▶ Same retry pattern
│   (attempt 1)       │
└──────────┬──────────┘
           │
           ▼
       Response
```

---

## 3. Server Implementation

### File Structure

```
server/src/
├── index.ts              # Express app configuration & startup
├── env.ts                # Environment variable validation
├── routes/
│   └── api.ts            # API route handlers
├── services/
│   ├── generator.ts      # Child Pokemon generation
│   ├── judge.ts          # Battle judgment
│   ├── openrouter.ts     # LLM client
│   ├── pokeapi.ts        # PokeAPI integration
│   └── typeMatchups.ts   # Type effectiveness
├── prompts/
│   ├── generator.ts      # Generation prompt template
│   └── judge.ts          # Judgment prompt template
└── utils/
    ├── logger.ts         # Structured logging
    └── retry.ts          # Retry with backoff
```

### Express Configuration (index.ts)

#### Middleware Stack

```typescript
// Applied in order:
1. helmet()           // Security headers
2. cors()             // Cross-origin requests
3. rateLimit()        // Rate limiting (100 req/15min)
4. express.json()     // JSON body parser (1MB limit)
```

#### Production vs Development

| Feature | Production | Development |
|---------|------------|-------------|
| Trust Proxy | Enabled (for rate limiting behind reverse proxy) | Disabled |
| CSP | Strict (`'self'` for scripts/styles) | Disabled |
| CORS | Restricted to `ALLOWED_ORIGINS` | All origins |
| Static Files | Served from `client/dist` | Not served (Vite dev server) |
| SPA Fallback | All non-API routes → `index.html` | Not needed |

#### Graceful Shutdown

```typescript
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
```

### Environment Configuration (env.ts)

#### Required Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API authentication |
| `GENERATOR_MODEL` | Model ID for child generation |
| `JUDGE_MODEL` | Model ID for battle judging |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `POKEAPI_BASE_URL` | `https://pokeapi.co/api/v2` | PokeAPI endpoint |
| `ALLOWED_ORIGINS` | - | CORS allowed origins (comma-separated) |

#### Fail-Fast Validation

Environment variables are validated at module load time. If any required variable is missing, the process exits with code 1 and a helpful error message.

### API Routes (routes/api.ts)

#### GET /api/pokemon

```typescript
// Response
{
  pokemon: [{ id: number, name: string }, ...],
  total: number,
  limit: number,   // 5000
  offset: number   // 0
}
```

#### GET /api/pokemon/:id

```typescript
// Validation: ID must be 1-1025
// Response: PokemonParent object
{
  id: number,
  name: string,
  height: number,          // decimeters
  weight: number,          // hectograms
  types: string[],         // 1-2 types
  stats: {
    hp, attack, defense,
    specialAttack, specialDefense, speed  // 1-255 each
  },
  abilities: string[],
  sprite: string,          // URL or empty
  isLegendary?: boolean,
  isMythical?: boolean,
  flavorText?: string,     // English Pokedex entry
  eggGroups?: string[],
  genus?: string           // e.g., "Seed Pokémon"
}
```

#### POST /api/battle

Three-phase execution with parallel operations where possible.

### Services

#### pokeapi.ts

```typescript
// Functions
fetchPokemonById(id: number): Promise<PokemonParent>
fetchPokemonByName(name: string): Promise<PokemonParent>
fetchPokemonList(limit: number, offset: number): Promise<PokemonListResponse>

// Features
- 10-second timeout with AbortController
- Parallel Pokemon + species data fetching
- Graceful species fetch fallback (optional data)
- Type validation against 18 official types
- Sprite preference: official artwork > front_default > empty
- Flavor text cleanup (escape chars, whitespace)
```

#### generator.ts

```typescript
// Main function
generateChildFromPair(parent1: PokemonParent, parent2: PokemonParent): Promise<GeneratedChild>

// Flow
1. Build prompt with parent details (buildGeneratorPrompt)
2. Call LLM with retry (generateChild wrapper)
3. Validate output against GeneratedChildSchema
4. Return typed child object

// Output
{
  name: string,           // 1-50 chars, fusion name
  types: string[],        // 1-2 types
  stats: {...},           // 6 stats, 1-255 each
  abilities: string[],    // 1-2 abilities
  signatureMove: {
    name, type, power (0-200), description
  },
  description: string     // 2-3 sentences
}
```

#### judge.ts

```typescript
// Main function
judgeBattle(child1: GeneratedChild, child2: GeneratedChild): Promise<BattleJudgment>

// Analysis criteria
1. Type matchups (advantages/disadvantages)
2. Stat distributions (speed = turn order)
3. Signature move effectiveness
4. Ability synergies and counters
5. Rule violations (unrealistic attributes)

// Output
{
  winner: "child1" | "child2",
  confidence: 0-100,
  reasoning: string,      // 50-2000 chars
  keyFactors: string[],   // 1-5 items
  ruleViolations?: string[]
}
```

#### openrouter.ts

```typescript
// LLM Configuration
- Temperature: 0.7
- Max tokens: 4000
- Response format: json_object
- Timeout: 60 seconds

// Public functions
callLLMWithRetry<T>(prompt, schema, model, maxRetries?): Promise<T>
generateChild<T>(prompt, schema): Promise<T>   // Uses GENERATOR_MODEL
judgeMatch<T>(prompt, schema): Promise<T>      // Uses JUDGE_MODEL

// Retry strategy
- Max attempts: 3
- Delay: 1000ms × 2^attempt
- Sequence: 1s → 2s → 4s

// Validation
- JSON parsing with error handling
- Zod schema validation
- Detailed error messages with field paths
```

#### typeMatchups.ts

```typescript
// Functions
loadTypeMatchups(): Promise<void>      // Call on server startup
calculateEffectiveness(attackType: string, defenseTypes: string[]): number
getTypeEffectivenessSummary(types: string[]): { weakTo, resistantTo, immuneTo }

// Effectiveness multipliers
0    = Immune (e.g., Normal vs Ghost)
0.25 = Double resist (dual type)
0.5  = Resist
1    = Neutral
2    = Super effective
4    = Double super effective (dual type)

// Caching
- Fetched once on startup
- Stored in memory
- 10-second timeout per type fetch
```

### Prompts

#### generator.ts Prompt

**Role**: Pokemon breeding expert

**Input structure**:
```
Parent 1: [Name]
- Types: [type1, type2]
- Stats: HP: X, Attack: X, Defense: X, Sp.Atk: X, Sp.Def: X, Speed: X
- Abilities: [ability1, ability2]

Parent 2: [Same format]
```

**Generation requirements**:
1. Fusion name (max 50 chars) - combines both parents
2. Types: 1-2 types inherited/combined
3. Stats: Blended from parents (1-255 range)
4. Abilities: 1-2 derived from parents
5. Signature move: name, type, power (0-200), description
6. Description: 2-3 sentences

**Output format**: Strict JSON matching GeneratedChildSchema

#### judge.ts Prompt

**Role**: Pokemon battle analyst

**Input structure**:
```
Child 1: [Name]
- Types: [types]
- Stats: [all 6 stats]
- Abilities: [abilities]
- Signature Move: [name] (Type: [type], Power: [power])
  Description: [description]

Child 2: [Same format]
```

**Analysis considerations**:
1. Type matchups
2. Stat distributions
3. Signature move effectiveness
4. Ability synergies
5. Rule violations

**Output format**: Strict JSON matching BattleJudgmentSchema

### Utilities

#### logger.ts

**Badge types**: API, POKEAPI, LLM, GENERATOR, JUDGE, RETRY, ERROR, TYPE_MATCHUPS

**Functions**:
```typescript
logStart(type, action, payload?): number  // Returns timestamp
logEnd(type, action, startTime, result?, payload?)
logInfo(type, message, payload?)
logError(type, message, error)
logRetry(attempt, maxRetries, error, delayMs?)
```

**Features**:
- ANSI color codes for visual distinction
- Duration tracking (ms or seconds)
- Payload truncation (500 chars max)
- Error stack trace extraction

#### retry.ts

```typescript
// Generic retry wrapper
withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>

interface RetryOptions {
  maxRetries?: number;  // Default: 3
  delayMs?: number;     // Default: 1000
}

// Backoff formula
delay = initialDelayMs × 2^attemptNumber
// Attempt 0: 1000ms
// Attempt 1: 2000ms
// Attempt 2: 4000ms

// Schema validation helper
validateWithSchema<T>(data: unknown, schema: ZodSchema<T>): T
```

---

## 4. Client Implementation

### File Structure

```
client/src/
├── App.tsx                    # Main application component
├── main.tsx                   # React entry point
├── components/
│   ├── BattleVerdict.tsx      # Battle result display
│   ├── ChildCard.tsx          # Generated Pokemon card
│   ├── LoadingState.tsx       # Loading animation
│   ├── PokemonSelector.tsx    # Pokemon dropdown
│   └── ui/                    # shadcn/ui primitives
├── hooks/
│   ├── useBattle.ts           # Battle API hook
│   └── usePokemon.ts          # Pokemon list hook
└── lib/
    ├── api.ts                 # API client
    ├── typeColors.ts          # Type color mappings
    └── utils.ts               # Tailwind utilities
```

### App.tsx - Main Application

#### State Management

```typescript
// Local state
const [pairA, setPairA] = useState({ parent1: null, parent2: null });
const [pairB, setPairB] = useState({ parent1: null, parent2: null });

// Custom hooks
const { pokemon, loading, error } = usePokemon();
const { battle, loading, error, runBattle, reset } = useBattle();

// Computed
const canBattle = pairA.parent1 && pairA.parent2 && pairB.parent1 && pairB.parent2;
```

#### User Flow

1. **Initial load**: Fetch Pokemon list via `usePokemon`
2. **Selection**: User picks 4 Pokemon using `PokemonSelector`
3. **Battle**: Click button triggers `handleBattle()`
4. **Loading**: Show `LoadingState` with progress
5. **Results**: Display `ChildCard` (×2) and `BattleVerdict`
6. **Reroll**: Keep parents, regenerate children

### Components

#### PokemonSelector.tsx

**Features**:
- Virtualized list (@tanstack/react-virtual) for 1000+ Pokemon
- Case-insensitive search filtering
- Sprite preview with fallback placeholder
- Keyboard navigation (Enter/Space to select)
- ARIA accessibility attributes

**Props**:
```typescript
interface PokemonSelectorProps {
  pokemon: PokemonListItem[];
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

#### ChildCard.tsx

**Display sections**:
1. Header: Label, name, type badges
2. Stats: 6 progress bars with color-coded values
3. Abilities: Outline badges
4. Signature move: Name, type, power, description
5. Description: Italic flavor text

**Props**:
```typescript
interface ChildCardProps {
  child: GeneratedChild;
  label: string;          // "Child 1", "Child 2"
  isWinner?: boolean;     // Green ring + badge
}
```

**Stat colors**:
| Range | Color |
|-------|-------|
| < 30 | Red |
| 30-50 | Orange |
| 50-70 | Yellow |
| 70-90 | Lime |
| ≥ 90 | Green |

#### BattleVerdict.tsx

**Display sections**:
1. Competitor names (winner bold, loser muted)
2. Winner box with highlighted name
3. Confidence progress bar (0-100%)
4. Reasoning text
5. Key factors bullet list
6. Rule violations alert (conditional)

**Props**:
```typescript
interface BattleVerdictProps {
  judgment: BattleJudgment;
  child1: GeneratedChild;
  child2: GeneratedChild;
}
```

#### LoadingState.tsx

**Multi-layer feedback**:
1. Spinning loader animation
2. Progress bar (0-95%, caps to prevent false completion)
3. Stage messages (rotates every 3 seconds):
   - "Analyzing parent Pokemon..."
   - "Creating Pair A offspring..."
   - "Creating Pair B offspring..."
   - "Judging battle outcome..."
4. Skeleton placeholders for results

### Hooks

#### useBattle.ts

```typescript
interface UseBattleResult {
  battle: BattleResponse | null;
  loading: boolean;
  error: string | null;
  runBattle: (request: BattleRequest) => Promise<void>;
  reset: () => void;
}

// Error handling
- Distinguishes ApiError (status + details) from generic errors
- Combines message + details for display
- Loading always set to false in finally block
```

#### usePokemon.ts

```typescript
interface UsePokemonResult {
  pokemon: PokemonListItem[];
  loading: boolean;
  error: string | null;
}

// Behavior
- Fetches on mount (empty dependency array)
- Loading starts as true (eager)
- No reset function (list is static)
```

### Lib

#### api.ts

```typescript
// Custom error class
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  )
}

// Generic fetch wrapper
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T>

// Exported functions
fetchPokemonList(): Promise<PokemonListResponse>
fetchPokemon(id: number): Promise<PokemonParent>
startBattle(request: BattleRequest): Promise<BattleResponse>
```

#### typeColors.ts

**TYPE_COLORS mapping**:
```typescript
{
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
  fairy: "bg-pink-300"
}
```

**Helper functions**:
```typescript
getTypeColor(type: string): string   // Case-insensitive, fallback: bg-gray-500
getStatColor(value: number): string  // 5-tier color system
```

---

## 5. Shared Schemas

### pokemon.ts

```typescript
// Constants
export const POKEMON_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy"
] as const;

// Schemas
export const PokemonTypeSchema = z.enum(POKEMON_TYPES);

export const PokemonStatsSchema = z.object({
  hp: z.number().min(1).max(255),
  attack: z.number().min(1).max(255),
  defense: z.number().min(1).max(255),
  specialAttack: z.number().min(1).max(255),
  specialDefense: z.number().min(1).max(255),
  speed: z.number().min(1).max(255),
});

export const PokemonParentSchema = z.object({
  id: z.number().min(1),
  name: z.string().min(1),
  height: z.number().min(0),
  weight: z.number().min(0),
  types: z.array(PokemonTypeSchema).min(1).max(2),
  stats: PokemonStatsSchema,
  abilities: z.array(z.string().min(1)).min(1),
  sprite: z.string(),
  isLegendary: z.boolean().optional(),
  isMythical: z.boolean().optional(),
  flavorText: z.string().optional(),
  eggGroups: z.array(z.string()).optional(),
  genus: z.string().optional(),
});

// Types
export type PokemonType = z.infer<typeof PokemonTypeSchema>;
export type PokemonStats = z.infer<typeof PokemonStatsSchema>;
export type PokemonParent = z.infer<typeof PokemonParentSchema>;
```

### child.ts

```typescript
export const SignatureMoveSchema = z.object({
  name: z.string(),
  type: z.string(),
  power: z.number().min(0).max(200),
  description: z.string(),
});

export const GeneratedChildStatsSchema = z.object({
  hp: z.number().min(1).max(255),
  attack: z.number().min(1).max(255),
  defense: z.number().min(1).max(255),
  specialAttack: z.number().min(1).max(255),
  specialDefense: z.number().min(1).max(255),
  speed: z.number().min(1).max(255),
});

export const GeneratedChildSchema = z.object({
  name: z.string().min(1).max(50),
  types: z.array(z.string()).min(1).max(2),
  stats: GeneratedChildStatsSchema,
  abilities: z.array(z.string()).min(1).max(2),
  signatureMove: SignatureMoveSchema,
  description: z.string(),
});

export type SignatureMove = z.infer<typeof SignatureMoveSchema>;
export type GeneratedChildStats = z.infer<typeof GeneratedChildStatsSchema>;
export type GeneratedChild = z.infer<typeof GeneratedChildSchema>;
```

### battle.ts

```typescript
export const BattleJudgmentSchema = z.object({
  winner: z.enum(["child1", "child2"]),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().min(50).max(2000),
  keyFactors: z.array(z.string()).min(1).max(5),
  ruleViolations: z.array(z.string()).optional(),
});

export type BattleJudgment = z.infer<typeof BattleJudgmentSchema>;
```

### api.ts

```typescript
export const BattleRequestSchema = z.object({
  pairA: z.object({
    parent1Id: z.number(),
    parent2Id: z.number(),
  }),
  pairB: z.object({
    parent1Id: z.number(),
    parent2Id: z.number(),
  }),
});

export const BattleResponseSchema = z.object({
  parents: z.object({
    pairA: z.object({ parent1: PokemonParentSchema, parent2: PokemonParentSchema }),
    pairB: z.object({ parent1: PokemonParentSchema, parent2: PokemonParentSchema }),
  }),
  children: z.object({
    child1: GeneratedChildSchema,
    child2: GeneratedChildSchema,
  }),
  battle: BattleJudgmentSchema,
});

export const PokemonListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const PokemonListResponseSchema = z.object({
  pokemon: z.array(PokemonListItemSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

// Types
export type BattleRequest = z.infer<typeof BattleRequestSchema>;
export type BattleResponse = z.infer<typeof BattleResponseSchema>;
export type PokemonListItem = z.infer<typeof PokemonListItemSchema>;
export type PokemonListResponse = z.infer<typeof PokemonListResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
```

---

## 6. API Reference

### GET /api/pokemon

List all available Pokemon for selection.

**Request**: None

**Response** (200):
```json
{
  "pokemon": [
    { "id": 1, "name": "bulbasaur" },
    { "id": 2, "name": "ivysaur" },
    ...
  ],
  "total": 1025,
  "limit": 5000,
  "offset": 0
}
```

**Errors**:
- 500: Failed to fetch Pokemon list

---

### GET /api/pokemon/:id

Get detailed Pokemon data by ID.

**Request**: Path parameter `id` (1-1025)

**Response** (200):
```json
{
  "id": 25,
  "name": "pikachu",
  "height": 4,
  "weight": 60,
  "types": ["electric"],
  "stats": {
    "hp": 35,
    "attack": 55,
    "defense": 40,
    "specialAttack": 50,
    "specialDefense": 50,
    "speed": 90
  },
  "abilities": ["static", "lightning-rod"],
  "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
  "isLegendary": false,
  "isMythical": false,
  "flavorText": "When several of these POKéMON gather, their electricity could build and cause lightning storms.",
  "eggGroups": ["ground", "fairy"],
  "genus": "Mouse Pokémon"
}
```

**Errors**:
- 400: Invalid Pokemon ID (not 1-1025)
- 500: Failed to fetch Pokemon

---

### POST /api/battle

Generate child Pokemon and judge battle outcome.

**Request**:
```json
{
  "pairA": {
    "parent1Id": 25,
    "parent2Id": 6
  },
  "pairB": {
    "parent1Id": 1,
    "parent2Id": 7
  }
}
```

**Response** (200):
```json
{
  "parents": {
    "pairA": {
      "parent1": { /* PokemonParent */ },
      "parent2": { /* PokemonParent */ }
    },
    "pairB": {
      "parent1": { /* PokemonParent */ },
      "parent2": { /* PokemonParent */ }
    }
  },
  "children": {
    "child1": {
      "name": "Pikazard",
      "types": ["electric", "fire"],
      "stats": {
        "hp": 58,
        "attack": 72,
        "defense": 65,
        "specialAttack": 95,
        "specialDefense": 70,
        "speed": 88
      },
      "abilities": ["Static Blaze", "Thunder Armor"],
      "signatureMove": {
        "name": "Thunder Flare",
        "type": "electric",
        "power": 120,
        "description": "A devastating combination of lightning and fire that strikes with overwhelming force."
      },
      "description": "Pikazard combines the electric might of Pikachu with Charizard's fiery power. Its tail crackles with both flames and electricity."
    },
    "child2": { /* GeneratedChild */ }
  },
  "battle": {
    "winner": "child1",
    "confidence": 72,
    "reasoning": "Pikazard's superior Speed stat of 88 allows it to strike first in most scenarios. Combined with its powerful Thunder Flare signature move at 120 power, it can deal devastating damage before the opponent can respond. The Electric/Fire typing provides strong offensive coverage...",
    "keyFactors": [
      "Higher Speed stat enables first-strike advantage",
      "Thunder Flare's 120 power is exceptionally strong",
      "Electric/Fire typing provides excellent offensive coverage",
      "Static Blaze ability can paralyze and burn opponents"
    ],
    "ruleViolations": []
  }
}
```

**Errors**:
- 400: Invalid request body (Zod validation errors)
- 500: Failed to complete battle

---

### GET /health

Health check endpoint for monitoring.

**Response** (200):
```json
{
  "status": "ok"
}
```

---

## 7. LLM Integration

### OpenRouter Configuration

| Setting | Value |
|---------|-------|
| Provider | OpenRouter API |
| SDK | Official OpenRouter Node.js SDK |
| Temperature | 0.7 |
| Max Tokens | 4000 |
| Response Format | `json_object` |
| Timeout | 60 seconds |

### Model Selection

Models are configured via environment variables:
- `GENERATOR_MODEL`: Used for child Pokemon generation
- `JUDGE_MODEL`: Used for battle judgment

Recommended free models:
```env
GENERATOR_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
JUDGE_MODEL=tngtech/deepseek-r1t2-chimera:free
```

### Retry Strategy

```
Attempt 1 fails
    ↓
Wait 1000ms
    ↓
Attempt 2 fails
    ↓
Wait 2000ms
    ↓
Attempt 3 fails
    ↓
Wait 4000ms
    ↓
Final attempt fails → Throw error
```

**Backoff formula**: `delay = 1000ms × 2^attempt`

### JSON Schema Validation

1. LLM returns JSON string
2. Parse JSON (catch parsing errors)
3. Validate against Zod schema
4. Return typed result or throw with field-level errors

```typescript
// Example error message
"Validation failed: stats.hp: Number must be at least 1, name: String must contain at least 1 character(s)"
```

### Prompt Engineering Best Practices

1. **Role definition**: "You are a Pokemon breeding expert" / "Pokemon battle analyst"
2. **Structured input**: Clear formatting with labels and line breaks
3. **Explicit constraints**: Stat ranges, name limits, type counts
4. **JSON-only instruction**: "Respond with ONLY valid JSON in this exact format:"
5. **Schema example**: Complete JSON template in prompt

---

## 8. Testing

### Test Framework

| Tool | Purpose |
|------|---------|
| Vitest | Test runner & assertions |
| React Testing Library | Component testing |
| vi.fn() / vi.spyOn() | Mocking |
| @testing-library/jest-dom | DOM matchers |

### Server Tests (71 total)

#### schemas.test.ts

- GeneratedChildSchema validation
- BattleJudgmentSchema validation
- PokemonParentSchema validation
- Boundary value testing (stats 1-255)
- Type enum validation (all 18 types)
- Optional field handling

#### pokeapi.test.ts (~21 tests)

- Sprite preference (official artwork > front_default)
- Data transformation (stats, types, abilities)
- Error handling (non-existent Pokemon)
- Species data fallback
- List fetching and ID extraction

#### retry.test.ts (~14 tests)

- Successful first attempt
- Recovery from failures
- Max retry limits
- Error preservation
- Backoff timing
- Console logging verification

#### typeMatchups.test.ts (~15 tests)

- Type loading from PokeAPI
- Effectiveness calculations (2x, 0.5x, 0x, 1x)
- Dual-type stacking (4x, 0.25x)
- Immunity overrides
- Cache management

### Client Tests (27 total)

#### components.test.tsx (17 tests)

**BattleVerdict**:
- Winner display
- Confidence rendering
- Reasoning and key factors
- Rule violations (conditional)

**ChildCard**:
- Name and types display
- Stats visualization
- Abilities rendering
- Signature move details
- Winner badge (conditional)

#### typeColors.test.ts (10 tests)

- TYPE_COLORS completeness
- getTypeColor() case insensitivity
- Unknown type fallback
- getStatColor() tier boundaries

### Mocking Patterns

#### Global fetch mock
```typescript
vi.mock("node:fetch", () => ({
  default: vi.fn().mockImplementation((url) => {
    // Return different responses based on URL
  })
}));
```

#### Factory helpers
```typescript
function createMockTypeResponse(typeName: string) {
  return {
    damage_relations: {
      double_damage_to: [...],
      half_damage_to: [...],
      no_damage_to: [...]
    }
  };
}
```

#### Console spying
```typescript
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
// ... run test ...
expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("SUCCESS"));
```

### Running Tests

```bash
# All tests
npm run test

# By workspace
npm run test:server
npm run test:client

# Single file
cd server && npx vitest run tests/schemas.test.ts

# Watch mode
npm run test -- --watch

# Mutation testing
npm run test:mutation
```

---

## 9. Deployment

### Docker

#### Dockerfile Structure

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/
RUN npm ci
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
RUN npm ci --production
EXPOSE 3001
CMD ["node", "server/dist/index.js"]
```

#### Build & Run

```bash
# Build image
docker build -t pokefusion .

# Run container
docker run -p 3001:3001 \
  -e OPENROUTER_API_KEY=your-key \
  -e GENERATOR_MODEL=nvidia/nemotron-3-nano-30b-a3b:free \
  -e JUDGE_MODEL=tngtech/deepseek-r1t2-chimera:free \
  pokefusion
```

### Production Configuration

#### Express Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| Trust Proxy | Enabled | Accurate IP detection behind Traefik/nginx |
| CSP | Strict | XSS protection |
| CORS | Restricted | Only allowed origins |
| Rate Limit | 100/15min | Abuse prevention |

#### Static File Serving

In production, the Express server serves the built React app:
```typescript
app.use(express.static(path.join(__dirname, "../../client/dist")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});
```

#### Environment Variables

Required:
- `OPENROUTER_API_KEY`
- `GENERATOR_MODEL`
- `JUDGE_MODEL`

Optional:
- `PORT` (default: 3001)
- `NODE_ENV` (set to "production")
- `ALLOWED_ORIGINS` (comma-separated URLs)

### Health Monitoring

The `/health` endpoint returns `{"status": "ok"}` for load balancer health checks.

### Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Use HTTPS (handled by reverse proxy)
- [ ] Keep API key secure (environment variable)
- [ ] Enable rate limiting
- [ ] Review CSP settings for your deployment
