export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Clean up upload locks older than 1 hour (stale locks)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { data: deleted, error } = await supabaseAdmin
      .from('upload_locks')
      .delete()
      .lt('createdAt', oneHourAgo.toISOString())
      .select();

    if (error) {
      console.error("Supabase cleanup error:", error);
      return NextResponse.json({ 
        error: "Failed to cleanup locks", 
        detail: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: deleted?.length || 0
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
