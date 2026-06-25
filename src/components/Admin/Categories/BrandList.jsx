"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  Tag,
  Button,
  Avatar,
  Dropdown,
  Card,
  Pagination,
  message,
  Spin,
} from "antd";
import { IconEdit, IconTrash, IconDots } from "@tabler/icons-react";

const BrandList = ({ onEdit, onDelete }) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ---------------- FETCH BRANDS ---------------- */
  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/brands", {
        params: {
          includeInactive: true,
          includeProductCount: true,
          sort: "sortOrder",
        },
      });

      if (!data.success) throw new Error(data.message);
      setBrands(data.data.brands);
    } catch (error) {
      console.error(error);
      message.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  /* ---------------- PAGINATION CALC ---------------- */
  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return brands.slice(start, start + pageSize);
  }, [brands, currentPage, pageSize]);

  /* ---------------- TABLE COLUMNS (MEMOIZED) ---------------- */
  const columns = useMemo(
    () => [
      {
        title: "Brand",
        key: "brand",
        width: 200,
        render: (_, record) => (
          <div className="flex items-center gap-3">
            <Avatar
              src={record.logo}
              size={44}
              className="rounded-lg"
              icon={record.name?.[0]?.toUpperCase()}
            />
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white truncate">
                {record.name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {record.slug}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        render: (text) => (
          <span className="text-gray-600 dark:text-gray-300">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Sort Order",
        dataIndex: "sortOrder",
        key: "sortOrder",
        width: 120,
        render: (order) => <Tag color="blue">{order}</Tag>,
      },
      {
        title: "Products",
        dataIndex: "productCount",
        key: "productCount",
        width: 120,
        render: (count) => <Tag color="green">{count}</Tag>,
      },
      {
        title: "Actions",
        key: "actions",
        width: 80,
        render: (_, record) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  label: "Edit Brand",
                  icon: <IconEdit className="w-4 h-4" />,
                  onClick: () => onEdit?.(record),
                },
                { type: "divider" },
                {
                  key: "delete",
                  label: "Delete",
                  icon: <IconTrash className="w-4 h-4" />,
                  danger: true,
                  onClick: () => onDelete?.(record.id),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<IconDots className="w-4 h-4" />} />
          </Dropdown>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  /* ---------------- MOBILE CARD RENDER (MEMOIZED FN) ---------------- */
  const renderBrandCard = useCallback(
    (brand) => (
      <motion.div
        key={brand.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            <Avatar
              src={brand.logo}
              size={56}
              className="rounded-lg"
              icon={brand.name?.[0]?.toUpperCase()}
            />
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {brand.name}
                  </h3>
                  <p className="text-xs text-gray-500">{brand.slug}</p>
                </div>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "edit",
                        label: "Edit",
                        icon: <IconEdit />,
                        onClick: () => onEdit?.(brand),
                      },
                      { type: "divider" },
                      {
                        key: "delete",
                        label: "Delete",
                        icon: <IconTrash />,
                        danger: true,
                        onClick: () => onDelete?.(brand.id),
                      },
                    ],
                  }}
                >
                  <Button type="text" icon={<IconDots />} />
                </Dropdown>
              </div>
              {brand.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {brand.description}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <Tag color="blue">Order: {brand.sortOrder}</Tag>
                <Tag color="green">{brand.productCount} Products</Tag>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    ),
    [onEdit, onDelete]
  );

  /* ---------------- RENDER ---------------- */
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="!bg-zinc-950 rounded-lg shadow-sm border overflow-hidden">
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Table
              dataSource={brands.map((b) => ({ ...b, key: b.id }))}
              columns={columns}
              pagination={{ pageSize: 10 }}
            />
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden p-4 space-y-3">
            <AnimatePresence>
              {paginatedBrands.map(renderBrandCard)}
            </AnimatePresence>

            {brands.length > pageSize && (
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={brands.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                size="small"
                className="flex justify-center mt-4"
              />
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default BrandList;
