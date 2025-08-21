import { NextRequest } from "next/server";
import { addSubscriber, removeSubscriber } from "@/lib/realtime";
import { createErrorResponse, ErrorCodes } from "@/lib/api-utils";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max duration
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    const userId = searchParams.get("userId");

    // Validate required parameters
    if (!userId) {
      return new Response(
        JSON.stringify(createErrorResponse(ErrorCodes.VALIDATION_ERROR, "User ID is required")),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const send = (event: any) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch (error) {
            console.error("Error sending SSE event:", error);
            close();
          }
        };

        addSubscriber({ id, teamId, userId, send });

        // heartbeat every 30 seconds to prevent timeouts
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch (error) {
            console.error("Error sending heartbeat:", error);
            close();
          }
        }, 30000);

        const close = () => {
          clearInterval(heartbeat);
          removeSubscriber(id);
          try {
            controller.close();
          } catch (error) {
            console.error("Error closing SSE stream:", error);
          }
        };

        // Handle client disconnect
        req.signal?.addEventListener("abort", close);
        
        // Auto-close after 4.5 minutes to prevent Vercel timeout
        setTimeout(close, 4.5 * 60 * 1000);
      },
      cancel() {
        // Cleanup on cancel
        removeSubscriber(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
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


