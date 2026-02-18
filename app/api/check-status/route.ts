import { NextRequest, NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const verified = await isEmailVerified(email);
  return NextResponse.json({ verified });
}
