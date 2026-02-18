import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/shopify";
import { isEmailVerified, storeOrder } from "@/lib/db";
import { releaseOrderHold } from "@/lib/shopify";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256") || "";

  // Verify the webhook is from Shopify
  if (!verifyWebhook(body, hmac)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = JSON.parse(body);
  const email = order.email?.toLowerCase();
  const shopifyOrderId = String(order.id);

  if (!email) {
    return NextResponse.json({ error: "No email in order" }, { status: 400 });
  }

  // Store the order in our database
  await storeOrder(shopifyOrderId, email);

  // Check if this email is already verified
  const verified = await isEmailVerified(email);

  if (verified) {
    // Release the hold automatically
    await releaseOrderHold(shopifyOrderId);
  }

  return NextResponse.json({ ok: true, verified });
}
