import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const REFRESH_COOKIE_NAME = "refreshToken";

const getJwtSecret = () =>
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * /admin requires a valid refresh-token cookie whose JWT payload has role === "admin".
 * Non-admins are redirected home with ?admin_denied=1 (see AdminAccessNotice).
 */
export async function proxy(request) {
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

    // Fast path: JWT includes admin (new refresh tokens).
    // Otherwise verify against DB (legacy tokens without role, or role promoted in DB).
    if (payload.role === "admin") {
      return NextResponse.next();
    }

    const verifyUrl = new URL(
      "/api/auth/verify-admin-session",
      request.url
    );
    let isAdmin = false;
    try {
      const verifyRes = await fetch(verifyUrl, {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
        cache: "no-store",
      });
      const data = await verifyRes.json();
      isAdmin = data?.admin === true;
    } catch {
      isAdmin = false;
    }

    if (!isAdmin) {
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
