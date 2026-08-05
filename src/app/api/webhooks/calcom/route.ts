import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cal.com webhook — same pattern as signal-outbound-engine's. Add one at
// cal.com/settings/developer/webhooks pointed at
// https://<your-deployment>/api/webhooks/calcom, subscribed to
// BOOKING_CREATED. If a signing secret is configured there, set
// CALCOM_WEBHOOK_SECRET to the same value to verify X-Cal-Signature-256.
export async function POST(request: Request) {
  const rawBody = await request.text();

  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get("x-cal-signature-256");
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(rawBody);
  if (event.triggerEvent !== "BOOKING_CREATED") {
    return NextResponse.json({ ok: true, ignored: event.triggerEvent });
  }

  const attendeeEmail: string | undefined = event.payload?.attendees?.[0]?.email;
  const startTime: string | undefined = event.payload?.startTime;
  if (!attendeeEmail || !startTime) {
    return NextResponse.json({ error: "Payload missing attendee email or startTime" }, { status: 400 });
  }

  const lead = await db.lead.findFirst({ where: { contactEmail: attendeeEmail }, orderBy: { createdAt: "desc" } });
  if (!lead) {
    return NextResponse.json({ error: `No lead on file for ${attendeeEmail}` }, { status: 404 });
  }

  const meeting = await db.meeting.upsert({
    where: { leadId: lead.id },
    create: { leadId: lead.id, scheduledAt: new Date(startTime), bookedVia: "cal.com" },
    update: { scheduledAt: new Date(startTime) },
  });
  await db.lead.update({ where: { id: lead.id }, data: { status: "booked" } });

  return NextResponse.json({ ok: true, meetingId: meeting.id });
}
