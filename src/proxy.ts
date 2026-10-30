/**
 * Next.js 16 `proxy` (formerly middleware).
 *
 *  1. Optimistic auth redirect: private areas without a session cookie go straight to /login.
 *     This is a UX shortcut, NOT security — every layout, page, action and route handler re-validates the
 *     session and permissions server-side.
 *  2. Forwards the pathname to server components (`x-pathname`) so they can build `?next=` redirects.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { AUTH_COOKIE_PREFIX } from "@/lib/auth/cookie-prefix";

const PRIVATE_PREFIXES = ["/account", "/staff", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPrivate && !getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX })) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|brand/|icon.svg|api/media/).*)"],
};
