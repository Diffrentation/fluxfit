"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Tag, Button, Select, DatePicker, Statistic, Row, Col, Pagination, message } from "antd";
import { IconDownload, IconCalculator } from "@tabler/icons-react";
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

const { RangePicker } = DatePicker;
const { Option } = Select;

const TaxManagement = ({ taxData = [], onUpdateTaxData }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(id);
  }, []);
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
        className="h-full border border-zinc-800 hover:shadow-md transition-shadow !bg-zinc-950 w-full min-w-0"
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
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
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

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Order ID",
        field: "orderId",
        width: 120,
        cellRenderer: (p) => <span className="font-mono">#{p.value}</span>,
      },
      {
        headerName: "Order Amount",
        field: "amount",
        width: 130,
        cellRenderer: (p) => <span className="font-semibold">₹{formatPrice(p.value)}</span>,
      },
      {
        headerName: "GST Rate",
        field: "gstRate",
        width: 100,
        cellRenderer: (p) => <Tag color="blue">{p.value}%</Tag>,
      },
      {
        headerName: "CGST (9%)",
        field: "cgst",
        width: 120,
        cellRenderer: (p) => <span>₹{formatPrice(p.value)}</span>,
      },
      {
        headerName: "SGST (9%)",
        field: "sgst",
        width: 120,
        cellRenderer: (p) => <span>₹{formatPrice(p.value)}</span>,
      },
      {
        headerName: "IGST (18%)",
        field: "igst",
        width: 120,
        cellRenderer: (p) => <span>₹{formatPrice(p.value)}</span>,
      },
      {
        headerName: "Total Tax",
        field: "totalTax",
        width: 120,
        cellRenderer: (p) => (
          <span className="font-semibold text-purple-600">₹{formatPrice(p.value)}</span>
        ),
      },
      {
        headerName: "State",
        field: "state",
        width: 150,
      },
      {
        headerName: "Date",
        field: "date",
        width: 120,
        cellRenderer: (p) => format(new Date(p.value), "MMM dd, yyyy"),
      },
    ],
    []
  );

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
        <Card className="!bg-zinc-950 border-zinc-800 w-full min-w-0">
          <Statistic
            title="Total CGST"
            value={totalCGST}
            prefix={<IconCalculator className="w-4 h-4" />}
            formatter={(value) => `₹${formatPrice(value)}`}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
        <Card className="!bg-zinc-950 border-zinc-800 w-full min-w-0">
          <Statistic
            title="Total SGST"
            value={totalSGST}
            prefix={<IconCalculator className="w-4 h-4" />}
            formatter={(value) => `₹${formatPrice(value)}`}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
        <Card className="!bg-zinc-950 border-zinc-800 w-full min-w-0">
          <Statistic
            title="Total IGST"
            value={totalIGST}
            prefix={<IconCalculator className="w-4 h-4" />}
            formatter={(value) => `₹${formatPrice(value)}`}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Card>
        <Card className="!bg-zinc-950 border-zinc-800 w-full min-w-0">
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
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 !bg-zinc-950 p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-zinc-800 mb-3 sm:mb-4">
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
        <div className="!bg-zinc-950 rounded-lg shadow-sm border border-zinc-800 overflow-hidden p-2">
          {isClient ? (
            <div style={{ width: "100%", height: 560 }}>
              <AgGridReact
                theme={myDarkTheme}
                modules={[AllCommunityModule]}
                rowData={paginatedTaxData}
                columnDefs={columnDefs}
                defaultColDef={{ sortable: true, resizable: true }}
                getRowId={(p) => String(p.data.id)}
                animateRows
                rowHeight={56}
                headerHeight={44}
                suppressCellFocus
                overlayNoRowsTemplate="No tax records found"
              />
            </div>
          ) : (
            <div className="h-[560px]" />
          )}
        </div>
        {filteredTaxData.length > 0 && (
          <div className="flex justify-end pt-3">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredTaxData.length}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-zinc-800">
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
