"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tag, Avatar, Button, Dropdown, Badge, Card, Pagination } from "antd";
import { IconDots, IconEye, IconBan, IconCheck } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const UserList = ({
  users,
  pagination,
  onPageChange,
  onSelect,
  selectedUserId,
  onBlock,
  onUnblock,
  isMutating,
}) => {
  const currentPage = pagination?.page ?? 1;
  const pageSize = pagination?.limit ?? 10;
  const total = pagination?.total ?? users.length;
  const getRoleColor = (role) => {
    const colors = {
      user: "blue",
      admin: "red",
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
            <div className="font-medium text-gray-900 dark:text-white">
              {record.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {record.email}
            </div>
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
      title: "Created",
      dataIndex: "registeredAt",
      key: "createdAt",
      width: 140,
      render: (registeredAt) => {
        if (!registeredAt) return <span>-</span>;
        const d = new Date(registeredAt);
        return <span className="text-gray-600 dark:text-gray-300">{format(d, "MMM dd, yyyy")}</span>;
      },
    },
    {
      title: "Total Spent",
      dataIndex: "totalSpent",
      key: "spent",
      width: 120,
      render: (spent) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          ₹{formatPrice(spent || 0)}
        </span>
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
                    disabled: !!isMutating,
                    onClick: () => onBlock(record.id),
                  }
                : {
                    key: "unblock",
                    label: "Unblock User",
                    icon: <IconCheck className="w-4 h-4" />,
                    disabled: !!isMutating,
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

  const renderUserCard = (user) => (
    <motion.div
      key={user.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      className="w-full"
    >
      <Card
        className={`h-full border border-zinc-800 hover:shadow-md transition-all cursor-pointer ${
          selectedUserId === user.id
            ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "hover:border-blue-300 dark:hover:border-blue-600"
        }`}
        bodyStyle={{ padding: "16px" }}
        onClick={() => onSelect(user)}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <Avatar
            size={56}
            className="bg-blue-500 shrink-0 w-14 h-14 sm:w-16 sm:h-16"
          >
            {user.name?.[0]?.toUpperCase() || "U"}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-1 truncate">
                  {user.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
                  {user.email}
                </p>
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "view",
                      label: "View Details",
                      icon: <IconEye className="w-4 h-4" />,
                      onClick: () => onSelect(user),
                    },
                    {
                      type: "divider",
                    },
                    user.status === "active"
                      ? {
                          key: "block",
                          label: "Block User",
                          icon: <IconBan className="w-4 h-4" />,
                          danger: true,
                          onClick: () => onBlock(user.id),
                        }
                      : {
                          key: "unblock",
                          label: "Unblock User",
                          icon: <IconCheck className="w-4 h-4" />,
                          onClick: () => onUnblock(user.id),
                        },
                  ],
                }}
                trigger={["click"]}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  type="text"
                  icon={<IconDots className="w-4 h-4" />}
                  size="small"
                  className="shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
              <Tag color={getRoleColor(user.role)} className="capitalize text-xs sm:text-sm">
                {user.role}
              </Tag>
              <Badge
                status={user.status === "active" ? "success" : "error"}
                text={
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    {user.status === "active" ? "Active" : "Blocked"}
                  </span>
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Created:</span>
                <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                  {user.registeredAt
                    ? format(new Date(user.registeredAt), "MMM dd, yyyy")
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Spent:</span>
                <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                  ₹{formatPrice(user.totalSpent || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="!bg-zinc-950 rounded-lg shadow-sm border border-zinc-800 overflow-hidden"
    >
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Table
          dataSource={users.map((u) => ({ ...u, key: u.id }))}
          columns={columns}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (t) => `Total ${t} users`,
            responsive: true,
            onChange: (page, size) => {
              onPageChange?.(page, size);
            },
          }}
          scroll={{ x: 1000 }}
          onRow={(record) => ({
            onClick: () => onSelect(record),
            className:
              selectedUserId === record.id
                ? "bg-blue-50 dark:bg-blue-900/20"
                : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50",
          })}
        />
      </div>

      {/* Mobile/Tablet Grid View */}
      <div className="lg:hidden p-2 sm:p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <AnimatePresence mode="popLayout">
            {users.map((user) => renderUserCard(user))}
          </AnimatePresence>
        </div>

        {pagination && total > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-zinc-800">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, total)} of {total} users
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={(page, size) => {
                onPageChange?.(page, size);
              }}
              showSizeChanger
              showQuickJumper={false}
              showTotal={(total) => `Total ${total}`}
              size="small"
              className="flex justify-center sm:justify-end"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UserList;

