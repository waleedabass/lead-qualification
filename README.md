# AI Lead Qualification & Speed-to-Lead

A working prototype of Pixel AI Solutions' speed-to-lead product, built around the brief's own demo scenario: a cybersecurity vendor ("Vantage Security," fictional) gets an inbound demo request, and the system identifies company size, open security roles, tech stack, and territory, scores intent, and routes to the right account executive — all before a human has to touch it.

Nothing here is a black box. The intent score is computed in plain code from real, inspectable factors; an AI model only writes a one-paragraph explanation *of* that computed score, grounded strictly in the factors passed to it.

## What's real right now, with zero paid accounts

- **Open security roles** — a live scan of the [Greenhouse](https://boards-api.greenhouse.io) and [Lever](https://api.lever.co) public job-board APIs for the submitted company, filtered to security/infosec/compliance-relevant titles. For companies that are actually on those boards (see below), this is genuine, current hiring data, not a mock.
- **Deterministic scoring** (`src/lib/scoring/score.ts`) — company size band, open-role count, cloud-native tech stack match, territory coverage, and urgency keywords in the submitted message (e.g. "SOC 2," "audit," "breach") each contribute a fixed number of points, capped at 100. Every point is traceable to a labeled factor — see the score panel on any lead's journey page.
- **AI-written score explanation** — a short paragraph grounded only in the computed factors and real open-role titles, via the same `AI_PROVIDER` auto-detect (Anthropic → Gemini → OpenRouter) as the other three Pixel projects.
- **Deterministic territory routing** (`src/lib/routing.ts`) — exact territory match to a seeded AE, with an explicit catch-all fallback so a lead never goes silently unrouted.
- **Slack alerts and CRM sync** — real Slack Incoming Webhook and real HubSpot v3 contacts API, both behind provider interfaces with a log-only default so the pipeline runs fully with zero keys.
- **Cal.com booking webhook** (`/api/webhooks/calcom`) — verifies an optional HMAC signature, matches the booking to a lead by attendee email, and books the meeting automatically. A manual booking form on the lead journey page covers local testing without a real webhook registered.
- **Follow-up nudges** (`npm run followups`) — finds leads that were routed but never booked a meeting, past `FOLLOWUP_DELAY_DAYS`, and logs exactly what would be sent. No real email provider is wired up (same honest limitation as QuickBooks/Xero in `document-ai`) — it always logs, never sends.

## What needs a key from you, in the order to get them

| Stage | Provider | Cost to start | Env var |
|---|---|---|---|
| Score explanation (optional — scoring itself needs no key) | [Anthropic](https://console.anthropic.com), [Google AI Studio](https://aistudio.google.com/apikey), or [OpenRouter](https://openrouter.ai/keys) | Anthropic: pay-as-you-go. Gemini/OpenRouter: free tier. | `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `OPENROUTER_API_KEY` |
| AE alerts | [Slack Incoming Webhook](https://api.slack.com/messaging/webhooks) | Free | `SLACK_WEBHOOK_URL` |
| CRM sync | [HubSpot private app](https://developers.hubspot.com/docs/api/private-apps) | Free developer account | `HUBSPOT_API_KEY` |
| Real booking webhook | [Cal.com](https://cal.com) webhook | Free | `CALCOM_WEBHOOK_SECRET` (optional) |

Copy `.env.example` to `.env` and fill in what you have.

## Running it

```bash
npm install
npm run seed   # seeds 4 fictional Vantage Security AEs across US-West/US-East/EMEA/APAC
npm run dev
```

Then:

1. **`/demo-request`** — submit the form. Use `cloudflare.com`, `datadoghq.com`, `okta.com`, `gitlab.com`, or `stripe.com` as the company domain for a live, real open-roles lookup; any other domain still works end-to-end with clearly-synthetic placeholder firmographic data.
2. You land on **`/leads/[id]`** — the full lead journey: source message, enrichment, real open-role evidence with live links, the score breakdown and its AI explanation, routing decision and reasoning, CRM sync status, and meeting/booking status.
3. **`/`** — the funnel dashboard: leads in → enriched → routed → booked, conversion by source, average intent score, recent leads.
4. **`/routing`** — the AE territory table, showing which leads each AE owns.
5. `npm run followups` — after a lead has been routed for at least `FOLLOWUP_DELAY_DAYS` (default 2) without booking, logs a follow-up nudge and records it on the lead.

## Architecture notes

- **Same conventions as the other three Pixel projects**: Next.js 16 + Prisma 7 with the `@prisma/adapter-better-sqlite3` driver adapter, Server Actions for mutations, provider interfaces (`CompanyEnrichmentProvider`, `CrmProvider`) so a real Clay/Apollo/Clearbit or HubSpot integration slots in without touching business logic. Same 8-color minimal palette across all four, for a portfolio that reads as one body of work.
- **No shared package between projects.** The Greenhouse/Lever fetch logic is re-implemented here (filtered for security titles instead of sales ones) rather than imported from `signal-outbound-engine` — each prototype stays self-contained and independently deployable.
- **Scoring and routing are both deliberately not AI.** The brief explicitly contrasts agency systems that "explain scores" and route deterministically against average implementations that don't — an AI-guessed number would be neither reproducible nor trustworthy the way a labeled point breakdown is.
- **Firmographic enrichment is a seeded mock** (`src/lib/enrichment/company.ts`) — there's no free Clearbit/Apollo/Clay API. The 5 companies listed above have genuinely accurate public data hard-coded in; any other domain gets a clearly-synthetic, deterministically-derived placeholder (same domain always gets the same fake data, so demos are repeatable) rather than something invented per request.

## Known limitations, on purpose

- Firmographic data only reflects reality for the 5 companies explicitly listed above — a client deployment would replace `mockCompanyEnrichmentProvider` with a real Clay/Apollo/Clearbit call behind the same interface.
- Follow-ups are always log-only; there's no real email-sending integration in any of the four Pixel prototypes built so far.
- Territory-from-location mapping (`territoryFromLocation`) is a small hard-coded rule table keyed on known city/country substrings, not a real geocoding service — accurate for the seed/demo data, not exhaustive.
- One follow-up per lead in the current script (it skips any lead that already has a `FollowUp` row) — a client build would likely want a cadence of several nudges, not just one.


## Public Pixel sample

The public entry and `/demo` run editable, browser-isolated sample workflows. No live email, payment, CRM update or paid AI request is made. Records reset on reload. Existing provider integrations remain available behind explicit private access. Set `ENABLE_LIVE_DEMO=true`, `DATABASE_URL` and a private `PIXEL_LIVE_ACCESS_TOKEN` of at least 32 characters; authenticate internal requests using the `pixel-live-access` cookie or a Bearer header. Keep provider keys server-side. Public POSTs and APIs are blocked. Do not enable integration mode for anonymous visitors.

Run `npm ci`, `npm test`, `npm run lint`, and `npm run build`. Production uses the linked Vercel project.
