import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test user table
    const userCount = await prisma.user.count();
    
    // Test if we can create a test user (then delete it)
    const testUser = await prisma.user.create({
      data: {
        id: `test-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
      }
    });
    
    await prisma.user.delete({
      where: { id: testUser.id }
    });

    return NextResponse.json({
      status: "success",
      message: "Database connection working",
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
