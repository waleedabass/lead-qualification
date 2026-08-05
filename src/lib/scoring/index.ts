import type { ExplainProvider } from "./explain-types";
import { createAnthropicExplainProvider } from "./explain-anthropic";
import { createGeminiExplainProvider } from "./explain-gemini";
import { createOpenRouterExplainProvider } from "./explain-openrouter";

export function getExplainProvider(): ExplainProvider {
  const requested = process.env.AI_PROVIDER?.toLowerCase();

  if (requested === "anthropic") return requireAnthropic();
  if (requested === "gemini") return requireGemini();
  if (requested === "openrouter") return requireOpenRouter();

  if (process.env.ANTHROPIC_API_KEY) return requireAnthropic();
  if (process.env.GEMINI_API_KEY) return requireGemini();
  if (process.env.OPENROUTER_API_KEY) return requireOpenRouter();

  throw new Error("No AI provider configured — set ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY.");
}

function requireAnthropic(): ExplainProvider {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set.");
  return createAnthropicExplainProvider(process.env.ANTHROPIC_API_KEY);
}
function requireGemini(): ExplainProvider {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set.");
  return createGeminiExplainProvider(process.env.GEMINI_API_KEY);
}
function requireOpenRouter(): ExplainProvider {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set.");
  return createOpenRouterExplainProvider(process.env.OPENROUTER_API_KEY);
}

export { computeScore } from "./score";
export type { ScoreFactor, ScoreInput, ScoreResult } from "./score";
export type { ExplainProvider, ExplainInput } from "./explain-types";
