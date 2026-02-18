import { NextRequest, NextResponse } from "next/server";
import { getStaleOrders, markCancelled } from "@/lib/db";
import { cancelOrder } from "@/lib/shopify";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getStaleOrders();
  let cancelled = 0;

  for (const order of orders) {
    try {
      await cancelOrder(order.shopify_order_id);
      await markCancelled(order.id);
      cancelled++;
    } catch (err) {
      console.error(`Failed to cancel order ${order.shopify_order_id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, ordersCancelled: cancelled });
}
