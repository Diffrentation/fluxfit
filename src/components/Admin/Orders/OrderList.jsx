"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tag, Avatar, Button, Dropdown, Card, Pagination } from "antd";
import { IconDots, IconEye } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const OrderList = ({ orders, onSelect, selectedOrderId, onStatusChange }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  // Calculate pagination for mobile/tablet
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  const renderOrderCard = (order) => {
    const isSelected = selectedOrderId === order.orderId;
    
    return (
      <motion.div
        key={order.orderId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onSelect(order)}
        className={`cursor-pointer transition-all ${
          isSelected
            ? "ring-2 ring-blue-500 dark:ring-blue-400"
            : "hover:shadow-md"
        }`}
      >
        <Card
          className={`h-full border ${
            isSelected
              ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-700"
          } hover:shadow-md transition-shadow`}
          bodyStyle={{ padding: "16px" }}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Order ID and Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-sm sm:text-base text-blue-600 dark:text-blue-400">
                      #{order.orderId}
                    </span>
                    <Tag color={getStatusColor(order.status)} className="capitalize text-xs sm:text-sm">
                      {order.status}
                    </Tag>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(order.orderDate), "MMM dd, yyyy")}
                  </div>
                </div>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "view",
                        label: "View Details",
                        icon: <IconEye className="w-4 h-4" />,
                        onClick: () => onSelect(order),
                      },
                    ],
                  }}
                  trigger={["click"]}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="text"
                    icon={<IconDots className="w-4 h-4" />}
                    size="small"
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </div>

              {/* Customer Info */}
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Avatar size={40} className="bg-blue-500 shrink-0">
                  {order.address?.name?.[0]?.toUpperCase() || "C"}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                    {order.address?.name || "N/A"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {order.address?.phone || ""}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {order.items?.length || 0} items
                </div>
                <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                  ₹{formatPrice(order.orderSummary?.grandTotal || 0)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Desktop Table View */}
      <div className="hidden lg:block">
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
            className: selectedOrderId === record.orderId ? "bg-blue-50 dark:bg-blue-900/20" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50",
          })}
        />
      </div>

      {/* Mobile/Tablet Grid View */}
      <div className="lg:hidden p-2 sm:p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <AnimatePresence mode="popLayout">
            {paginatedOrders.map((order) => renderOrderCard(order))}
          </AnimatePresence>
        </div>

        {orders.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} orders
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={orders.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              showQuickJumper={false}
              showTotal={(total) => `Total ${total}`}
              size="small"
              className="flex justify-center sm:justify-end"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OrderList;

