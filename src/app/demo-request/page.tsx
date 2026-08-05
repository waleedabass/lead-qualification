import { submitDemoRequestAction } from "@/lib/actions";

export default function DemoRequestPage() {
  return (
    <div className="min-h-screen -mt-8">
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-10 text-center">
        <p className="mono text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          Vantage Security
        </p>
        <h1 className="text-3xl font-semibold tracking-tight mt-2 text-balance">
          See Vantage in action.
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          Cloud security posture management for engineering teams shipping fast. Tell us about
          your environment and we&apos;ll route you to the right person on our team.
        </p>
      </section>

      <section className="max-w-lg mx-auto px-6 pb-20">
        <form action={submitDemoRequestAction} className="panel p-6 flex flex-col gap-4">
          <div>
            <label className="mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
              Company name
            </label>
            <input name="companyName" required placeholder="e.g. Cloudflare" className="field mt-1" />
          </div>
          <div>
            <label className="mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
              Company website
            </label>
            <input name="companyDomain" required placeholder="e.g. cloudflare.com" className="field mt-1" />
            <p className="text-xs mt-1" style={{ color: "var(--muted-2)" }}>
              Try cloudflare.com, datadoghq.com, okta.com, gitlab.com, or stripe.com for a live
              open-roles lookup — any other domain still works, with placeholder firmographic data.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                Your name
              </label>
              <input name="contactName" required placeholder="Jamie Rivera" className="field mt-1" />
            </div>
            <div>
              <label className="mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                Title (optional)
              </label>
              <input name="contactTitle" placeholder="VP Engineering" className="field mt-1" />
            </div>
          </div>
          <div>
            <label className="mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
              Work email
            </label>
            <input type="email" name="contactEmail" required placeholder="jamie@cloudflare.com" className="field mt-1" />
          </div>
          <div>
            <label className="mono text-xs uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
              What are you looking to solve?
            </label>
            <textarea
              name="message"
              required
              rows={4}
              defaultValue="We're preparing for a SOC 2 audit and need better visibility into our cloud security posture across AWS and Kubernetes before the review."
              className="field mt-1"
            />
          </div>
          <button type="submit" className="btn btn-primary mt-1">
            Request a demo →
          </button>
        </form>
      </section>
    </div>
  );
}
