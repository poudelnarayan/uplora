import crypto from "crypto";
export function buildInviteUrl(token: string): string {
  // Prefer canonical domain configured in env; hard-default to production domain
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.uplora.io"
  ).replace(/\/$/, "");

  return `${base}/invite/${token}`;
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

