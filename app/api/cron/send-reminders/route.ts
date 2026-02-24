import { NextRequest, NextResponse } from "next/server";
import { getOrdersNeedingReminder, incrementReminderCount, getStaleOrders, markCancelled } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { cancelOrder } from "@/lib/shopify";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log("Cron auth failed. Header:", authHeader ? "present" : "missing", "CRON_SECRET set:", !!process.env.CRON_SECRET);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let remindersSent = 0;
  let ordersCancelled = 0;

  // Send first reminder (24h after order)
  const firstReminders = await getOrdersNeedingReminder(1);
  for (const order of firstReminders) {
    try {
      await sendReminderEmail(order.email);
      await incrementReminderCount(order.id);
      remindersSent++;
      console.log(`Sent 1st reminder to ${order.email}`);
    } catch (err) {
      console.error(`Failed to send 1st reminder to ${order.email}:`, err);
    }
  }

  // Send second reminder (48h after order)
  const secondReminders = await getOrdersNeedingReminder(2);
  for (const order of secondReminders) {
    try {
      await sendReminderEmail(order.email);
      await incrementReminderCount(order.id);
      remindersSent++;
      console.log(`Sent 2nd reminder to ${order.email}`);
    } catch (err) {
      console.error(`Failed to send 2nd reminder to ${order.email}:`, err);
    }
  }

  // Cancel stale orders (72h after order)
  const staleOrders = await getStaleOrders();
  for (const order of staleOrders) {
    try {
      await cancelOrder(order.shopify_order_id);
      await markCancelled(order.id);
      ordersCancelled++;
      console.log(`Cancelled stale order ${order.shopify_order_id}`);
    } catch (err) {
      console.error(`Failed to cancel order ${order.shopify_order_id}:`, err);
    }
  }

  console.log(`Cron complete: ${remindersSent} reminders sent, ${ordersCancelled} orders cancelled`);
  return NextResponse.json({ ok: true, remindersSent, ordersCancelled });
}
