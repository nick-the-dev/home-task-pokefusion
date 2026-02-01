# Pokefusion - Pokemon Breeding Battle Arena

A full-stack application where users select 4 parent Pokemon (2 pairs), generate 2 offspring via LLM, and have a judge LLM predict a battle outcome.

> For detailed technical documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + shadcn/ui + Tailwind CSS
- **Backend**: Express + TypeScript + Node.js 18+
- **Shared**: Zod schemas for runtime validation and type inference
- **LLM**: OpenRouter API (configurable models for generation and judging)
- **Testing**: Vitest + React Testing Library + StrykerJS (mutation testing)

## Project Structure

```
home-task-pokefusion/
├── shared/                          # Shared TypeScript types & Zod schemas
│   └── src/schemas/
│       ├── pokemon.ts               # Parent Pokemon schema (18 types, stats 1-255)
│       ├── child.ts                 # Generated child schema + signature move
│       ├── battle.ts                # Battle judgment schema
│       └── api.ts                   # Request/response schemas
├── server/                          # Express backend
│   └── src/
│       ├── index.ts                 # Express app with helmet, CORS, rate limiting
│       ├── routes/api.ts            # API endpoints
│       ├── services/
│       │   ├── generator.ts         # LLM child Pokemon generation
│       │   ├── judge.ts             # LLM battle judging
│       │   ├── openrouter.ts        # OpenRouter client + retry logic
│       │   ├── pokeapi.ts           # PokeAPI integration
│       │   └── typeMatchups.ts      # Type effectiveness calculations
│       ├── prompts/                 # LLM prompt templates
│       └── utils/                   # Logger + retry utilities
├── client/                          # React + Vite frontend
│   └── src/
│       ├── App.tsx                  # Main UI with battle flow
│       ├── components/              # UI components
│       ├── hooks/                   # useBattle, usePokemon
│       └── lib/                     # API client, type colors
└── package.json                     # Root workspace config (npm workspaces)
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- OpenRouter API key

### Setup

```bash
# Clone and install
git clone <repository-url>
cd home-task-pokefusion
npm install

# Configure environment
cp .env.example .env
# Edit .env with your OpenRouter API key
```

### Environment Variables

```env
OPENROUTER_API_KEY=sk-or-your-api-key-here
GENERATOR_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
JUDGE_MODEL=tngtech/deepseek-r1t2-chimera:free
PORT=3001
POKEAPI_BASE_URL=https://pokeapi.co/api/v2
```

### Development

```bash
# Start both server and client
npm run dev

# Or run separately
npm run dev:server    # Server at http://localhost:3001
npm run dev:client    # Client at http://localhost:5173
```

### Production Build

```bash
npm run build
cd server && npm start
```

### Docker Deployment

```bash
docker build -t pokefusion .
docker run -p 3001:3001 \
  -e OPENROUTER_API_KEY=your-key \
  -e GENERATOR_MODEL=nvidia/nemotron-3-nano-30b-a3b:free \
  -e JUDGE_MODEL=tngtech/deepseek-r1t2-chimera:free \
  pokefusion
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  Select 4 Pokemon (2 pairs) → Click "Generate & Battle"         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POST /api/battle                              │
│  Request: { pairA: {id1, id2}, pairB: {id3, id4} }              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Phase 1: Fetch Parents (Parallel)                   │
│  PokeAPI → 4 parent Pokemon data (10s timeout each)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             Phase 2: Generate Children (Parallel)                │
│  OpenRouter LLM → 2 offspring (60s timeout, 3 retries)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Phase 3: Judge Battle                           │
│  OpenRouter LLM → Winner prediction with confidence             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Response                                    │
│  { parents, children, battle: {winner, confidence, reasoning} } │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pokemon` | List available Pokemon (limit: 5000) |
| GET | `/api/pokemon/:id` | Get Pokemon details (ID: 1-1025) |
| POST | `/api/battle` | Generate children and judge battle |
| GET | `/health` | Health check endpoint |

## Code Quality

```bash
npm run lint          # Lint codebase
npm run lint:fix      # Auto-fix issues
npm run typecheck     # Type check all workspaces
```

## Testing

```bash
# Run all tests
npm run test

# Run by workspace
npm run test:server
npm run test:client

# Run single test file
cd server && npx vitest run tests/schemas.test.ts

# Mutation testing
npm run test:mutation
```

### Test Coverage

| Package | Tests | Coverage Areas |
|---------|-------|----------------|
| Server | 71 | Schemas, PokeAPI, retry logic, type matchups |
| Client | 27 | Components, type color utilities |

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Helmet.js with CSP (stricter in production)
- **CORS**: Configurable origins via `ALLOWED_ORIGINS`
- **Input Validation**: Zod schemas validate all API inputs
- **Timeouts**: PokeAPI (10s), LLM (60s)
- **Retry Logic**: Exponential backoff (1s → 2s → 4s)

## Key Technologies

### LLM Integration (OpenRouter)
- Configurable models for generation and judging
- JSON schema enforcement for structured output
- Retry with exponential backoff
- 60-second timeout for free tier models

### Type System
Supports all 18 official Pokemon types with:
- Type effectiveness calculations (loadTypeMatchups on startup)
- Damage multipliers: 0x (immune), 0.5x, 1x, 2x, 4x (dual-type stacking)
- Type-specific color mappings for UI

### Schema Validation (Zod)
- **PokemonStats**: 6 stats, each 1-255
- **GeneratedChild**: Name (1-50 chars), 1-2 types, signature move (power 0-200)
- **BattleJudgment**: Winner enum, confidence 0-100, reasoning 50-2000 chars

## License

MIT
