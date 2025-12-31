"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Tag,
  Button,
  Select,
  Modal,
  Form,
  Input,
  Divider,
  Timeline,
  Avatar,
  message,
} from "antd";
import {
  IconDownload,
  IconTruck,
  IconX,
  IconRefresh,
  IconCheck,
  IconUser,
  IconMapPin,
  IconCreditCard,
} from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const { TextArea } = Input;
const { Option } = Select;

const OrderDetails = ({
  order,
  onStatusChange,
  onAssignDeliveryPartner,
  onCancel,
  onPartialCancel,
  onGenerateInvoice,
  onClose,
}) => {
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isDeliveryModalVisible, setIsDeliveryModalVisible] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [statusForm] = Form.useForm();
  const [deliveryForm] = Form.useForm();
  const [cancelForm] = Form.useForm();

  const getStatusColor = (status) => {
    const colors = {
      pending: "orange",
      confirmed: "blue",
      processing: "cyan",
      shipped: "purple",
      delivered: "green",
      cancelled: "red",
      returned: "volcano",
    };
    return colors[status] || "default";
  };

  const deliveryPartners = [
    { id: 1, name: "Delhivery", phone: "+91 1234567890" },
    { id: 2, name: "BlueDart", phone: "+91 1234567891" },
    { id: 3, name: "FedEx", phone: "+91 1234567892" },
  ];

  const handleStatusUpdate = (values) => {
    onStatusChange(order.orderId, values.status, values.note);
    setIsStatusModalVisible(false);
    statusForm.resetFields();
  };

  const handleDeliveryAssign = (values) => {
    onAssignDeliveryPartner(order.orderId, values.partnerId);
    setIsDeliveryModalVisible(false);
    deliveryForm.resetFields();
  };

  const handleCancel = (values) => {
    onCancel(order.orderId, values.reason);
    setIsCancelModalVisible(false);
    cancelForm.resetFields();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-4 lg:block"
    >
      <Card
        title={
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-sm sm:text-base font-semibold">Order #{order.orderId}</span>
            <Tag color={getStatusColor(order.status)} className="capitalize text-xs sm:text-sm">
              {order.status}
            </Tag>
          </div>
        }
        className="shadow-sm dark:bg-gray-800"
        bodyStyle={{ padding: "16px" }}
      >
        <div className="space-y-3 sm:space-y-4">
          {/* Customer Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconUser className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Customer</span>
            </div>
            <div className="pl-6">
              <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{order.address?.name}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{order.address?.phone}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{order.address?.email}</div>
            </div>
          </div>

          <Divider />

          {/* Delivery Address */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconMapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Delivery Address</span>
            </div>
            <div className="pl-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {order.address?.address}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}
            </div>
          </div>

          <Divider />

          {/* Order Items */}
          <div>
            <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2">Order Items</div>
            <div className="space-y-2">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.size} • {item.color} • Qty: {item.quantity}
                    </div>
                  </div>
                  <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white ml-2 shrink-0">
                    ₹{formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* Order Summary */}
          <div>
            <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2">Order Summary</div>
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">₹{formatPrice(order.orderSummary?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Discount</span>
                <span className="text-green-600 dark:text-green-400">-₹{formatPrice(order.orderSummary?.discount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="text-gray-900 dark:text-white">₹{formatPrice(order.orderSummary?.tax || 0)}</span>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between font-semibold text-base sm:text-lg">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-gray-900 dark:text-white">₹{formatPrice(order.orderSummary?.grandTotal || 0)}</span>
              </div>
            </div>
          </div>

          <Divider />

          {/* Status Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div>
              <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2">Status Timeline</div>
              <Timeline
                items={order.statusHistory.map((history) => ({
                  color: getStatusColor(history.status),
                  children: (
                    <div>
                      <div className="font-medium text-xs sm:text-sm capitalize text-gray-900 dark:text-white">{history.status}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(history.timestamp), "MMM dd, yyyy HH:mm")}
                      </div>
                      {history.note && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                          {history.note}
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            </div>
          )}

          <Divider />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              type="primary"
              block
              icon={<IconCheck className="w-4 h-4" />}
              onClick={() => setIsStatusModalVisible(true)}
              size="large"
              className="text-xs sm:text-sm"
            >
              Change Status
            </Button>
            <Button
              block
              icon={<IconTruck className="w-4 h-4" />}
              onClick={() => setIsDeliveryModalVisible(true)}
              size="large"
              className="text-xs sm:text-sm"
            >
              Assign Delivery Partner
            </Button>
            <Button
              block
              icon={<IconDownload className="w-4 h-4" />}
              onClick={onGenerateInvoice}
              size="large"
              className="text-xs sm:text-sm"
            >
              Generate Invoice
            </Button>
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <Button
                danger
                block
                icon={<IconX className="w-4 h-4" />}
                onClick={() => setIsCancelModalVisible(true)}
                size="large"
                className="text-xs sm:text-sm"
              >
                Cancel Order
              </Button>
            )}
            {order.status === "delivered" && (
              <Button
                block
                icon={<IconRefresh className="w-4 h-4" />}
                onClick={() => {
                  // Handle return/refund
                  message.info("Return/Refund functionality");
                }}
                size="large"
                className="text-xs sm:text-sm"
              >
                Handle Return/Refund
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Status Change Modal */}
      <Modal
        title="Change Order Status"
        open={isStatusModalVisible}
        onCancel={() => {
          setIsStatusModalVisible(false);
          statusForm.resetFields();
        }}
        footer={null}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusUpdate}>
          <Form.Item
            name="status"
            label="New Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select placeholder="Select status">
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="processing">Processing</Option>
              <Option value="shipped">Shipped</Option>
              <Option value="delivered">Delivered</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="returned">Returned</Option>
            </Select>
          </Form.Item>
          <Form.Item name="note" label="Note (Optional)">
            <TextArea rows={3} placeholder="Add a note about this status change" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsStatusModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Update Status
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delivery Partner Modal */}
      <Modal
        title="Assign Delivery Partner"
        open={isDeliveryModalVisible}
        onCancel={() => {
          setIsDeliveryModalVisible(false);
          deliveryForm.resetFields();
        }}
        footer={null}
      >
        <Form form={deliveryForm} layout="vertical" onFinish={handleDeliveryAssign}>
          <Form.Item
            name="partnerId"
            label="Delivery Partner"
            rules={[{ required: true, message: "Please select delivery partner" }]}
          >
            <Select placeholder="Select delivery partner">
              {deliveryPartners.map((partner) => (
                <Option key={partner.id} value={partner.id}>
                  {partner.name} - {partner.phone}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsDeliveryModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Assign Partner
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        title="Cancel Order"
        open={isCancelModalVisible}
        onCancel={() => {
          setIsCancelModalVisible(false);
          cancelForm.resetFields();
        }}
        footer={null}
      >
        <Form form={cancelForm} layout="vertical" onFinish={handleCancel}>
          <Form.Item
            name="reason"
            label="Cancellation Reason"
            rules={[{ required: true, message: "Please enter cancellation reason" }]}
          >
            <TextArea rows={4} placeholder="Enter reason for cancellation" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsCancelModalVisible(false)}>Cancel</Button>
            <Button type="primary" danger htmlType="submit">
              Cancel Order
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default OrderDetails;

