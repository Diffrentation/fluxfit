import toast from "react-hot-toast";

/**
 * Normalize axios/fetch-style errors into a user-visible string.
 */
export function getErrorMessage(error, fallback = "Something went wrong") {
  if (!error) return fallback;
  const data = error.response?.data;
  let msg = data?.message ?? data?.error;
  if (msg != null && typeof msg === "object") {
    if (typeof msg.message === "string") msg = msg.message;
    else {
      try {
        msg = JSON.stringify(msg);
      } catch {
        msg = fallback;
      }
    }
  }
  if (Array.isArray(msg)) {
    msg = msg
      .map((m) => (typeof m === "string" ? m : m?.message || String(m)))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
}

export function toastApiError(error, fallback) {
  const text = getErrorMessage(error, fallback);
  toast.error(text);
}

export function toastApiSuccess(message) {
  if (typeof message === "string" && message.trim()) {
    toast.success(message.trim());
  }
}

export { toast };
