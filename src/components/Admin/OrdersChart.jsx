"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, Spin, Empty } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { IconShoppingCart } from "@tabler/icons-react";
import axios from "axios";

function readAuthToken() {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  const token = String(raw).trim();
  if (!token || token === "undefined" || token === "null") return null;
  return token;
}

function toISO(d) {
  if (!d) return undefined;
  if (typeof d === "string") return d;
  if (d.toDate) return d.toDate().toISOString();
  if (d.toISOString) return d.toISOString();
  return undefined;
}

const OrdersChart = ({ reportType = "daily", dateRange, refreshNonce }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [byStatus, setByStatus] = useState([]);
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [summary, setSummary] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = readAuthToken();
      if (!token) {
        throw new Error("Please login as admin to view orders chart.");
      }
      const startDate = dateRange?.[0] ? toISO(dateRange[0]) : undefined;
      const endDate = dateRange?.[1] ? toISO(dateRange[1]) : undefined;

      // Backend periods are "today"|"week"|"month"|"year"|"all".
      const period =
        reportType === "daily" ? "month" : reportType === "monthly" ? "year" : "month";

      const { data } = await axios.get("/api/admin/dashboard/orders", {
        params: { period, startDate, endDate },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load order statistics");
      }

      setSummary(data.data?.summary || null);
      setByStatus(data.data?.byStatus || []);
      setDailyBreakdown(data.data?.dailyBreakdown || []);
    } catch (e) {
      if (e?.response?.status === 401) {
        setError(new Error("Session expired. Please login again."));
        setSummary(null);
        setByStatus([]);
        setDailyBreakdown([]);
        return;
      }
      setError(e);
      setSummary(null);
      setByStatus([]);
      setDailyBreakdown([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, reportType]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer = null;

    const run = () => {
      if (cancelled) return;
      const token = readAuthToken();
      if (!token) {
        attempts += 1;
        if (attempts <= 10) {
          timer = setTimeout(run, 250);
          return;
        }
        setError(new Error("Please login as admin to view orders chart."));
        setLoading(false);
        return;
      }

      fetchOrders();
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchOrders, refreshNonce]);

  const barChartData = useMemo(
    () =>
      (byStatus || []).map((s) => ({
        status: s.status,
        count: s.count,
      })),
    [byStatus],
  );

  const lineChartData = useMemo(
    () =>
      (dailyBreakdown || []).map((d) => ({
        date: d.date,
        count: d.count,
      })),
    [dailyBreakdown],
  );

  const totalOrders = summary?.totalOrders ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card
        title={
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Orders Count</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-bold text-purple-600 dark:text-purple-400">{totalOrders}</span>
            </div>
          </div>
        }
        className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        {loading ? (
          <div className="h-[250px] flex items-center justify-center">
            <Spin />
          </div>
        ) : error ? (
          <div className="p-4 text-gray-600 dark:text-gray-300">
            Failed to load order statistics.
          </div>
        ) : byStatus.length === 0 && dailyBreakdown.length === 0 ? (
          <Empty description="No order statistics available" />
        ) : (
          <div className="p-1">
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="status"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    className="dark:text-gray-400"
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    className="dark:text-gray-400"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 h-[120px] border-t border-gray-200 dark:border-gray-700 pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-700"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    className="dark:text-gray-400"
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    className="dark:text-gray-400"
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default OrdersChart;
