import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/shopify";
import { isEmailVerified, storeOrder } from "@/lib/db";
import { releaseOrderHold } from "@/lib/shopify";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256") || "";

  console.log("Webhook received:", {
    hasBody: body.length > 0,
    bodyLength: body.length,
    hasHmac: hmac.length > 0,
    hmacValue: hmac.substring(0, 10) + "...",
    hasSecret: !!process.env.SHOPIFY_CLIENT_SECRET,
    secretPrefix: process.env.SHOPIFY_CLIENT_SECRET?.substring(0, 8) + "...",
  });

  // Verify the webhook is from Shopify
  if (!verifyWebhook(body, hmac)) {
    console.log("Webhook HMAC verification failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = JSON.parse(body);
  const email = order.email?.toLowerCase();
  const shopifyOrderId = String(order.id);

  console.log("Order received:", { email, shopifyOrderId });

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
