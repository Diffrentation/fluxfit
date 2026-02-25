"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, Statistic, Progress } from "antd";
import { IconShoppingCart, IconX } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";

const AbandonedCartStats = () => {
  const [stats, setStats] = useState({
    totalCarts: 0,
    abandonedCarts: 0,
    recoveredCarts: 0,
    totalValue: 0,
    abandonedValue: 0,
    recoveryRate: 0,
  });

  useEffect(() => {
    // Get current cart items (abandoned carts)
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");

    // Calculate abandoned cart value
    const abandonedValue = currentCart.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);

    // Mock data for total carts (in real app, this would track all cart sessions)
    const totalCarts = orders.length + currentCart.length;
    const abandonedCarts = currentCart.length > 0 ? 1 : 0;
    const recoveredCarts = orders.length;

    // Calculate recovery rate
    const recoveryRate = totalCarts > 0 
      ? ((recoveredCarts / totalCarts) * 100).toFixed(1)
      : 0;

    setStats({
      totalCarts,
      abandonedCarts,
      recoveredCarts,
      totalValue: abandonedValue + orders.reduce((sum, order) => 
        sum + parseFloat(order.orderSummary?.grandTotal || 0), 0
      ),
      abandonedValue,
      recoveryRate: parseFloat(recoveryRate),
    });
  }, []);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div>
            <Statistic
              title="Total Cart Sessions"
              value={stats.totalCarts}
              prefix={<IconShoppingCart className="w-5 h-5 text-blue-500" />}
              formatter={(value) => <span className="text-blue-500 text-2xl font-bold">{value}</span>}
            />
          </div>
          <div>
            <Statistic
              title="Abandoned Carts"
              value={stats.abandonedCarts}
              prefix={<IconX className="w-5 h-5 text-red-500" />}
              formatter={(value) => <span className="text-red-500 text-2xl font-bold">{value}</span>}
            />
          </div>
          <div>
            <Statistic
              title="Abandoned Cart Value"
              value={stats.abandonedValue}
              prefix="₹"
              formatter={(value) => <span className="text-orange-500 text-2xl font-bold">{formatPrice(value)}</span>}
            />
          </div>
          <div>
            <Statistic
              title="Recovery Rate"
              value={stats.recoveryRate}
              suffix="%"
              formatter={(value) => <span className="text-emerald-500 text-2xl font-bold">{value}</span>}
            />
            <Progress
              percent={stats.recoveryRate}
              strokeColor="#10b981"
              showInfo={false}
              className="mt-2"
            />
          </div>
        </div>
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Send reminder emails to customers with abandoned carts to recover potential sales.
            Current recovery rate is {stats.recoveryRate}%.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default AbandonedCartStats;
