/**
 * Map API order (GET /api/orders/:id or create response) to legacy checkout / order UI shape.
 */
export function mapApiOrderToLegacyUi(apiOrder) {
  if (!apiOrder) return null;

  const addr = apiOrder.shippingAddress || {};
  const line1 = addr.addressLine1 || "";
  const line2 = addr.addressLine2 || "";
  const addressCombined =
    [line1, line2].filter(Boolean).join(", ").trim() || line1;
  const userEmail =
    apiOrder.user && typeof apiOrder.user === "object"
      ? apiOrder.user.email
      : null;

  const rawHistory = apiOrder.statusHistory || [];
  const statusHistory =
    rawHistory.length > 0
      ? rawHistory.map((h) => ({
          status: h.status,
          timestamp: h.timestamp || apiOrder.createdAt,
          note: h.note,
        }))
      : [
          {
            status: apiOrder.status,
            timestamp: apiOrder.createdAt,
          },
        ];

  return {
    orderId: apiOrder.orderNumber,
    orderNumber: apiOrder.orderNumber,
    mongoId: apiOrder.id != null ? String(apiOrder.id) : null,
    orderDate: apiOrder.createdAt,
    status: apiOrder.status,
    statusHistory,
    paymentMethod: apiOrder.payment?.method,
    paymentDetails: {},
    address: {
      name: addr.name,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      landmark: addr.landmark,
      email: userEmail || "",
      address: addressCombined,
    },
    items: (apiOrder.items || []).map((line, idx) => ({
      lineItemId: line.id != null ? String(line.id) : null,
      id:
        line.product?.id != null
          ? String(line.product.id)
          : `line-${idx}`,
      name: line.product?.name || line.productName,
      image: line.product?.image,
      size: line.variant?.size || "One Size",
      color: line.variant?.color || "",
      quantity: line.quantity,
      price: line.price,
    })),
    orderSummary: {
      subtotal: apiOrder.subtotal ?? 0,
      discount: apiOrder.discount ?? 0,
      shipping: apiOrder.shipping?.cost ?? 0,
      tax: apiOrder.tax?.total ?? 0,
      grandTotal: apiOrder.total ?? 0,
    },
    cancelledAt: apiOrder.cancellation?.cancelledAt || null,
    delivery: apiOrder.delivery,
    raw: apiOrder,
  };
}
