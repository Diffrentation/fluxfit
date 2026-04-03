"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, Statistic, Spin, Empty } from "antd";
import { IconShoppingCart, IconX } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import axios from "axios";

function readAuthToken() {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  const token = String(raw).trim();
  if (!token || token === "undefined" || token === "null") return null;
  return token;
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const AbandonedCartStats = ({ refreshNonce }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [byDays, setByDays] = useState([]);

  const fetchAbandoned = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = readAuthToken();
      if (!token) {
        throw new Error("Please login as admin to view abandoned cart stats.");
      }
      const { data } = await axios.get("/api/admin/dashboard/abandoned-carts", {
        params: { page: 1, limit: 20, days: 7, sort: "newest" },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load abandoned carts");
      }

      const s = data.data?.statistics || {};
      setStats({
        totalAbandonedCarts: toNumber(s.totalAbandonedCarts),
        totalAbandonedValue: toNumber(s.totalAbandonedValue),
        averageAbandonedValue: toNumber(s.averageAbandonedValue),
      });
      setByDays((s.byDays || []).map((r) => ({ range: r.range, count: r.count, totalValue: r.totalValue })));
    } catch (e) {
      if (e?.response?.status === 401) {
        setError(new Error("Session expired. Please login again."));
        setStats(null);
        setByDays([]);
        return;
      }
      setError(e);
      setStats(null);
      setByDays([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
        setError(new Error("Please login as admin to view abandoned cart stats."));
        setLoading(false);
        setStats(null);
        setByDays([]);
        return;
      }
      fetchAbandoned();
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchAbandoned, refreshNonce]);

  const empty = useMemo(() => !loading && !error && (!stats || stats.totalAbandonedCarts === 0), [loading, error, stats]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card
        title={
          <div className="flex items-center gap-2">
            <IconShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
            <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Abandoned Cart Statistics</span>
          </div>
        }
        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        {loading ? (
          <div className="h-[240px] flex items-center justify-center">
            <Spin />
          </div>
        ) : error ? (
          <div className="p-4 text-gray-600 dark:text-gray-300">
            Failed to load abandoned cart stats.
          </div>
        ) : empty ? (
          <div className="p-4">
            <Empty description="No abandoned cart activity found" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              <div>
                <Statistic
                  title="Abandoned Carts"
                  value={stats.totalAbandonedCarts}
                  prefix={<IconX className="w-5 h-5 text-red-500" />}
                  formatter={(value) => <span className="text-red-500 text-2xl font-bold">{value}</span>}
                />
              </div>
              <div>
                <Statistic
                  title="Total Abandoned Value"
                  value={stats.totalAbandonedValue}
                  prefix="₹"
                  formatter={(value) => <span className="text-orange-500 text-2xl font-bold">{formatPrice(value)}</span>}
                />
              </div>
              <div>
                <Statistic
                  title="Average Abandoned Cart Value"
                  value={stats.averageAbandonedValue}
                  prefix="₹"
                  formatter={(value) => <span className="text-emerald-500 text-2xl font-bold">{formatPrice(value)}</span>}
                />
              </div>
              <div>
                <Statistic
                  title="Activity Ranges"
                  value={byDays?.length || 0}
                  formatter={(value) => <span className="text-blue-500 text-2xl font-bold">{value}</span>}
                />
              </div>
            </div>
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> Send cart recovery emails based on the most abandoned value ranges.
              </p>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {byDays.slice(0, 4).map((r) => (
                  <div key={r.range} className="bg-white/60 dark:bg-black/20 rounded p-2 border border-blue-200 dark:border-blue-800">
                    <div className="text-[11px] sm:text-xs text-blue-900 dark:text-blue-200">{r.range}</div>
                    <div className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-100">
                      {r.count} carts
                    </div>
                    <div className="text-[11px] sm:text-xs text-blue-700 dark:text-blue-200">
                      ₹{formatPrice(r.totalValue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
};

export default AbandonedCartStats;
