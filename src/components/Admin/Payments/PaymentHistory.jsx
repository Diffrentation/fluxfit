"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Button, Input, Select, DatePicker, Dropdown, Badge, Card, Pagination, Modal, message } from "antd";
import { IconSearch, IconDots, IconEye, IconAlertTriangle } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);
const myDarkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "#09090b",
  foregroundColor: "#e4e4e7",
  headerBackgroundColor: "#18181b",
  borderColor: "#27272a",
  rowHoverColor: "#18181b",
});

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const PaymentHistory = ({ payments = [], onUpdatePayments }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(id);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
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

    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (payment) =>
          payment.transactionId?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          payment.orderId?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          payment.customer?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
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
  }, [payments, debouncedSearchQuery, statusFilter, dateRange]);

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
        className="h-full border border-zinc-800 hover:shadow-md transition-shadow !bg-zinc-950 w-full min-w-0"
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

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Transaction ID",
        field: "transactionId",
        width: 150,
        cellRenderer: (p) => (
          <span className="font-mono text-sm text-blue-600 dark:text-blue-400">#{p.value}</span>
        ),
      },
      {
        headerName: "Order ID",
        field: "orderId",
        width: 120,
        cellRenderer: (p) => <span className="font-mono text-sm">#{p.value}</span>,
      },
      {
        headerName: "Customer",
        field: "customer",
        width: 150,
      },
      {
        headerName: "Amount",
        field: "amount",
        width: 120,
        cellRenderer: (p) => <span className="font-semibold">₹{formatPrice(p.value)}</span>,
      },
      {
        headerName: "Payment Method",
        field: "method",
        width: 130,
        cellRenderer: (p) => <Tag color="blue">{getMethodLabel(p.value)}</Tag>,
      },
      {
        headerName: "Status",
        field: "status",
        width: 100,
        cellRenderer: (p) => (
          <div className="h-full flex items-center gap-2">
            <Tag color={getStatusColor(p.value)} className="capitalize">
              {p.value}
            </Tag>
            {p.data.fraudFlag && (
              <Badge
                count={<IconAlertTriangle className="w-3 h-3 text-red-500" />}
                title="Fraud Flagged"
              />
            )}
          </div>
        ),
      },
      {
        headerName: "Date",
        field: "date",
        width: 120,
        cellRenderer: (p) => format(new Date(p.value), "MMM dd, yyyy"),
      },
      {
        headerName: "Actions",
        width: 100,
        pinned: "right",
        cellRenderer: (p) => {
          const record = p.data;
          return (
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
          );
        },
      },
    ],
    [handleViewDetails, handleReviewFraud]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 !bg-zinc-950 p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-zinc-800">
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
        <div className="!bg-zinc-950 rounded-lg shadow-sm border border-zinc-800 overflow-hidden p-2">
          {isClient ? (
            <div style={{ width: "100%", height: 560 }}>
              <AgGridReact
                theme={myDarkTheme}
                modules={[AllCommunityModule]}
                rowData={paginatedPayments}
                columnDefs={columnDefs}
                defaultColDef={{ sortable: true, resizable: true }}
                getRowId={(p) => String(p.data.id)}
                animateRows
                rowHeight={56}
                headerHeight={44}
                suppressCellFocus
                overlayNoRowsTemplate="No payments found"
              />
            </div>
          ) : (
            <div className="h-[560px]" />
          )}
        </div>
        {filteredPayments.length > 0 && (
          <div className="flex justify-end pt-3">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredPayments.length}
              showSizeChanger
              showTotal={(total) => `Total ${total} transactions`}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              onShowSizeChange={(current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              }}
            />
          </div>
        )}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-zinc-800">
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
        style={{ maxWidth: 850 }}
        className="!bg-zinc-950"
        centered
      >
        {selectedPayment && (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-zinc-800 pb-6">
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Transaction ID</div>
                <div className="font-mono text-sm font-semibold text-white">
                  #{selectedPayment.transactionId}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Order ID</div>
                <div className="font-mono text-sm font-semibold text-white">
                  #{selectedPayment.orderId}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Customer</div>
                <div className="text-sm font-medium text-white">
                  {selectedPayment.customer}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Amount</div>
                <div className="text-base font-semibold text-emerald-400">
                  ₹{formatPrice(selectedPayment.amount)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Payment Method</div>
                <Tag color="blue" className="m-0 font-medium">{getMethodLabel(selectedPayment.method)}</Tag>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Status</div>
                <Tag color={getStatusColor(selectedPayment.status)} className="capitalize m-0 font-medium">
                  {selectedPayment.status}
                </Tag>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Date</div>
                <div className="text-sm text-zinc-200">
                  {format(new Date(selectedPayment.date), "MMM dd, yyyy")}
                </div>
              </div>
            </div>

            {selectedPayment.fraudFlag && (
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center gap-3 p-4 bg-orange-950/20 border border-orange-900/40 rounded-xl text-orange-200">
                  <IconAlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
                  <span className="text-sm">
                    <strong>Fraud Flag:</strong> This transaction has been flagged for fraud review. Please verify billing details and contact info before shipping.
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <Button size="large" onClick={() => setIsDetailsModalVisible(false)}>Close Details</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default PaymentHistory;
