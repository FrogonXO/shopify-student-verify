import { NextRequest, NextResponse } from "next/server";
import { isEmailVerified, createPendingVerification, findPendingOrderId } from "@/lib/db";
import { isValidStudentEmail, generateToken } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email";
import { activateVerifiedCustomer } from "@/lib/shopify";

export async function POST(req: NextRequest) {
  const { purchaseEmail, studentEmail } = await req.json();

  if (!purchaseEmail || !studentEmail) {
    return NextResponse.json(
      { error: "Bitte gib beide Email-Adressen ein" },
      { status: 400 }
    );
  }

  // Check if already verified
  const alreadyVerified = await isEmailVerified(purchaseEmail);
  if (alreadyVerified) {
    // Activate any on-hold orders just in case
    const orderId = await findPendingOrderId(purchaseEmail);
    if (orderId) {
      try {
        await activateVerifiedCustomer(purchaseEmail, [orderId]);
      } catch (err) {
        console.error("Failed to activate verified customer:", err);
      }
    }
    return NextResponse.json({ alreadyVerified: true });
  }

  // Validate student email domain
  if (!isValidStudentEmail(studentEmail)) {
    return NextResponse.json(
      { error: "Die Bildungsemail muss eine .edu oder eine .ac.at - Adresse sein. Bei Problemen, sende eine Email an service@edubook.at mit deiner Bestell-Email + einem Beleg deines Bildungsstatus" },
      { status: 400 }
    );
  }

  // Find the order for this purchase email
  const orderId = await findPendingOrderId(purchaseEmail);
  if (!orderId) {
    return NextResponse.json(
      { error: "Keine offene Bestellung von dieser Email gefunden. Bitte überprüfe deine Eingabe bei \"Email deiner Bestellung\"" },
      { status: 404 }
    );
  }

  // Generate token and store pending verification
  const token = generateToken();
  await createPendingVerification(purchaseEmail, studentEmail, token, orderId);

  // Send verification email to student email
  await sendVerificationEmail(studentEmail, token);

  return NextResponse.json({ ok: true });
}
