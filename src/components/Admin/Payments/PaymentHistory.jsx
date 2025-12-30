"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table, Tag, Button, Input, Select, DatePicker, Dropdown, Badge } from "antd";
import { IconSearch, IconDots, IconEye, IconAlertTriangle } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PaymentHistory = () => {
  const [payments] = useState([
    {
      id: 1,
      orderId: "ORD001",
      transactionId: "TXN123456",
      amount: 5000,
      method: "credit_card",
      status: "success",
      fraudFlag: false,
      date: "2024-05-15",
      customer: "John Doe",
    },
    {
      id: 2,
      orderId: "ORD002",
      transactionId: "TXN123457",
      amount: 3000,
      method: "upi",
      status: "success",
      fraudFlag: true,
      date: "2024-05-16",
      customer: "Jane Smith",
    },
    {
      id: 3,
      orderId: "ORD003",
      transactionId: "TXN123458",
      amount: 8000,
      method: "debit_card",
      status: "failed",
      fraudFlag: false,
      date: "2024-05-17",
      customer: "Bob Johnson",
    },
  ]);

  const getStatusColor = (status) => {
    const colors = {
      success: "green",
      failed: "red",
      pending: "orange",
      refunded: "blue",
    };
    return colors[status] || "default";
  };

  const getMethodLabel = (method) => {
    const labels = {
      credit_card: "Credit Card",
      debit_card: "Debit Card",
      upi: "UPI",
      netbanking: "Net Banking",
      wallet: "Wallet",
    };
    return labels[method] || method;
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
      width: 150,
      render: (id) => (
        <span className="font-mono text-sm text-blue-600">#{id}</span>
      ),
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      width: 120,
      render: (id) => (
        <span className="font-mono text-sm">#{id}</span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      width: 150,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount) => (
        <span className="font-semibold">₹{formatPrice(amount)}</span>
      ),
    },
    {
      title: "Payment Method",
      dataIndex: "method",
      key: "method",
      width: 130,
      render: (method) => <Tag color="blue">{getMethodLabel(method)}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status, record) => (
        <div className="flex items-center gap-2">
          <Tag color={getStatusColor(status)} className="capitalize">
            {status}
          </Tag>
          {record.fraudFlag && (
            <Badge
              count={<IconAlertTriangle className="w-3 h-3 text-red-500" />}
              title="Fraud Flagged"
            />
          )}
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) => format(new Date(date), "MMM dd, yyyy"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: "View Details",
                icon: <IconEye className="w-4 h-4" />,
              },
              record.fraudFlag && {
                key: "review",
                label: "Review Fraud",
                icon: <IconAlertTriangle className="w-4 h-4" />,
                danger: true,
              },
            ].filter(Boolean),
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            icon={<IconDots className="w-4 h-4" />}
            className="flex items-center justify-center"
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex-1">
          <Search
            placeholder="Search by transaction ID or order ID"
            allowClear
            prefix={<IconSearch className="w-4 h-4 text-gray-400" />}
            size="large"
          />
        </div>
        <Select placeholder="All Status" style={{ width: 150 }} size="large">
          <Option value="all">All Status</Option>
          <Option value="success">Success</Option>
          <Option value="failed">Failed</Option>
          <Option value="pending">Pending</Option>
        </Select>
        <RangePicker size="large" format="YYYY-MM-DD" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table
          dataSource={payments.map((p) => ({ ...p, key: p.id }))}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} transactions`,
          }}
          scroll={{ x: 1000 }}
        />
      </div>
    </motion.div>
  );
};

export default PaymentHistory;

