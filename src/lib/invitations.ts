import crypto from "crypto";
export function buildInviteUrl(token: string): string {
  const base =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined) ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/invite/${token}`;
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

