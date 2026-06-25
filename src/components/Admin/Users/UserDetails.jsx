
"use client";
import React, { useEffect, useState } from "react";
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

const UserDetails = ({
  user,
  onRoleChange,
  onResetPassword,
  onBlock,
  onUnblock,
  onClose,
  isMutating,
}) => {
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [roleForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Keep modal form value in sync when switching between users.
  useEffect(() => {
    if (!user?.role) return;
    roleForm.setFieldsValue({ role: user.role });
  }, [user?.role, roleForm]);

  const getRoleColor = (role) => {
    const colors = {
      user: "blue",
      admin: "red",
    };
    return colors[role] || "default";
  };

  const handleRoleUpdate = (values) => {
    if (isMutating) return;
    onRoleChange(user.id, values.role);
    setIsRoleModalVisible(false);
    roleForm.resetFields();
  };

  const handlePasswordReset = (values) => {
    if (isMutating) return;
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
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar
              size={48}
              className="bg-blue-500 shrink-0 w-12 h-12 sm:w-14 sm:h-14"
            >
              {user.name?.[0]?.toUpperCase() || "U"}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                {user.name}
              </div>
              <Tag
                color={getRoleColor(user.role)}
                className="capitalize mt-1 text-xs sm:text-sm"
              >
                {user.role}
              </Tag>
            </div>
          </div>
        }
        className="shadow-sm !bg-zinc-950 border-zinc-800"
      >
        <div className="space-y-4">
          {/* User Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconMail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                Email
              </span>
            </div>
            <div className="pl-6 text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-all">
              {user.email}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconPhone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                Phone
              </span>
            </div>
            <div className="pl-6 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              {user.phone || "N/A"}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconUser className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                Registered
              </span>
            </div>
            <div className="pl-6 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              {format(new Date(user.registeredAt), "MMM dd, yyyy")}
            </div>
          </div>

          <Divider />

          {/* Statistics */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconShoppingCart className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                Statistics
              </span>
            </div>
            <div className="pl-6 space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Orders</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.totalOrders || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Spent</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₹{formatPrice(user.totalSpent || 0)}
                </span>
              </div>
            </div>
          </div>

          <Divider />

          {/* Order History */}
          {orderHistory.length > 0 && (
            <div>
              <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2">
                Recent Orders
              </div>
              <div className="space-y-2">
                {orderHistory.map((order) => (
                  <div
                    key={order.id}
                    className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-xs sm:text-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        #{order.orderId}
                      </span>
                      <Tag color="blue" className="text-xs sm:text-sm">
                        {order.status}
                      </Tag>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(new Date(order.date), "MMM dd, yyyy")} • ₹
                      {formatPrice(order.total)}
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
              size="large"
              className="text-xs sm:text-sm"
              disabled={!!isMutating}
            >
              Change Role
            </Button>
            <Button
              block
              icon={<IconKey className="w-4 h-4" />}
              onClick={() => setIsPasswordModalVisible(true)}
              size="large"
              className="text-xs sm:text-sm"
              disabled={!!isMutating}
            >
              Reset Password
            </Button>
            {user.status === "active" ? (
              <Button
                danger
                block
                icon={<IconBan className="w-4 h-4" />}
                onClick={() => {
                  if (onBlock) {
                    onBlock(user.id);
                  }
                }}
                size="large"
                className="text-xs sm:text-sm"
                disabled={!!isMutating}
              >
                Block User
              </Button>
            ) : (
              <Button
                block
                icon={<IconCheck className="w-4 h-4" />}
                onClick={() => {
                  if (onUnblock) {
                    onUnblock(user.id);
                  }
                }}
                size="large"
                className="text-xs sm:text-sm"
                disabled={!!isMutating}
              >
                Unblock User
              </Button>
            )}
            {onClose && (
              <Button
                block
                onClick={onClose}
                className="mt-2 text-xs sm:text-sm"
                size="large"
              >
                Close
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
        width={750}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleRoleUpdate} initialValues={{ role: user.role }} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm h-full flex flex-col justify-center">
                <span className="font-bold text-zinc-200 block mb-1">User Details</span>
                <div>Name: <span className="font-semibold text-white">{user.name}</span></div>
                <div>Email: <span className="font-semibold text-white">{user.email}</span></div>
                <div className="mt-1">Current Role: <span className="capitalize px-2 py-0.5 text-xs bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-md ml-1">{user.role}</span></div>
              </div>
            </div>
            <div className="md:col-span-7">
              <Form.Item
                name="role"
                label="User Role"
                rules={[{ required: true, message: "Please select role" }]}
                className="mb-0"
              >
                <Select placeholder="Select role" size="large">
                  <Option value="user">User (Standard Customer Access)</Option>
                  <Option value="admin">Admin (Full Dashboard Access)</Option>
                </Select>
              </Form.Item>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4 mt-6">
            <Button onClick={() => setIsRoleModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" disabled={!!isMutating}>
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
        width={700}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handlePasswordReset} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <div className="p-4 bg-yellow-950/20 border border-yellow-800/60 rounded-xl text-yellow-200 text-sm h-full flex flex-col justify-center">
                <span className="font-bold block mb-1 text-yellow-300">Reset Confirmation</span>
                You are about to trigger a password reset flow for this user.
              </div>
            </div>
            <div className="md:col-span-7 flex flex-col justify-center">
              <p className="text-sm text-zinc-300">
                A password reset email containing secure reset instructions will be sent automatically to:
                <strong className="block text-white text-base font-mono mt-1 bg-zinc-900 border border-zinc-800/80 p-3 rounded-lg">{user.email}</strong>
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4 mt-6">
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

