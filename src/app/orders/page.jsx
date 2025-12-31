"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconShoppingBag,
  IconChevronRight,
  IconSearch,
  IconFilter,
  IconPackage,
  IconTruck,
  IconCheck,
  IconX,
  IconRefresh,
} from "@tabler/icons-react";
import { Button, Input, Select, Card, Badge, Empty, message } from "antd";
import Image from "next/image";
import { format } from "date-fns";

const { Search } = Input;
const { Option } = Select;

const OrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const loadOrders = () => {
    const savedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    // Sort by order date (newest first)
    const sortedOrders = savedOrders.sort(
      (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
    );
    setOrders(sortedOrders);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: "blue",
      processing: "orange",
      shipped: "purple",
      delivered: "green",
      cancelled: "red",
      returned: "gray",
      refunded: "gray",
    };
    return colors[status] || "default";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <IconCheck className="w-4 h-4" />;
      case "processing":
        return <IconPackage className="w-4 h-4" />;
      case "shipped":
        return <IconTruck className="w-4 h-4" />;
      case "delivered":
        return <IconCheck className="w-4 h-4" />;
      case "cancelled":
        return <IconX className="w-4 h-4" />;
      default:
        return <IconPackage className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      returned: "Returned",
      refunded: "Refunded",
    };
    return labels[status] || status;
  };

  // Format price helper - prices are already in INR
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 pb-8 sm:pb-12 transition-colors duration-300">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Orders
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Track and manage your orders
            </p>
          </div>
          <Empty
            description="No orders found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => router.push("/product-list")}>
              Start Shopping
            </Button>
          </Empty>
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
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Orders
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Track and manage your orders
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <Search
                placeholder="Search by order ID or product name"
                allowClear
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={
                  <IconSearch className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                }
                className="w-full"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full sm:w-[180px] md:w-[200px]"
              prefixIcon={<IconFilter className="w-4 h-4" />}
            >
              <Option value="all">All Status</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="processing">Processing</Option>
              <Option value="shipped">Shipped</Option>
              <Option value="delivered">Delivered</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="returned">Returned</Option>
              <Option value="refunded">Refunded</Option>
            </Select>
            <Button
              icon={<IconRefresh className="w-4 h-4" />}
              onClick={loadOrders}
              className="w-full sm:w-auto"
            >
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Orders List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <Empty
                description="No orders match your filters"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.orderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700"
                  onClick={() => router.push(`/orders/${order.orderId}`)}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                              Order #{order.orderId}
                            </h3>
                            <Badge
                              color={getStatusColor(order.status)}
                              text={getStatusLabel(order.status)}
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(order.status)}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            Placed on{" "}
                            {format(
                              new Date(order.orderDate),
                              "MMM dd, yyyy 'at' hh:mm a"
                            )}
                          </p>
                        </div>
                        <IconChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 hidden md:block shrink-0" />
                      </div>

                      {/* Order Items Preview */}
                      <div className="space-y-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={`${item.id}-${item.size}-${item.color}-${idx}`}
                            className="flex items-center gap-2 sm:gap-3"
                          >
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                              <Image
                                src={item.image || ""}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {item.size && item.size !== "One Size"
                                  ? `Size: ${item.size} • `
                                  : ""}
                                {item.color ? `Color: ${item.color} • ` : ""}
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                              ₹
                              {formatPrice(
                                parseFloat(item.price) * item.quantity
                              )}
                            </p>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                            +{order.items.length - 3} more item(s)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="md:w-48 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 md:pt-0 md:pl-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Items:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {order.items.length}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Total:
                          </span>
                          <span className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400">
                            ₹
                            {formatPrice(
                              parseFloat(
                                order.orderSummary?.grandTotal || "0.00"
                              )
                            )}
                          </span>
                        </div>
                        <Button
                          type="primary"
                          block
                          className="mt-3 sm:mt-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.orderId}`);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
