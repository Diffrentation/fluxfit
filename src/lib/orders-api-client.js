import axios from "axios";

export function getOrdersAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * GET /api/orders — current user's orders.
 */
export async function fetchMyOrders(options = {}) {
  const { page = 1, limit = 50 } = options;
  const sp = new URLSearchParams();
  sp.set("page", String(page));
  sp.set("limit", String(limit));
  const { data } = await axios.get(`/api/orders?${sp.toString()}`, {
    headers: getOrdersAuthHeaders(),
  });
  return data;
}

/**
 * GET /api/orders/:id — Mongo _id or orderNumber.
 */
export async function fetchMyOrderById(orderRef) {
  const { data } = await axios.get(
    `/api/orders/${encodeURIComponent(orderRef)}`,
    { headers: getOrdersAuthHeaders() },
  );
  return data;
}

/**
 * GET /api/admin/orders — admin only.
 */
export async function fetchAdminOrders(options = {}) {
  const { page = 1, limit = 100 } = options;
  const sp = new URLSearchParams();
  sp.set("page", String(page));
  sp.set("limit", String(limit));
  const { data } = await axios.get(`/api/admin/orders?${sp.toString()}`, {
    headers: getOrdersAuthHeaders(),
  });
  return data;
}
