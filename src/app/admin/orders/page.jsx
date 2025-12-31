"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import OrderList from "@/components/Admin/Orders/OrderList";
import OrderDetails from "@/components/Admin/Orders/OrderDetails";
import { Input, Select, DatePicker, message, Modal } from "antd";
import { IconSearch } from "@tabler/icons-react";

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

  // Load orders on mount
  useEffect(() => {
    // Load orders from localStorage
    try {
      const storedOrders = localStorage.getItem("orders");
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        setOrders(parsedOrders);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      message.error("Failed to load orders");
    }
  }, []);

  // Update selected order when orders change
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find(
        (o) => o.orderId === selectedOrder.orderId
      );
      if (
        updatedOrder &&
        JSON.stringify(updatedOrder) !== JSON.stringify(selectedOrder)
      ) {
        setSelectedOrder(updatedOrder);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // Filter orders using useMemo for better performance
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.address?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.address?.phone?.includes(searchQuery)
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
  }, [orders, searchQuery, statusFilter, dateRange]);

  const handleStatusChange = useCallback((orderId, newStatus, note) => {
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              status: newStatus,
              statusHistory: [
                ...(order.statusHistory || []),
                {
                  status: newStatus,
                  timestamp: new Date().toISOString(),
                  note: note || `Status changed to ${newStatus}`,
                },
              ],
            }
          : order
      );
      try {
        localStorage.setItem("orders", JSON.stringify(updatedOrders));
      } catch (error) {
        console.error("Error saving orders:", error);
      }
      return updatedOrders;
    });
    message.success("Order status updated successfully");
  }, []);

  const handleAssignDeliveryPartner = useCallback((orderId, partnerId) => {
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) =>
        order.orderId === orderId
          ? { ...order, deliveryPartner: partnerId }
          : order
      );
      try {
        localStorage.setItem("orders", JSON.stringify(updatedOrders));
      } catch (error) {
        console.error("Error saving orders:", error);
      }
      return updatedOrders;
    });
    message.success("Delivery partner assigned successfully");
  }, []);

  const handleCancelOrder = useCallback(
    (orderId, reason) => {
      handleStatusChange(orderId, "cancelled", reason || "Order cancelled");
      message.success("Order cancelled successfully");
    },
    [handleStatusChange]
  );

  const handlePartialCancel = useCallback((orderId, itemsToCancel) => {
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.orderId === orderId) {
          const updatedItems = order.items.filter(
            (item) => !itemsToCancel.includes(item.id || item.name)
          );
          return {
            ...order,
            items: updatedItems,
            statusHistory: [
              ...(order.statusHistory || []),
              {
                status: order.status,
                timestamp: new Date().toISOString(),
                note: `Partial cancellation: ${itemsToCancel.length} item(s) cancelled`,
              },
            ],
          };
        }
        return order;
      });
      try {
        localStorage.setItem("orders", JSON.stringify(updatedOrders));
      } catch (error) {
        console.error("Error saving orders:", error);
      }
      return updatedOrders;
    });
    message.success("Partial order cancellation processed");
  }, []);

  const handleSelectOrder = useCallback((order) => {
    setSelectedOrder(order);
    // Show modal on mobile/tablet
    if (window.innerWidth < 1024) {
      setIsDetailsModalVisible(true);
    }
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsModalVisible(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        <AdminSidebar activeItem="orders" />

        <div className="flex-1 ml-0 lg:ml-64 pt-14 sm:pt-16 lg:pt-16">
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
                    View and manage all customer orders
                  </p>
                </div>
              </div>

              {/* Filters */}
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

              {/* Desktop Layout: Side by side */}
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
                      onGenerateInvoice={() => {
                        message.success("Invoice generated successfully");
                      }}
                    />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
                      Select an order to view details
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile/Tablet Layout: Full width list */}
              <div className="lg:hidden">
                <OrderList
                  orders={filteredOrders}
                  onSelect={handleSelectOrder}
                  selectedOrderId={selectedOrder?.orderId}
                  onStatusChange={handleStatusChange}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Order Details Modal */}
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
            onStatusChange={(orderId, status, note) => {
              handleStatusChange(orderId, status, note);
            }}
            onAssignDeliveryPartner={(orderId, partnerId) => {
              handleAssignDeliveryPartner(orderId, partnerId);
            }}
            onCancel={(orderId, reason) => {
              handleCancelOrder(orderId, reason);
            }}
            onPartialCancel={(orderId, items) => {
              handlePartialCancel(orderId, items);
            }}
            onGenerateInvoice={() => {
              message.success("Invoice generated successfully");
            }}
            onClose={handleCloseDetails}
          />
        )}
      </Modal>
    </div>
  );
};

export default OrderManagementPage;
