/**
 * Client-side server cart sync (Bearer token + MongoDB product _id).
 */
import axios from "axios";
import { isStrictMongoObjectIdString } from "@/lib/mongoose-id";

export function getCartAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeVariantForServer(size, color) {
  const s =
    size && String(size).trim() && String(size) !== "One Size"
      ? String(size).trim()
      : null;
  const c =
    color && String(color).trim() && String(color) !== "default"
      ? String(color).trim()
      : null;
  return { size: s, color: c };
}

/**
 * Best-effort: add line to MongoDB cart when user is logged in and product id is a real ObjectId.
 */
export async function addItemToServerCart(productId, options = {}) {
  const { size, color, quantity = 1 } = options;
  const headers = getCartAuthHeaders();
  if (!headers.Authorization) {
    return { ok: false, skipped: true, reason: "no_token" };
  }
  const id = productId != null ? String(productId).trim() : "";
  if (!isStrictMongoObjectIdString(id)) {
    return { ok: false, skipped: true, reason: "invalid_product_id" };
  }
  const variant = normalizeVariantForServer(size, color);
  const { data } = await axios.post(
    "/api/cart/items",
    {
      productId: id,
      variant,
      quantity: Math.max(1, Number(quantity) || 1),
    },
    { headers },
  );
  if (!data?.success) {
    const err = new Error(data?.message || "Server cart request failed");
    err.response = { data };
    throw err;
  }
  return { ok: true, data };
}
