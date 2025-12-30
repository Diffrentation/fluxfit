"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "antd";
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
import { format, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

const RevenueChart = ({ reportType = "daily", dateRange }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    
    let data = [];
    
    if (reportType === "daily") {
      // Generate last 30 days
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

        const revenue = dayOrders.reduce((sum, order) => {
          return sum + parseFloat(order.orderSummary?.grandTotal || 0);
        }, 0);

        return {
          date: format(day, "MMM dd"),
          revenue: revenue,
          orders: dayOrders.length,
        };
      });
    } else {
      // Generate last 12 months
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

        const revenue = monthOrders.reduce((sum, order) => {
          return sum + parseFloat(order.orderSummary?.grandTotal || 0);
        }, 0);

        return {
          date: format(month, "MMM yyyy"),
          revenue: revenue,
          orders: monthOrders.length,
        };
      });
    }

    setChartData(data);
  }, [reportType, dateRange]);

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenue = totalRevenue / (chartData.length || 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconTrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Revenue Trend</span>
            </div>
            <div className="text-sm text-gray-600">
              Total: <span className="font-bold text-green-600">₹{formatPrice(totalRevenue)}</span>
            </div>
          </div>
        }
        className="h-full"
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: "#6b7280" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "#6b7280" }}
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
        <div className="mt-4 flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-600">Average Daily Revenue:</span>
            <span className="ml-2 font-semibold text-gray-900">
              ₹{formatPrice(avgRevenue)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Revenue</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default RevenueChart;
