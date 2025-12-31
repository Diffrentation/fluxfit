"use client";
import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tag, Button, Input, Select, DatePicker, Dropdown, Badge, Card, Pagination, Modal, message } from "antd";
import { IconSearch, IconDots, IconEye, IconAlertTriangle } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PaymentHistory = ({ payments = [], onUpdatePayments }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

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

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];

    if (searchQuery) {
      filtered = filtered.filter(
        (payment) =>
          payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.customer?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((payment) => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= dateRange[0] && paymentDate <= dateRange[1];
      });
    }

    return filtered;
  }, [payments, searchQuery, statusFilter, dateRange]);

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  const handleViewDetails = useCallback((payment) => {
    setSelectedPayment(payment);
    setIsDetailsModalVisible(true);
  }, []);

  const handleReviewFraud = useCallback((payment) => {
    if (onUpdatePayments) {
      const updatedPayments = payments.map((p) =>
        p.id === payment.id ? { ...p, fraudFlag: false, reviewed: true } : p
      );
      onUpdatePayments(updatedPayments);
      message.success("Fraud flag reviewed and cleared");
    }
  }, [payments, onUpdatePayments]);

  const renderPaymentCard = (payment) => (
    <motion.div
      key={payment.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="h-full border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 w-full min-w-0"
        bodyStyle={{ padding: "12px" }}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 min-w-0">
                <span className="font-mono text-xs sm:text-sm text-blue-600 dark:text-blue-400 truncate">
                  #{payment.transactionId}
                </span>
                {payment.fraudFlag && (
                  <Badge
                    count={<IconAlertTriangle className="w-3 h-3 text-red-500" />}
                    title="Fraud Flagged"
                  />
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Order: #{payment.orderId}
              </div>
            </div>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "view",
                    label: "View Details",
                    icon: <IconEye className="w-4 h-4" />,
                    onClick: () => handleViewDetails(payment),
                  },
                  payment.fraudFlag && {
                    key: "review",
                    label: "Review Fraud",
                    icon: <IconAlertTriangle className="w-4 h-4" />,
                    danger: true,
                    onClick: () => handleReviewFraud(payment),
                  },
                ].filter(Boolean),
              }}
              trigger={["click"]}
            >
              <Button
                type="text"
                icon={<IconDots className="w-4 h-4" />}
                size="small"
                className="shrink-0"
              />
            </Dropdown>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Customer</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate text-right">
                {payment.customer}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Amount</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                ₹{formatPrice(payment.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Method</span>
              <Tag color="blue" className="text-xs">
                {getMethodLabel(payment.method)}
              </Tag>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
              <Tag color={getStatusColor(payment.status)} className="capitalize text-xs">
                {payment.status}
              </Tag>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Date</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {format(new Date(payment.date), "MMM dd, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
      width: 150,
      render: (id) => (
        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">#{id}</span>
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
                onClick: () => handleViewDetails(record),
              },
              record.fraudFlag && {
                key: "review",
                label: "Review Fraud",
                icon: <IconAlertTriangle className="w-4 h-4" />,
                danger: true,
                onClick: () => handleReviewFraud(record),
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
      className="space-y-3 sm:space-y-4"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-white dark:bg-gray-800 p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <Search
            placeholder="Search by transaction ID or order ID"
            allowClear
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            prefix={<IconSearch className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
            size="large"
            className="w-full"
          />
        </div>
        <Select
          placeholder="All Status"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto sm:min-w-[150px]"
          size="large"
        >
          <Option value="all">All Status</Option>
          <Option value="success">Success</Option>
          <Option value="failed">Failed</Option>
          <Option value="pending">Pending</Option>
          <Option value="refunded">Refunded</Option>
        </Select>
        <RangePicker
          size="large"
          format="YYYY-MM-DD"
          value={dateRange}
          onChange={(dates) => {
            setDateRange(dates);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table
            dataSource={paginatedPayments.map((p) => ({ ...p, key: p.id }))}
            columns={columns}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredPayments.length,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} transactions`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              onShowSizeChange: (current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              },
            }}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>

      {/* Mobile/Tablet Grid View - xs: 1 col, sm: 2 cols, md: 2 cols */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 w-full">
          <AnimatePresence mode="popLayout">
            {paginatedPayments.length > 0 ? (
              paginatedPayments.map((payment) => renderPaymentCard(payment))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                No payments found matching your filters
              </div>
            )}
          </AnimatePresence>
        </div>

        {filteredPayments.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} transactions
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredPayments.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              onShowSizeChange={(current, size) => {
                setCurrentPage(1);
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

      {/* Payment Details Modal */}
      <Modal
        title={`Payment Details - ${selectedPayment?.transactionId}`}
        open={isDetailsModalVisible}
        onCancel={() => {
          setIsDetailsModalVisible(false);
          setSelectedPayment(null);
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: 600 }}
        className="dark:bg-gray-800"
        centered
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Transaction ID</div>
                <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  #{selectedPayment.transactionId}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Order ID</div>
                <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  #{selectedPayment.orderId}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Customer</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedPayment.customer}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  ₹{formatPrice(selectedPayment.amount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Payment Method</div>
                <Tag color="blue">{getMethodLabel(selectedPayment.method)}</Tag>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                <Tag color={getStatusColor(selectedPayment.status)} className="capitalize">
                  {selectedPayment.status}
                </Tag>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Date</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {format(new Date(selectedPayment.date), "MMM dd, yyyy")}
                </div>
              </div>
              {selectedPayment.fraudFlag && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <IconAlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs text-orange-700 dark:text-orange-300">
                      This transaction has been flagged for fraud review
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default PaymentHistory;
