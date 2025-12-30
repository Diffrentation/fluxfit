"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import OrderList from "@/components/Admin/Orders/OrderList";
import OrderDetails from "@/components/Admin/Orders/OrderDetails";
import { Input, Select, DatePicker, message } from "antd";
import { IconSearch } from "@tabler/icons-react";

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, dateRange]);

  const loadOrders = () => {
    // Load orders from localStorage
    const storedOrders = localStorage.getItem("orders");
    if (storedOrders) {
      const parsedOrders = JSON.parse(storedOrders);
      setOrders(parsedOrders);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.address?.name?.toLowerCase().includes(searchQuery.toLowerCase())
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

    setFilteredOrders(filtered);
  };

  const handleStatusChange = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) =>
      order.orderId === orderId
        ? {
            ...order,
            status: newStatus,
            statusHistory: [
              ...(order.statusHistory || []),
              {
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: `Status changed to ${newStatus}`,
              },
            ],
          }
        : order
    );
    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    message.success("Order status updated successfully");
    loadOrders();
  };

  const handleAssignDeliveryPartner = (orderId, partnerId) => {
    const updatedOrders = orders.map((order) =>
      order.orderId === orderId
        ? { ...order, deliveryPartner: partnerId }
        : order
    );
    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    message.success("Delivery partner assigned successfully");
    loadOrders();
  };

  const handleCancelOrder = (orderId, reason) => {
    handleStatusChange(orderId, "cancelled");
    message.success("Order cancelled successfully");
  };

  const handlePartialCancel = (orderId, itemsToCancel) => {
    message.success("Partial order cancellation processed");
    loadOrders();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar activeItem="orders" />

        <div className="flex-1 ml-0 lg:ml-64 pt-20 lg:pt-16">
          <div className="p-4 md:p-6 pb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Order Management
                  </h1>
                  <p className="text-gray-600">
                    View and manage all customer orders
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                <div className="flex-1">
                  <Search
                    placeholder="Search by order ID or customer name"
                    allowClear
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    prefix={<IconSearch className="w-4 h-4 text-gray-400" />}
                    size="large"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 180 }}
                  size="large"
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
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <OrderList
                    orders={filteredOrders}
                    onSelect={(order) => setSelectedOrder(order)}
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
                      onGenerateInvoice={() => {
                        // Invoice generation logic
                        message.success("Invoice generated successfully");
                      }}
                    />
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                      Select an order to view details
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagementPage;

