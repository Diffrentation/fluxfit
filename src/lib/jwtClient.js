/**
 * Read JWT `exp` (seconds) from an access token without verifying signature (client-only scheduling).
 * @returns {number | null} expiry time in milliseconds since epoch
 */
export function getJwtExpiryMs(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    if (typeof atob === "undefined") return null;
    const json = JSON.parse(atob(base64));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}
