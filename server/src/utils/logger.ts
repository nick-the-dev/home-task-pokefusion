// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground colors
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  white: "\x1b[37m",

  // Background colors
  bgCyan: "\x1b[46m",
  bgYellow: "\x1b[43m",
  bgMagenta: "\x1b[45m",
  bgGreen: "\x1b[42m",
  bgBlue: "\x1b[44m",
  bgRed: "\x1b[41m",
};

type BadgeType = "API" | "POKEAPI" | "LLM" | "GENERATOR" | "JUDGE" | "RETRY" | "ERROR";

const badgeColors: Record<BadgeType, string> = {
  API: colors.cyan,
  POKEAPI: colors.yellow,
  LLM: colors.magenta,
  GENERATOR: colors.green,
  JUDGE: colors.blue,
  RETRY: colors.yellow,
  ERROR: colors.red,
};

function badge(type: BadgeType): string {
  const color = badgeColors[type];
  return `${color}${colors.bold}[${type}]${colors.reset}`;
}

function formatPayload(payload: unknown, maxLength = 500): string {
  if (payload === undefined || payload === null) return "";
  const str = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  if (str.length <= maxLength) {
    return `${colors.gray}${str}${colors.reset}`;
  }
  return `${colors.gray}${str.substring(0, maxLength)}...${colors.reset}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${colors.dim}[${ms}ms]${colors.reset}`;
  }
  return `${colors.dim}[${(ms / 1000).toFixed(2)}s]${colors.reset}`;
}

export function logStart(type: BadgeType, action: string, payload?: unknown): number {
  const timestamp = Date.now();
  console.log(`${badge(type)} ${colors.dim}→${colors.reset} ${action} ${colors.bold}START${colors.reset}`);
  if (payload !== undefined) {
    console.log(`${badge(type)} ${formatPayload(payload)}`);
  }
  return timestamp;
}

export function logEnd(
  type: BadgeType,
  action: string,
  startTime: number,
  result?: string,
  payload?: unknown
): void {
  const duration = Date.now() - startTime;
  const resultStr = result ? ` → ${result}` : "";
  console.log(
    `${badge(type)} ${colors.green}✓${colors.reset} ${action} ${colors.bold}END${colors.reset}${resultStr} ${formatDuration(duration)}`
  );
  if (payload !== undefined) {
    console.log(`${badge(type)} ${formatPayload(payload)}`);
  }
}

export function logPhase(type: BadgeType, phase: string): void {
  console.log(`\n${badge(type)} ${colors.bold}━━━ ${phase} ━━━${colors.reset}`);
}

export function logInfo(type: BadgeType, message: string, payload?: unknown): void {
  console.log(`${badge(type)} ${message}`);
  if (payload !== undefined) {
    console.log(`${badge(type)} ${formatPayload(payload)}`);
  }
}

export function logError(type: BadgeType, message: string, error?: unknown): void {
  console.log(`${badge("ERROR")} ${badge(type)} ${colors.red}${message}${colors.reset}`);
  if (error instanceof Error) {
    console.log(`${badge("ERROR")} ${colors.red}${error.message}${colors.reset}`);
    if (error.stack) {
      console.log(`${colors.dim}${error.stack}${colors.reset}`);
    }
  } else if (error !== undefined) {
    console.log(`${badge("ERROR")} ${formatPayload(error)}`);
  }
}

export function logRetry(attempt: number, maxRetries: number, error: string, delayMs?: number): void {
  const delayStr = delayMs ? ` (retrying in ${delayMs}ms)` : "";
  console.log(
    `${badge("RETRY")} ${colors.yellow}Attempt ${attempt}/${maxRetries} failed: ${error}${delayStr}${colors.reset}`
  );
}

// Helper to create a scoped logger for tracking async operations
export function createTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

// Export badge types for external use
export type { BadgeType };
