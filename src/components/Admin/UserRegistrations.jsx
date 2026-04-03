"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, Spin, Empty } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { IconUsers } from "@tabler/icons-react";
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

const UserRegistrations = ({ reportType = "daily", dateRange, refreshNonce }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = readAuthToken();
      if (!token) {
        throw new Error("Please login as admin to view registrations chart.");
      }
      const startDate = dateRange?.[0] ? toISO(dateRange[0]) : undefined;
      const endDate = dateRange?.[1] ? toISO(dateRange[1]) : undefined;

      const { data } = await axios.get("/api/admin/dashboard/user-registrations", {
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
        throw new Error(data?.message || "Failed to load user registrations");
      }

      const trends = data.data?.trends || [];
      const summary = data.data?.summary || {};

      setTotalUsers(summary.newUsers ?? 0);
      setChartData(
        trends.map((t) => ({
          date: t.date,
          users: t.count,
        })),
      );
    } catch (e) {
      if (e?.response?.status === 401) {
        setError(new Error("Session expired. Please login again."));
        setTotalUsers(0);
        setChartData([]);
        return;
      }
      setError(e);
      setTotalUsers(0);
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
        setError(new Error("Please login as admin to view registrations chart."));
        setLoading(false);
        setChartData([]);
        setTotalUsers(0);
        return;
      }

      fetchRegistrations();
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchRegistrations, refreshNonce]);

  const empty = useMemo(() => !loading && chartData.length === 0, [loading, chartData.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card
        title={
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconUsers className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">User Registrations</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-bold text-orange-600 dark:text-orange-400">{totalUsers}</span>
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
            Failed to load user registration trends.
          </div>
        ) : empty ? (
          <Empty description="No registration data available" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
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
                dataKey="users"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: "#f97316", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          New user registrations over time
        </div>
      </Card>
    </motion.div>
  );
};

export default UserRegistrations;
