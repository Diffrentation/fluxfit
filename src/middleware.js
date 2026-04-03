import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const REFRESH_COOKIE_NAME = "refreshToken";

const getJwtSecret = () =>
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * /admin requires a valid refresh-token cookie whose JWT payload has role === "admin".
 * Non-admins are redirected home with ?admin_denied=1 (see AdminAccessNotice).
 */
export async function middleware(request) {
  const token = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!token) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set(
      "redirect",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(login);
  }

  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (payload.type !== "refresh") {
      const login = new URL("/auth/login", request.url);
      login.searchParams.set(
        "redirect",
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      );
      return NextResponse.redirect(login);
    }

    if (payload.role !== "admin") {
      const home = new URL("/", request.url);
      home.searchParams.set("admin_denied", "1");
      return NextResponse.redirect(home);
    }

    return NextResponse.next();
  } catch {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set(
      "redirect",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
