"use client";
import React from "react";
import { motion } from "framer-motion";
import { Table, Tag, Button, Avatar, Dropdown, Image } from "antd";
import { IconEdit, IconTrash, IconDots } from "@tabler/icons-react";

const BrandList = ({ brands, onEdit, onDelete }) => {
  const columns = [
    {
      title: "Brand",
      key: "brand",
      width: 200,
      responsive: ["xs", "sm", "md", "lg"],
      render: (_, record) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar
            src={record.logo}
            size={40}
            className="rounded-lg shrink-0 sm:w-12 sm:h-12"
            icon={record.name?.[0]?.toUpperCase()}
          />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{record.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{record.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      responsive: ["md", "lg"],
      render: (text) => <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{text || "-"}</span>,
    },
    {
      title: "Sort Order",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 100,
      responsive: ["sm", "md", "lg"],
      render: (order) => <Tag color="blue" className="text-xs sm:text-sm">{order}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      fixed: "right",
      responsive: ["xs", "sm", "md", "lg"],
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                label: "Edit Brand",
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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <Table
        dataSource={brands.map((b) => ({ ...b, key: b.id }))}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} brands`,
          responsive: true,
        }}
        scroll={{ x: 600 }}
        size="small"
      />
    </motion.div>
  );
};

export default BrandList;

