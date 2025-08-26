import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addSubscriber, removeSubscriber } from "@/lib/realtime";
import { createErrorResponse, ErrorCodes } from "@/lib/api-utils";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max duration
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    const { userId } = await auth();

    // Validate required parameters
    if (!userId) {
      return new Response(
        JSON.stringify(createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required")),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const encoder = new TextEncoder();
    const connectionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false;
        let heartbeat: ReturnType<typeof setInterval> | null = null;
        let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

        const close = () => {
          if (isClosed) return;
          isClosed = true;
          try { if (heartbeat) clearInterval(heartbeat); } catch {}
          try { if (autoCloseTimer) clearTimeout(autoCloseTimer); } catch {}
          try { removeSubscriber(connectionId); } catch {}
          try { controller.close(); } catch {}
        };

        const send = (event: any) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch (error) {
            close();
          }
        };

        addSubscriber({ id: connectionId, teamId, userId, send });

        // heartbeat every 30 seconds to prevent timeouts
        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch (error) {
            close();
          }
        }, 30000);

        // Handle client disconnect
        req.signal?.addEventListener("abort", close);
        
        // Auto-close after 4.5 minutes to prevent Vercel timeout
        autoCloseTimer = setTimeout(close, 4.5 * 60 * 1000);
      },
      cancel() {
        // Cleanup on cancel
        try { removeSubscriber(connectionId); } catch {}
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("SSE error:", error);
    return new Response(
      JSON.stringify(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to establish SSE connection")),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}


