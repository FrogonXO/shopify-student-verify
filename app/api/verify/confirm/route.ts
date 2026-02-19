import { NextRequest, NextResponse } from "next/server";
import { confirmVerification } from "@/lib/db";
import { activateVerifiedCustomer } from "@/lib/shopify";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const result = await confirmVerification(token);

  if (!result) {
    return NextResponse.json(
      { error: "Invalid or expired verification link" },
      { status: 404 }
    );
  }

  // Tag customer, set metafield, and release all on-hold orders
  try {
    await activateVerifiedCustomer(result.purchaseEmail, result.orderIds);
  } catch (err) {
    console.error("Failed to activate customer in Shopify:", err);
  }

  // Redirect to success page regardless — the verification is saved in DB
  const successUrl = new URL("/verify/success", process.env.APP_URL);
  successUrl.searchParams.set("email", result.studentEmail);
  return NextResponse.redirect(successUrl.toString());
}
