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
    message.info("Refund is processed by support after return approval.");
  };

  const generateInvoice = async () => {
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

  const getStatusSteps = () => {
    const statusOrder = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
    ];
    const st = order?.status;
    const mapForCancelled =
      st === "cancelled"
        ? [
            { title: "Cancelled", status: "error" },
          ]
        : null;
    if (mapForCancelled) return mapForCancelled;

    let currentIndex = statusOrder.indexOf(st);
    if (currentIndex < 0) currentIndex = 0;

    return statusOrder.map((status, index) => ({
      title: status.charAt(0).toUpperCase() + status.slice(1),
      status:
        index < currentIndex
          ? "finish"
          : index === currentIndex
            ? "process"
            : "wait",
    }));
  };

  const getStatusTimeline = () => {
    if (!order) return [];
    const raw = order.statusHistory || [];
    const colorFor = (s) => {
      if (s === "delivered") return "green";
      if (s === "shipped") return "purple";
      if (s === "processing") return "orange";
      if (s === "cancelled" || s === "returned" || s === "refunded")
        return "red";
      if (s === "pending") return "gold";
      return "blue";
    };
    const iconFor = (s) => {
      if (s === "shipped") return <IconTruck className="w-4 h-4" />;
      if (s === "cancelled" || s === "returned" || s === "refunded")
        return <IconX className="w-4 h-4" />;
      return <IconCheck className="w-4 h-4" />;
    };
    if (raw.length > 0) {
      return raw.map((h) => ({
        status: h.status,
        label:
          (h.status || "").charAt(0).toUpperCase() +
          (h.status || "").slice(1),
        icon: iconFor(h.status),
        color: colorFor(h.status),
        timestamp: h.timestamp || order.orderDate,
      }));
    }
    return [
      {
        status: order.status,
        label:
          (order.status || "").charAt(0).toUpperCase() +
          (order.status || "").slice(1),
        icon: iconFor(order.status),
        color: colorFor(order.status),
        timestamp: order.orderDate,
      },
    ];
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 pb-8 sm:pb-12 transition-colors duration-300">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <Button
            type="text"
            icon={<IconArrowLeft className="w-4 h-4" />}
            onClick={() => router.push("/orders")}
            className="mb-3 sm:mb-4"
          >
            Back to Orders
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Order #{order.orderId}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Placed on{" "}
                {format(
                  new Date(order.orderDate),
                  "MMMM dd, yyyy 'at' hh:mm a"
                )}
              </p>
            </div>
            <Badge
              status={
                order.status === "delivered"
                  ? "success"
                  : order.status === "cancelled"
                  ? "error"
                  : "processing"
              }
              text={
                order.status.charAt(0).toUpperCase() + order.status.slice(1)
              }
              className="text-sm sm:text-base shrink-0"
            />
          </div>
        </motion.div>

        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-6"
        >
          <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Order Status
            </h2>
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
            <Divider />
            <Timeline
              items={getStatusTimeline().map((item) => {
                const colorClasses = {
                  blue: "bg-blue-500",
                  orange: "bg-orange-500",
                  purple: "bg-purple-500",
                  green: "bg-green-500",
                  red: "bg-red-500",
                  gold: "bg-amber-500",
                };
                return {
                  dot: (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                        colorClasses[item.color] || "bg-gray-500"
                      }`}
                    >
                      {item.icon}
                    </div>
                  ),
                  children: (
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {format(
                          new Date(item.timestamp),
                          "MMM dd, yyyy 'at' hh:mm a"
                        )}
                      </p>
                    </div>
                  ),
                };
              })}
            />
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            {/* Order Items */}
            <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Order Items
              </h2>
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
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
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
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {item.size && item.size !== "One Size" && (
                            <span>Size: {item.size}</span>
                          )}
                          {item.color && (
                            <span className="capitalize">
                              Color: {item.color}
                            </span>
                          )}
                          <span>Qty: {item.quantity}</span>
                        </div>
                        <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                          ₹{formatPrice(itemTotal)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>

            {/* Delivery Address */}
            <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <IconMapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Delivery Address
                </h2>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {order.address.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1">
                  {order.address.phone}
                </p>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {order.address.addressLine1}, {order.address.addressLine2}
                </p>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {order.address.city}, {order.address.state} -{" "}
                  {order.address.pincode}
                </p>
                {order.address.landmark && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Landmark: {order.address.landmark}
                  </p>
                )}
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <IconCreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Payment Method
                </h2>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : order.paymentMethod.toUpperCase()}
                </p>
                {order.paymentMethod === "card" &&
                  order.paymentDetails?.cardDetails && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Card ending in{" "}
                      {order.paymentDetails.cardDetails.cardNumber.slice(-4)}
                    </p>
                  )}
                {order.paymentMethod === "upi" &&
                  order.paymentDetails?.upiId && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      {order.paymentDetails.upiId}
                    </p>
                  )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 w-full">
            {/* Order Summary */}
            <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 lg:sticky lg:top-20 xl:top-24 mb-6 sm:mb-8 lg:mb-0 max-h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-10rem)] overflow-y-auto">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <div className="flex justify-between text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <span>Subtotal ({order.items.length} items)</span>
                  <span>₹{formatPrice(order.orderSummary.subtotal)}</span>
                </div>
                {order.orderSummary.discount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-₹{formatPrice(order.orderSummary.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <span>Shipping</span>
                  <span>₹{order.orderSummary.shipping}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <span>Tax (GST 18%)</span>
                  <span>₹{formatPrice(order.orderSummary.tax)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 sm:pt-3 flex justify-between">
                  <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
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
                >
                  Download Invoice
                </Button>

                {canCancel() && (
                  <Button
                    block
                    size="large"
                    danger
                    icon={<IconX className="w-4 h-4" />}
                    onClick={() => setIsCancelModalVisible(true)}
                  >
                    Cancel Order
                  </Button>
                )}

                {canReturn() && (
                  <Button
                    block
                    size="large"
                    icon={<IconRefresh className="w-4 h-4" />}
                    onClick={() => setIsReturnModalVisible(true)}
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
                >
                  Reorder
                </Button>
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
