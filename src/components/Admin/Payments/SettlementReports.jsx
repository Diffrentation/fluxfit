"use client";
import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tag, Button, Select, DatePicker, Card, Statistic, Row, Col, Pagination, message } from "antd";
import { IconDownload, IconCurrencyRupee } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const { RangePicker } = DatePicker;
const { Option } = Select;

const SettlementReports = ({ settlements = [], onUpdateSettlements }) => {
  const [vendorFilter, setVendorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getStatusColor = (status) => {
    const colors = {
      pending: "orange",
      processed: "green",
      failed: "red",
    };
    return colors[status] || "default";
  };

  // Filter settlements
  const filteredSettlements = useMemo(() => {
    let filtered = [...settlements];

    if (vendorFilter !== "all") {
      filtered = filtered.filter((s) => s.vendorId === vendorFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((s) => {
        const periodDate = new Date(s.period + "-01");
        return periodDate >= dateRange[0] && periodDate <= dateRange[1];
      });
    }

    return filtered;
  }, [settlements, vendorFilter, statusFilter, dateRange]);

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSettlements = filteredSettlements.slice(startIndex, endIndex);

  const handleProcessSettlement = useCallback((settlement) => {
    if (onUpdateSettlements) {
      const updatedSettlements = settlements.map((s) =>
        s.id === settlement.id
          ? { ...s, status: "processed", processedDate: new Date().toISOString().split('T')[0] }
          : s
      );
      onUpdateSettlements(updatedSettlements);
      message.success("Settlement processed successfully");
    }
  }, [settlements, onUpdateSettlements]);

  const handleExport = useCallback((settlement) => {
    message.success("Settlement report exported successfully");
  }, []);

  const totalPending = useMemo(() => {
    return filteredSettlements
      .filter((s) => s.status === "pending")
      .reduce((sum, s) => sum + s.settlement, 0);
  }, [filteredSettlements]);

  const totalProcessed = useMemo(() => {
    return filteredSettlements
      .filter((s) => s.status === "processed")
      .reduce((sum, s) => sum + s.settlement, 0);
  }, [filteredSettlements]);

  const renderSettlementCard = (settlement) => (
    <motion.div
      key={settlement.id}
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
              <div className="font-mono text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {settlement.vendorName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ID: #{settlement.vendorId} | Period: {settlement.period}
              </div>
            </div>
            <Tag color={getStatusColor(settlement.status)} className="capitalize text-xs shrink-0">
              {settlement.status}
            </Tag>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total Sales</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ₹{formatPrice(settlement.totalSales)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Commission (10%)</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                ₹{formatPrice(settlement.commission)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Tax (GST)</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                ₹{formatPrice(settlement.tax)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Settlement</span>
              <span className="text-base font-bold text-green-600 dark:text-green-400">
                ₹{formatPrice(settlement.settlement)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Due Date</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {format(new Date(settlement.dueDate), "MMM dd, yyyy")}
              </span>
            </div>
            {settlement.processedDate && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Processed</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {format(new Date(settlement.processedDate), "MMM dd, yyyy")}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {settlement.status === "pending" && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleProcessSettlement(settlement)}
                className="flex-1"
              >
                Process
              </Button>
            )}
            <Button
              type="text"
              size="small"
              icon={<IconDownload className="w-3 h-3" />}
              onClick={() => handleExport(settlement)}
              className="flex-1"
            >
              Export
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const columns = [
    {
      title: "Vendor ID",
      dataIndex: "vendorId",
      key: "vendorId",
      width: 100,
      render: (id) => <span className="font-mono">#{id}</span>,
    },
    {
      title: "Vendor Name",
      dataIndex: "vendorName",
      key: "vendorName",
      width: 150,
    },
    {
      title: "Period",
      dataIndex: "period",
      key: "period",
      width: 120,
    },
    {
      title: "Total Sales",
      dataIndex: "totalSales",
      key: "totalSales",
      width: 120,
      render: (amount) => <span className="font-semibold">₹{formatPrice(amount)}</span>,
    },
    {
      title: "Commission (10%)",
      dataIndex: "commission",
      key: "commission",
      width: 130,
      render: (amount) => <span className="text-gray-600">₹{formatPrice(amount)}</span>,
    },
    {
      title: "Tax (GST)",
      dataIndex: "tax",
      key: "tax",
      width: 120,
      render: (amount) => <span className="text-gray-600">₹{formatPrice(amount)}</span>,
    },
    {
      title: "Settlement Amount",
      dataIndex: "settlement",
      key: "settlement",
      width: 150,
      render: (amount) => (
        <span className="font-semibold text-green-600">₹{formatPrice(amount)}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (date) => format(new Date(date), "MMM dd, yyyy"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <div className="flex gap-2">
          {record.status === "pending" && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleProcessSettlement(record)}
            >
              Process
            </Button>
          )}
          <Button
            type="text"
            size="small"
            icon={<IconDownload className="w-4 h-4" />}
            onClick={() => handleExport(record)}
          >
            Export
          </Button>
        </div>
      ),
    },
  ];

  const uniqueVendors = useMemo(() => {
    const vendors = new Set(settlements.map((s) => s.vendorId));
    return Array.from(vendors).map((id) => {
      const settlement = settlements.find((s) => s.vendorId === id);
      return { id, name: settlement?.vendorName || id };
    });
  }, [settlements]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      {/* Statistics Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 w-full">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full min-w-0">
          <Statistic
            title="Pending Settlements"
            value={totalPending}
            prefix={<IconCurrencyRupee className="w-4 h-4" />}
            formatter={(value) => `₹${formatPrice(value)}`}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full min-w-0">
          <Statistic
            title="Processed This Month"
            value={totalProcessed}
            prefix={<IconCurrencyRupee className="w-4 h-4" />}
            formatter={(value) => `₹${formatPrice(value)}`}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 sm:col-span-2 lg:col-span-1 w-full min-w-0">
          <Statistic
            title="Total Vendors"
            value={uniqueVendors.length}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-white dark:bg-gray-800 p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-3 sm:mb-4">
        <Select
          placeholder="All Vendors"
          value={vendorFilter}
          onChange={(value) => {
            setVendorFilter(value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto sm:min-w-[150px]"
          size="large"
        >
          <Option value="all">All Vendors</Option>
          {uniqueVendors.map((vendor) => (
            <Option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </Option>
          ))}
        </Select>
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
          <Option value="pending">Pending</Option>
          <Option value="processed">Processed</Option>
          <Option value="failed">Failed</Option>
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
            dataSource={paginatedSettlements.map((s) => ({ ...s, key: s.id }))}
            columns={columns}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredSettlements.length,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} settlements`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              onShowSizeChange: (current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              },
            }}
            scroll={{ x: 1200 }}
          />
        </div>
      </div>

      {/* Mobile/Tablet Grid View - xs: 1 col, sm: 2 cols, md: 2 cols */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 w-full">
          <AnimatePresence mode="popLayout">
            {paginatedSettlements.length > 0 ? (
              paginatedSettlements.map((settlement) => renderSettlementCard(settlement))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                No settlements found matching your filters
              </div>
            )}
          </AnimatePresence>
        </div>

        {filteredSettlements.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredSettlements.length)} of {filteredSettlements.length} settlements
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredSettlements.length}
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
    </motion.div>
  );
};

export default SettlementReports;
