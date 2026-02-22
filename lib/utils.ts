import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

const BLACKLISTED_DOMAINS = ["gmx.at"];

export function isValidStudentEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  // Must be a valid email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) return false;

  const domain = lower.split("@")[1];

  // Reject blacklisted domains
  if (BLACKLISTED_DOMAINS.includes(domain)) return false;

  // Accept .edu, any .at domain
  return lower.endsWith(".edu") || lower.endsWith(".at");
}
