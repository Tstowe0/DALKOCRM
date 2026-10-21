import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname, origin, searchParams } = req.nextUrl;
  const isLogin = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth");

  if (isAuthApi) return NextResponse.next();

  if (!req.auth && !isLogin) {
    const login = new URL("/login", origin);
    const next = `${pathname}${req.nextUrl.search}`;
    if (next && next !== "/") login.searchParams.set("callbackUrl", next);
    return NextResponse.redirect(login);
  }

  if (req.auth && isLogin) {
    const dest = searchParams.get("callbackUrl");
    const safe =
      dest && dest.startsWith("/") && !dest.startsWith("//") ? dest : "/dashboard";
    return NextResponse.redirect(new URL(safe, origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
