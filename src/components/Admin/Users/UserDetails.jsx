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
  Avatar,
  Timeline,
  message,
} from "antd";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconShoppingCart,
  IconKey,
  IconBan,
  IconCheck,
  IconShield,
} from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const { Option } = Select;
const { TextArea } = Input;

const UserDetails = ({ user, onRoleChange, onResetPassword }) => {
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [roleForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const getRoleColor = (role) => {
    const colors = {
      customer: "blue",
      admin: "red",
      vendor: "green",
    };
    return colors[role] || "default";
  };

  const handleRoleUpdate = (values) => {
    onRoleChange(user.id, values.role);
    setIsRoleModalVisible(false);
    roleForm.resetFields();
  };

  const handlePasswordReset = (values) => {
    onResetPassword(user.id);
    setIsPasswordModalVisible(false);
    passwordForm.resetFields();
  };

  // Mock order history
  const orderHistory = [
    { id: 1, orderId: "ORD001", date: "2024-01-20", total: 5000, status: "delivered" },
    { id: 2, orderId: "ORD002", date: "2024-02-15", total: 3000, status: "shipped" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-4"
    >
      <Card
        title={
          <div className="flex items-center gap-3">
            <Avatar size={48} className="bg-blue-500">
              {user.name?.[0]?.toUpperCase() || "U"}
            </Avatar>
            <div>
              <div className="font-semibold">{user.name}</div>
              <Tag color={getRoleColor(user.role)} className="capitalize mt-1">
                {user.role}
              </Tag>
            </div>
          </div>
        }
        className="shadow-sm"
      >
        <div className="space-y-4">
          {/* User Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconMail className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-900">Email</span>
            </div>
            <div className="pl-6 text-sm text-gray-600">{user.email}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconPhone className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-900">Phone</span>
            </div>
            <div className="pl-6 text-sm text-gray-600">{user.phone || "N/A"}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconUser className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-900">Registered</span>
            </div>
            <div className="pl-6 text-sm text-gray-600">
              {format(new Date(user.registeredAt), "MMM dd, yyyy")}
            </div>
          </div>

          <Divider />

          {/* Statistics */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconShoppingCart className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-900">Statistics</span>
            </div>
            <div className="pl-6 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-semibold">{user.totalOrders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Spent</span>
                <span className="font-semibold">₹{formatPrice(user.totalSpent || 0)}</span>
              </div>
            </div>
          </div>

          <Divider />

          {/* Order History */}
          {orderHistory.length > 0 && (
            <div>
              <div className="font-semibold text-gray-900 mb-2">Recent Orders</div>
              <div className="space-y-2">
                {orderHistory.map((order) => (
                  <div key={order.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">#{order.orderId}</span>
                      <Tag color="blue">{order.status}</Tag>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(order.date), "MMM dd, yyyy")} • ₹{formatPrice(order.total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Divider />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              block
              icon={<IconShield className="w-4 h-4" />}
              onClick={() => setIsRoleModalVisible(true)}
            >
              Change Role
            </Button>
            <Button
              block
              icon={<IconKey className="w-4 h-4" />}
              onClick={() => setIsPasswordModalVisible(true)}
            >
              Reset Password
            </Button>
            {user.status === "active" ? (
              <Button
                danger
                block
                icon={<IconBan className="w-4 h-4" />}
                onClick={() => {
                  // Handle block
                  message.info("Block user functionality");
                }}
              >
                Block User
              </Button>
            ) : (
              <Button
                block
                icon={<IconCheck className="w-4 h-4" />}
                onClick={() => {
                  // Handle unblock
                  message.info("Unblock user functionality");
                }}
              >
                Unblock User
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Role Change Modal */}
      <Modal
        title="Change User Role"
        open={isRoleModalVisible}
        onCancel={() => {
          setIsRoleModalVisible(false);
          roleForm.resetFields();
        }}
        footer={null}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleRoleUpdate} initialValues={{ role: user.role }}>
          <Form.Item
            name="role"
            label="User Role"
            rules={[{ required: true, message: "Please select role" }]}
          >
            <Select placeholder="Select role">
              <Option value="customer">Customer</Option>
              <Option value="admin">Admin</Option>
              <Option value="vendor">Vendor</Option>
            </Select>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsRoleModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Update Role
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        title="Reset Password"
        open={isPasswordModalVisible}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handlePasswordReset}>
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              A password reset email will be sent to <strong>{user.email}</strong>
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsPasswordModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Send Reset Email
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default UserDetails;

