import { NextResponse } from "next/server";

/**
 * Set authentication cookies in the response
 * @param {NextResponse} response - Next.js response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 * @returns {NextResponse} - Response with cookies set
 */
export function setAuthCookies(response, accessToken, refreshToken) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };

  // Set access token cookie (shorter expiry)
  response.cookies.set("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24, // 1 day
  });

  // Set refresh token cookie (longer expiry)
  response.cookies.set("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

/**
 * Clear authentication cookies
 * @param {NextResponse} response - Next.js response object
 * @returns {NextResponse} - Response with cookies cleared
 */
export function clearAuthCookies(response) {
  response.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
