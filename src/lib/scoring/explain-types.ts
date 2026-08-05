import type { ScoreFactor } from "./score";

export interface ExplainInput {
  companyName: string;
  score: number;
  factors: ScoreFactor[];
  openRoleTitles: string[];
}

export interface ExplainProvider {
  name: string;
  explain(input: ExplainInput): Promise<string>;
}

export const EXPLAIN_SYSTEM_PROMPT = `You write a one-paragraph explanation of a computed lead-qualification score for a sales rep.

Rules, non-negotiable:
- Ground the explanation ONLY in the factors and numbers given to you. Never invent a detail (a headcount, a role, a fact) that wasn't in the input.
- Reference the actual open role titles by name if any were given — that's the strongest evidence, don't waste it on vague language.
- 2-4 sentences. Plain text, no markdown, no bullet points.
- Write for a rep who has 10 seconds to read this before a call — direct and specific, not generic sales-speak.`;
