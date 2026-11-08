"use server";

import { requireLiveAccess } from "@/lib/live-access";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { findOpenSecurityRoles } from "@/lib/enrichment/roles";
import { getCompanyEnrichmentProvider, territoryFromLocation } from "@/lib/enrichment/company";
import { computeScore } from "@/lib/scoring/score";
import { getExplainProvider } from "@/lib/scoring";
import { routeLead } from "@/lib/routing";
import { postToSlack } from "@/lib/notify/slack";
import { getCrmProvider } from "@/lib/crm";

export async function submitDemoRequestAction(formData: FormData): Promise<void> {
  await requireLiveAccess();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const companyDomain = String(formData.get("companyDomain") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactTitle = String(formData.get("contactTitle") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!companyName || !companyDomain || !contactName || !contactEmail || !message) {
    throw new Error("Company name, domain, contact name, email, and message are all required.");
  }

  const lead = await db.lead.create({
    data: { companyName, companyDomain, contactName, contactEmail, contactTitle: contactTitle || null, message },
  });

  await processLead(lead.id);

  revalidatePath("/");
  redirect(`/leads/${lead.id}`);
}

// Separated from the form action so a "reprocess" button (e.g. after a
// failed enrichment) can call the same pipeline without resubmitting the form.
export async function processLead(leadId: string): Promise<void> {
  await requireLiveAccess();
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });

  // 1. Enrichment — real open-role scan (Greenhouse/Lever) + mock firmographic data.
  const [openRoles, firmographics] = await Promise.all([
    findOpenSecurityRoles(lead.companyDomain),
    getCompanyEnrichmentProvider().enrich(lead.companyDomain),
  ]);
  const territory = territoryFromLocation(firmographics.hqLocation);

  await db.openRole.deleteMany({ where: { leadId } }); // idempotent on reprocess
  for (const role of openRoles) {
    await db.openRole.create({ data: { leadId, title: role.title, url: role.url, source: role.source } });
  }

  await db.lead.update({
    where: { id: leadId },
    data: {
      employeeCountBand: firmographics.employeeCountBand,
      industry: firmographics.industry,
      techStack: JSON.stringify(firmographics.techStack),
      hqLocation: firmographics.hqLocation,
      territory,
      status: "enriched",
    },
  });

  // 2. Deterministic score + AI-written explanation grounded in it.
  const { score, factors } = computeScore({
    employeeCountBand: firmographics.employeeCountBand,
    openRoleCount: openRoles.length,
    techStack: firmographics.techStack,
    territoryKnown: Boolean(territory),
    message: lead.message,
  });

  const explainer = getExplainProvider();
  const explanation = await explainer.explain({
    companyName: lead.companyName,
    score,
    factors,
    openRoleTitles: openRoles.map((r) => r.title),
  });

  await db.lead.update({
    where: { id: leadId },
    data: { intentScore: score, scoreExplanation: explanation, scoreModel: explainer.name },
  });

  // 3. Deterministic routing.
  const routing = await routeLead(territory);
  if (routing) {
    await db.routingDecision.upsert({
      where: { leadId },
      create: { leadId, aeId: routing.aeId, rule: routing.rule, reasoning: routing.reasoning },
      update: { aeId: routing.aeId, rule: routing.rule, reasoning: routing.reasoning },
    });
    await db.lead.update({ where: { id: leadId }, data: { status: "routed" } });

    const ae = await db.accountExecutive.findUniqueOrThrow({ where: { id: routing.aeId } });
    await postToSlack(
      `:zap: *New lead: ${lead.companyName}* (score ${score}/100) routed to *${ae.name}*\n> ${explanation}\nContact: ${lead.contactName} <${lead.contactEmail}>`
    );
  }

  // 4. CRM sync.
  const crm = getCrmProvider();
  const [firstName, ...rest] = lead.contactName.split(" ");
  const result = await crm.upsertContact({
    email: lead.contactEmail,
    firstName,
    lastName: rest.join(" "),
    jobTitle: lead.contactTitle,
    companyName: lead.companyName,
  });
  await db.crmSyncRecord.create({
    data: { leadId, provider: result.provider, externalId: result.externalId, status: "synced" },
  });

  revalidatePath("/");
  revalidatePath(`/leads/${leadId}`);
}

// Manual booking fallback for local testing before a real Cal.com webhook
// is wired up — see /api/webhooks/calcom for that. Same pattern as
// signal-outbound-engine's bookMeetingAction.
export async function bookMeetingAction(leadId: string, formData: FormData): Promise<void> {
  await requireLiveAccess();
  const scheduledAtISO = String(formData.get("scheduledAt") ?? "");
  if (!scheduledAtISO) throw new Error("A meeting time is required.");

  await db.meeting.upsert({
    where: { leadId },
    create: { leadId, scheduledAt: new Date(scheduledAtISO), bookedVia: "cal.com (manual)" },
    update: { scheduledAt: new Date(scheduledAtISO) },
  });
  await db.lead.update({ where: { id: leadId }, data: { status: "booked" } });

  revalidatePath("/");
  revalidatePath(`/leads/${leadId}`);
}
