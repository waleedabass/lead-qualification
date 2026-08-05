// SQLite has no native enum type, so the schema stores these as String.
// Single source of truth for allowed values.

export const LEAD_STATUSES = ["new", "enriched", "routed", "booked", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const TERRITORIES = ["US-West", "US-East", "EMEA", "APAC"] as const;
export type Territory = (typeof TERRITORIES)[number];

export const CRM_STATUSES = ["synced", "failed"] as const;
export type CrmStatus = (typeof CRM_STATUSES)[number];

export const FOLLOWUP_STATUSES = ["pending", "sent_log_only"] as const;
export type FollowUpStatus = (typeof FOLLOWUP_STATUSES)[number];
