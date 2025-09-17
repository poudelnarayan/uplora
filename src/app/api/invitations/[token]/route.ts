import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params;
    
    const { data: invitation, error } = await supabaseAdmin
      .from('teamInvites')
      .select(`
        *,
        teams (
          name,
          description
        )
      `)
      .eq('token', token)
      .eq('status', 'PENDING')
      .gt('expiresAt', new Date().toISOString())
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Invitation not found or expired"),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      team: {
        name: invitation.teams?.name,
        description: invitation.teams?.description || "",
      },
      inviter: {
        name: "",
        email: ""
      },
      expiresAt: invitation.expiresAt,
    }));
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
      { status: 500 }
    );
  }
}
