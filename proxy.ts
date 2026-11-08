import { NextResponse, type NextRequest } from "next/server";
import { canAccessRoute } from "@/config/roles";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySessionToken } from "@/lib/session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/target",
  "/tiket",
  "/rapat",
  "/arsip",
];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedPath(pathname)) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessRoute(session.role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/target/:path*",
    "/tiket/:path*",
    "/rapat/:path*",
    "/arsip/:path*",
  ],
};
