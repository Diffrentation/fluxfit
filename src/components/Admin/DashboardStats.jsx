"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IconTrendingUp,
  IconShoppingCart,
  IconUsers,
  IconPackage,
  IconCurrencyRupee,
} from "@tabler/icons-react";
import { Card, Statistic } from "antd";
import { formatPrice } from "@/lib/formatPrice";

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    growth: {
      sales: 0,
      revenue: 0,
      orders: 0,
      users: 0,
    },
  });

  useEffect(() => {
    // Load stats from localStorage (orders)
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const carts = JSON.parse(localStorage.getItem("cart") || "[]");
    
    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + parseFloat(order.orderSummary?.grandTotal || 0);
    }, 0);

    // Calculate total orders
    const totalOrders = orders.length;

    // Calculate total sales (items sold)
    const totalSales = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    // Mock user count (in real app, this would come from API)
    const totalUsers = Math.floor(totalOrders * 1.5); // Estimate

    // Calculate growth (mock data - in real app, compare with previous period)
    const growth = {
      sales: 12.5,
      revenue: 18.3,
      orders: 8.7,
      users: 15.2,
    };

    setStats({
      totalSales,
      totalRevenue,
      totalOrders,
      totalUsers,
      growth,
    });
  }, []);

  const statCards = [
    {
      title: "Total Sales",
      value: stats.totalSales,
      prefix: <IconPackage className="w-6 h-6" />,
      suffix: "items",
      growth: stats.growth.sales,
      color: "blue",
    },
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      prefix: <IconCurrencyRupee className="w-6 h-6" />,
      suffix: "",
      growth: stats.growth.revenue,
      color: "green",
      isCurrency: true,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      prefix: <IconShoppingCart className="w-6 h-6" />,
      suffix: "orders",
      growth: stats.growth.orders,
      color: "purple",
    },
    {
      title: "User Registrations",
      value: stats.totalUsers,
      prefix: <IconUsers className="w-6 h-6" />,
      suffix: "users",
      growth: stats.growth.users,
      color: "orange",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow h-full">
            <Statistic
              title={stat.title}
              value={stat.isCurrency ? formatPrice(stat.value) : stat.value.toLocaleString('en-IN')}
              prefix={
                <span
                  className={
                    stat.color === "green" ? "text-green-500" :
                    stat.color === "blue" ? "text-blue-500" :
                    stat.color === "purple" ? "text-purple-500" : "text-orange-500"
                  }
                >
                  {stat.prefix}
                </span>
              }
              suffix={stat.suffix}
              valueStyle={{
                color: stat.color === "green" ? "#10b981" : 
                       stat.color === "blue" ? "#3b82f6" :
                       stat.color === "purple" ? "#a855f7" : "#f97316",
                fontSize: "20px",
                fontWeight: "bold",
              }}
            />
            <div className="mt-2 flex items-center gap-1 text-xs sm:text-sm">
              <IconTrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">
                +{stat.growth}%
              </span>
              <span className="text-gray-500 hidden sm:inline">vs last period</span>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats;
