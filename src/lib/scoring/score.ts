export interface ScoreFactor {
  label: string;
  points: number;
}

export interface ScoreInput {
  employeeCountBand: string;
  openRoleCount: number;
  techStack: string[];
  territoryKnown: boolean;
  message: string;
}

export interface ScoreResult {
  score: number;
  factors: ScoreFactor[];
}

const URGENCY_KEYWORDS = ["urgent", "breach", "audit", "compliance", "soc2", "soc 2", "pentest", "incident"];
const CLOUD_KEYWORDS = ["kubernetes", "aws", "gcp", "azure", "cloud"];

// Deterministic, in plain code — the brief explicitly contrasts "agency
// systems explain scores" against average ones that don't. An AI-guessed
// number would be neither explainable nor reproducible; this is both.
export function computeScore(input: ScoreInput): ScoreResult {
  const factors: ScoreFactor[] = [];

  const sizePoints = (() => {
    switch (input.employeeCountBand) {
      case "1-50": return 10;
      case "51-200": return 20;
      case "201-1000": return 25;
      case "1000-5000": return 30;
      case "5000-10000": return 30;
      default: return 5;
    }
  })();
  factors.push({ label: `Company size (${input.employeeCountBand} employees)`, points: sizePoints });

  const rolePoints = input.openRoleCount === 0 ? 0 : input.openRoleCount <= 2 ? 15 : input.openRoleCount <= 5 ? 25 : 35;
  factors.push({
    label:
      input.openRoleCount === 0
        ? "No open security roles found"
        : `${input.openRoleCount} open security-relevant role${input.openRoleCount === 1 ? "" : "s"} — active hiring signal`,
    points: rolePoints,
  });

  const stackLower = input.techStack.map((s) => s.toLowerCase());
  const hasCloud = CLOUD_KEYWORDS.some((k) => stackLower.some((s) => s.includes(k)));
  factors.push({
    label: hasCloud ? `Cloud-native tech stack (${input.techStack.join(", ")})` : "Tech stack not cloud-native",
    points: hasCloud ? 15 : 0,
  });

  factors.push({
    label: input.territoryKnown ? "Territory maps to a covered region" : "Territory not covered — needs manual routing",
    points: input.territoryKnown ? 10 : 0,
  });

  const messageLower = input.message.toLowerCase();
  const matchedUrgency = URGENCY_KEYWORDS.filter((k) => messageLower.includes(k));
  if (matchedUrgency.length > 0) {
    factors.push({ label: `Message signals urgency (mentions: ${matchedUrgency.join(", ")})`, points: 10 });
  }

  const score = Math.min(100, factors.reduce((sum, f) => sum + f.points, 0));
  return { score, factors };
}
