import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // If the user is not authenticated and trying to access a protected route
    if (!req.nextauth.token) {
      // For API routes, return 401 instead of redirecting
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { ok: false, code: "UNAUTHORIZED", message: "Authentication required" },
          { status: 401 }
        );
      }
      
      // For pages, redirect to signin
      return NextResponse.redirect(new URL("/signin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/teams/:path*",
    "/settings/:path*",
    "/videos/:path*",
    "/subscription/:path*",
    "/api/teams/:path*",
    "/api/videos/:path*",
    "/api/s3/:path*",
    "/api/events/:path*",
  ],
};
