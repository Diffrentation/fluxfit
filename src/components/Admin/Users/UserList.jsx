"use client";
import React from "react";
import { motion } from "framer-motion";
import { Table, Tag, Avatar, Button, Dropdown, Badge } from "antd";
import { IconDots, IconEye, IconBan, IconCheck } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";

const UserList = ({ users, onSelect, selectedUserId, onBlock, onUnblock }) => {
  const getRoleColor = (role) => {
    const colors = {
      customer: "blue",
      admin: "red",
      vendor: "green",
    };
    return colors[role] || "default";
  };

  const columns = [
    {
      title: "User",
      key: "user",
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar size={40} className="bg-blue-500">
            {record.name?.[0]?.toUpperCase() || "U"}
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{record.name}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role) => (
        <Tag color={getRoleColor(role)} className="capitalize">
          {role}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Badge
          status={status === "active" ? "success" : "error"}
          text={status === "active" ? "Active" : "Blocked"}
        />
      ),
    },
    {
      title: "Orders",
      dataIndex: "totalOrders",
      key: "orders",
      width: 100,
      render: (orders) => <span className="text-gray-600">{orders || 0}</span>,
    },
    {
      title: "Total Spent",
      dataIndex: "totalSpent",
      key: "spent",
      width: 120,
      render: (spent) => (
        <span className="font-semibold">₹{formatPrice(spent || 0)}</span>
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
                key: "view",
                label: "View Details",
                icon: <IconEye className="w-4 h-4" />,
                onClick: () => onSelect(record),
              },
              {
                type: "divider",
              },
              record.status === "active"
                ? {
                    key: "block",
                    label: "Block User",
                    icon: <IconBan className="w-4 h-4" />,
                    danger: true,
                    onClick: () => onBlock(record.id),
                  }
                : {
                    key: "unblock",
                    label: "Unblock User",
                    icon: <IconCheck className="w-4 h-4" />,
                    onClick: () => onUnblock(record.id),
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
        dataSource={users.map((u) => ({ ...u, key: u.id }))}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
        }}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => onSelect(record),
          className: selectedUserId === record.id ? "bg-blue-50" : "cursor-pointer hover:bg-gray-50",
        })}
      />
    </motion.div>
  );
};

export default UserList;

