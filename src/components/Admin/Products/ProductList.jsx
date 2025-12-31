"use client";
import React from "react";
import { motion } from "framer-motion";
import { Table, Tag, Button, Avatar, Image, Dropdown, message, Card } from "antd";
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
      width: 200,
      responsive: ["xs", "sm", "md", "lg"],
      render: (_, record) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
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
            <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
              {record.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 100,
      responsive: ["sm", "md", "lg"],
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
      width: 100,
      responsive: ["sm", "md", "lg"],
      render: (price) => (
        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
          ₹{formatPrice(price)}
        </span>
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      width: 90,
      responsive: ["md", "lg"],
      render: (stock) => (
        <span
          className={`font-semibold text-sm sm:text-base ${
            stock > 10
              ? "text-green-600 dark:text-green-400"
              : stock > 0
              ? "text-orange-600 dark:text-orange-400"
              : "text-red-600 dark:text-red-400"
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
      width: 100,
      responsive: ["sm", "md", "lg"],
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
      width: 80,
      fixed: "right",
      responsive: ["xs", "sm", "md", "lg"],
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

  // Grid view for mobile and tablet
  const ProductCard = ({ product }) => {
    return (
      <Card
        className="h-full hover:shadow-md transition-shadow"
        bodyStyle={{ padding: "12px" }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
              <Image
                src={product.images?.[0] || product.image || ""}
                alt={product.name}
                width={80}
                height={80}
                className="object-cover"
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23e5e7eb'/%3E%3C/svg%3E"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate mb-1">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">ID: {product.id}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <Tag color="blue" className="text-xs">{product.category}</Tag>
                <Tag
                  color={getStatusColor(product.status)}
                  className="flex items-center gap-1 text-xs"
                >
                  {getStatusIcon(product.status)}
                  <span className="capitalize">{product.status}</span>
                </Tag>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Price:</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                ₹{formatPrice(product.price)}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Stock:</span>
              <p
                className={`font-semibold ${
                  product.stock > 10
                    ? "text-green-600 dark:text-green-400"
                    : product.stock > 0
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {product.stock || 0} units
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="default"
              size="small"
              icon={<IconEye className="w-3 h-3" />}
              onClick={() => onView(product)}
              className="flex-1"
            >
              View
            </Button>
            <Button
              type="default"
              size="small"
              icon={<IconEdit className="w-3 h-3" />}
              onClick={() => onEdit(product)}
              className="flex-1"
            >
              Edit
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "delete",
                    label: "Delete",
                    icon: <IconTrash className="w-4 h-4" />,
                    danger: true,
                    onClick: () => onDelete(product.id),
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button
                type="default"
                size="small"
                icon={<IconDots className="w-3 h-3" />}
                danger
              />
            </Dropdown>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Grid Layout for Mobile and Tablet */}
      <div className="lg:hidden">
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No products found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Table Layout for Desktop */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table
          dataSource={products.map((p) => ({ ...p, key: p.id }))}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
            responsive: true,
          }}
          scroll={{ x: 600 }}
          className="product-table"
          size="small"
        />
      </div>
    </motion.div>
  );
};

export default ProductList;
