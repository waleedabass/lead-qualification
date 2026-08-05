import type { CrmContactInput, CrmProvider, CrmSyncResult } from "./types";

export const logOnlyCrmProvider: CrmProvider = {
  name: "log_only",
  async upsertContact(input: CrmContactInput): Promise<CrmSyncResult> {
    console.log(`[CRM disabled — set HUBSPOT_API_KEY] would upsert ${input.email} (${input.companyName})`);
    return { provider: "log_only", externalId: null };
  },
};
