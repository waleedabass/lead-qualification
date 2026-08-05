import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RoutingPage() {
  const aes = await db.accountExecutive.findMany({
    orderBy: { territory: "asc" },
    include: { routingDecisions: { include: { lead: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mono text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          Routing
        </p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Account executives by territory</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Routing is deterministic: a lead&apos;s territory (derived from its enriched HQ location)
          is matched to an AE exactly. Leads with an unrecognized location fall back to the
          earliest-created AE so nothing goes unrouted.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {aes.map((ae) => (
          <div key={ae.id} className="panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">{ae.name}</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-2)" }}>{ae.email}</p>
              </div>
              <span className="chip chip-routed">{ae.territory}</span>
            </div>
            <p className="mono text-xs mt-4 mb-1 uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
              Routed leads ({ae.routingDecisions.length})
            </p>
            {ae.routingDecisions.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>None yet.</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {ae.routingDecisions.map((rd) => (
                  <li key={rd.id}>
                    <a href={`/leads/${rd.leadId}`} className="underline">
                      {rd.lead.companyName}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
