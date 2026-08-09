# AI Lead Qualification & Speed-to-Lead System — Pitch Guide & Productionization Kit

Repo: https://github.com/waleedabass/lead-qualification

---

## 1. Production-Conversion Prompt

```
I'm taking the lead-qualification prototype to production for a real client.
Read AGENTS.md, CLAUDE.md, and README.md first, then do the following:

CLIENT CONTEXT
- Client: [CLIENT_NAME], selling [CLIENT_PRODUCT] to [ICP_DESCRIPTION]
- Demo-request form location: [CLIENT_WEBSITE_URL]/[FORM_PATH]
- CRM: [CLIENT_CRM — HubSpot/Salesforce/Pipedrive/other]
- Sales team roster + territory assignments: see Section 2

FIRMOGRAPHIC ENRICHMENT (the real gap to close)
- Replace src/lib/enrichment/company.ts's mock/synthetic firmographic data
  with a real provider — Clay, Apollo, or Clearbit — behind the existing
  CompanyEnrichmentProvider interface. This is the single most valuable
  upgrade: real employee count, industry, tech stack, and HQ location for
  every inbound lead, not five hardcoded companies.

OPEN-ROLE SIGNAL
- The Greenhouse/Lever open-role scan is real and works as-is for any
  company on those ATSs — confirm it still fires correctly against
  [CLIENT_NAME]'s actual ICP (adjust the security-relevant keyword list in
  src/lib/enrichment/roles.ts if their buying signal isn't security hiring
  — e.g. swap to whatever role type predicts intent for their product).

SCORING
- Review src/lib/scoring/score.ts's point weights against [CLIENT_NAME]'s
  actual definition of a qualified lead — company size bands, role-count
  thresholds, and urgency keywords should reflect their real ICP and deal
  history, not the security-vendor defaults built for the demo.

ROUTING
- Replace the 4 seeded territories/AEs in prisma/seed.ts with
  [CLIENT_NAME]'s real sales team roster and territory definitions (see
  Section 2) — src/lib/routing.ts's logic itself doesn't need to change.

CRM & BOOKING
- Point the HubSpot integration at the client's real portal (or implement
  Salesforce/Pipedrive behind the same CrmProvider interface).
- Point the Cal.com webhook at the client's real booking page and set
  CALCOM_WEBHOOK_SECRET for real signature verification (or swap in
  Calendly behind the same pattern).

FOLLOW-UPS
- The follow-up trigger (npm run followups) is currently log-only — wire a
  real email-sending provider (SendGrid, Postmark, or the client's ESP) if
  automated follow-up sending (not just drafting) is in scope.

DATA LAYER
- Replace SQLite with Postgres — [CONNECTION_STRING].

DEPLOYMENT
- Deploy to [VERCEL/CLIENT_INFRA], custom domain, environment variables
  from Section 2.
- Add authentication to the dashboard/routing pages — the demo-request
  form should stay public, but the internal pages should not.
- Schedule npm run followups as a real recurring job (cron, Vercel Cron,
  or client infra) instead of a manual script.

Test end-to-end with a real inbound demo request from an account actually
on the client's ICP before handoff.
```

---

## 2. Client Details Needed

**Brand & identity**
- Company name, logo, brand colors, copy/tone for the public demo-request form

**ICP & scoring**
- Their real definition of a "qualified" lead: company size sweet spot, industry, and what buying signal actually predicts intent for them (open roles in a specific function, tech-stack match, etc.)
- Urgency keywords/phrases that historically correlate with faster-closing deals

**Enrichment**
- Clay/Apollo/Clearbit account (or budget/preference for which) for real firmographic data

**Sales team**
- Full AE roster: name, email, and territory (region, industry vertical, or account-size band — whatever their actual routing logic is)
- Fallback/catch-all rep for leads outside any defined territory

**CRM**
- Which CRM, API credentials, and which pipeline/stage new leads should land in

**Booking**
- Cal.com or Calendly link + webhook secret, and which rep(s) get booked meetings

**Follow-ups**
- Whether automated follow-up emails should actually send (needs a real ESP) or stay log-only/manual for now
- Follow-up cadence and timing (the prototype defaults to a single nudge after N days)

**Notifications**
- Slack webhook URL for real-time new-lead alerts to the right channel/AE

**Access & auth**
- Who needs access to the dashboard/routing pages, preferred auth method

**Infra**
- Hosting preference, custom domain, database, and where the demo-request form embeds (their marketing site, a landing-page builder, etc.)

---

## 3. Pitch Guide — Everything This Product Does

### The problem it solves

Every minute between an inbound demo request and a rep's first response measurably lowers the odds of ever connecting with that lead. Meanwhile, sales reps waste time on leads that were never going to buy, because nobody scored or researched them before the call.

### The pitch, feature by feature

**1. Real firmographic + intent enrichment, the moment a lead comes in**
The instant someone submits a demo request, the system automatically looks up real company data — size, industry, tech stack — and scans real public job boards for hiring signals that indicate active need, before a human ever looks at the lead.

**2. A deterministic, explainable score — not an AI guess**
The intent score is computed from real, labeled factors (company size, active hiring signal, tech-stack fit, territory, urgency language in their own message) that add up to a transparent number. A rep can see exactly why a lead scored 85 instead of 40 — because the factors are listed right there, not hidden inside a model.

**3. An AI-written explanation, grounded in the real evidence**
On top of the deterministic score, the system writes a one-paragraph narrative that references the actual open roles and real signals found — so a rep gets context, not just a number.

**4. Deterministic territory routing — nothing falls through the cracks**
Every lead is automatically routed to the correct AE based on territory, with an explicit fallback so a lead from an unrecognized territory still reaches someone rather than sitting unrouted.

**5. Instant Slack alerts to the right rep**
The moment a lead is scored and routed, the assigned AE gets a real-time Slack alert with the score and explanation — so "speed to lead" is measured in seconds, not the next time someone checks a dashboard.

**6. Real CRM sync and booking capture**
Every lead syncs to the CRM automatically, and when they book a meeting, a real webhook captures it — the whole pipeline from form submission to booked call requires zero manual data entry.

**7. A follow-up safety net**
If a routed lead never books a meeting, the system automatically flags it after a configurable delay so it doesn't just go cold silently.

**8. A full "lead journey" view for premium presentation**
Every lead has a single page showing the complete story — the enrichment evidence, the score breakdown, the routing decision and why, CRM sync status, and booking status — the kind of transparent, auditable view that makes a sales-ops team trust the system instead of working around it.

### Why this is agency-grade, not "average"

An average lead-routing tool assigns leads round-robin and calls it done. This system scores leads on real evidence, explains every point of that score, routes deterministically with no dead ends, and alerts the right person within seconds — the full speed-to-lead motion that actually moves the needle on conversion, not just a form-to-inbox pipe.

### Recurring revenue angle

- Monthly platform fee scaled by lead volume
- Enrichment credit usage (Clay/Apollo/Clearbit pass-through or markup)
- Per-integration fee for additional CRMs/booking platforms
- Upsell: outbound automation for un-booked leads, revenue forecasting, lead-scoring model tuning as a service

### Suggested live demo script

1. Submit a real demo request for a company actually on Greenhouse/Lever with open roles — show the real enrichment landing within seconds.
2. Show the score breakdown — point to each factor and its real evidence.
3. Show the Slack alert firing and the CRM sync happening.
4. Open the lead journey page — the single transparent view of the whole story.
5. Show the routing table — a different territory routes to a different rep.
