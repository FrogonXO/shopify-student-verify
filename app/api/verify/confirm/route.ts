import { NextRequest, NextResponse } from "next/server";
import { confirmVerification } from "@/lib/db";
import { activateVerifiedCustomer } from "@/lib/shopify";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token erforderlich", code: "invalid" }, { status: 400 });
  }

  const result = await confirmVerification(token);

  if (result.status === "not_found") {
    return NextResponse.json(
      { error: "Dieser Link wurde bereits verwendet.", code: "used" },
      { status: 404 }
    );
  }

  if (result.status === "expired") {
    return NextResponse.json(
      { error: "Dieser Link ist abgelaufen.", code: "expired" },
      { status: 410 }
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
