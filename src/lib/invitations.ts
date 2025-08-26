import crypto from "crypto";
export function buildInviteUrl(token: string): string {
  // Prefer canonical domain configured in env
  const canonical =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";

  let base = canonical;

  if (!base) {
    // Fallback to Vercel preview URL only if no canonical is configured
    const vercel = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
    base = vercel ? `https://${vercel}` : "http://localhost:3000";
  }

  return `${base.replace(/\/$/, "")}/invite/${token}`;
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

