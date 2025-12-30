"use client";
import React, { useState, useEffect } from "react";
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
import { useCart } from "@/context/CartContext";
import { productDatabase } from "@/lib/productDatabase";

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const OrderDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [order, setOrder] = useState(null);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
  const [cancelForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = () => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const foundOrder = orders.find((o) => o.orderId === params.id);
    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      message.error("Order not found");
      router.push("/orders");
    }
  };

  const updateOrderStatus = (newStatus, additionalData = {}) => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const updatedOrders = orders.map((o) => {
      if (o.orderId === params.id) {
        const updatedOrder = {
          ...o,
          status: newStatus,
          ...additionalData,
          statusHistory: [
            ...(o.statusHistory || []),
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              ...additionalData,
            },
          ],
        };
        return updatedOrder;
      }
      return o;
    });
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    setOrder(updatedOrders.find((o) => o.orderId === params.id));
  };

  const handleCancelOrder = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateOrderStatus("cancelled", {
        cancellationReason: values.reason,
        cancellationNote: values.note,
        cancelledAt: new Date().toISOString(),
      });

      message.success("Order cancelled successfully");
      setIsCancelModalVisible(false);
      cancelForm.resetFields();
    } catch (error) {
      message.error("Failed to cancel order");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnRequest = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateOrderStatus("returned", {
        returnReason: values.reason,
        returnNote: values.note,
        returnItems: values.items || [],
        requestedAt: new Date().toISOString(),
      });

      message.success("Return request submitted successfully");
      setIsReturnModalVisible(false);
      returnForm.resetFields();
    } catch (error) {
      message.error("Failed to submit return request");
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateOrderStatus("refunded", {
        refundedAt: new Date().toISOString(),
        refundAmount: order.orderSummary.grandTotal,
      });

      message.success("Refund request submitted successfully");
    } catch (error) {
      message.error("Failed to submit refund request");
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = () => {
    if (!order) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .company-info { margin-bottom: 30px; }
          .order-info { margin-bottom: 20px; background: #f5f5f5; padding: 15px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #4a5568; color: white; }
          .total { text-align: right; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; color: #2563eb;">FluxFit</h1>
          <p style="margin: 5px 0; font-size: 18px;">Invoice</p>
        </div>
        <div class="company-info">
          <p><strong>FluxFit E-Commerce</strong></p>
          <p>123 Business Street, Mumbai, Maharashtra - 400001</p>
          <p>Email: support@fluxfit.com | Phone: +91 9876543210</p>
        </div>
        <div class="order-info">
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Order Date:</strong> ${format(new Date(order.orderDate), "MMMM dd, yyyy 'at' hh:mm a")}</p>
          <p><strong>Status:</strong> <span class="status" style="background: ${
            order.status === "delivered" ? "#10b981" : order.status === "cancelled" ? "#ef4444" : "#3b82f6"
          }; color: white;">${order.status.toUpperCase()}</span></p>
        </div>
        <div>
          <h3>Shipping Address:</h3>
          <p>${order.address.name}</p>
          <p>${order.address.phone}</p>
          <p>${order.address.addressLine1}, ${order.address.addressLine2}</p>
          <p>${order.address.city}, ${order.address.state} - ${order.address.pincode}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Size</th>
              <th>Color</th>
              <th>Quantity</th>
              <th>Unit Price</th>
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
                <td>₹${(parseFloat(item.price) * 83).toFixed(2)}</td>
                <td>₹${(parseFloat(item.price) * 83 * item.quantity).toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="total">
          <p>Subtotal: ₹${(order.orderSummary.subtotal * 83).toFixed(2)}</p>
          ${order.orderSummary.discount > 0 ? `<p>Discount: -₹${(order.orderSummary.discount * 83).toFixed(2)}</p>` : ""}
          <p>Shipping: ₹${order.orderSummary.shipping}</p>
          <p>Tax (GST 18%): ₹${order.orderSummary.tax}</p>
          <p style="font-size: 20px; color: #2563eb;">Total: ₹${order.orderSummary.grandTotal}</p>
        </div>
        <div>
          <h3>Payment Method:</h3>
          <p>${order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod.toUpperCase()}</p>
        </div>
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;

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

  const handleReorder = () => {
    if (!order) return;

    order.items.forEach((item) => {
      const product = productDatabase[item.id];
      if (product) {
        addToCart(product, {
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        });
      }
    });

    message.success("Items added to cart");
    router.push("/cart");
  };

  const getStatusSteps = () => {
    const statusOrder = ["confirmed", "processing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(order?.status);
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
    const statusHistory = order.statusHistory || [];
    const timeline = [
      {
        status: "confirmed",
        label: "Order Confirmed",
        icon: <IconCheck className="w-4 h-4" />,
        color: "blue",
        timestamp: order.orderDate,
      },
    ];

    if (order.status === "processing" || order.statusHistory?.some((h) => h.status === "processing")) {
      timeline.push({
        status: "processing",
        label: "Processing",
        icon: <IconPackage className="w-4 h-4" />,
        color: "orange",
        timestamp: order.statusHistory?.find((h) => h.status === "processing")?.timestamp || order.orderDate,
      });
    }

    if (order.status === "shipped" || order.statusHistory?.some((h) => h.status === "shipped")) {
      timeline.push({
        status: "shipped",
        label: "Shipped",
        icon: <IconTruck className="w-4 h-4" />,
        color: "purple",
        timestamp: order.statusHistory?.find((h) => h.status === "shipped")?.timestamp || order.orderDate,
      });
    }

    if (order.status === "delivered" || order.statusHistory?.some((h) => h.status === "delivered")) {
      timeline.push({
        status: "delivered",
        label: "Delivered",
        icon: <IconCheck className="w-4 h-4" />,
        color: "green",
        timestamp: order.statusHistory?.find((h) => h.status === "delivered")?.timestamp || order.orderDate,
      });
    }

    if (order.status === "cancelled") {
      timeline.push({
        status: "cancelled",
        label: "Cancelled",
        icon: <IconX className="w-4 h-4" />,
        color: "red",
        timestamp: order.cancelledAt || order.orderDate,
      });
    }

    return timeline;
  };

  const canCancel = () => {
    return order && ["confirmed", "processing"].includes(order.status);
  };

  const canReturn = () => {
    return order && order.status === "delivered";
  };

  const canRefund = () => {
    return order && ["cancelled", "returned"].includes(order.status) && order.status !== "refunded";
  };

  const convertToRupees = (usdPrice) => {
    const rate = 83;
    return (parseFloat(usdPrice) * rate).toFixed(2);
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
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            type="text"
            icon={<IconArrowLeft className="w-4 h-4" />}
            onClick={() => router.push("/orders")}
            className="mb-4"
          >
            Back to Orders
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Order #{order.orderId}
              </h1>
              <p className="text-gray-600">
                Placed on {format(new Date(order.orderDate), "MMMM dd, yyyy 'at' hh:mm a")}
              </p>
            </div>
            <Badge
              status={order.status === "delivered" ? "success" : order.status === "cancelled" ? "error" : "processing"}
              text={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              className="text-lg"
            />
          </div>
        </motion.div>

        {/* Status Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status</h2>
            <Steps
              current={getStatusSteps().findIndex((s) => s.status === "process")}
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
                };
                return {
                  dot: (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${colorClasses[item.color] || "bg-gray-500"}`}
                    >
                      {item.icon}
                    </div>
                  ),
                  children: (
                    <div>
                      <p className="font-semibold text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(item.timestamp), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
                    </div>
                  ),
                };
              })}
            />
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => {
                  const product = productDatabase[item.id];
                  const itemTotalInRupees = convertToRupees(
                    parseFloat(item.price) * item.quantity
                  );

                  return (
                    <motion.div
                      key={`${item.id}-${item.size}-${item.color}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="relative w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={item.image || product?.images?.[0] || ""}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          {item.size && item.size !== "One Size" && (
                            <span>Size: {item.size}</span>
                          )}
                          {item.color && (
                            <span className="capitalize">Color: {item.color}</span>
                          )}
                          <span>Qty: {item.quantity}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">₹{itemTotalInRupees}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>

            {/* Delivery Address */}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <IconMapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-1">{order.address.name}</p>
                <p className="text-gray-700 text-sm mb-1">{order.address.phone}</p>
                <p className="text-gray-700 text-sm">
                  {order.address.addressLine1}, {order.address.addressLine2}
                </p>
                <p className="text-gray-700 text-sm">
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
                {order.address.landmark && (
                  <p className="text-gray-600 text-xs mt-1">
                    Landmark: {order.address.landmark}
                  </p>
                )}
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <IconCreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-1">
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : order.paymentMethod.toUpperCase()}
                </p>
                {order.paymentMethod === "card" && order.paymentDetails?.cardDetails && (
                  <p className="text-gray-600 text-sm">
                    Card ending in {order.paymentDetails.cardDetails.cardNumber.slice(-4)}
                  </p>
                )}
                {order.paymentMethod === "upi" && order.paymentDetails?.upiId && (
                  <p className="text-gray-600 text-sm">{order.paymentDetails.upiId}</p>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({order.items.length} items)</span>
                  <span>₹{(order.orderSummary.subtotal * 83).toFixed(2)}</span>
                </div>
                {order.orderSummary.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{(order.orderSummary.discount * 83).toFixed(2)}</span>
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
        width={600}
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

          <Form.Item
            name="note"
            label="Additional Notes (Optional)"
          >
            <TextArea
              rows={4}
              placeholder="Please provide any additional information..."
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setIsCancelModalVisible(false);
              cancelForm.resetFields();
            }}>
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
        width={600}
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
            rules={[{ required: true, message: "Please select at least one item" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select items to return"
              options={order.items.map((item, index) => ({
                label: `${item.name} (${item.size || "One Size"}, ${item.color || "N/A"})`,
                value: index,
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
              <Option value="size_issue">Size doesn't fit</Option>
              <Option value="quality_issue">Quality issue</Option>
              <Option value="not_as_described">Not as described</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="note"
            label="Additional Notes (Optional)"
          >
            <TextArea
              rows={4}
              placeholder="Please provide any additional information..."
            />
          </Form.Item>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <IconAlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Return Policy:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Items must be in original condition with tags attached</li>
                  <li>Return request must be submitted within 7 days of delivery</li>
                  <li>Refund will be processed within 5-7 business days</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setIsReturnModalVisible(false);
              returnForm.resetFields();
            }}>
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

export default OrderDetailsPage;

