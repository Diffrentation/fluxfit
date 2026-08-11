import axios from "axios";

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export function getCheckoutAuthHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function isLoggedInForCheckout() {
  return Boolean(
    typeof window !== "undefined" && localStorage.getItem("token"),
  );
}

function normalizeVariantForApi(item) {
  const size =
    item.size && item.size !== "One Size" ? String(item.size).trim() : null;
  const color = item.color ? String(item.color).trim() : null;
  return { size, color };
}

/**
 * Replace the authenticated user's server cart with local `cartItems`, then optionally apply coupon.
 * Required before POST /api/orders (orders are created from the DB cart).
 */
export async function syncLocalCartToServer(cartItems, appliedCoupon) {
  const headers = getCheckoutAuthHeaders();
  if (!headers.Authorization) {
    const err = new Error("Please sign in to place an order.");
    err.code = "LOGIN_REQUIRED";
    throw err;
  }

  await axios.delete("/api/cart", { headers });

  for (const item of cartItems) {
    const pid = item.id != null ? String(item.id) : "";
    if (!OBJECT_ID_RE.test(pid)) {
      const err = new Error(
        "Cart contains an item that cannot be ordered online. Remove it and add the product again from the shop.",
      );
      err.code = "INVALID_PRODUCT_ID";
      throw err;
    }
    const { size, color } = normalizeVariantForApi(item);
    const { data } = await axios.post(
      "/api/cart/items",
      {
        productId: pid,
        variant: { size, color },
        quantity: Number(item.quantity) || 1,
      },
      { headers },
    );
    if (!data?.success) {
      const err = new Error(data?.message || "Failed to sync cart");
      err.response = { data };
      throw err;
    }
  }

  if (appliedCoupon?.code) {
    const { data } = await axios.post(
      "/api/cart/apply-coupon",
      { code: String(appliedCoupon.code).trim() },
      { headers },
    );
    if (!data?.success) {
      const err = new Error(data?.message || "Could not apply coupon on server");
      err.response = { data };
      throw err;
    }
  }
}

/**
 * POST /api/orders — uses server cart + shippingAddressId.
 */
export async function createOrderFromServerCart({
  shippingAddressId,
  paymentMethod,
  shippingCost = 0,
  shippingMethod = "standard",
  clearCart = true,
}) {
  const headers = getCheckoutAuthHeaders();
  const { data } = await axios.post(
    "/api/orders",
    {
      shippingAddressId,
      paymentMethod,
      shippingCost,
      shippingMethod,
      clearCart,
    },
    { headers },
  );

  if (!data?.success) {
    const err = new Error(data?.message || "Failed to create order");
    err.response = { data };
    throw err;
  }

  return data.data.order;
}

/**
 * POST /api/orders in "Buy Now" mode — creates an order for exactly one
 * product/variant via `directItem`, without ever reading, syncing, or
 * clearing the user's real server cart (contrast with
 * createOrderFromServerCart, which always operates on the cart).
 */
export async function createDirectOrder({
  shippingAddressId,
  paymentMethod,
  directItem,
}) {
  const headers = getCheckoutAuthHeaders();
  if (!headers.Authorization) {
    const err = new Error("Please sign in to place an order.");
    err.code = "LOGIN_REQUIRED";
    throw err;
  }

  const { data } = await axios.post(
    "/api/orders",
    {
      shippingAddressId,
      paymentMethod,
      directItem,
    },
    { headers },
  );

  if (!data?.success) {
    const err = new Error(data?.message || "Failed to create order");
    err.response = { data };
    throw err;
  }

  return data.data.order;
}
