import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  // Skip middleware for these paths
  const publicPaths = [
    "/api",
    "/signin",
    "/onboarding",
    "/terms",
    "/privacy",
    "/contact",
    "/_next",
    "/logo.svg",
    "/favicon.ico",
  ];
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path));

  // Skip middleware for non-authenticated users or public paths
  if (!token || isPublicPath) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// See https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico|logo.svg).*)"],
};
