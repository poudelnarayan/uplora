export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";
import { sendMail } from "@/lib/email";

type PlatformRequestBody = {
  platformName?: string;
  platformUrl?: string;
  details?: string;
};

export async function POST(request: NextRequest) {
  try {
    const result = await withAuth(async ({ clerkUser, supabaseUser }) => {
      const body = (await request.json().catch(() => ({}))) as PlatformRequestBody;
      const platformName = String(body.platformName || "").trim();
      const platformUrl = String(body.platformUrl || "").trim();
      const details = String(body.details || "").trim();

      if (!platformName) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Platform name is required");
      }

      const id = `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const createdAt = new Date().toISOString();
      const requesterEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "";

      // 1) Best-effort persist to DB (if table exists)
      let stored = true;
      try {
        const { error } = await supabaseAdmin.from("platform_requests").insert({
          id,
          platformName,
          platformUrl: platformUrl || null,
          details: details || null,
          userId: supabaseUser.id,
          email: requesterEmail || null,
          createdAt,
        });
        if (error) {
          // If table doesn't exist, keep flow working via email/logging
          if ((error as any)?.code === "PGRST205") stored = false;
          else throw error;
        }
      } catch (e) {
        console.error("Platform request insert failed:", e);
        stored = false;
      }

      // 2) Best-effort notify via email (if SMTP is configured)
      let emailed = true;
      try {
        const to = process.env.PLATFORM_REQUEST_TO || process.env.SMTP_USER;
        if (!to) throw new Error("No recipient configured (PLATFORM_REQUEST_TO or SMTP_USER)");
        const subject = `Uplora: Platform request – ${platformName}`;
        const text = [
          `Platform requested: ${platformName}`,
          platformUrl ? `URL: ${platformUrl}` : "",
          "",
          `Requested by: ${requesterEmail || "(unknown email)"} (${supabaseUser.id})`,
          "",
          details ? `Details:\n${details}` : "Details: (none)",
          "",
          `Request ID: ${id}`,
          `Created At: ${createdAt}`,
        ]
          .filter(Boolean)
          .join("\n");

        await sendMail({ to, subject, text });
      } catch (e) {
        console.warn("Platform request email notify failed (non-fatal):", e);
        emailed = false;
      }

      return createSuccessResponse({
        message: "Platform request submitted",
        requestId: id,
        stored,
        emailed,
      });
    });

    if (!result.ok) {
      const status =
        result.code === ErrorCodes.UNAUTHORIZED ? 401 :
        result.code === ErrorCodes.FORBIDDEN ? 403 :
        result.code === ErrorCodes.NOT_FOUND ? 404 :
        result.code === ErrorCodes.VALIDATION_ERROR ? 400 :
        500;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Platform request error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to submit platform request"),
      { status: 500 }
    );
  }
}


