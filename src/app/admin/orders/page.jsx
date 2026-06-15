"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { motion } from "framer-motion";
import axios from "axios";
import AdminContent from "@/components/Admin/AdminContent";
import OrderList from "@/components/Admin/Orders/OrderList";
import OrderDetails from "@/components/Admin/Orders/OrderDetails";
import { Input, Select, DatePicker, message, Modal, Spin } from "antd";
import { IconSearch } from "@tabler/icons-react";
import { mapApiOrderToLegacyUi } from "@/lib/order-display";
import {
  fetchAdminOrders,
  getOrdersAuthHeaders,
} from "@/lib/orders-api-client";

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PARTNER_NAMES = {
  1: "Delhivery",
  2: "BlueDart",
  3: "FedEx",
};

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    const h = getOrdersAuthHeaders();
    if (!h.Authorization) {
      message.error("Admin session required");
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchAdminOrders({ page: 1, limit: 200 });
      console.log("[Admin Orders] GET /api/admin/orders response", data);

      const rawList =
        data?.orders ??
        data?.data?.orders ??
        [];

      if (!data?.success) {
        message.error(data?.message || "Failed to load orders");
        setOrders([]);
        return;
      }

      const mapped = rawList
        .map((row) => {
          const legacy = mapApiOrderToLegacyUi(row);
          if (!legacy) return null;
          if (row.user?.email) legacy.address.email = row.user.email;
          return legacy;
        })
        .filter(Boolean);

      setOrders(mapped);
      setSelectedOrder((prev) => {
        if (!prev) return null;
        return mapped.find((o) => o.orderId === prev.orderId) ?? null;
      });
    } catch (err) {
      console.error("[Admin Orders] load", err);
      message.error(
        err.response?.data?.message || err.message || "Failed to load orders",
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderId?.toLowerCase().includes(q) ||
          order.address?.name?.toLowerCase().includes(q) ||
          order.address?.email?.toLowerCase().includes(q) ||
          order.address?.phone?.includes(q),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= dateRange[0] && orderDate <= dateRange[1];
      });
    }

    return filtered;
  }, [orders, debouncedSearchQuery, statusFilter, dateRange]);

  const handleStatusChange = useCallback(
    async (orderId, newStatus, note) => {
      const headers = getOrdersAuthHeaders();
      try {
        const { data } = await axios.put(
          `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
          { status: newStatus, note },
          { headers },
        );
        if (!data?.success) {
          message.error(data?.message || "Status update failed");
          return;
        }
        message.success("Order status updated");
        await loadOrders();
      } catch (err) {
        message.error(
          err.response?.data?.message ||
            err.message ||
            "Status update failed",
        );
      }
    },
    [loadOrders],
  );

  const handleAssignDeliveryPartner = useCallback(
    async (orderId, partnerId) => {
      const headers = getOrdersAuthHeaders();
      const partner =
        PARTNER_NAMES[partnerId] || String(partnerId || "Partner");
      try {
        const { data } = await axios.put(
          `/api/admin/orders/${encodeURIComponent(orderId)}/assign-delivery`,
          { partner },
          { headers },
        );
        if (!data?.success) {
          message.error(data?.message || "Assignment failed");
          return;
        }
        message.success("Delivery partner assigned");
        await loadOrders();
      } catch (err) {
        message.error(
          err.response?.data?.message ||
            err.message ||
            "Assignment failed",
        );
      }
    },
    [loadOrders],
  );

  const handleCancelOrder = useCallback(
    async (orderId, reason) => {
      const headers = getOrdersAuthHeaders();
      try {
        const { data } = await axios.post(
          `/api/admin/orders/${encodeURIComponent(orderId)}/cancel`,
          { reason: reason || "Cancelled by admin" },
          { headers },
        );
        if (!data?.success) {
          message.error(data?.message || "Cancel failed");
          return;
        }
        message.success("Order cancelled");
        await loadOrders();
      } catch (err) {
        message.error(
          err.response?.data?.message || err.message || "Cancel failed",
        );
      }
    },
    [loadOrders],
  );

  const handlePartialCancel = useCallback(() => {
    message.info("Partial cancel: use the admin API or support workflow.");
  }, []);

  const handleSelectOrder = useCallback((order) => {
    setSelectedOrder(order);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsDetailsModalVisible(true);
    }
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsModalVisible(false);
  }, []);

  const handleGenerateInvoice = useCallback(
    async (orderId) => {
      const headers = getOrdersAuthHeaders();
      try {
        const res = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}/invoice`,
          { headers },
        );
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.message || `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice-${orderId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        message.success("Invoice downloaded");
      } catch (err) {
        message.error(err.message || "Invoice download failed");
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        <AdminContent>
          <div className="p-2 sm:p-4 md:p-6 pb-4 sm:pb-6 md:pb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 md:mb-6"
            >
              <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Order Management
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
                    View and manage all customer orders (from database)
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-3 sm:mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Search
                      placeholder="Search orders..."
                      allowClear
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      prefix={
                        <IconSearch className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      }
                      size="large"
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: "100%" }}
                    size="large"
                    className="w-full"
                  >
                    <Option value="all">All Status</Option>
                    <Option value="pending">Pending</Option>
                    <Option value="confirmed">Confirmed</Option>
                    <Option value="processing">Processing</Option>
                    <Option value="shipped">Shipped</Option>
                    <Option value="delivered">Delivered</Option>
                    <Option value="cancelled">Cancelled</Option>
                    <Option value="returned">Returned</Option>
                  </Select>
                  <RangePicker
                    size="large"
                    onChange={setDateRange}
                    format="YYYY-MM-DD"
                    className="w-full"
                    placeholder={["Start Date", "End Date"]}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <OrderList
                        orders={filteredOrders}
                        onSelect={handleSelectOrder}
                        selectedOrderId={selectedOrder?.orderId}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      {selectedOrder ? (
                        <OrderDetails
                          order={selectedOrder}
                          onStatusChange={handleStatusChange}
                          onAssignDeliveryPartner={handleAssignDeliveryPartner}
                          onCancel={handleCancelOrder}
                          onPartialCancel={handlePartialCancel}
                          onGenerateInvoice={() =>
                            handleGenerateInvoice(selectedOrder.orderId)
                          }
                        />
                      ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
                          Select an order to view details
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:hidden">
                    <OrderList
                      orders={filteredOrders}
                      onSelect={handleSelectOrder}
                      selectedOrderId={selectedOrder?.orderId}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </AdminContent>
      </div>

      <Modal
        title={
          selectedOrder ? `Order #${selectedOrder.orderId}` : "Order Details"
        }
        open={isDetailsModalVisible}
        onCancel={handleCloseDetails}
        footer={null}
        width="95%"
        style={{ maxWidth: 600 }}
        className="dark:bg-gray-800"
        centered
      >
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onStatusChange={handleStatusChange}
            onAssignDeliveryPartner={handleAssignDeliveryPartner}
            onCancel={handleCancelOrder}
            onPartialCancel={handlePartialCancel}
            onGenerateInvoice={() =>
              handleGenerateInvoice(selectedOrder.orderId)
            }
            onClose={handleCloseDetails}
          />
        )}
      </Modal>
    </div>
  );
};

export default OrderManagementPage;
