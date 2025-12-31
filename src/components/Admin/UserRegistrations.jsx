"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "antd";
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
import { format, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

const UserRegistrations = ({ reportType = "daily", dateRange }) => {
  const [chartData, setChartData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    
    // Estimate users based on orders (in real app, this would come from user database)
    const estimatedUsers = Math.floor(orders.length * 1.5);
    setTotalUsers(estimatedUsers);

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

        // Estimate 1.5 users per order
        const users = Math.floor(dayOrders.length * 1.5);

        return {
          date: format(day, "MMM dd"),
          users: users,
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

        const users = Math.floor(monthOrders.length * 1.5);

        return {
          date: format(month, "MMM yyyy"),
          users: users,
        };
      });
    }

    setChartData(data);
  }, [reportType, dateRange]);

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
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              className="dark:text-gray-400"
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 10 }}
              className="dark:text-gray-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
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
        <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          New user registrations over time
        </div>
      </Card>
    </motion.div>
  );
};

export default UserRegistrations;
