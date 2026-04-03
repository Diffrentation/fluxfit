"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  IconTrendingUp,
  IconShoppingCart,
  IconUsers,
  IconPackage,
  IconCurrencyRupee,
} from "@tabler/icons-react";
import { Card, Statistic, Spin } from "antd";
import axios from "axios";
import { formatPrice } from "@/lib/formatPrice";

function readAuthToken() {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  const token = String(raw).trim();
  if (!token || token === "undefined" || token === "null") return null;
  return token;
}

const DashboardStats = ({ refreshNonce, reportType }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = readAuthToken();
      if (!token) {
        throw new Error("Please login as admin to view dashboard stats.");
      }
      const { data } = await axios.get("/api/admin/dashboard/stats", {
        params: {
          period: reportType === "daily" ? "week" : "month",
          compare: "true",
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load dashboard stats");
      }

      setStats(data.data?.statistics || null);
    } catch (e) {
      if (e?.response?.status === 401) {
        setError(new Error("Session expired. Please login again."));
        setStats(null);
        return;
      }
      setError(e);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [reportType]);

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
        setError(new Error("Please login as admin to view dashboard stats."));
        setStats(null);
        setLoading(false);
        return;
      }

      fetchStats();
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchStats, refreshNonce]);

  const statCards = useMemo(() => {
    const s = stats;
    if (!s) return [];

    return [
      {
        title: "Total Sales",
        value: s.revenue?.net ?? 0,
        prefix: <IconPackage className="w-6 h-6" />,
        suffix: "net",
        growth: s.revenue?.growth ?? null,
        color: "blue",
        isCurrency: true,
      },
      {
        title: "Total Revenue",
        value: s.revenue?.total ?? 0,
        prefix: <IconCurrencyRupee className="w-6 h-6" />,
        suffix: "",
        growth: s.revenue?.growth ?? null,
        color: "green",
        isCurrency: true,
      },
      {
        title: "Total Orders",
        value: s.orders?.total ?? 0,
        prefix: <IconShoppingCart className="w-6 h-6" />,
        suffix: "orders",
        growth: s.orders?.growth ?? null,
        color: "purple",
      },
      {
        title: "User Registrations",
        value: s.users?.new ?? 0,
        prefix: <IconUsers className="w-6 h-6" />,
        suffix: "users",
        growth: s.users?.growth ?? null,
        color: "orange",
      },
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
        Failed to load dashboard stats.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Statistic
              title={<span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{stat.title}</span>}
              value={stat.isCurrency ? formatPrice(stat.value) : stat.value.toLocaleString('en-IN')}
              prefix={
                <span
                  className={
                    stat.color === "green" ? "text-green-500 dark:text-green-400" :
                    stat.color === "blue" ? "text-blue-500 dark:text-blue-400" :
                    stat.color === "purple" ? "text-purple-500 dark:text-purple-400" : "text-orange-500 dark:text-orange-400"
                  }
                >
                  {stat.prefix}
                </span>
              }
              suffix={<span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{stat.suffix}</span>}
              styles={{
                content: {
                  color:
                    stat.color === "green"
                      ? "#10b981"
                      : stat.color === "blue"
                      ? "#3b82f6"
                      : stat.color === "purple"
                      ? "#a855f7"
                      : "#f97316",
                  fontSize: "18px",
                  fontWeight: "bold",
                },
              }}
                          />
            <div className="mt-2 flex items-center gap-1 text-xs sm:text-sm">
              <IconTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                {stat.growth == null ? "+0%" : `+${stat.growth}%`}
              </span>
              <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">vs last period</span>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats;
