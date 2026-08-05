// Real Greenhouse/Lever public job-board APIs — same proven technique as
// signal-outbound-engine, filtered for security-relevant titles instead of
// sales ones. No auth required for either API.
//
// The board "token" (Greenhouse) / "site" (Lever) is guessed from the
// company domain (strip TLD, lowercase) since a real demo-request form
// only gets a domain, not an ATS token. This works for companies whose
// token happens to match their domain slug — verified live against
// cloudflare, datadog, okta, gitlab, and stripe while building this — but
// it's a heuristic, not a lookup. A real product would maintain a mapping
// or use a paid ATS-detection service; a miss here just means "no open
// roles found," which is itself a legitimate, honest outcome.

export interface OpenRoleResult {
  title: string;
  url: string;
  source: "greenhouse" | "lever";
}

const SECURITY_KEYWORDS = ["security", "infosec", "privacy", "compliance", "trust", "risk"];

function isSecurityRelevant(title: string): boolean {
  const t = title.toLowerCase();
  return SECURITY_KEYWORDS.some((k) => t.includes(k));
}

function guessToken(domain: string): string {
  return domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(".")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
}
interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
}

async function fetchGreenhouseRoles(token: string): Promise<OpenRoleResult[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=false`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { jobs: GreenhouseJob[] };
  return data.jobs
    .filter((j) => isSecurityRelevant(j.title))
    .map((j) => ({ title: j.title, url: j.absolute_url, source: "greenhouse" as const }));
}

async function fetchLeverRoles(site: string): Promise<OpenRoleResult[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as LeverPosting[];
  return data
    .filter((p) => isSecurityRelevant(p.text))
    .map((p) => ({ title: p.text, url: p.hostedUrl, source: "lever" as const }));
}

export async function findOpenSecurityRoles(companyDomain: string): Promise<OpenRoleResult[]> {
  const token = guessToken(companyDomain);
  if (!token) return [];

  const [greenhouse, lever] = await Promise.all([fetchGreenhouseRoles(token), fetchLeverRoles(token)]);
  return [...greenhouse, ...lever];
}
