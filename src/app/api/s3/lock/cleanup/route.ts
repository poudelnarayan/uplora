export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Clean up upload locks older than 1 hour (stale locks)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const deleted = await prisma.uploadLock.deleteMany({
      where: {
        createdAt: {
          lt: oneHourAgo
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: deleted.count 
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("lock cleanup error", e);
    return NextResponse.json({ 
      error: "Failed to cleanup locks", 
      detail: err?.message 
    }, { status: 500 });
  }
}
