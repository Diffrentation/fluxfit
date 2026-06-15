"use client";
import React, { useState } from "react";
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
  IconEye,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Card, Statistic, DatePicker, Button, Select, message } from "antd";
import axios from "axios";
import DashboardStats from "@/components/Admin/DashboardStats";
import RevenueChart from "@/components/Admin/RevenueChart";
import OrdersChart from "@/components/Admin/OrdersChart";
import TopProducts from "@/components/Admin/TopProducts";
import AbandonedCartStats from "@/components/Admin/AbandonedCartStats";
import UserRegistrations from "@/components/Admin/UserRegistrations";
import AdminContent from "@/components/Admin/AdminContent";
import SupportInboxAlert from "@/components/Admin/SupportInboxAlert";
import {
  exportToCSV,
  exportToExcel,
} from "@/lib/exportData";

const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState(null);
  const [reportType, setReportType] = useState("daily"); // daily or monthly
  const [loading, setLoading] = useState(false);
  const [exportDataType, setExportDataType] = useState("sales");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const router = useRouter();

  const handleUserView = () => {
    localStorage.setItem("admin_user_view_mode", "true");
    router.push("/");
  };

  const readAuthToken = () => {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const token = String(raw).trim();
    if (!token || token === "undefined" || token === "null") return null;
    return token;
  };

  const toISO = (d) => {
    if (!d) return undefined;
    if (typeof d === "string") return d;
    if (d.toDate) return d.toDate().toISOString();
    if (d.toISOString) return d.toISOString();
    return undefined;
  };

  // Load analytics data (real refetch is handled inside components).
  const loadAnalyticsData = () => {
    setLoading(true);
    setRefreshNonce((n) => n + 1);
    setTimeout(() => setLoading(false), 500);
  };

  // Components refetch automatically when `reportType` or `dateRange` changes.

  const handleExport = (formatType, dataType = "sales") => {
    const runExport = async () => {
      const token = readAuthToken();
      if (!token) {
        message.error("Please login as admin to export reports");
        return;
      }

      const startDate = dateRange?.[0] ? toISO(dateRange[0]) : undefined;
      const endDate = dateRange?.[1] ? toISO(dateRange[1]) : undefined;
      const period = reportType === "daily" ? "month" : "year";

      const loaderKey = "dashboard-export";
      message.loading({
        content: `Exporting ${dataType} data as ${formatType.toUpperCase()}...`,
        key: loaderKey,
        duration: 0,
      });

      try {
        let data = [];
        let filename = "";

        if (dataType === "sales") {
          const res = await axios.get("/api/admin/dashboard/revenue", {
            params: { period: reportType, startDate, endDate },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const points = res?.data?.data?.revenue || [];
          data = points.map((p) => ({
            Date: p.date,
            Revenue: p.revenue ?? 0,
            Discount: p.discount ?? 0,
            Net: p.net ?? 0,
            Orders: p.orders ?? 0,
            Items: p.items ?? 0,
            AverageOrderValue: p.averageOrderValue ?? 0,
          }));
          filename = "sales_report";
        } else if (dataType === "orders") {
          const res = await axios.get("/api/admin/dashboard/orders", {
            params: { period, startDate, endDate },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const byStatus = res?.data?.data?.byStatus || [];
          data = byStatus.map((s) => ({
            Status: s.status || "unknown",
            Count: s.count ?? 0,
            Revenue: s.revenue ?? 0,
            Percentage: s.percentage ?? 0,
          }));
          filename = "orders_report";
        } else if (dataType === "products") {
          const res = await axios.get("/api/admin/dashboard/top-products", {
            params: { period, limit: 50, sort: "revenue", startDate, endDate },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const products = res?.data?.data?.products || [];
          data = products.map((row) => ({
            Rank: row.rank,
            ProductId: row.product?.id || "",
            ProductName: row.product?.name || "",
            Category: row.product?.category?.name || "",
            QuantitySold: row.sales?.quantity ?? 0,
            Revenue: row.sales?.revenue ?? 0,
            Orders: row.sales?.orders ?? 0,
            AveragePrice: row.sales?.averagePrice ?? 0,
          }));
          filename = "products_report";
        }

        if (!Array.isArray(data) || data.length === 0) {
          message.warning({ content: "No data available to export", key: loaderKey });
          return;
        }

        if (formatType === "csv") {
          exportToCSV(data, filename);
        } else {
          exportToExcel(data, filename);
        }
        message.success({
          content: `Data exported successfully as ${formatType.toUpperCase()}`,
          key: loaderKey,
        });
      } catch (error) {
        if (error?.response?.status === 401) {
          message.error({ content: "Session expired. Please login again.", key: loaderKey });
          return;
        }
        message.error({
          content: error?.response?.data?.message || "Export failed. Please try again.",
          key: loaderKey,
        });
      }
    };

    runExport();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        {/* Main Content */}
        <AdminContent className="pt-16 sm:pt-20 lg:pt-16">
          <div className="p-3 sm:p-4 md:p-6 pb-6 sm:pb-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Analytics and insights for your e-commerce platform
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
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
                  <Button
                    type="default"
                    icon={<IconEye className="w-4 h-4" />}
                    onClick={handleUserView}
                    className="w-full sm:w-auto bg-white hover:bg-gray-50 border-gray-300 shadow-sm transition-all text-gray-700"
                  >
                    View as User
                  </Button>
                </div>
              </div>
            </motion.div>

            <SupportInboxAlert />

            {/* Dashboard Stats */}
            <DashboardStats refreshNonce={refreshNonce} reportType={reportType} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <RevenueChart
                reportType={reportType}
                dateRange={dateRange}
                refreshNonce={refreshNonce}
              />
              <OrdersChart
                reportType={reportType}
                dateRange={dateRange}
                refreshNonce={refreshNonce}
              />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="lg:col-span-2">
                <TopProducts
                  reportType={reportType}
                  dateRange={dateRange}
                  refreshNonce={refreshNonce}
                />
              </div>
              <div>
                <UserRegistrations
                  reportType={reportType}
                  dateRange={dateRange}
                  refreshNonce={refreshNonce}
                />
              </div>
            </div>

            {/* Abandoned Cart Stats */}
            <AbandonedCartStats refreshNonce={refreshNonce} />
          </div>
        </AdminContent>
      </div>
    </div>
  );
};

export default AdminDashboard;
