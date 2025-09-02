export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    // Release any upload lock for this user
    const { error: lockError } = await supabaseAdmin
      .from('upload_locks')
      .delete()
      .eq('userId', userId);

    return NextResponse.json(createSuccessResponse({ success: true }));
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("lock release error", e);
    return NextResponse.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to release lock",
        err?.message ? { detail: String(err.message) } : undefined
      ),
      { status: 500 }
    );
  }
}    

// Add POST method support for compatibility
export async function POST(req: NextRequest) {
  return DELETE(req);
}
