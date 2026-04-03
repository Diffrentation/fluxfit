/** HttpOnly cookie name for JWT refresh token */
export const REFRESH_COOKIE_NAME = "refreshToken";

export function getRefreshCookieMaxAgeSec() {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || "7", 10);
  return Math.max(1, days) * 24 * 60 * 60;
}

/**
 * @param {import("next/server").NextResponse} response
 * @param {string} refreshToken
 */
export function setRefreshTokenCookie(response, refreshToken) {
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getRefreshCookieMaxAgeSec(),
  });
}

/**
 * @param {import("next/server").NextResponse} response
 */
export function clearRefreshTokenCookie(response) {
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
