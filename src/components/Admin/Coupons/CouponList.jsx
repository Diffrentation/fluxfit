"use client";
import React from "react";
import { motion } from "framer-motion";
import { Table, Tag, Button, Dropdown, Progress } from "antd";
import { IconEdit, IconTrash, IconDots, IconCopy } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const CouponList = ({ coupons, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    const colors = {
      active: "green",
      expired: "red",
      inactive: "gray",
    };
    return colors[status] || "default";
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const columns = [
    {
      title: "Coupon Code",
      dataIndex: "code",
      key: "code",
      width: 150,
      render: (code) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-blue-600">{code}</span>
          <Button
            type="text"
            size="small"
            icon={<IconCopy className="w-3 h-3" />}
            onClick={() => {
              copyToClipboard(code);
            }}
          />
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type, record) => (
        <div>
          <Tag color={type === "percentage" ? "blue" : "green"}>
            {type === "percentage" ? `${record.value}%` : `₹${record.value}`}
          </Tag>
        </div>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      width: 200,
      render: (_, record) => (
        <div className="text-sm">
          {record.type === "percentage" ? (
            <>
              <span>{record.value}% off</span>
              {record.maxDiscount && (
                <span className="text-gray-500"> (max ₹{formatPrice(record.maxDiscount)})</span>
              )}
            </>
          ) : (
            <span>₹{formatPrice(record.value)} off</span>
          )}
          <div className="text-xs text-gray-500 mt-1">
            Min purchase: ₹{formatPrice(record.minPurchase)}
          </div>
        </div>
      ),
    },
    {
      title: "Usage",
      key: "usage",
      width: 150,
      render: (_, record) => (
        <div>
          <div className="text-sm font-medium">
            {record.usedCount} / {record.usageLimit}
          </div>
          <Progress
            percent={Math.round((record.usedCount / record.usageLimit) * 100)}
            size="small"
            status={record.usedCount >= record.usageLimit ? "exception" : "active"}
          />
        </div>
      ),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      key: "expiryDate",
      width: 120,
      render: (date) => (
        <span className="text-gray-600">{format(new Date(date), "MMM dd, yyyy")}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                label: "Edit Coupon",
                icon: <IconEdit className="w-4 h-4" />,
                onClick: () => onEdit(record),
              },
              {
                type: "divider",
              },
              {
                key: "delete",
                label: "Delete",
                icon: <IconTrash className="w-4 h-4" />,
                danger: true,
                onClick: () => onDelete(record.id),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            icon={<IconDots className="w-4 h-4" />}
            className="flex items-center justify-center"
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      <Table
        dataSource={coupons.map((c) => ({ ...c, key: c.id }))}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} coupons`,
        }}
        scroll={{ x: 1000 }}
      />
    </motion.div>
  );
};

export default CouponList;

