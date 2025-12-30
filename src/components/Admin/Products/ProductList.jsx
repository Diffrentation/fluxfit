"use client";
import React from "react";
import { motion } from "framer-motion";
import { Table, Tag, Button, Avatar, Image, Dropdown, message } from "antd";
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconDots,
  IconCheck,
  IconX,
  IconClock,
} from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const ProductList = ({ products, onEdit, onDelete, onView }) => {
  const getStatusColor = (status) => {
    const colors = {
      approved: "green",
      pending: "orange",
      rejected: "red",
      draft: "gray",
    };
    return colors[status] || "default";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <IconCheck className="w-4 h-4" />;
      case "pending":
        return <IconClock className="w-4 h-4" />;
      case "rejected":
        return <IconX className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const columns = [
    {
      title: "Product",
      key: "product",
      width: 300,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            <Image
              src={record.images?.[0] || record.image || ""}
              alt={record.name}
              width={48}
              height={48}
              className="object-cover"
              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23e5e7eb'/%3E%3C/svg%3E"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 truncate">
              {record.name}
            </div>
            <div className="text-xs text-gray-500">ID: {record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category) => (
        <Tag color="blue" className="font-medium">
          {category}
        </Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (price) => (
        <span className="font-semibold text-gray-900">
          ₹{formatPrice(price)}
        </span>
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 100,
      render: (stock) => (
        <span
          className={`font-semibold ${
            stock > 10
              ? "text-green-600"
              : stock > 0
              ? "text-orange-600"
              : "text-red-600"
          }`}
        >
          {stock || 0} units
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag
          color={getStatusColor(status)}
          className="flex items-center gap-1 w-fit"
        >
          {getStatusIcon(status)}
          <span className="capitalize">{status}</span>
        </Tag>
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
                onClick: () => onView(record),
              },
              {
                key: "edit",
                label: "Edit Product",
                icon: <IconEdit className="w-4 h-4" />,
                onClick: () => onEdit(record),
              },
              {
                type: "divider",
              },
              {
                key: "delete",
                label: "Delete",
                icon: <IconTrash className="w-4 h-4" />,
                danger: true,
                onClick: () => onDelete(record.id),
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
      transition={{ delay: 0.1 }}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table
          dataSource={products.map((p) => ({ ...p, key: p.id }))}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
          }}
          scroll={{ x: 1000 }}
          className="product-table"
        />
      </div>
    </motion.div>
  );
};

export default ProductList;
