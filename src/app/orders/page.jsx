"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { motion } from "framer-motion";
import {
  IconChevronRight,
  IconSearch,
  IconFilter,
  IconPackage,
  IconTruck,
  IconCheck,
  IconX,
  IconRefresh,
  IconMessageCircleQuestion,
  IconArrowRight,
  IconShoppingBag,
  IconShieldCheck,
  IconHeadset
} from "@tabler/icons-react";
import { Button, Input, Select, Card, Badge, Empty, message, Spin } from "antd";
import Image from "next/image";
import { format } from "date-fns";
import { mapApiOrderToLegacyUi } from "@/lib/order-display";
import { fetchMyOrders, getOrdersAuthHeaders } from "@/lib/orders-api-client";

const { Search } = Input;
const { Option } = Select;

const OrdersPageContent = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    const headers = getOrdersAuthHeaders();
    if (!headers.Authorization) {
      message.warning("Please sign in to view your orders");
      router.push("/auth/login?returnUrl=/orders");
      setLoading(false);
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchMyOrders({ page: 1, limit: 100 });
      console.log("[OrdersPage] GET /api/orders response", data);

      const rawList =
        data?.orders ??
        data?.data?.orders ??
        (Array.isArray(data) ? data : []);

      if (!data?.success) {
        message.error(data?.message || "Could not load orders");
        setOrders([]);
        return;
      }

      const mapped = rawList
        .map((o) => mapApiOrderToLegacyUi(o))
        .filter(Boolean);
      setOrders(mapped);
    } catch (err) {
      console.error("[OrdersPage] load orders", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to load orders";
      message.error(msg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    let filtered = [...orders];

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          String(order.orderId || "")
            .toLowerCase()
            .includes(q) ||
          order.items.some((item) =>
            String(item.name || "")
              .toLowerCase()
              .includes(q),
          ),
      );
    }

    setFilteredOrders(filtered);
  }, [orders, debouncedSearchQuery, statusFilter]);

  const getStatusColor = (status) => {
    const colors = {
      pending: "gold",
      confirmed: "blue",
      processing: "orange",
      shipped: "purple",
      delivered: "green",
      cancelled: "red",
      returned: "gray",
      refunded: "gray",
    };
    return colors[status] || "default";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <IconCheck className="w-4 h-4" />;
      case "processing":
        return <IconPackage className="w-4 h-4" />;
      case "shipped":
        return <IconTruck className="w-4 h-4" />;
      case "delivered":
        return <IconCheck className="w-4 h-4" />;
      case "cancelled":
        return <IconX className="w-4 h-4" />;
      default:
        return <IconPackage className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      returned: "Returned",
      refunded: "Refunded",
    };
    return labels[status] || status;
  };

  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const orderLinkRef = (order) =>
    encodeURIComponent(order.orderNumber || order.orderId || order.mongoId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 pb-12 flex items-center justify-center">
        <Spin size="large" tip="Loading orders..." />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafcfb] pt-24 pb-12 transition-colors duration-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mb-2 tracking-tight">
                My Orders
              </h1>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
                Track and manage your orders
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 max-w-sm">
              <div className="w-10 h-10 bg-[#f4fbf7] rounded-full flex items-center justify-center shrink-0">
                <IconMessageCircleQuestion className="w-5 h-5 text-[#1e9a58]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#111827] text-sm">Need Help?</p>
                <p className="text-gray-500 text-xs">We're here to assist you</p>
              </div>
              <button className="text-[#1e9a58] font-bold text-xs sm:text-sm flex items-center gap-1 hover:text-green-700 transition-colors shrink-0">
                Contact Support <IconArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Empty State Main Card */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 sm:p-16 flex flex-col items-center justify-center text-center mb-10">
            {/* Custom Empty Box Illustration */}
            <div className="relative w-64 h-48 mb-8 flex items-center justify-center">
              {/* Soft Green Circle Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#eef8f2] to-transparent rounded-full opacity-60"></div>

              {/* Box Icon */}
              <IconPackage className="w-24 h-24 text-[#1e9a58] relative z-10" stroke={1.5} />

              {/* Decorative Elements */}
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-300 rounded-full"></div>
              <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-[#1e9a58] rounded-full opacity-40"></div>
              <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-green-400 rounded-full"></div>

              <svg className="absolute w-full h-full text-green-200 opacity-50" viewBox="0 0 100 100">
                <path d="M 20 80 Q 50 10 80 20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <polygon points="80,20 75,15 85,25" fill="currentColor" />
              </svg>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mb-3">
              You don't have any orders yet
            </h2>
            <p className="text-gray-500 font-medium text-sm sm:text-base max-w-md mx-auto mb-8">
              Looks like you haven't placed any orders. Start shopping and explore our amazing collection!
            </p>

            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1e9a58] hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-lg shadow-green-200"
            >
              <IconShoppingBag className="w-5 h-5" />
              Start Shopping
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 border-t border-gray-100 pt-10">
            <div className="flex items-center gap-5 min-h-[100px]">
              <div className="w-14 h-14 bg-[#f4fbf7] rounded-full flex items-center justify-center shrink-0">
                <IconShieldCheck className="w-7 h-7 text-[#1e9a58]" />
              </div>
              <div>
                <p className="font-bold text-[#1e9a58] text-sm mb-1">Secure Shopping</p>
                <p className="text-gray-500 text-xs leading-relaxed">Your data and payments are 100% safe.</p>
              </div>
            </div>

            <div className="flex items-center gap-5 min-h-[100px] sm:border-l border-gray-100 sm:pl-6 lg:pl-8">
              <div className="w-14 h-14 bg-[#f4fbf7] rounded-full flex items-center justify-center shrink-0">
                <IconTruck className="w-7 h-7 text-[#1e9a58]" />
              </div>
              <div>
                <p className="font-bold text-[#1e9a58] text-sm mb-1">Fast Delivery</p>
                <p className="text-gray-500 text-xs leading-relaxed">Get your order delivered on time, every time.</p>
              </div>
            </div>

            <div className="flex items-center gap-5 min-h-[100px] lg:border-l border-gray-100 lg:pl-8">
              <div className="w-14 h-14 bg-[#f4fbf7] rounded-full flex items-center justify-center shrink-0">
                <IconRefresh className="w-7 h-7 text-[#1e9a58]" />
              </div>
              <div>
                <p className="font-bold text-[#1e9a58] text-sm mb-1">Easy Returns</p>
                <p className="text-gray-500 text-xs leading-relaxed">Hassle-free returns within 7 days.</p>
              </div>
            </div>

            <div className="flex items-center gap-5 min-h-[100px] sm:border-l border-gray-100 sm:pl-6 lg:pl-8">
              <div className="w-14 h-14 bg-[#f4fbf7] rounded-full flex items-center justify-center shrink-0">
                <IconHeadset className="w-7 h-7 text-[#1e9a58]" />
              </div>
              <div>
                <p className="font-bold text-[#1e9a58] text-sm mb-1">24/7 Support</p>
                <p className="text-gray-500 text-xs leading-relaxed">We're always here to help you.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 pb-8 sm:pb-12 transition-colors duration-300">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Orders
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Track and manage your orders
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <Search
                placeholder="Search by order ID or product name"
                allowClear
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={
                  <IconSearch className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                }
                className="w-full"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full sm:w-[180px] md:w-[200px]"
              prefixIcon={<IconFilter className="w-4 h-4" />}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="processing">Processing</Option>
              <Option value="shipped">Shipped</Option>
              <Option value="delivered">Delivered</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="returned">Returned</Option>
              <Option value="refunded">Refunded</Option>
            </Select>
            <Button
              icon={<IconRefresh className="w-4 h-4" />}
              onClick={loadOrders}
              className="w-full sm:w-auto"
            >
              Refresh
            </Button>
          </div>
        </motion.div>

        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <Empty
                description="No orders match your filters"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.mongoId || order.orderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700"
                  onClick={() =>
                    router.push(`/orders/${orderLinkRef(order)}`)
                  }
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                              Order #{order.orderId}
                            </h3>
                            <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 border ${
                              order.status === "delivered"
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30"
                                : order.status === "cancelled"
                                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30"
                                : order.status === "shipped"
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30"
                                : order.status === "processing"
                                ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/30"
                                : order.status === "confirmed"
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30"
                                : order.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30"
                                : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/50"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                order.status === "delivered"
                                  ? "bg-green-500"
                                  : order.status === "cancelled"
                                  ? "bg-red-500"
                                  : order.status === "shipped"
                                  ? "bg-purple-500"
                                  : order.status === "processing"
                                  ? "bg-orange-500"
                                  : order.status === "confirmed"
                                  ? "bg-blue-500"
                                  : order.status === "pending"
                                  ? "bg-amber-500"
                                  : "bg-zinc-500"
                              }`} />
                              {order.status}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            Placed on{" "}
                            {format(
                              new Date(order.orderDate),
                              "MMM dd, yyyy 'at' hh:mm a",
                            )}
                          </p>
                        </div>
                        <IconChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 hidden md:block shrink-0" />
                      </div>

                      <div className="space-y-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={`${item.lineItemId || item.id}-${idx}`}
                            className="flex items-center gap-2 sm:gap-3"
                          >
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                                  —
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {item.size && item.size !== "One Size"
                                  ? `Size: ${item.size} • `
                                  : ""}
                                {item.color ? `Color: ${item.color} • ` : ""}
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                              ₹
                              {formatPrice(
                                parseFloat(item.price) * item.quantity,
                              )}
                            </p>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                            +{order.items.length - 3} more item(s)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="md:w-48 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 md:pt-0 md:pl-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Items:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {order.items.length}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Total:
                          </span>
                          <span className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400">
                            ₹
                            {formatPrice(
                              parseFloat(
                                order.orderSummary?.grandTotal || "0",
                              ),
                            )}
                          </span>
                        </div>
                        <Button
                          type="primary"
                          block
                          className="mt-3 sm:mt-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${orderLinkRef(order)}`);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}
