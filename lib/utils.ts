import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function isValidStudentEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  // Must be a valid email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) return false;

  // Must end with .edu or .ac.at
  return lower.endsWith(".edu") || lower.endsWith(".ac.at");
}
