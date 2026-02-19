import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook, activateVerifiedCustomer } from "@/lib/shopify";
import { isEmailVerified, storeOrder, autoVerifyStudent } from "@/lib/db";
import { isValidStudentEmail } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256") || "";

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
  let verified = await isEmailVerified(email);

  // If not verified, check if the purchase email itself is a student email
  if (!verified && isValidStudentEmail(email)) {
    console.log(`Auto-verifying student email: ${email}`);
    await autoVerifyStudent(email);
    verified = true;
  }

  if (verified) {
    try {
      await activateVerifiedCustomer(email, [shopifyOrderId]);
    } catch (err) {
      console.error("Failed to activate order for verified customer:", err);
    }
  }

  return NextResponse.json({ ok: true, verified });
}
