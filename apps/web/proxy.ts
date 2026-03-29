import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
