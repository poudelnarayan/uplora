import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If the user is not authenticated and trying to access a protected route
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/teams/:path*",
    "/analytics/:path*",
    "/insights/:path*",
    "/settings/:path*",
  ],
};
