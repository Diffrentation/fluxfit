"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { IconShoppingCart } from "@tabler/icons-react";
import { format, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

const OrdersChart = ({ reportType = "daily", dateRange }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    
    let data = [];
    
    if (reportType === "daily") {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });

      data = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayOrders = orders.filter((order) => {
          const orderDate = format(new Date(order.orderDate), "yyyy-MM-dd");
          return orderDate === dayStr;
        });

        const confirmed = dayOrders.filter((o) => o.status === "confirmed").length;
        const delivered = dayOrders.filter((o) => o.status === "delivered").length;
        const cancelled = dayOrders.filter((o) => o.status === "cancelled").length;

        return {
          date: format(day, "MMM dd"),
          Confirmed: confirmed,
          Delivered: delivered,
          Cancelled: cancelled,
        };
      });
    } else {
      const months = eachMonthOfInterval({
        start: subMonths(new Date(), 11),
        end: new Date(),
      });

      data = months.map((month) => {
        const monthStr = format(month, "yyyy-MM");
        const monthOrders = orders.filter((order) => {
          const orderDate = format(new Date(order.orderDate), "yyyy-MM");
          return orderDate === monthStr;
        });

        const confirmed = monthOrders.filter((o) => o.status === "confirmed").length;
        const delivered = monthOrders.filter((o) => o.status === "delivered").length;
        const cancelled = monthOrders.filter((o) => o.status === "cancelled").length;

        return {
          date: format(month, "MMM yyyy"),
          Confirmed: confirmed,
          Delivered: delivered,
          Cancelled: cancelled,
        };
      });
    }

    setChartData(data);
  }, [reportType, dateRange]);

  const totalOrders = chartData.reduce(
    (sum, item) => sum + item.Confirmed + item.Delivered + item.Cancelled,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconShoppingCart className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">Orders Count</span>
            </div>
            <div className="text-sm text-gray-600">
              Total: <span className="font-bold text-purple-600">{totalOrders}</span>
            </div>
          </div>
        }
        className="h-full"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "#6b7280" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "#6b7280" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="Confirmed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Delivered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Cancelled</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default OrdersChart;
