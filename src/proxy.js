import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const REFRESH_COOKIE_NAME = "refreshToken";

const getJwtSecret = () =>
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

/** Best-effort, edge-safe check of whether the request carries an admin refresh cookie. */
async function isAdminRequest(request) {
  const token = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (payload.type !== "refresh") return false;
    if (payload.role === "admin") return true;
    // Legacy token without a role claim — fall back to a DB-backed check.
    const verifyUrl = new URL("/api/auth/verify-admin-session", request.url);
    const verifyRes = await fetch(verifyUrl, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    const data = await verifyRes.json();
    return data?.admin === true;
  } catch {
    return false;
  }
}

function maintenanceResponse(message) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Under Maintenance — FluxFit</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;background:#0d1c2f;color:#e5e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center;}main{max-width:480px;}h1{font-size:1.5rem;margin-bottom:.75rem;color:#fff;}p{color:#9ca3af;line-height:1.6;}</style></head><body><main><h1>We&#39;ll be right back</h1><p>${message}</p></main></body></html>`;
  return new NextResponse(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "3600" },
  });
}

/**
 * /admin requires a valid refresh-token cookie whose JWT payload has role === "admin".
 * Non-admins are redirected home with ?admin_denied=1 (see AdminAccessNotice).
 */
export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Maintenance mode gates every non-admin, non-auth page for non-admin
  // visitors. Checked here (not in a page-level layout) so it actually
  // blocks the whole storefront, not just pages that happen to render it.
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/auth/")) {
    try {
      const settingsUrl = new URL("/api/settings", request.url);
      const res = await fetch(settingsUrl, { cache: "no-store" });
      const json = await res.json();
      const maintenance = json?.data?.maintenance;
      if (maintenance?.enabled && !(await isAdminRequest(request))) {
        return maintenanceResponse(
          maintenance.message ||
            "We are currently under maintenance. Please check back later."
        );
      }
    } catch {
      // If the settings check itself fails, don't take the site down over it.
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

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
  // Runs on every page route so maintenance mode can actually block the
  // whole storefront, not just /admin (API routes and static assets are
  // excluded so the app keeps functioning — including the settings check
  // this file itself performs — while maintenance mode is on).
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|icon.png).*)",
  ],
};
