import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = await getToken();
    
    return NextResponse.json({
      success: true,
      userId,
      token,
      instructions: {
        postman: {
          method: "Add to Headers",
          key: "Authorization", 
          value: `Bearer ${token}`,
          note: "This token expires in 1 hour"
        }
      }
    });
    
  } catch (error) {
    console.error("Error getting auth token:", error);
    return NextResponse.json({
      error: "Failed to get token",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
