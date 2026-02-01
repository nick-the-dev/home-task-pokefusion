# Pokefusion - Pokemon Breeding Battle Arena

A full-stack application where users select 4 parent Pokemon (2 pairs), generate 2 offspring via LLM, and have a judge LLM predict a battle outcome.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + shadcn/ui + Tailwind CSS
- **Backend**: Express + TypeScript
- **Shared**: Zod schemas for runtime validation and type inference
- **LLM**: OpenRouter API (configurable models for generation and judging)
- **Testing**: Vitest + React Testing Library + StrykerJS (mutation testing)

## Project Structure

```
home-task-pokefusion/
├── shared/           # Shared TypeScript types & Zod schemas
├── server/           # Express backend
├── client/           # React + Vite frontend
└── package.json      # Root workspace config (npm workspaces)
```

## Prerequisites

- Node.js 18+
- npm 8+
- OpenRouter API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd home-task-pokefusion
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your OpenRouter API key to `.env`:
```
OPENROUTER_API_KEY=sk-or-your-api-key-here
GENERATOR_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
JUDGE_MODEL=tngtech/deepseek-r1t2-chimera:free
PORT=3001
POKEAPI_BASE_URL=https://pokeapi.co/api/v2
```

## Running the Application

### Development Mode

Start both server and client concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:server    # Server at http://localhost:3001
npm run dev:client    # Client at http://localhost:5173
```

### Production Build

```bash
# Build all packages (shared must build first)
npm run build

# Start the server
cd server && npm start
```

### Docker Deployment

```bash
# Build the Docker image
docker build -t pokefusion .

# Run the container
docker run -p 3001:3001 \
  -e OPENROUTER_API_KEY=your-key \
  -e GENERATOR_MODEL=nvidia/nemotron-3-nano-30b-a3b:free \
  -e JUDGE_MODEL=tngtech/deepseek-r1t2-chimera:free \
  pokefusion
```

## Code Quality

```bash
# Lint the codebase
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Type check all workspaces
npm run typecheck
```

## Running Tests

```bash
# Run all tests
npm run test

# Run server or client tests only
npm run test:server
npm run test:client

# Run a single test file
cd server && npx vitest run tests/schemas.test.ts
cd client && npx vitest run tests/components.test.tsx
```

### Mutation Testing (StrykerJS)

```bash
# Run all mutation tests
npm run test:mutation

# Run server or client mutation tests only
npm run test:mutation:server
npm run test:mutation:client
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Helmet.js for XSS protection, Content-Type sniffing, etc.
- **CORS Configuration**: Configurable origins for production
- **Input Validation**: Zod schemas validate all API inputs
- **Request Timeouts**: PokeAPI (10s) and LLM (60s) calls have timeouts
- **Exponential Backoff**: LLM calls retry with increasing delays on failure

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pokemon` | List available Pokemon (paginated) |
| GET | `/api/pokemon/:id` | Get single Pokemon details |
| POST | `/api/battle` | Generate children and judge battle |

### POST /api/battle

**Request:**
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

**Response:**
```json
{
  "parents": {
    "pairA": { "parent1": {...}, "parent2": {...} },
    "pairB": { "parent1": {...}, "parent2": {...} }
  },
  "children": {
    "child1": {
      "name": "Pikazard",
      "types": ["electric", "fire"],
      "stats": { "hp": 58, "attack": 72, ... },
      "abilities": ["Static Blaze"],
      "signatureMove": { "name": "Thunder Flare", "type": "electric", "power": 90 }
    },
    "child2": {...}
  },
  "battle": {
    "winner": "child1",
    "winnerName": "Pikazard",
    "confidence": 72,
    "reasoning": "Pikazard's superior Speed..."
  }
}
```

## Test Coverage

### Server Tests (47 tests)
- Schema validation tests (12 tests)
- PokéAPI integration tests (16 tests)
- Retry logic tests (19 tests)

### Client Tests (17 tests)
- BattleVerdict component tests (7 tests)
- ChildCard component tests (10 tests)

### Mutation Testing
- Server: ~29% mutation score (focus on core logic)
- Client: ~15% mutation score (CSS mutations not prioritized)

## License

MIT
