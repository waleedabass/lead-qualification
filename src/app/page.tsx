import Link from "next/link";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const leads = await db.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { routingDecision: { include: { ae: true } } },
  });

  const total = leads.length;
  const enriched = leads.filter((l) => ["enriched", "routed", "booked"].includes(l.status)).length;
  const routed = leads.filter((l) => ["routed", "booked"].includes(l.status)).length;
  const booked = leads.filter((l) => l.status === "booked").length;

  const bySource = new Map<string, { total: number; booked: number }>();
  for (const lead of leads) {
    const bucket = bySource.get(lead.source) ?? { total: 0, booked: 0 };
    bucket.total += 1;
    if (lead.status === "booked") bucket.booked += 1;
    bySource.set(lead.source, bucket);
  }

  const avgScore =
    leads.filter((l) => l.intentScore !== null).length > 0
      ? Math.round(
          leads.reduce((sum, l) => sum + (l.intentScore ?? 0), 0) /
            leads.filter((l) => l.intentScore !== null).length
        )
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mono text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          Speed-to-lead
        </p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Funnel</h1>
      </div>

      {total === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No leads yet. Submit a{" "}
            <Link href="/demo-request" className="underline">
              demo request
            </Link>{" "}
            to see the pipeline in action.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FunnelStat label="Leads in" value={total} />
            <FunnelStat label="Enriched" value={enriched} sub={total ? `${Math.round((enriched / total) * 100)}%` : undefined} />
            <FunnelStat label="Routed" value={routed} sub={total ? `${Math.round((routed / total) * 100)}%` : undefined} />
            <FunnelStat label="Booked" value={booked} sub={total ? `${Math.round((booked / total) * 100)}%` : undefined} />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="panel p-5">
              <h2 className="text-sm font-semibold mb-4">Conversion by source</h2>
              <div className="flex flex-col gap-2 text-sm">
                {[...bySource.entries()].map(([source, stats]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="mono text-xs" style={{ color: "var(--muted)" }}>{source}</span>
                    <span>
                      {stats.booked}/{stats.total} booked
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel p-5">
              <h2 className="text-sm font-semibold mb-4">Average intent score</h2>
              <span className="mono text-3xl font-semibold tabular-nums">{avgScore !== null ? `${avgScore}/100` : "—"}</span>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <h2 className="text-sm font-semibold p-5 pb-0">Recent leads</h2>
            <div className="flex flex-col mt-3">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 border-t"
                  style={{ borderColor: "var(--line-soft)" }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{lead.companyName}</div>
                    <div className="text-xs truncate" style={{ color: "var(--muted-2)" }}>
                      {lead.contactName} · {timeAgo(lead.createdAt)}
                      {lead.routingDecision && <> · → {lead.routingDecision.ae.name}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {lead.intentScore !== null && (
                      <span className="mono text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                        {lead.intentScore}/100
                      </span>
                    )}
                    <span className={`chip chip-${lead.status}`}>{lead.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FunnelStat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="panel p-4">
      <p className="mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
        {label}
      </p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {sub && <span className="mono text-xs" style={{ color: "var(--muted)" }}>{sub}</span>}
      </div>
    </div>
  );
}
