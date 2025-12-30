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
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={record.logo}
            size={48}
            className="rounded-lg"
            icon={record.name?.[0]?.toUpperCase()}
          />
          <div>
            <div className="font-semibold text-gray-900">{record.name}</div>
            <div className="text-xs text-gray-500">{record.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => <span className="text-gray-600">{text || "-"}</span>,
    },
    {
      title: "Sort Order",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 120,
      render: (order) => <Tag color="blue">{order}</Tag>,
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
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      <Table
        dataSource={brands.map((b) => ({ ...b, key: b.id }))}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} brands`,
        }}
        scroll={{ x: 800 }}
      />
    </motion.div>
  );
};

export default BrandList;

