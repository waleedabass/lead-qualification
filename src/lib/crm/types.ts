export interface CrmContactInput {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  companyName: string;
}

export interface CrmSyncResult {
  provider: string;
  externalId: string | null;
}

export interface CrmProvider {
  name: string;
  upsertContact(input: CrmContactInput): Promise<CrmSyncResult>;
}
