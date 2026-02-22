import { NextRequest, NextResponse } from "next/server";
import { confirmVerification } from "@/lib/db";
import { activateVerifiedCustomer } from "@/lib/shopify";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token erforderlich" }, { status: 400 });
  }

  const result = await confirmVerification(token);

  if (!result) {
    return NextResponse.json(
      { error: "Ungültiger oder abgelaufener Verifizierungslink" },
      { status: 404 }
    );
  }

  // Tag customer, set metafield, and release all on-hold orders
  try {
    await activateVerifiedCustomer(result.purchaseEmail, result.orderIds);
  } catch (err) {
    console.error("Failed to activate customer in Shopify:", err);
  }

  return NextResponse.json({ ok: true, email: result.studentEmail });
}
