import { NextRequest, NextResponse } from "next/server";
import { isEmailVerified, createPendingVerification, findPendingOrderId } from "@/lib/db";
import { isValidStudentEmail, generateToken } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email";
import { releaseOrderHold } from "@/lib/shopify";

export async function POST(req: NextRequest) {
  const { purchaseEmail, studentEmail } = await req.json();

  if (!purchaseEmail || !studentEmail) {
    return NextResponse.json(
      { error: "Both purchase email and student email are required" },
      { status: 400 }
    );
  }

  // Check if already verified
  const alreadyVerified = await isEmailVerified(purchaseEmail);
  if (alreadyVerified) {
    // Release any on-hold orders just in case
    const orderId = await findPendingOrderId(purchaseEmail);
    if (orderId) {
      await releaseOrderHold(orderId);
    }
    return NextResponse.json({ alreadyVerified: true });
  }

  // Validate student email domain
  if (!isValidStudentEmail(studentEmail)) {
    return NextResponse.json(
      { error: "Student email must be a .edu or .ac.at address" },
      { status: 400 }
    );
  }

  // Find the order for this purchase email
  const orderId = await findPendingOrderId(purchaseEmail);
  if (!orderId) {
    return NextResponse.json(
      { error: "No pending order found for this email. Please use the email you purchased with." },
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
