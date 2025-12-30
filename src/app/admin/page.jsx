"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IconTrendingUp,
  IconShoppingCart,
  IconUsers,
  IconPackage,
  IconChartBar,
  IconDownload,
  IconCalendar,
  IconRefresh,
} from "@tabler/icons-react";
import { Card, Statistic, DatePicker, Button, Select, message } from "antd";
import DashboardStats from "@/components/Admin/DashboardStats";
import RevenueChart from "@/components/Admin/RevenueChart";
import OrdersChart from "@/components/Admin/OrdersChart";
import TopProducts from "@/components/Admin/TopProducts";
import AbandonedCartStats from "@/components/Admin/AbandonedCartStats";
import UserRegistrations from "@/components/Admin/UserRegistrations";
import { format } from "date-fns";
import {
  exportToCSV,
  exportToExcel,
  prepareSalesData,
  prepareOrdersData,
  prepareProductsData,
} from "@/lib/exportData";

const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState(null);
  const [reportType, setReportType] = useState("daily"); // daily or monthly
  const [loading, setLoading] = useState(false);
  const [exportDataType, setExportDataType] = useState("sales");

  // Load analytics data
  const loadAnalyticsData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      message.success("Analytics data refreshed");
    }, 1000);
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, reportType]);

  const handleExport = (formatType, dataType = "sales") => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    
    let data = [];
    let filename = "";

    switch (dataType) {
      case "sales":
        data = prepareSalesData(orders);
        filename = "sales_report";
        break;
      case "orders":
        data = prepareOrdersData(orders);
        filename = "orders_report";
        break;
      case "products":
        data = prepareProductsData(orders);
        filename = "products_report";
        break;
      default:
        data = prepareSalesData(orders);
        filename = "sales_report";
    }

    if (data.length === 0) {
      message.warning("No data available to export");
      return;
    }

    message.loading(`Exporting ${dataType} data as ${formatType.toUpperCase()}...`, 1);
    
    setTimeout(() => {
      if (formatType === "csv") {
        exportToCSV(data, filename);
      } else {
        exportToExcel(data, filename);
      }
      message.success(`Data exported successfully as ${formatType.toUpperCase()}`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Analytics and insights for your e-commerce platform
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select
                value={reportType}
                onChange={setReportType}
                style={{ width: 120 }}
                className="w-full sm:w-auto"
              >
                <Option value="daily">Daily</Option>
                <Option value="monthly">Monthly</Option>
              </Select>
              <RangePicker
                onChange={setDateRange}
                format="DD/MM/YYYY"
                placeholder={["Start Date", "End Date"]}
                className="w-full sm:w-auto"
              />
              <Button
                icon={<IconRefresh className="w-4 h-4" />}
                onClick={loadAnalyticsData}
                loading={loading}
                className="w-full sm:w-auto"
              >
                Refresh
              </Button>
              <Select
                value={exportDataType}
                onChange={setExportDataType}
                style={{ width: 140 }}
                className="w-full sm:w-auto"
              >
                <Option value="sales">Sales Data</Option>
                <Option value="orders">Orders Data</Option>
                <Option value="products">Products Data</Option>
              </Select>
              <Button
                type="primary"
                icon={<IconDownload className="w-4 h-4" />}
                onClick={() => handleExport("csv", exportDataType)}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">Export </span>CSV
              </Button>
              <Button
                type="primary"
                icon={<IconDownload className="w-4 h-4" />}
                onClick={() => handleExport("excel", exportDataType)}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">Export </span>Excel
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RevenueChart reportType={reportType} dateRange={dateRange} />
          <OrdersChart reportType={reportType} dateRange={dateRange} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <TopProducts />
          </div>
          <div>
            <UserRegistrations reportType={reportType} dateRange={dateRange} />
          </div>
        </div>

        {/* Abandoned Cart Stats */}
        <AbandonedCartStats />
      </div>
    </div>
  );
};

export default AdminDashboard;

