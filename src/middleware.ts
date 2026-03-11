import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPaths = [
  "/dashboard", "/meetings", "/library", "/action-items", "/decisions",
  "/coach", "/clips", "/analytics", "/team", "/integrations", "/settings",
];

const authPaths = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Demo routes bypass all auth
  if (pathname.startsWith("/demo")) {
    return NextResponse.next();
  }

  // Auth callback — don't touch cookies, the client page handles token exchange
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Public routes — no session needed
  if (
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/about" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/share/")
  ) {
    // Still refresh session cookie if present
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Refresh session and get user
  const { supabaseResponse, user } = await updateSession(request);

  // Protected routes — redirect to sign-in if not authenticated
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Auth routes — redirect to dashboard if already authenticated
  const isAuth = authPaths.some((p) => pathname.startsWith(p));
  if (isAuth && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
