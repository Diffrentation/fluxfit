"use client";
import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconDownload,
  IconShoppingCart,
  IconX,
  IconRefresh,
  IconCheck,
  IconPackage,
  IconTruck,
  IconMapPin,
  IconCreditCard,
  IconFileText,
  IconAlertCircle,
} from "@tabler/icons-react";
import {
  Button,
  Card,
  Badge,
  Modal,
  Form,
  Input,
  Select,
  Steps,
  message,
  Timeline,
  Divider,
} from "antd";
import Image from "next/image";
import { format } from "date-fns";
import axios from "axios";
import { mapApiOrderToLegacyUi } from "@/lib/order-display";
import {
  fetchMyOrderById,
  getOrdersAuthHeaders,
} from "@/lib/orders-api-client";
import { blockAdminAction } from "@/lib/adminBlocker";

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const OrderDetailsPageContent = () => {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
  const [cancelForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadOrder = async () => {
    const id = params.id;
    setInitialLoad(true);
    setOrder(null);

    if (!id) {
      message.error("Order not found");
      router.push("/orders");
      setInitialLoad(false);
      return;
    }

    const headers = getOrdersAuthHeaders();
    if (!headers.Authorization) {
      message.warning("Please sign in to view this order");
      router.push(`/auth/login?returnUrl=/orders/${encodeURIComponent(id)}`);
      setInitialLoad(false);
      return;
    }

    try {
      const data = await fetchMyOrderById(id);
      console.log("[OrderDetailsPage] GET /api/orders/:id response", data);

      if (data?.success && data?.data?.order) {
        setOrder(mapApiOrderToLegacyUi(data.data.order));
        return;
      }

      message.error(data?.message || "Order not found");
      router.push("/orders");
    } catch (err) {
      console.error("[OrderDetailsPage] load order", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to load order";
      message.error(msg);
      router.push("/orders");
    } finally {
      setInitialLoad(false);
    }
  };

  const handleCancelOrder = async (values) => {
    if (blockAdminAction()) return;
    const id = params.id;
    setLoading(true);
    try {
      const reason = [values.reason, values.note].filter(Boolean).join(" — ");
      const { data } = await axios.post(
        `/api/orders/${encodeURIComponent(id)}/cancel`,
        { reason },
        { headers: getOrdersAuthHeaders() },
      );
      if (!data?.success) {
        message.error(data?.message || "Failed to cancel order");
        return;
      }
      message.success("Order cancelled successfully");
      setIsCancelModalVisible(false);
      cancelForm.resetFields();
      await loadOrder();
    } catch (err) {
      message.error(
        err.response?.data?.message || err.message || "Failed to cancel order",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReturnRequest = async (values) => {
    if (blockAdminAction()) return;
    const id = params.id;
    setLoading(true);
    try {
      const itemIds = Array.isArray(values.items) ? values.items : [];
      const reason = [values.reason, values.note].filter(Boolean).join(" — ");
      const { data } = await axios.post(
        `/api/orders/${encodeURIComponent(id)}/return`,
        {
          reason,
          ...(itemIds.length ? { itemIds } : {}),
        },
        { headers: getOrdersAuthHeaders() },
      );
      if (!data?.success) {
        message.error(data?.message || "Failed to submit return request");
        return;
      }
      message.success("Return request submitted successfully");
      setIsReturnModalVisible(false);
      returnForm.resetFields();
      await loadOrder();
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit return request",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = async () => {
    if (blockAdminAction()) return;
    message.info("Refund is processed by support after return approval.");
  };

  const generateInvoice = async () => {
    if (blockAdminAction()) return;
    if (!order) return;
    const id = params.id;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(id)}/invoice`,
        { headers: getOrdersAuthHeaders() },
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Invoice failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${order.orderId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success("Invoice downloaded");
    } catch (err) {
      message.error(err.message || "Failed to download invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async () => {
    if (blockAdminAction()) return;
    if (!order) return;
    const id = params.id;
    setLoading(true);
    try {
      const { data } = await axios.post(
        `/api/orders/${encodeURIComponent(id)}/reorder`,
        {},
        { headers: getOrdersAuthHeaders() },
      );
      if (!data?.success) {
        message.error(data?.message || "Could not reorder");
        return;
      }
      message.success("Items added to your cart");
      router.push("/cart");
    } catch (err) {
      message.error(
        err.response?.data?.message || err.message || "Could not reorder",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepTimestamp = (status) => {
    if (!order || !order.statusHistory) return null;
    const history = order.statusHistory.find((h) => h.status === status);
    if (history?.timestamp) {
      return format(new Date(history.timestamp), "MMM dd, hh:mm a");
    }
    if (order.status === status) {
      return format(new Date(order.orderDate), "MMM dd, hh:mm a");
    }
    return null;
  };

  const getEstimatedDelivery = () => {
    if (!order) return "";
    const orderDate = new Date(order.orderDate);
    const start = new Date(orderDate);
    start.setDate(orderDate.getDate() + 3);
    const end = new Date(orderDate);
    end.setDate(orderDate.getDate() + 5);
    return `${format(start, "MMM dd, yyyy")} - ${format(end, "MMM dd, yyyy")}`;
  };

  const getTrackingBannerText = () => {
    if (!order) return null;
    const est = getEstimatedDelivery();
    
    switch (order.status) {
      case "delivered":
        return {
          title: "Your order has been delivered!",
          desc: `Delivered on ${getStepTimestamp("delivered") || format(new Date(order.orderDate), "MMM dd, yyyy")}`,
          color: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-900/50",
          iconColor: "text-green-500",
        };
      case "cancelled":
        return {
          title: "This order has been cancelled.",
          desc: "We hope to serve you again in the future.",
          color: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/50",
          iconColor: "text-red-500",
        };
      case "returned":
      case "refunded":
        return {
          title: "This order has been returned.",
          desc: "Refund status will be updated soon.",
          color: "bg-zinc-150 text-zinc-800 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-700/50",
          iconColor: "text-zinc-500",
        };
      case "shipped":
        return {
          title: "Great news! Your order is on the way.",
          desc: `Estimated delivery: ${est}`,
          color: "bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50",
          iconColor: "text-emerald-600",
        };
      default:
        return {
          title: "Your order is being processed.",
          desc: `Estimated delivery: ${est}`,
          color: "bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50",
          iconColor: "text-blue-500",
        };
    }
  };

  const getStatusSteps = () => {
    const statusOrder = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
    ];
    const st = order?.status;
    
    if (st === "cancelled") {
      return [
        {
          title: "Cancelled",
          status: "error",
          description: getStepTimestamp("cancelled") || "Order Cancelled",
        },
      ];
    }

    let currentIndex = statusOrder.indexOf(st);
    if (currentIndex < 0) currentIndex = 0;

    return statusOrder.map((status, index) => {
      const isCompleted = index < currentIndex;
      const isActive = index === currentIndex;
      const timestamp = getStepTimestamp(status);

      return {
        title: (
          <span className={`text-xs sm:text-sm font-semibold ${
            isActive 
              ? "text-emerald-600 dark:text-emerald-400" 
              : isCompleted 
              ? "text-gray-900 dark:text-white" 
              : "text-gray-400 dark:text-gray-500"
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        ),
        status: isCompleted ? "finish" : isActive ? "process" : "wait",
        description: (
          <div className="text-[10px] sm:text-xs mt-0.5">
            {timestamp ? (
              <span className={isActive ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}>
                {timestamp}
              </span>
            ) : (
              <span className="text-gray-300 dark:text-gray-600">
                {status === "delivered" ? "Delivered" : "Pending"}
              </span>
            )}
          </div>
        ),
      };
    });
  };

  const canCancel = () => {
    return (
      order &&
      ["pending", "confirmed", "processing"].includes(order.status)
    );
  };

  const canReturn = () => {
    return order && order.status === "delivered";
  };

  const canRefund = () => {
    return (
      order &&
      ["cancelled", "returned"].includes(order.status) &&
      order.status !== "refunded"
    );
  };

  // Format price helper - prices are already in INR
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (initialLoad || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 pb-8 sm:pb-12 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 sm:pt-32 pb-8 sm:pb-12 transition-colors duration-300">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Button
              icon={<IconArrowLeft className="w-5 h-5" />}
              onClick={() => router.push("/orders")}
              className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-gray-600 dark:text-gray-300 shrink-0"
            />
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  Order #{order.orderId}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Placed on {format(new Date(order.orderDate), "MMMM dd, yyyy 'at' hh:mm a")}
                </p>
              </div>
              
              <div className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold capitalize shrink-0 flex items-center gap-1.5 border self-start sm:self-center ${
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
          </div>
        </motion.div>

        {/* Status Timeline / Order Tracking Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-6"
        >
          <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <IconTruck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Order Tracking
              </h2>
            </div>
            <Steps
              current={(() => {
                const steps = getStatusSteps();
                const proc = steps.findIndex((s) => s.status === "process");
                if (proc >= 0) return proc;
                const err = steps.findIndex((s) => s.status === "error");
                if (err >= 0) return err;
                return 0;
              })()}
              items={getStatusSteps()}
              className="mb-6"
            />
            
            {/* Banner/Delivery Estimate Alert */}
            {(() => {
              const banner = getTrackingBannerText();
              if (!banner) return null;
              return (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 ${banner.color}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/80 dark:bg-black/20 shrink-0 ${banner.iconColor}`}>
                      <IconAlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">{banner.title}</p>
                      <p className="text-xs sm:text-sm opacity-90 mt-0.5">{banner.desc}</p>
                    </div>
                  </div>
                  {/* Nice illustrative SVG of delivery box with map pin on the right */}
                  <div className="shrink-0 hidden sm:block">
                    <svg className="w-16 h-16 opacity-85" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="25" y="45" width="50" height="40" rx="6" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="2.5"/>
                      <path d="M25 45L50 25L75 45" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M50 45V85" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 3"/>
                      <circle cx="50" cy="22" r="10" fill="#E8F5E9" stroke="#10B981" strokeWidth="1.5"/>
                      <path d="M50 16C47.8 16 46 17.8 46 20C46 23 50 27 50 27C50 27 54 23 54 20C54 17.8 52.2 16 50 16ZM50 22C48.9 22 48 21.1 48 20C48 18.9 48.9 18 50 18C51.1 18 52 18.9 52 20C52 21.1 51.1 22 50 22Z" fill="#10B981"/>
                    </svg>
                  </div>
                </div>
              );
            })()}
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            {/* Order Items */}
            <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <IconPackage className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Order Items ({order.items.length})
                </h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {order.items.map((item, index) => {
                  const itemTotal = parseFloat(item.price) * item.quantity;

                  return (
                    <motion.div
                      key={`${item.lineItemId || item.id}-${item.size}-${item.color}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden">
                        {item.customization?.previewDataUrl || item.image ? (
                          (item.customization?.previewDataUrl || item.image).startsWith("data:") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.customization?.previewDataUrl || item.image}
                              alt={item.name}
                              className="w-full h-full object-contain bg-white"
                            />
                          ) : (
                            <Image
                              src={item.customization?.previewDataUrl || item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            —
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
                          {item.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {item.size && item.size !== "One Size" && (
                            <span>Size: {item.size}</span>
                          )}
                          {item.size && item.size !== "One Size" && item.color && (
                            <span>•</span>
                          )}
                          {item.color && (
                            <span className="capitalize">
                              Color: {item.color}
                            </span>
                          )}
                          {(item.size || item.color) && <span>•</span>}
                          <span>Qty: {item.quantity}</span>
                        </div>

                        {/* Customization Details Block */}
                        {item.customization && (
                          <div className="mt-2 mb-2 p-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-lg text-xs max-w-md">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                              <span className="font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[10px]">Customized</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1 text-[11px] text-gray-600 dark:text-gray-300">
                              {item.customization.fabricId && (
                                <p>
                                  <span className="font-semibold text-purple-700 dark:text-purple-400">Fabric/Color:</span>{" "}
                                  <span className="capitalize">{item.customization.fabricId}</span>
                                </p>
                              )}
                              {item.customization.mockupTemplateName && (
                                <p>
                                  <span className="font-semibold text-purple-700 dark:text-purple-400">Garment Base:</span>{" "}
                                  <span className="capitalize">{item.customization.mockupTemplateName}</span>
                                </p>
                              )}
                              {/* Print layers info */}
                              {["front", "back"].map((view) => {
                                const viewData = item.customization.views?.[view];
                                const activeLayers = (viewData?.layers ?? []).filter(
                                  (l) => l.designId && l.designId !== "none"
                                );
                                if (!activeLayers.length) return null;
                                return (
                                  <p key={view} className="truncate">
                                    <span className="font-semibold text-purple-700 dark:text-purple-400 capitalize">{view} prints:</span>{" "}
                                    <span>
                                      {activeLayers.map((l) => {
                                        if (l.type === "text") {
                                          return `Text ("${l.text || ''}")`;
                                        }
                                        return l.designId === "upload" ? "Custom upload" : l.designId;
                                      }).join(", ")}
                                    </span>
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                          ₹{formatPrice(itemTotal)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>

            {/* Delivery Address and Payment Method side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Delivery Address */}
              <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <IconMapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      Delivery Address
                    </h2>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                      {order.address.name}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      {order.address.phone}
                    </p>
                    <p className="leading-relaxed">
                      {order.address.addressLine1 || order.address.address}, {order.address.addressLine2 || ""}
                    </p>
                    <p>
                      {order.address.city}, {order.address.state} - {order.address.pincode}
                    </p>
                  </div>
                </div>
                {/* Map Illustration SVG inside card */}
                <div className="mt-4 opacity-75 self-end">
                  <svg className="w-20 h-16" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="80" rx="8" fill="#F3F4F6" dark-fill="#1F2937"/>
                    <path d="M10 20 L40 10 L70 30 L90 15 M10 50 L30 40 L60 60 L90 45" stroke="#E5E7EB" strokeWidth="2"/>
                    <circle cx="50" cy="40" r="25" fill="#E8F5E9" stroke="#A5D6A7" strokeWidth="1"/>
                    <path d="M50 25C44 25 40 29 40 35C40 43 50 53 50 53C50 53 60 43 60 35C60 29 56 25 50 25ZM50 38C48.3 38 47 36.7 47 35C47 33.3 48.3 32 50 32C51.7 32 53 33.3 53 35C53 36.7 51.7 38 50 38Z" fill="#10B981"/>
                  </svg>
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <IconCreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      Payment Method
                    </h2>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-semibold text-gray-900 dark:text-white capitalize mb-1">
                      {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod.toUpperCase()}
                    </p>
                    {order.paymentMethod === "card" && order.paymentDetails?.cardDetails && (
                      <p className="text-gray-500">
                        Card ending in {order.paymentDetails.cardDetails.cardNumber.slice(-4)}
                      </p>
                    )}
                    {order.paymentMethod === "upi" && order.paymentDetails?.upiId && (
                      <p className="text-gray-500">
                        {order.paymentDetails.upiId}
                      </p>
                    )}
                  </div>
                </div>
                {/* Wallet Illustration SVG */}
                <div className="mt-4 opacity-75 self-end">
                  <svg className="w-20 h-16" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="20" width="80" height="50" rx="8" fill="#E8F5E9" stroke="#A5D6A7" strokeWidth="2"/>
                    <path d="M60 20 L60 70" stroke="#A5D6A7" strokeWidth="2" strokeDasharray="3 3"/>
                    <rect x="55" y="35" width="30" height="20" rx="4" fill="#10B981"/>
                    <circle cx="65" cy="45" r="3" fill="#FFFFFF"/>
                  </svg>
                </div>
              </Card>
            </div>

            {/* Need Help Card */}
            <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎧</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Need Help?</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Our support team is available 24/7 to assist you with your order.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => router.push("/support")}
                  className="bg-transparent hover:bg-gray-50 border-gray-200 text-gray-700 dark:text-gray-200"
                >
                  Contact Support <span className="ml-1">➔</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 w-full lg:sticky lg:top-24">
            {/* Order Summary */}
            <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <span className="text-xl">📋</span>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Order Summary
                </h2>
              </div>
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <div className="flex justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span>Subtotal ({order.items.length} item{order.items.length !== 1 ? 's' : ''})</span>
                  <span className="text-gray-900 dark:text-white">₹{formatPrice(order.orderSummary.subtotal)}</span>
                </div>
                {order.orderSummary.discount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-₹{formatPrice(order.orderSummary.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span>Shipping</span>
                  <span className="text-gray-900 dark:text-white">₹{order.orderSummary.shipping}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span>Tax (GST 18%)</span>
                  <span className="text-gray-900 dark:text-white">₹{formatPrice(order.orderSummary.tax)}</span>
                </div>
                <div className="border-t border-gray-150 dark:border-gray-700 pt-3 flex justify-between items-center mt-2">
                  <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{formatPrice(order.orderSummary.grandTotal)}
                  </span>
                </div>
              </div>

              <Divider />

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<IconDownload className="w-4 h-4" />}
                  onClick={generateInvoice}
                  className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white font-semibold flex items-center justify-center"
                >
                  Download Invoice
                </Button>

                {canCancel() && (
                  <Button
                    block
                    size="large"
                    danger
                    icon={<IconX className="w-4 h-4" />}
                    onClick={() => {
                      if (blockAdminAction()) return;
                      setIsCancelModalVisible(true);
                    }}
                  >
                    Cancel Order
                  </Button>
                )}

                {canReturn() && (
                  <Button
                    block
                    size="large"
                    icon={<IconRefresh className="w-4 h-4" />}
                    onClick={() => {
                      if (blockAdminAction()) return;
                      setIsReturnModalVisible(true);
                    }}
                  >
                    Request Return
                  </Button>
                )}

                {canRefund() && (
                  <Button
                    block
                    size="large"
                    icon={<IconRefresh className="w-4 h-4" />}
                    onClick={handleRefundRequest}
                    loading={loading}
                  >
                    Request Refund
                  </Button>
                )}

                <Button
                  block
                  size="large"
                  icon={<IconShoppingCart className="w-4 h-4" />}
                  onClick={handleReorder}
                  className="flex items-center justify-center font-medium"
                >
                  Reorder
                </Button>
              </div>
            </Card>

            {/* Shop with Confidence Card */}
            <Card className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/25 rounded-lg">
              <div className="flex gap-3">
                <span className="text-2xl text-emerald-600">🛡️</span>
                <div>
                  <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">Shop with Confidence</h4>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/85">
                    Your order is secured with end-to-end encryption and 100% protection.
                  </p>
                </div>
              </div>
            </Card>

            {/* Order Details Grid Card */}
            <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Order Details</h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-150 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Order ID</span>
                  <span className="font-mono font-semibold text-gray-950 dark:text-white">{order.orderId}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-150 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Order Date</span>
                  <span className="text-gray-950 dark:text-white">
                    {format(new Date(order.orderDate), "MMM dd, yyyy 'at' hh:mm a")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">Payment Method</span>
                  <span className="text-gray-950 dark:text-white capitalize">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        title="Cancel Order"
        open={isCancelModalVisible}
        onCancel={() => {
          setIsCancelModalVisible(false);
          cancelForm.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 600 }}
      >
        <Form
          form={cancelForm}
          layout="vertical"
          onFinish={handleCancelOrder}
          className="mt-4"
        >
          <Form.Item
            name="reason"
            label="Cancellation Reason"
            rules={[{ required: true, message: "Please select a reason" }]}
          >
            <Select placeholder="Select reason for cancellation">
              <Option value="changed_mind">Changed my mind</Option>
              <Option value="found_cheaper">Found cheaper elsewhere</Option>
              <Option value="wrong_item">Ordered wrong item</Option>
              <Option value="delivery_issue">Delivery issue</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label="Additional Notes (Optional)">
            <TextArea
              rows={4}
              placeholder="Please provide any additional information..."
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsCancelModalVisible(false);
                cancelForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} danger>
              Confirm Cancellation
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Return Request Modal */}
      <Modal
        title="Request Return"
        open={isReturnModalVisible}
        onCancel={() => {
          setIsReturnModalVisible(false);
          returnForm.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 600 }}
      >
        <Form
          form={returnForm}
          layout="vertical"
          onFinish={handleReturnRequest}
          className="mt-4"
        >
          <Form.Item
            name="items"
            label="Select Items to Return"
            rules={[
              { required: true, message: "Please select at least one item" },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select items to return"
              options={order.items.map((item) => ({
                label: `${item.name} (${item.size || "One Size"}, ${
                  item.color || "N/A"
                })`,
                value: item.lineItemId,
                disabled: !item.lineItemId,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Return Reason"
            rules={[{ required: true, message: "Please select a reason" }]}
          >
            <Select placeholder="Select reason for return">
              <Option value="defective">Defective/Damaged item</Option>
              <Option value="wrong_item">Wrong item received</Option>
              <Option value="size_issue">Size doesn&apos;t fit</Option>
              <Option value="quality_issue">Quality issue</Option>
              <Option value="not_as_described">Not as described</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label="Additional Notes (Optional)">
            <TextArea
              rows={4}
              placeholder="Please provide any additional information..."
            />
          </Form.Item>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <IconAlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Return Policy:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Items must be in original condition with tags attached
                  </li>
                  <li>
                    Return request must be submitted within 7 days of delivery
                  </li>
                  <li>Refund will be processed within 5-7 business days</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsReturnModalVisible(false);
                returnForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit Return Request
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default function OrderDetailsPage() {
  return (
    <ProtectedRoute>
      <OrderDetailsPageContent />
    </ProtectedRoute>
  );
}
