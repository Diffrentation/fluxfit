"use client";
import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Table, Tag, Button, Select, DatePicker, Statistic, Row, Col, Pagination, message } from "antd";
import { IconDownload, IconCalculator } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const { RangePicker } = DatePicker;
const { Option } = Select;

const TaxManagement = ({ taxData = [], onUpdateTaxData }) => {
  const [stateFilter, setStateFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter tax data
  const filteredTaxData = useMemo(() => {
    let filtered = [...taxData];

    if (stateFilter !== "all") {
      filtered = filtered.filter((t) => t.state === stateFilter);
    }

    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((t) => {
        const taxDate = new Date(t.date);
        return taxDate >= dateRange[0] && taxDate <= dateRange[1];
      });
    }

    return filtered;
  }, [taxData, stateFilter, dateRange]);

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTaxData = filteredTaxData.slice(startIndex, endIndex);

  const totalCGST = useMemo(() => {
    return filteredTaxData.reduce((sum, item) => sum + item.cgst, 0);
  }, [filteredTaxData]);

  const totalSGST = useMemo(() => {
    return filteredTaxData.reduce((sum, item) => sum + item.sgst, 0);
  }, [filteredTaxData]);

  const totalIGST = useMemo(() => {
    return filteredTaxData.reduce((sum, item) => sum + item.igst, 0);
  }, [filteredTaxData]);

  const totalTax = useMemo(() => {
    return filteredTaxData.reduce((sum, item) => sum + item.totalTax, 0);
  }, [filteredTaxData]);

  const handleExport = useCallback(() => {
    message.success("Tax report exported successfully");
  }, []);

  const renderTaxCard = (tax) => (
    <motion.div
      key={tax.id}
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
                Order #{tax.orderId}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {tax.state} | {format(new Date(tax.date), "MMM dd, yyyy")}
              </div>
            </div>
            <Tag color="blue" className="text-xs shrink-0">
              {tax.gstRate}%
            </Tag>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Order Amount</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                ₹{formatPrice(tax.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">CGST (9%)</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                ₹{formatPrice(tax.cgst)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">SGST (9%)</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                ₹{formatPrice(tax.sgst)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">IGST (18%)</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                ₹{formatPrice(tax.igst)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Tax</span>
              <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                ₹{formatPrice(tax.totalTax)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const columns = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      width: 120,
      render: (id) => <span className="font-mono">#{id}</span>,
    },
    {
      title: "Order Amount",
      dataIndex: "amount",
      key: "amount",
      width: 130,
      render: (amount) => <span className="font-semibold">₹{formatPrice(amount)}</span>,
    },
    {
      title: "GST Rate",
      dataIndex: "gstRate",
      key: "gstRate",
      width: 100,
      render: (rate) => <Tag color="blue">{rate}%</Tag>,
    },
    {
      title: "CGST (9%)",
      dataIndex: "cgst",
      key: "cgst",
      width: 120,
      render: (amount) => <span>₹{formatPrice(amount)}</span>,
    },
    {
      title: "SGST (9%)",
      dataIndex: "sgst",
      key: "sgst",
      width: 120,
      render: (amount) => <span>₹{formatPrice(amount)}</span>,
    },
    {
      title: "IGST (18%)",
      dataIndex: "igst",
      key: "igst",
      width: 120,
      render: (amount) => <span>₹{formatPrice(amount)}</span>,
    },
    {
      title: "Total Tax",
      dataIndex: "totalTax",
      key: "totalTax",
      width: 120,
      render: (amount) => (
        <span className="font-semibold text-purple-600">₹{formatPrice(amount)}</span>
      ),
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      width: 150,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) => format(new Date(date), "MMM dd, yyyy"),
    },
  ];

  const uniqueStates = useMemo(() => {
    const states = new Set(taxData.map((t) => t.state));
    return Array.from(states);
  }, [taxData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      {/* Statistics Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 w-full">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full min-w-0">
          <Statistic
            title="Total CGST"
            value={totalCGST}
            prefix={<IconCalculator className="w-4 h-4" />}
            formatter={(value) => `₹${formatPrice(value)}`}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full min-w-0">
          <Statistic
            title="Total SGST"
            value={totalSGST}
            prefix={<IconCalculator className="w-4 h-4" />}
            formatter={(value) => `₹${formatPrice(value)}`}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full min-w-0">
          <Statistic
            title="Total IGST"
            value={totalIGST}
            prefix={<IconCalculator className="w-4 h-4" />}
            formatter={(value) => `₹${formatPrice(value)}`}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full min-w-0">
          <Statistic
            title="Total Tax Collected"
            value={totalTax}
            prefix={<IconCalculator className="w-4 h-4" />}
            formatter={(value) => `₹${formatPrice(value)}`}
            valueStyle={{ color: "#722ed1" }}
          />
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-white dark:bg-gray-800 p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-3 sm:mb-4">
        <Select
          placeholder="All States"
          value={stateFilter}
          onChange={(value) => {
            setStateFilter(value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto sm:min-w-[150px]"
          size="large"
        >
          <Option value="all">All States</Option>
          {uniqueStates.map((state) => (
            <Option key={state} value={state}>
              {state}
            </Option>
          ))}
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
        <Button
          type="primary"
          icon={<IconDownload className="w-4 h-4" />}
          size="large"
          onClick={handleExport}
          className="w-full sm:w-auto"
        >
          Export Tax Report
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table
            dataSource={paginatedTaxData.map((t) => ({ ...t, key: t.id }))}
            columns={columns}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredTaxData.length,
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
            scroll={{ x: 1200 }}
          />
        </div>
      </div>

      {/* Mobile/Tablet Grid View - xs: 1 col, sm: 2 cols, md: 2 cols */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 w-full">
          <AnimatePresence mode="popLayout">
            {paginatedTaxData.length > 0 ? (
              paginatedTaxData.map((tax) => renderTaxCard(tax))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                No tax records found matching your filters
              </div>
            )}
          </AnimatePresence>
        </div>

        {filteredTaxData.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredTaxData.length)} of {filteredTaxData.length} transactions
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredTaxData.length}
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

export default TaxManagement;
