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
  const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
  const [cancelForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [refundForm] = Form.useForm();
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

  const handleRefundRequest = async (values) => {
    if (blockAdminAction()) return;
    const id = params.id;
    setLoading(true);
    try {
      const itemIds = Array.isArray(values?.items) ? values.items : [];
      const { data } = await axios.post(
        `/api/orders/${encodeURIComponent(id)}/refund`,
        {
          reason: values?.reason,
          ...(itemIds.length ? { itemIds } : {}),
        },
        { headers: getOrdersAuthHeaders() },
      );
      if (!data?.success) {
        message.error(data?.message || "Failed to submit refund request");
        return;
      }
      message.success("Refund request submitted successfully");
      setIsRefundModalVisible(false);
      refundForm.resetFields();
      await loadOrder();
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit refund request",
      );
    } finally {
      setLoading(false);
    }
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
    // Prefer the real estimate set by admin (delivery assignment) over a
    // guessed range.
    if (order.delivery?.estimatedDelivery) {
      return format(new Date(order.delivery.estimatedDelivery), "MMM dd, yyyy");
    }
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

    // "returned"/"refunded" aren't part of the linear pending -> delivered
    // sequence — treating them as an unrecognized status (indexOf === -1)
    // used to fall back to index 0, making a returned order look like it
    // had just been placed. Show the linear steps as fully completed
    // (the order did reach delivered before being returned) plus a
    // trailing step for the actual current status.
    if (st === "returned" || st === "refunded") {
      return [
        ...statusOrder.map((status) => ({
          title: (
            <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          ),
          status: "finish",
          description: (
            <div className="text-[10px] sm:text-xs mt-0.5 text-gray-500 dark:text-gray-400">
              {getStepTimestamp(status) || "Completed"}
            </div>
          ),
        })),
        {
          title: (
            <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </span>
          ),
          status: "process",
          description: (
            <div className="text-[10px] sm:text-xs mt-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
              {getStepTimestamp(st) || "In progress"}
            </div>
          ),
        },
      ];
    }

    // Derive completion from statusHistory rather than a fixed array
    // index — an admin can skip a stage (e.g. go straight from
    // "confirmed" to "shipped"), and indexOf-based comparison alone can't
    // tell a genuinely-skipped stage apart from one that just hasn't
    // happened yet the way checking for a recorded history entry can.
    const historyStatuses = new Set(
      (order?.statusHistory || []).map((h) => h.status)
    );
    let currentIndex = statusOrder.indexOf(st);
    if (currentIndex < 0) currentIndex = 0;

    return statusOrder.map((status, index) => {
      const isCompleted = historyStatuses.has(status)
        ? status !== st
        : index < currentIndex;
      const isActive = status === st;
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
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900 pt-20 sm:pt-28 pb-8 sm:pb-12 transition-colors duration-300">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 lg:mb-8"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/orders")}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 transition-colors shrink-0"
              >
                <IconArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                Order #{order.orderId}
              </h1>
            </div>
            
            <div className="flex items-center justify-between pl-[52px]">
              <p className="text-[11px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(order.orderDate), "MMM dd, yyyy 'at' hh:mm a")}
              </p>
              <div className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold capitalize shrink-0 border ${
                order.status === "delivered" ? "bg-green-50 text-green-700 border-green-200" :
                order.status === "cancelled" ? "bg-red-50 text-red-700 border-red-200" :
                order.status === "shipped" ? "bg-purple-50 text-purple-700 border-purple-200" :
                order.status === "processing" ? "bg-orange-50 text-orange-700 border-orange-200" :
                order.status === "confirmed" ? "bg-blue-50 text-blue-700 border-blue-200" :
                order.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                "bg-gray-100 text-gray-700 border-gray-200"
              }`}>
                {order.status}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2-Column Desktop Grid Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 flex flex-col gap-4 sm:gap-5">
          
          {/* Left Column (Tracking & Items) */}
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-5">
            
            {/* Status Timeline / Order Tracking Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5"
            >
              <div className="flex items-center gap-2 mb-6">
                <IconTruck className="w-5 h-5 text-[#1e9a58]" />
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Order Tracking
                </h2>
              </div>
              
              <div className="relative pl-1">
                {(() => {
                  const steps = getStatusSteps();
                  return steps.map((step, idx) => {
                    const isLast = idx === steps.length - 1;
                    const isCompleted = step.status === "finish";
                    const isActive = step.status === "process";
                    
                    return (
                      <div key={idx} className="flex gap-4 relative">
                        {/* Timeline Line */}
                        {!isLast && (
                          <div className={`absolute top-8 bottom-0 left-[17.5px] w-[2px] ${
                            isCompleted ? "bg-[#1e9a58]" : "bg-gray-100 dark:bg-gray-700"
                          }`} style={{ height: 'calc(100% - 10px)' }} />
                        )}
                        
                        {/* Timeline Circle */}
                        <div className="relative z-10 shrink-0 mt-0.5">
                          {isCompleted ? (
                            <div className="w-9 h-9 rounded-full bg-[#1e9a58] flex items-center justify-center shadow-sm shadow-green-500/10">
                              <IconCheck className="w-5 h-5 text-white" stroke={3} />
                            </div>
                          ) : isActive ? (
                            <div className="w-9 h-9 rounded-full bg-[#1e9a58] ring-4 ring-[#e4f7ed] flex items-center justify-center shadow-md shadow-green-500/20">
                              <span className="text-white text-xs font-bold">{idx + 1}</span>
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs font-bold">{idx + 1}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Timeline Content */}
                        <div className={`pb-7 pt-1.5 ${isActive ? "" : "opacity-80"}`}>
                          {step.title}
                          {step.description}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              
              {/* Estimated Delivery Card */}
              {(() => {
                const banner = getTrackingBannerText();
                if (!banner) return null;
                return (
                  <div className={`mt-2 p-3 sm:p-4 rounded-xl flex items-start gap-3 ${banner.color}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${banner.iconColor} bg-white/60`}>
                      <IconAlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">{banner.title}</p>
                      <p className="text-[11px] sm:text-xs opacity-90 mt-0.5">{banner.desc}</p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <IconPackage className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Order Items ({order.items.length})
                </h2>
              </div>
              
              <div className="flex flex-col gap-4">
                {order.items.map((item, index) => {
                  const itemTotal = parseFloat(item.price) * item.quantity;
                  return (
                    <React.Fragment key={`${item.lineItemId || item.id}-${item.size}-${item.color}`}>
                      <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[80px_1fr] gap-4">
                        <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] shrink-0 bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden relative border border-gray-100">
                          {item.customization?.previewDataUrl || item.image ? (
                            (item.customization?.previewDataUrl || item.image).startsWith("data:") ? (
                              <img
                                src={item.customization?.previewDataUrl || item.image}
                                alt={item.name}
                                className="w-full h-full object-contain mix-blend-multiply"
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
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <IconPackage className="w-5 h-5 opacity-30" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                              {item.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {item.size && item.size !== "One Size" && <span>Size: {item.size}</span>}
                              {item.size && item.size !== "One Size" && item.color && <span>•</span>}
                              {item.color && <span className="capitalize">Color: {item.color}</span>}
                              {(item.size || item.color) && <span>•</span>}
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>
                          
                          <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                            ₹{formatPrice(itemTotal)}
                          </div>
                        </div>
                      </div>
                      
                      {index < order.items.length - 1 && (
                        <div className="h-px bg-gray-100 dark:bg-gray-700 w-full" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </motion.div>
          </div>
          
          {/* Right Column (Address, Payment, Summary) */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5 w-full">
            
            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <IconMapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Delivery Address
                </h2>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 pl-10">
                <p className="font-bold text-gray-900 dark:text-white mb-0.5">
                  {order.address.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  {order.address.phone}
                </p>
                <p className="leading-snug">
                  {order.address.addressLine1 || order.address.address}, {order.address.addressLine2 || ""}
                </p>
                <p className="leading-snug">
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                  <IconCreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Payment Method
                </h2>
              </div>
              <div className="flex items-center justify-between pl-10">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white capitalize text-sm">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod?.toUpperCase()}
                  </p>
                </div>
                {(() => {
                  const badges = {
                    completed: { label: "PAID", cls: "bg-green-50 text-green-700 border-green-100" },
                    pending: { label: "PENDING", cls: "bg-amber-50 text-amber-700 border-amber-100" },
                    processing: { label: "PROCESSING", cls: "bg-blue-50 text-blue-700 border-blue-100" },
                    failed: { label: "FAILED", cls: "bg-red-50 text-red-700 border-red-100" },
                    refunded: { label: "REFUNDED", cls: "bg-gray-50 text-gray-700 border-gray-200" },
                  };
                  const badge = badges[order.paymentStatus] || badges.pending;
                  return (
                    <div className={`px-2 py-0.5 border rounded text-[10px] font-bold ${badge.cls}`}>
                      {badge.label}
                    </div>
                  );
                })()}
              </div>
            </motion.div>

            {/* Order Summary & Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <IconFileText className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Order Summary
                </h2>
              </div>
              
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-900 font-medium">₹{formatPrice(order.orderSummary.subtotal)}</span>
                </div>
                {order.orderSummary.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{formatPrice(order.orderSummary.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span className="text-gray-900 font-medium">
                    {order.orderSummary.shipping === 0 ? "Free" : `₹${formatPrice(order.orderSummary.shipping)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax (GST)</span>
                  <span className="text-gray-900 font-medium">₹{formatPrice(order.orderSummary.tax)}</span>
                </div>
                
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between items-center mt-2">
                  <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-xl font-bold text-[#1e9a58]">
                    ₹{formatPrice(order.orderSummary.grandTotal)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-700 w-full mb-4" />

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                <button
                  onClick={generateInvoice}
                  className="h-11 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors w-full"
                >
                  <IconDownload className="w-4 h-4" />
                  Invoice
                </button>

                <button
                  onClick={handleReorder}
                  className="h-11 bg-white border border-[#1e9a58] hover:bg-[#e4f7ed] text-[#1e9a58] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors w-full"
                >
                  <IconShoppingCart className="w-4 h-4" />
                  Reorder
                </button>

                {canCancel() && (
                  <button
                    onClick={() => {
                      if (blockAdminAction()) return;
                      setIsCancelModalVisible(true);
                    }}
                    className="h-11 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors w-full col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-2"
                  >
                    <IconX className="w-4 h-4" />
                    Cancel Order
                  </button>
                )}

                {canReturn() && (
                  <button
                    onClick={() => {
                      if (blockAdminAction()) return;
                      setIsReturnModalVisible(true);
                    }}
                    className="h-11 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors w-full col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-2"
                  >
                    <IconRefresh className="w-4 h-4" />
                    Request Return
                  </button>
                )}

                {canRefund() && (
                  <button
                    onClick={() => {
                      if (blockAdminAction()) return;
                      setIsRefundModalVisible(true);
                    }}
                    className="h-11 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors w-full col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-2"
                  >
                    <IconRefresh className="w-4 h-4" />
                    Request Refund
                  </button>
                )}
              </div>
            </motion.div>

            {/* Need Help Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => router.push("/contact")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="text-xl">🎧</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Need Help?</h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Contact 24/7 support</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-sm">➔</span>
              </div>
            </motion.div>

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

      {/* Refund Request Modal */}
      <Modal
        title="Request Refund"
        open={isRefundModalVisible}
        onCancel={() => {
          setIsRefundModalVisible(false);
          refundForm.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 600 }}
      >
        <Form
          form={refundForm}
          layout="vertical"
          onFinish={handleRefundRequest}
          className="mt-4"
        >
          <Form.Item name="items" label="Select Items to Refund (leave empty to refund the whole order)">
            <Select
              mode="multiple"
              placeholder="Select items to refund"
              options={order.items.map((item) => ({
                label: `${item.name} (${item.size || "One Size"}, ${
                  item.color || "N/A"
                })`,
                value: item.lineItemId,
                disabled: !item.lineItemId,
              }))}
            />
          </Form.Item>

          <Form.Item name="reason" label="Notes (Optional)">
            <TextArea
              rows={3}
              placeholder="Anything you'd like our support team to know..."
            />
          </Form.Item>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <IconAlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                Refunds are reviewed by our team and processed to your original payment method within 5-7 business days.
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setIsRefundModalVisible(false);
                refundForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit Refund Request
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
