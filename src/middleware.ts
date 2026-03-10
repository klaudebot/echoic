import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = [
  "/dashboard", "/meetings", "/library", "/action-items", "/decisions",
  "/coach", "/clips", "/analytics", "/team", "/integrations", "/settings",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Demo routes bypass all auth
  if (pathname.startsWith("/demo")) {
    return NextResponse.next();
  }

  // For now, allow all routes (Supabase auth can be wired later)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
