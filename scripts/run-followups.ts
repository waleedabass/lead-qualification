import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Finds leads that were routed to an AE but never booked a meeting, and are
// older than FOLLOWUP_DELAY_DAYS. There's no real email-sending integration
// in this prototype (same honest limitation as QuickBooks/Xero in
// document-ai) — this logs exactly what would be sent and records a
// FollowUp row with status "sent_log_only" so the dashboard/lead journey
// can show it happened. Run via `npm run followups`.

const FOLLOWUP_DELAY_DAYS = Number(process.env.FOLLOWUP_DELAY_DAYS ?? 2);

const db = new PrismaClient({
  adapter: new PrismaLibSql({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  }),
});

function draftFollowUp(lead: { companyName: string; contactName: string; intentScore: number | null }, aeName: string): string {
  return (
    `Hi ${lead.contactName.split(" ")[0]}, following up on your demo request for ${lead.companyName} — ` +
    `${aeName} would love to walk you through how Vantage fits your environment. ` +
    `Any time work this week for a quick call?`
  );
}

async function main() {
  const cutoff = new Date(Date.now() - FOLLOWUP_DELAY_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await db.lead.findMany({
    where: {
      status: "routed",
      createdAt: { lte: cutoff },
      followUps: { none: {} },
    },
    include: { routingDecision: { include: { ae: true } } },
  });

  if (candidates.length === 0) {
    console.log(`No leads older than ${FOLLOWUP_DELAY_DAYS}d awaiting follow-up.`);
    await db.$disconnect();
    return;
  }

  for (const lead of candidates) {
    const aeName = lead.routingDecision?.ae.name ?? "our team";
    const content = draftFollowUp(lead, aeName);

    await db.followUp.create({
      data: {
        leadId: lead.id,
        channel: "email",
        content,
        status: "sent_log_only",
        scheduledFor: new Date(),
        sentAt: new Date(),
      },
    });

    console.log(`[FOLLOW-UP log-only — no email provider configured] to ${lead.contactEmail}:\n  "${content}"\n`);
  }

  console.log(`Logged ${candidates.length} follow-up(s).`);
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
