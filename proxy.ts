import { NextResponse, type NextRequest } from "next/server";
import { canAccessRoute } from "@/config/roles";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { verifySessionToken } from "@/lib/session";

const PROTECTED_PREFIXES = [
  "/menu",
  "/sso-clients",
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
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (pathname === "/login" && session) {
    const target = getSafeRedirectPath(
      request.nextUrl.searchParams.get("next"),
      "/menu",
    );
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isProtectedPath(pathname)) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", search ? `${pathname}${search}` : pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessRoute(session.role, pathname)) {
      // /menu terbuka untuk semua role, jadi tidak pernah memicu loop redirect.
      return NextResponse.redirect(new URL("/menu", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/menu/:path*",
    "/sso-clients/:path*",
    "/dashboard/:path*",
    "/target/:path*",
    "/tiket/:path*",
    "/rapat/:path*",
    "/arsip/:path*",
  ],
};
