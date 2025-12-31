"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tag, Button, Avatar, Dropdown, Card, Pagination } from "antd";
import { IconEdit, IconTrash, IconDots } from "@tabler/icons-react";

const BrandList = ({ brands, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Calculate pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBrands = brands.slice(startIndex, endIndex);

  const renderBrandCard = (brand) => (
    <motion.div
      key={brand.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="h-full border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        bodyStyle={{ padding: "16px" }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Avatar
            src={brand.logo}
            size={56}
            className="rounded-lg shrink-0 w-14 h-14 sm:w-16 sm:h-16"
            icon={brand.name?.[0]?.toUpperCase()}
          />
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-1 truncate">
                  {brand.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
                  {brand.slug}
                </p>
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "edit",
                      label: "Edit Brand",
                      icon: <IconEdit className="w-4 h-4" />,
                      onClick: () => onEdit(brand),
                    },
                    {
                      type: "divider",
                    },
                    {
                      key: "delete",
                      label: "Delete",
                      icon: <IconTrash className="w-4 h-4" />,
                      danger: true,
                      onClick: () => onDelete(brand.id),
                    },
                  ],
                }}
                trigger={["click"]}
              >
                <Button
                  type="text"
                  icon={<IconDots className="w-4 h-4" />}
                  size="small"
                  className="shrink-0"
                />
              </Dropdown>
            </div>
            {brand.description && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 line-clamp-2">
                {brand.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Tag color="blue" className="text-xs sm:text-sm">
                Order: {brand.sortOrder}
              </Tag>
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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Desktop Table View */}
      <div className="hidden lg:block">
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
      </div>

      {/* Mobile/Tablet Grid View */}
      <div className="lg:hidden p-2 sm:p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <AnimatePresence mode="popLayout">
            {paginatedBrands.map((brand) => renderBrandCard(brand))}
          </AnimatePresence>
        </div>
        
        {brands.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, brands.length)} of {brands.length} brands
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={brands.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
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

export default BrandList;

