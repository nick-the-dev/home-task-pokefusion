import type {
  PokemonParent,
  PokemonListResponse,
  BattleRequest,
  BattleResponse,
} from "@pokefusion/shared";

const API_BASE_URL = "/api";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || "API request failed", response.status, data.details);
  }

  return data as T;
}

export async function fetchPokemonList(): Promise<PokemonListResponse> {
  return fetchApi<PokemonListResponse>("/pokemon");
}

export async function fetchPokemon(id: number): Promise<PokemonParent> {
  return fetchApi<PokemonParent>(`/pokemon/${id}`);
}

export async function startBattle(request: BattleRequest): Promise<BattleResponse> {
  return fetchApi<BattleResponse>("/battle", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export { ApiError };
