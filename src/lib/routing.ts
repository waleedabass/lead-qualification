import { db } from "@/lib/db";

export interface RoutingResult {
  aeId: string;
  rule: string;
  reasoning: string;
}

// Deterministic territory routing — no AI involved, matching the brief's
// contrast between "agency systems use deterministic routing" and average
// ones that don't. Falls back to a catch-all AE rather than leaving a lead
// silently unrouted if its territory has no dedicated rep yet.
export async function routeLead(territory: string | null): Promise<RoutingResult | null> {
  if (territory) {
    const match = await db.accountExecutive.findFirst({ where: { territory } });
    if (match) {
      return {
        aeId: match.id,
        rule: `territory_match:${territory}`,
        reasoning: `Routed to ${match.name} — owns the ${territory} territory.`,
      };
    }
  }

  const fallback = await db.accountExecutive.findFirst({ orderBy: { createdAt: "asc" } });
  if (!fallback) return null;
  return {
    aeId: fallback.id,
    rule: "catch_all",
    reasoning: territory
      ? `No AE owns the ${territory} territory yet — routed to ${fallback.name} as the catch-all rep.`
      : `Territory could not be determined — routed to ${fallback.name} as the catch-all rep.`,
  };
}
