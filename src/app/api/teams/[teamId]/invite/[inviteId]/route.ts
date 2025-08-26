export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

// DELETE: Cancel invitation (owner/admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: { teamId: string; inviteId: string } }
) {
  try {
    const { teamId, inviteId } = context.params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerkId', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "User not found"),
        { status: 404 }
      );
    }

    // Get team details and check ownership/admin status
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (teamError || !team) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Team not found"),
        { status: 404 }
      );
    }

    // Check if user has permission to cancel invitations
    let hasPermission = team.ownerId === user.id; // Owner always has permission
    
    if (!hasPermission) {
      // Check if user is admin or manager
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('role')
        .eq('teamId', teamId)
        .eq('userId', user.id)
        .single();
      
      hasPermission = membership && ['ADMIN', 'MANAGER'].includes(membership.role);
    }

    if (!hasPermission) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions to cancel invitations"),
        { status: 403 }
      );
    }

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('team_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('teamId', teamId)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Invitation not found"),
        { status: 404 }
      );
    }

    // Delete the invitation
    const { error: deleteError } = await supabaseAdmin
      .from('team_invites')
      .delete()
      .eq('id', inviteId);

    if (deleteError) {
      console.error("Error canceling invitation:", deleteError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to cancel invitation"),
        { status: 500 }
      );
    }

    // Broadcast invitation canceled event
    broadcast({
      type: "team.invitation.canceled",
      payload: { 
        teamId: teamId, 
        invitationId: inviteId,
        email: invitation.email
      },
    });

    return NextResponse.json(createSuccessResponse({
      message: "Invitation canceled successfully",
      invitationId: inviteId
    }));

  } catch (error) {
    console.error("Cancel invitation error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to cancel invitation"),
      { status: 500 }
    );
  }
}

// POST: Resend invitation (owner/admin only)
export async function POST(
  request: NextRequest,
  context: { params: { teamId: string; inviteId: string } }
) {
  try {
    const { teamId, inviteId } = context.params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerkId', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "User not found"),
        { status: 404 }
      );
    }

    // Get team details and check ownership/admin status
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (teamError || !team) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Team not found"),
        { status: 404 }
      );
    }

    // Check if user has permission to resend invitations
    let hasPermission = team.ownerId === user.id;
    
    if (!hasPermission) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('role')
        .eq('teamId', teamId)
        .eq('userId', user.id)
        .single();
      
      hasPermission = membership && ['ADMIN', 'MANAGER'].includes(membership.role);
    }

    if (!hasPermission) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions to resend invitations"),
        { status: 403 }
      );
    }

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('team_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('teamId', teamId)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Invitation not found"),
        { status: 404 }
      );
    }

    // Update invitation timestamp
    const { error: updateError } = await supabaseAdmin
      .from('team_invites')
      .update({ updatedAt: new Date().toISOString() })
      .eq('id', inviteId);

    if (updateError) {
      console.error("Error updating invitation:", updateError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to resend invitation"),
        { status: 500 }
      );
    }

    // Send invitation email (import from parent invite route)
    const { sendInvitationEmail } = await import("../route");
    let emailSent = true;
    try {
      await sendInvitationEmail(invitation.token, invitation.email, teamId, invitation.role);
    } catch (emailError) {
      console.error("Email resending failed:", emailError);
      emailSent = false;
    }

    // Broadcast invitation resent event
    broadcast({
      type: "team.invitation.resent",
      payload: { 
        teamId: teamId, 
        invitationId: inviteId,
        email: invitation.email,
        emailSent
      },
    });

    return NextResponse.json(createSuccessResponse({
      message: emailSent ? "Invitation resent successfully" : "Invitation updated but email delivery failed",
      emailSent,
      invitation: invitation
    }));

  } catch (error) {
    console.error("Resend invitation error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to resend invitation"),
      { status: 500 }
    );
  }
}
