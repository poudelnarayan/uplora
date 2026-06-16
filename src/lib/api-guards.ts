import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { upsertSupabaseUser } from "@/lib/supabase";
import { safeAuth, checkTeamAccess } from "@/lib/clerk-supabase-utils";
import { createErrorResponse, ErrorCodes } from "@/lib/api-utils";

export type TeamRole = "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER";

export const TEAM_ROLES = {
  ALL: ["OWNER", "ADMIN", "MANAGER", "EDITOR", "MEMBER"] as const,
  ADMINS: ["OWNER", "ADMIN"] as const,
  PUBLISHERS: ["OWNER", "ADMIN", "MANAGER"] as const,
  NON_OWNERS: ["ADMIN", "MANAGER", "EDITOR", "MEMBER"] as const,
} satisfies Record<string, readonly TeamRole[]>;

export interface TeamRouteContext {
  teamId: string;
  userId: string;
  role: TeamRole;
  supabaseUser: { id: string; email: string; name?: string | null; image?: string | null } & Record<string, any>;
}

export type TeamRouteHandler<TParams extends { teamId: string }> = (
  req: NextRequest,
  ctx: TeamRouteContext,
  routeParams: TParams,
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap a Next route handler that targets `/api/teams/[teamId]/…` with a single
 * auth + team-membership + role gate. Replaces ad-hoc copies of:
 *   - auth() / currentUser() / upsertSupabaseUser
 *   - manual team owner / team_members lookup
 *   - manual role allowlist checks
 *
 * Pass the allowed roles (or one of the `TEAM_ROLES.*` constants) and a handler
 * that receives the validated context.
 */
export function withTeamRole<TParams extends { teamId: string } = { teamId: string }>(
  allowedRoles: readonly TeamRole[],
  handler: TeamRouteHandler<TParams>,
) {
  return async (req: NextRequest, route: { params: TParams }): Promise<NextResponse> => {
    try {
      const { userId } = await safeAuth();
      if (!userId) {
        return NextResponse.json(
          createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
          { status: 401 },
        );
      }

      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json(
          createErrorResponse(ErrorCodes.UNAUTHORIZED, "User not found"),
          { status: 401 },
        );
      }

      const supabaseUser = await upsertSupabaseUser(userId, {
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: clerkUser.fullName || undefined,
        image: clerkUser.imageUrl || undefined,
      });

      const { teamId } = route.params;
      if (!teamId) {
        return NextResponse.json(
          createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Missing teamId"),
          { status: 400 },
        );
      }

      const { hasAccess, role } = await checkTeamAccess(teamId, userId);
      if (!hasAccess || !role) {
        return NextResponse.json(
          createErrorResponse(ErrorCodes.FORBIDDEN, "No access to this team"),
          { status: 403 },
        );
      }

      if (!allowedRoles.includes(role as TeamRole)) {
        return NextResponse.json(
          createErrorResponse(
            ErrorCodes.FORBIDDEN,
            `Role ${role} is not permitted for this action`,
          ),
          { status: 403 },
        );
      }

      return handler(
        req,
        { teamId, userId, role: role as TeamRole, supabaseUser },
        route.params,
      );
    } catch (error) {
      console.error("withTeamRole error:", error);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),
        { status: 500 },
      );
    }
  };
}
