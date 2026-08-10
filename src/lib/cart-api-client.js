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
  const { size, color, quantity = 1, customization } = options;
  const headers = getCartAuthHeaders();
  if (!headers.Authorization) {
    return { ok: false, skipped: true, reason: "no_token" };
  }
  const id = productId != null ? String(productId).trim() : "";
  if (!isStrictMongoObjectIdString(id)) {
    return { ok: false, skipped: true, reason: "invalid_product_id" };
  }
  const variant = normalizeVariantForServer(size, color);
  const body = {
    productId: id,
    variant,
    quantity: Math.max(1, Number(quantity) || 1),
  };
  if (customization != null && typeof customization === "object") {
    body.customization = customization;
  }
  const { data } = await axios.post("/api/cart/items", body, { headers });
  if (!data?.success) {
    const err = new Error(data?.message || "Server cart request failed");
    err.response = { data };
    throw err;
  }
  return { ok: true, data };
}

/**
 * Find the matching server cart line's Mongo _id for a given product+variant
 * by reading the current server cart. The server cart is line-keyed by its
 * own subdocument _id, while the local cart is keyed by product+variant, so
 * quantity-change/remove need this lookup before they can call
 * PUT/DELETE /api/cart/items/:itemId.
 */
async function findServerCartItemId(productId, size, color, headers) {
  const { data } = await axios.get("/api/cart", { headers });
  const items = data?.data?.cart?.items || [];
  const { size: s, color: c } = normalizeVariantForServer(size, color);
  const match = items.find(
    (item) =>
      String(item.product?.id) === String(productId) &&
      (item.variant?.size || null) === s &&
      (item.variant?.color || null) === c,
  );
  return match?.id || null;
}

/**
 * Best-effort: mirror a local quantity change onto the MongoDB cart.
 */
export async function updateItemQuantityOnServerCart(productId, size, color, quantity) {
  const headers = getCartAuthHeaders();
  if (!headers.Authorization) return { ok: false, skipped: true, reason: "no_token" };
  const id = productId != null ? String(productId).trim() : "";
  if (!isStrictMongoObjectIdString(id)) {
    return { ok: false, skipped: true, reason: "invalid_product_id" };
  }
  const itemId = await findServerCartItemId(id, size, color, headers);
  if (!itemId) return { ok: false, skipped: true, reason: "not_in_server_cart" };
  const { data } = await axios.put(
    `/api/cart/items/${itemId}`,
    { quantity: Math.max(0, Number(quantity) || 0) },
    { headers },
  );
  if (!data?.success) {
    const err = new Error(data?.message || "Server cart request failed");
    err.response = { data };
    throw err;
  }
  return { ok: true, data };
}

/**
 * Best-effort: mirror a local item removal onto the MongoDB cart.
 */
export async function removeItemFromServerCart(productId, size, color) {
  const headers = getCartAuthHeaders();
  if (!headers.Authorization) return { ok: false, skipped: true, reason: "no_token" };
  const id = productId != null ? String(productId).trim() : "";
  if (!isStrictMongoObjectIdString(id)) {
    return { ok: false, skipped: true, reason: "invalid_product_id" };
  }
  const itemId = await findServerCartItemId(id, size, color, headers);
  if (!itemId) return { ok: false, skipped: true, reason: "not_in_server_cart" };
  const { data } = await axios.delete(`/api/cart/items/${itemId}`, { headers });
  if (!data?.success) {
    const err = new Error(data?.message || "Server cart request failed");
    err.response = { data };
    throw err;
  }
  return { ok: true, data };
}
