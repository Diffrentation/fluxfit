"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Table, Spin, Empty } from "antd";
import { IconPackage } from "@tabler/icons-react";
import Image from "next/image";
import { formatPrice } from "@/lib/formatPrice";
import axios from "axios";

function readAuthToken() {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  const token = String(raw).trim();
  if (!token || token === "undefined" || token === "null") return null;
  return token;
}

const TopProducts = ({ reportType = "daily", dateRange, refreshNonce }) => {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTopProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = readAuthToken();
      if (!token) {
        throw new Error("Please login as admin to view top products.");
      }

      const startDate = dateRange?.[0]
        ? dateRange[0].toDate?.().toISOString?.() || dateRange[0].toISOString?.()
        : undefined;
      const endDate = dateRange?.[1]
        ? dateRange[1].toDate?.().toISOString?.() || dateRange[1].toISOString?.()
        : undefined;

      const period = reportType === "daily" ? "month" : "year";
      const { data } = await axios.get("/api/admin/dashboard/top-products", {
        params: { period, limit: 10, sort: "revenue", startDate, endDate },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load top products");
      }

      setTopProducts(data.data?.products || []);
    } catch (e) {
      if (e?.response?.status === 401) {
        setError(new Error("Session expired. Please login again."));
        setTopProducts([]);
        return;
      }
      setError(e);
      setTopProducts([]);
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
        setError(new Error("Please login as admin to view top products."));
        setLoading(false);
        setTopProducts([]);
        return;
      }

      fetchTopProducts();
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchTopProducts, refreshNonce]);

  const columns = useMemo(
    () => [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      width: 60,
      render: (rank) => (
        <span className="font-bold text-base sm:text-lg text-gray-700 dark:text-gray-300">#{rank}</span>
      ),
    },
    {
      title: "Product",
      key: "product",
      render: (_, record) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
            {record.product?.image ? (
              <Image
                src={record.product.image}
                alt={record.product?.name || "Product"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
              {record.product?.name || "Unnamed product"}
            </div>
            {record.product?.category?.name ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {record.product.category.name}
              </div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: "Quantity Sold",
      dataIndex: ["sales", "quantity"],
      key: "quantity",
      width: 120,
      render: (quantity) => (
        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{quantity} units</span>
      ),
    },
    {
      title: "Revenue",
      dataIndex: ["sales", "revenue"],
      key: "revenue",
      width: 120,
      render: (revenue) => (
        <span className="font-semibold text-sm sm:text-base text-green-600 dark:text-green-400">
          ₹{formatPrice(revenue)}
        </span>
      ),
    },
  ],
    [],
  );

  const dataSource = topProducts.map((row) => ({
    key: row.product?.id || String(row.rank),
    rank: row.rank,
    product: row.product,
    sales: row.sales,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card
        title={
          <div className="flex items-center gap-2">
            <IconPackage className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Top Selling Products</span>
          </div>
        }
        className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        {loading ? (
          <div className="h-[260px] flex items-center justify-center">
            <Spin />
          </div>
        ) : error ? (
          <div className="p-4 text-gray-600 dark:text-gray-300">
            Failed to load top products.
          </div>
        ) : topProducts.length === 0 ? (
          <Empty description="No top products data available" />
        ) : (
          <div className="overflow-x-auto -mx-2 sm:-mx-4 px-2 sm:px-4">
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              size="small"
              className="mt-3 sm:mt-4"
              scroll={{ x: 600 }}
            />
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default TopProducts;
