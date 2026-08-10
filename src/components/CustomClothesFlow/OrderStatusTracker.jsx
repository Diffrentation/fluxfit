"use client";

import { motion } from "framer-motion";
import {
  IconCircleCheck,
  IconClock,
  IconLoader2,
  IconTool,
  IconX,
  IconPackageExport,
} from "@tabler/icons-react";
import { format } from "date-fns";

const STEPS = [
  {
    key: "pending_review",
    label: "Design Submitted",
    icon: IconClock,
    color: "blue",
  },
  {
    key: "approved",
    label: "Approved",
    icon: IconCircleCheck,
    color: "green",
    rejectKey: "rejected",
  },
  {
    key: "in_production",
    label: "In Production",
    icon: IconTool,
    color: "orange",
  },
  {
    key: "completed",
    label: "Completed",
    icon: IconPackageExport,
    color: "purple",
  },
];

const STATUS_ORDER = [
  "pending_review",
  "approved",
  "in_production",
  "completed",
];

const colorMap = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500",
    dot: "bg-blue-500",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: "text-green-600 dark:text-green-400",
    ring: "ring-green-500",
    dot: "bg-green-500",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    icon: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-500",
    dot: "bg-orange-500",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    icon: "text-purple-600 dark:text-purple-400",
    ring: "ring-purple-500",
    dot: "bg-purple-500",
  },
};

export default function OrderStatusTracker({ order }) {
  const isRejected = order.status === "rejected";
  const currentIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
            Order ID
          </p>
          <p className="font-mono text-sm text-gray-800 dark:text-gray-200 mt-0.5">
            #{order.id.slice(-8).toUpperCase()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
            Submitted
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
            {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}
          </p>
        </div>
      </div>

      {/* Rejected state */}
      {isRejected ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4"
        >
          <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full mt-0.5">
            <IconX size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              Order Rejected
            </p>
            {order.adminRemarks && (
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                {order.adminRemarks}
              </p>
            )}
          </div>
        </motion.div>
      ) : (
        /* Progress stepper */
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200 dark:bg-gray-700" />
          <div
            className="absolute left-5 top-5 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500 transition-all duration-700"
            style={{
              height: currentIdx >= 0
                ? `${(currentIdx / (STEPS.length - 1)) * 100}%`
                : "0%",
            }}
          />

          <div className="space-y-5">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const colors = colorMap[step.color];
              const isDone = currentIdx > idx;
              const isCurrent = currentIdx === idx;
              const isPending = currentIdx < idx;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="relative flex items-start gap-4 pl-0"
                >
                  {/* Step dot */}
                  <div
                    className={[
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isDone
                        ? `${colors.bg} border-transparent ring-2 ${colors.ring}`
                        : isCurrent
                        ? `${colors.bg} border-transparent ring-2 ${colors.ring} animate-pulse`
                        : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600",
                    ].join(" ")}
                  >
                    {isDone ? (
                      <IconCircleCheck size={20} className={colors.icon} />
                    ) : isCurrent ? (
                      <Icon size={18} className={colors.icon} />
                    ) : (
                      <Icon size={18} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="pt-1.5 min-w-0 flex-1">
                    <p
                      className={[
                        "font-semibold text-sm",
                        isDone || isCurrent
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-400 dark:text-gray-500",
                      ].join(" ")}
                    >
                      {step.label}
                    </p>

                    {isCurrent && step.key === "pending_review" && (
                      <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                        <IconLoader2 size={12} className="animate-spin" />
                        Waiting for admin review
                      </p>
                    )}

                    {isCurrent && step.key === "in_production" && (
                      <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">
                        Your design is being prepared
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin remarks */}
      {!isRejected && order.adminRemarks && (
        <div className="mt-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
            Admin Note
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {order.adminRemarks}
          </p>
        </div>
      )}

      {/* Price quote */}
      {order.quote?.totalAmount != null && (
        <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-1">
            Price Quote
          </p>
          <p className="text-lg font-bold text-indigo-900 dark:text-indigo-300">
            ₹{order.quote.totalAmount.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-indigo-500 dark:text-indigo-400 ml-2">
              (₹{order.quote.pricePerUnit.toLocaleString("en-IN")} × {order.quantity})
            </span>
          </p>
          {order.quote.notes && (
            <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
              {order.quote.notes}
            </p>
          )}
        </div>
      )}

      {/* Estimated delivery */}
      {order.estimatedDelivery && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5">
          <IconPackageExport size={16} />
          <span>
            Estimated delivery:{" "}
            <strong>
              {format(new Date(order.estimatedDelivery), "dd MMM yyyy")}
            </strong>
          </span>
        </div>
      )}

      {/* Details chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full font-medium">
          {order.clothType}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
          style={{
            backgroundColor: order.clothColor.hex + "22",
            color: order.clothColor.hex,
            border: `1px solid ${order.clothColor.hex}44`,
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: order.clothColor.hex }}
          />
          {order.clothColor.label}
        </span>
        <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full font-medium border border-indigo-200 dark:border-indigo-800">
          Qty: {order.quantity}
        </span>
        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full font-medium capitalize">
          {order.printPlacement.replace(/_/g, " ")}
        </span>
      </div>
    </div>
  );
}
