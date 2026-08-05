import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { bookMeetingAction } from "@/lib/actions";
import { timeAgo, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      openRoles: true,
      routingDecision: { include: { ae: true } },
      crmSyncRecords: { orderBy: { createdAt: "desc" } },
      meeting: true,
    },
  });
  if (!lead) notFound();

  const techStack: string[] = lead.techStack ? JSON.parse(lead.techStack) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="mono text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Lead journey
          </p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">{lead.companyName}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {lead.contactName}{lead.contactTitle ? ` — ${lead.contactTitle}` : ""} · {lead.contactEmail} · submitted {timeAgo(lead.createdAt)}
          </p>
        </div>
        <span className={`chip chip-${lead.status}`}>{lead.status}</span>
      </div>

      <div className="panel p-5">
        <h2 className="text-sm font-semibold mb-2">Source message</h2>
        <p className="text-sm italic" style={{ color: "var(--muted)" }}>&ldquo;{lead.message}&rdquo;</p>
        <p className="text-xs mt-2 mono" style={{ color: "var(--muted-2)" }}>source: {lead.source}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold mb-4">Enrichment</h2>
          {lead.employeeCountBand ? (
            <div className="flex flex-col gap-2 text-sm">
              <Row label="Employees" value={lead.employeeCountBand} />
              <Row label="Industry" value={lead.industry ?? "—"} />
              <Row label="HQ" value={lead.hqLocation ?? "—"} />
              <Row label="Territory" value={lead.territory ?? "—"} />
              <Row label="Tech stack" value={techStack.join(", ") || "—"} />
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Not enriched yet.</p>
          )}
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-semibold mb-4">
            Open security roles <span className="mono text-xs font-normal" style={{ color: "var(--muted-2)" }}>({lead.openRoles.length} found, live)</span>
          </h2>
          {lead.openRoles.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>None found via Greenhouse/Lever for this domain.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {lead.openRoles.map((r) => (
                <li key={r.id}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline">
                    {r.title}
                  </a>
                  <span className="mono text-xs ml-2" style={{ color: "var(--muted-2)" }}>via {r.source}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Score</h2>
          {lead.intentScore !== null && <span className="mono text-2xl font-semibold tabular-nums">{lead.intentScore}/100</span>}
        </div>
        {lead.scoreExplanation ? (
          <>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{lead.scoreExplanation}</p>
            <p className="text-xs mt-2 mono" style={{ color: "var(--muted-2)" }}>explained by {lead.scoreModel} · score computed deterministically from real factors, not AI-guessed</p>
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Not scored yet.</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold mb-2">Routing</h2>
          {lead.routingDecision ? (
            <div className="text-sm flex flex-col gap-1">
              <div className="font-medium">{lead.routingDecision.ae.name} <span style={{ color: "var(--muted)" }}>({lead.routingDecision.ae.territory})</span></div>
              <div style={{ color: "var(--muted)" }}>{lead.routingDecision.reasoning}</div>
              <div className="mono text-xs" style={{ color: "var(--muted-2)" }}>rule: {lead.routingDecision.rule}</div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Not routed yet.</p>
          )}
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-semibold mb-2">CRM sync</h2>
          {lead.crmSyncRecords.length > 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Synced via <span className="mono">{lead.crmSyncRecords[0].provider}</span> · {timeAgo(lead.crmSyncRecords[0].createdAt)}
              {lead.crmSyncRecords[0].externalId && <> · id {lead.crmSyncRecords[0].externalId}</>}
            </p>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Not synced yet.</p>
          )}
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="text-sm font-semibold mb-3">Meeting</h2>
        {lead.meeting ? (
          <p className="text-sm mono" style={{ color: "var(--text)" }}>
            ✓ Booked for {formatDateTime(lead.meeting.scheduledAt)} via {lead.meeting.bookedVia}
          </p>
        ) : (
          <form action={bookMeetingAction.bind(null, lead.id)} className="flex gap-2 items-center flex-wrap">
            <input type="datetime-local" name="scheduledAt" required className="field w-auto" />
            <button type="submit" className="btn btn-primary">Book meeting</button>
            <span className="text-xs" style={{ color: "var(--muted-2)" }}>manual fallback — a real Cal.com webhook does this automatically</span>
          </form>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
