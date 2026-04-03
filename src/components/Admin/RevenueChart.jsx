"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, Spin, Empty } from "antd";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { IconTrendingUp } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
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

const RevenueChart = ({ reportType = "daily", dateRange, refreshNonce }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = readAuthToken();
      if (!token) {
        throw new Error("Please login as admin to view revenue chart.");
      }
      const startDate = dateRange?.[0] ? toISO(dateRange[0]) : undefined;
      const endDate = dateRange?.[1] ? toISO(dateRange[1]) : undefined;

      const { data } = await axios.get("/api/admin/dashboard/revenue", {
        params: {
          period: reportType, // daily | monthly | yearly
          startDate,
          endDate,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load revenue");
      }

      const mapped = (data.data?.revenue || []).map((p) => ({
        date: p.date,
        revenue: p.revenue,
        orders: p.orders,
      }));

      setChartData(mapped);
    } catch (e) {
      if (e?.response?.status === 401) {
        setError(new Error("Session expired. Please login again."));
        setChartData([]);
        return;
      }
      setError(e);
      setChartData([]);
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
        setError(new Error("Please login as admin to view revenue chart."));
        setLoading(false);
        return;
      }

      fetchRevenue();
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchRevenue, refreshNonce]);

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0),
    [chartData],
  );
  const avgRevenue = useMemo(
    () => totalRevenue / (chartData.length || 1),
    [totalRevenue, chartData.length],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card
        title={
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Revenue Trend</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-bold text-green-600 dark:text-green-400">₹{formatPrice(totalRevenue)}</span>
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
            Failed to load revenue chart.
          </div>
        ) : chartData.length === 0 ? (
          <Empty description="No revenue data available" />
        ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              className="dark:text-gray-400"
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 10 }}
              className="dark:text-gray-400"
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value) => [`₹${formatPrice(value)}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Average Daily Revenue:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              ₹{formatPrice(avgRevenue)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Revenue</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default RevenueChart;
