export interface CompanyEnrichmentData {
  employeeCountBand: string;
  industry: string;
  techStack: string[];
  hqLocation: string;
}

export interface CompanyEnrichmentProvider {
  name: string;
  enrich(domain: string): Promise<CompanyEnrichmentData>;
}

// There's no free firmographic-data API (Clearbit/Apollo/Clay all require a
// paid account) — same situation as Northwind Outdoors' mock order lookup
// in the support-agent project. For the handful of real companies used to
// demo this (see roles.ts), the data below is genuinely accurate public
// information, not invented. Anything else falls through to a clearly
// synthetic, deterministic placeholder — a real deployment replaces this
// whole provider with a real Clay/Apollo/Clearbit implementation behind the
// same interface.
const KNOWN_COMPANIES: Record<string, CompanyEnrichmentData> = {
  "cloudflare.com": {
    employeeCountBand: "1000-5000",
    industry: "Internet Infrastructure & Security",
    techStack: ["Kubernetes", "Go", "Workers/V8", "Terraform"],
    hqLocation: "San Francisco, US",
  },
  "datadoghq.com": {
    employeeCountBand: "5000-10000",
    industry: "Cloud Monitoring & Observability",
    techStack: ["Kubernetes", "AWS", "Kafka", "Go"],
    hqLocation: "New York, US",
  },
  "datadog.com": {
    employeeCountBand: "5000-10000",
    industry: "Cloud Monitoring & Observability",
    techStack: ["Kubernetes", "AWS", "Kafka", "Go"],
    hqLocation: "New York, US",
  },
  "okta.com": {
    employeeCountBand: "5000-10000",
    industry: "Identity & Access Management",
    techStack: ["AWS", "Java", "React", "Auth0"],
    hqLocation: "San Francisco, US",
  },
  "gitlab.com": {
    employeeCountBand: "1000-5000",
    industry: "DevOps Platform",
    techStack: ["Ruby on Rails", "Kubernetes", "GCP", "Vue.js"],
    hqLocation: "Remote (San Francisco, US legal HQ)",
  },
  "stripe.com": {
    employeeCountBand: "5000-10000",
    industry: "Payments Infrastructure",
    techStack: ["Ruby", "Java", "Scala", "AWS"],
    hqLocation: "San Francisco, US",
  },
};

const SYNTHETIC_INDUSTRIES = ["B2B SaaS", "Fintech", "E-commerce", "Healthtech", "Logistics"];
const SYNTHETIC_BANDS = ["1-50", "51-200", "201-1000", "1000-5000"];
const SYNTHETIC_LOCATIONS = ["Austin, US", "London, UK", "Toronto, CA", "Singapore", "Berlin, DE"];
const SYNTHETIC_STACKS = [
  ["AWS", "React", "Node.js"],
  ["GCP", "Python", "Django"],
  ["Azure", ".NET", "Angular"],
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export const mockCompanyEnrichmentProvider: CompanyEnrichmentProvider = {
  name: "mock",
  async enrich(domain: string): Promise<CompanyEnrichmentData> {
    const known = KNOWN_COMPANIES[domain.toLowerCase()];
    if (known) return known;

    // Deterministic synthetic fallback so the same domain always gets the
    // same placeholder data — clearly labeled, not passed off as real.
    const h = hashString(domain.toLowerCase());
    return {
      employeeCountBand: SYNTHETIC_BANDS[h % SYNTHETIC_BANDS.length],
      industry: SYNTHETIC_INDUSTRIES[h % SYNTHETIC_INDUSTRIES.length],
      techStack: SYNTHETIC_STACKS[h % SYNTHETIC_STACKS.length],
      hqLocation: SYNTHETIC_LOCATIONS[h % SYNTHETIC_LOCATIONS.length],
    };
  },
};

export function getCompanyEnrichmentProvider(): CompanyEnrichmentProvider {
  return mockCompanyEnrichmentProvider;
}

export function territoryFromLocation(hqLocation: string): string {
  const loc = hqLocation.toLowerCase();
  if (loc.includes("london") || loc.includes("berlin") || loc.includes("uk") || loc.includes("de")) return "EMEA";
  if (loc.includes("singapore") || loc.includes("tokyo") || loc.includes("sydney")) return "APAC";
  if (loc.includes("toronto")) return "US-East"; // nearest NA territory
  // US: rough coast split by known city names in our seed/synthetic sets.
  const westCities = ["san francisco", "austin", "seattle", "los angeles"];
  if (westCities.some((c) => loc.includes(c))) return "US-West";
  return "US-East";
}
