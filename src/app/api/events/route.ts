import { NextRequest } from "next/server";
import { addSubscriber, removeSubscriber } from "@/lib/realtime";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  const userId = searchParams.get("userId");

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const send = (event: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      addSubscriber({ id, teamId, userId, send });

      // heartbeat
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch {}
      }, 25000);

      const close = () => {
        clearInterval(heartbeat);
        removeSubscriber(id);
        try { controller.close(); } catch {}
      };

      // @ts-ignore
      req.signal?.addEventListener("abort", close);
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}


