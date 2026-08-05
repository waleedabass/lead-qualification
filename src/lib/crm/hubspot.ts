import type { CrmContactInput, CrmProvider, CrmSyncResult } from "./types";

// HubSpot CRM v3 Contacts API — same stable, well-corroborated integration
// as signal-outbound-engine's. Free tier + a private app token works, no
// paid Sales Hub tier required.
export function createHubSpotCrmProvider(token: string): CrmProvider {
  return {
    name: "hubspot",
    async upsertContact(input: CrmContactInput): Promise<CrmSyncResult> {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            email: input.email,
            firstname: input.firstName,
            lastname: input.lastName,
            jobtitle: input.jobTitle ?? undefined,
            company: input.companyName,
          },
        }),
      });

      if (!res.ok && res.status !== 409) {
        throw new Error(`HubSpot contact upsert failed: ${res.status} ${await res.text()}`);
      }

      if (res.status === 409) {
        return { provider: "hubspot", externalId: null };
      }
      const data = (await res.json()) as { id?: string };
      return { provider: "hubspot", externalId: data.id ?? null };
    },
  };
}
