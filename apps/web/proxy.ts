import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_ROUTES = new Set(["/login", "/register"]);

export function proxy(request: NextRequest) {
  const hasAccessToken = Boolean(request.cookies.get("access_token")?.value);
  const { pathname } = request.nextUrl;

  if (
    (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) &&
    !hasAccessToken
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ROUTES.has(pathname) && hasAccessToken) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";

    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/dashboard", "/dashboard/:path*"],
};
