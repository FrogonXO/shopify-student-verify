import { NextRequest, NextResponse } from "next/server";
import { getOrdersNeedingReminder, incrementReminderCount } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sent = 0;

  // Send first reminder (24h after order, not yet reminded)
  const firstReminders = await getOrdersNeedingReminder(1);
  for (const order of firstReminders) {
    try {
      await sendReminderEmail(order.email);
      await incrementReminderCount(order.id);
      sent++;
    } catch (err) {
      console.error(`Failed to send 1st reminder to ${order.email}:`, err);
    }
  }

  // Send second reminder (48h after order, reminded once)
  const secondReminders = await getOrdersNeedingReminder(2);
  for (const order of secondReminders) {
    try {
      await sendReminderEmail(order.email);
      await incrementReminderCount(order.id);
      sent++;
    } catch (err) {
      console.error(`Failed to send 2nd reminder to ${order.email}:`, err);
    }
  }

  return NextResponse.json({ ok: true, remindersSent: sent });
}
