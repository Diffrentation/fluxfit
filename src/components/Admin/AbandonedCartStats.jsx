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
            <IconShoppingCart className="w-5 h-5 text-red-600" />
            <span className="font-semibold">Abandoned Cart Statistics</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div>
            <Statistic
              title="Total Cart Sessions"
              value={stats.totalCarts}
              prefix={<IconShoppingCart className="w-5 h-5 text-blue-500" />}
              valueStyle={{ color: "#3b82f6", fontSize: "24px", fontWeight: "bold" }}
            />
          </div>
          <div>
            <Statistic
              title="Abandoned Carts"
              value={stats.abandonedCarts}
              prefix={<IconX className="w-5 h-5 text-red-500" />}
              valueStyle={{ color: "#ef4444", fontSize: "24px", fontWeight: "bold" }}
            />
          </div>
          <div>
            <Statistic
              title="Abandoned Cart Value"
              value={formatPrice(stats.abandonedValue)}
              prefix="₹"
              valueStyle={{ color: "#f97316", fontSize: "24px", fontWeight: "bold" }}
            />
          </div>
          <div>
            <Statistic
              title="Recovery Rate"
              value={stats.recoveryRate}
              suffix="%"
              valueStyle={{ color: "#10b981", fontSize: "24px", fontWeight: "bold" }}
            />
            <Progress
              percent={stats.recoveryRate}
              strokeColor="#10b981"
              showInfo={false}
              className="mt-2"
            />
          </div>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Send reminder emails to customers with abandoned carts to recover potential sales.
            Current recovery rate is {stats.recoveryRate}%.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default AbandonedCartStats;
