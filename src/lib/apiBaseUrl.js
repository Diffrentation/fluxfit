/**
 * Base URL for client-side API calls.
 * In the browser, prefer NEXT_PUBLIC_API_URL when set (absolute origin).
 * Falls back to "" so paths like "/api/products" stay same-origin.
 */
export function getPublicApiBaseUrl() {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return String(process.env.NEXT_PUBLIC_API_URL).replace(/\/$/, "");
  }
  return "";
}

/**
 * Build full URL for a path starting with /api/...
 */
export function publicApiUrl(path) {
  const base = getPublicApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
