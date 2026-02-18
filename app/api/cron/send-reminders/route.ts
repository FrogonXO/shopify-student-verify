import { NextRequest, NextResponse } from "next/server";
import { getStaleReminders, markReminded } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getStaleReminders();
  let sent = 0;

  for (const order of orders) {
    try {
      await sendReminderEmail(order.email);
      await markReminded(order.id);
      sent++;
    } catch (err) {
      console.error(`Failed to send reminder to ${order.email}:`, err);
    }
  }

  return NextResponse.json({ ok: true, remindersSent: sent });
}
