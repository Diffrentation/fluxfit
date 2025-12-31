"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, Table, Tag, Avatar } from "antd";
import { IconPackage, IconTrendingUp } from "@tabler/icons-react";
import Image from "next/image";
import { formatPrice } from "@/lib/formatPrice";

const TopProducts = () => {
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");

    // Calculate product sales
    const productSales = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = `${item.id}-${item.size}-${item.color}`;
        if (!productSales[key]) {
          productSales[key] = {
            id: item.id,
            name: item.name,
            image: item.image,
            size: item.size,
            color: item.color,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += parseFloat(item.price) * item.quantity;
      });
    });

    // Convert to array and sort by quantity
    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    setTopProducts(sortedProducts);
  }, []);

  const columns = [
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
            <Image
              src={record.image || ""}
              alt={record.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{record.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {record.size && record.size !== "One Size" && `Size: ${record.size} • `}
              {record.color && `Color: ${record.color}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Quantity Sold",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (quantity) => (
        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{quantity} units</span>
      ),
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      width: 120,
      render: (revenue) => (
        <span className="font-semibold text-sm sm:text-base text-green-600 dark:text-green-400">
          ₹{formatPrice(revenue)}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: () => (
        <Tag color="green" className="font-semibold">
          Active
        </Tag>
      ),
    },
  ];

  const dataSource = topProducts.map((product, index) => ({
    key: `${product.id}-${product.size}-${product.color}`,
    rank: index + 1,
    ...product,
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
        {topProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            No sales data available
          </div>
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
