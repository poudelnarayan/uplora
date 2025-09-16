export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { withAuth } from "@/lib/clerk-supabase-utils";

import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function DELETE(req: NextRequest) {
  const result = await withAuth(async (user) => {
    try {
      // Release any upload lock for this user
      const { error: lockError } = await supabaseAdmin
        .from('upload_locks')
        .delete()
        .eq('userId', user.clerkUserId);

      return createSuccessResponse({ success: true });
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error("lock release error", e);
      return (
        createErrorResponse(
          ErrorCodes.INTERNAL_ERROR,
          "Failed to release lock",
          err?.message ? { detail: String(err.message) } : undefined
        )
      );
    }
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}    

// Add POST method support for compatibility
export async function POST(req: NextRequest) {
  return DELETE(req);
}
