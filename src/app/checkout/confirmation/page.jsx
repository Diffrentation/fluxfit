"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { motion } from "framer-motion";
import { mapApiOrderToLegacyUi } from "@/lib/order-display";
import {
  fetchMyOrderById,
  getOrdersAuthHeaders,
} from "@/lib/orders-api-client";
import {
  IconCheck,
  IconDownload,
  IconShoppingBag,
  IconHome,
  IconFileText,
  IconPackage,
} from "@tabler/icons-react";
import { Button, Card, message } from "antd";
import Image from "next/image";

const OrderConfirmationContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const orderRef =
    searchParams.get("orderNumber") || searchParams.get("orderId");

  useEffect(() => {
    if (!orderRef) {
      message.error("Missing order reference");
      router.push("/");
      return;
    }

    let cancelled = false;

    const load = async () => {
      const headers = getOrdersAuthHeaders();
      if (!headers.Authorization) {
        message.warning("Sign in to view your order confirmation");
        router.push(
          `/auth/login?returnUrl=${encodeURIComponent(`/checkout/confirmation?orderNumber=${encodeURIComponent(orderRef)}`)}`,
        );
        return;
      }

      try {
        const data = await fetchMyOrderById(orderRef);
        console.log("[Confirmation] GET /api/orders/:id", data);
        if (!cancelled && data?.success && data?.data?.order) {
          setOrder(mapApiOrderToLegacyUi(data.data.order));
          return;
        }
        if (!cancelled) {
          message.error(data?.message || "Order not found");
          router.push("/orders");
        }
      } catch (err) {
        console.error("[Confirmation] load order", err);
        if (!cancelled) {
          message.error(
            err.response?.data?.message ||
              err.message ||
              "Could not load order",
          );
          router.push("/orders");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [orderRef, router]);

  // Format price helper - prices are already in INR
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const generateInvoice = () => {
    if (!order) return;

    // Create invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-info { margin-bottom: 30px; }
          .order-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FluxFit</h1>
          <p>Invoice</p>
        </div>
        <div class="company-info">
          <p><strong>FluxFit E-Commerce</strong></p>
          <p>123 Business Street, Mumbai, Maharashtra - 400001</p>
          <p>Email: support@fluxfit.com | Phone: +91 9876543210</p>
        </div>
        <div class="order-info">
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Order Date:</strong> ${new Date(
            order.orderDate
          ).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        <div>
          <h3>Shipping Address:</h3>
          <p>${order.address.name}</p>
          <p>${order.address.phone}</p>
          <p>${order.address.addressLine1}, ${order.address.addressLine2}</p>
          <p>${order.address.city}, ${order.address.state} - ${
      order.address.pincode
    }</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Size</th>
              <th>Color</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.size || "One Size"}</td>
                <td>${item.color || "N/A"}</td>
                <td>${item.quantity}</td>
                <td>₹${formatPrice(item.price)}</td>
                <td>₹${formatPrice(parseFloat(item.price) * item.quantity)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="total">
          <p>Subtotal: ₹${formatPrice(order.orderSummary.subtotal)}</p>
          ${
            order.orderSummary.discount > 0
              ? `<p>Discount: -₹${formatPrice(order.orderSummary.discount)}</p>`
              : ""
          }
          <p>Shipping: ₹${order.orderSummary.shipping}</p>
          <p>Tax (GST 18%): ₹${order.orderSummary.tax}</p>
          <p style="font-size: 18px;">Total: ₹${
            order.orderSummary.grandTotal
          }</p>
        </div>
        <div>
          <h3>Payment Method:</h3>
          <p>${
            order.paymentMethod === "cod"
              ? "Cash on Delivery"
              : order.paymentMethod.toUpperCase()
          }</p>
        </div>
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([invoiceHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${order.orderId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success("Invoice downloaded successfully");
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <IconCheck className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you for your purchase. Your order has been placed
            successfully.
          </p>
          <p className="text-lg font-semibold text-gray-900">
            Order ID: <span className="text-blue-600">{order.orderId}</span>
          </p>
        </motion.div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Order Items */}
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <IconShoppingBag className="w-5 h-5" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item, index) => {
                const itemTotal = parseFloat(item.price) * item.quantity;

                return (
                  <motion.div
                    key={`${item.id}-${item.size}-${item.color}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="relative w-16 h-16 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={item.image || ""}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      <div className="text-xs text-gray-600 mb-1">
                        {item.size &&
                          item.size !== "One Size" &&
                          `Size: ${item.size} • `}
                        {item.color && `Color: ${item.color} • `}
                        Qty: {item.quantity}
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        ₹{formatPrice(itemTotal)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>₹{formatPrice(order.orderSummary.subtotal)}</span>
              </div>
              {order.orderSummary.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{formatPrice(order.orderSummary.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>₹{order.orderSummary.shipping}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax (GST 18%)</span>
                <span>₹{order.orderSummary.tax}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-blue-600">
                  ₹{order.orderSummary.grandTotal}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Payment Method:</strong>{" "}
                {order.paymentMethod === "cod"
                  ? "Cash on Delivery"
                  : order.paymentMethod.toUpperCase()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Order Date:</strong>{" "}
                {new Date(order.orderDate).toLocaleString()}
              </p>
            </div>
          </Card>
        </div>

        {/* Delivery Address */}
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Delivery Address
          </h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-900 mb-1">
              {order.address.name}
            </p>
            <p className="text-gray-700 text-sm mb-1">{order.address.phone}</p>
            <p className="text-gray-700 text-sm">
              {order.address.addressLine1}, {order.address.addressLine2}
            </p>
            <p className="text-gray-700 text-sm">
              {order.address.city}, {order.address.state} -{" "}
              {order.address.pincode}
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            type="primary"
            size="large"
            icon={<IconDownload className="w-4 h-4" />}
            onClick={generateInvoice}
            className="flex-1"
          >
            Download Invoice
          </Button>
          <Button
            type="default"
            size="large"
            icon={<IconPackage className="w-4 h-4" />}
            onClick={() =>
              router.push(
                `/orders/${encodeURIComponent(order.orderId || order.orderNumber)}`,
              )
            }
            className="flex-1"
          >
            View Order Details
          </Button>
          <Button
            size="large"
            icon={<IconShoppingBag className="w-4 h-4" />}
            onClick={() => router.push("/product-list")}
            className="flex-1"
          >
            Continue Shopping
          </Button>
          <Button
            size="large"
            icon={<IconHome className="w-4 h-4" />}
            onClick={() => router.push("/")}
            className="flex-1"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

const OrderConfirmationPage = () => {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600">Loading order details...</p>
            </div>
          </div>
        }
      >
        <OrderConfirmationContent />
      </Suspense>
    </ProtectedRoute>
  );
};

export default OrderConfirmationPage;
