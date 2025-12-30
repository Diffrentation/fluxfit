"use client";
import React from "react";
import { motion } from "framer-motion";
import { Table, Tag, Avatar, Button, Dropdown } from "antd";
import { IconDots, IconEye } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const OrderList = ({ orders, onSelect, selectedOrderId, onStatusChange }) => {
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

  const columns = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      width: 150,
      render: (orderId) => (
        <span className="font-mono font-semibold text-blue-600">#{orderId}</span>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar size={40} className="bg-blue-500">
            {record.address?.name?.[0]?.toUpperCase() || "C"}
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{record.address?.name || "N/A"}</div>
            <div className="text-xs text-gray-500">{record.address?.phone || ""}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Items",
      key: "items",
      width: 100,
      render: (_, record) => (
        <span className="text-gray-600">{record.items?.length || 0} items</span>
      ),
    },
    {
      title: "Total",
      dataIndex: "orderSummary",
      key: "total",
      width: 120,
      render: (summary) => (
        <span className="font-semibold text-gray-900">
          ₹{formatPrice(summary?.grandTotal || 0)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "orderDate",
      key: "date",
      width: 120,
      render: (date) => (
        <span className="text-gray-600">{format(new Date(date), "MMM dd, yyyy")}</span>
      ),
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
                onClick: () => onSelect(record),
              },
            ],
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
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      <Table
        dataSource={orders.map((o) => ({ ...o, key: o.orderId }))}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} orders`,
        }}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => onSelect(record),
          className: selectedOrderId === record.orderId ? "bg-blue-50" : "cursor-pointer hover:bg-gray-50",
        })}
      />
    </motion.div>
  );
};

export default OrderList;

