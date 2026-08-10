"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
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
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);
const myDarkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "#09090b",
  foregroundColor: "#e4e4e7",
  headerBackgroundColor: "#18181b",
  borderColor: "#27272a",
  rowHoverColor: "#18181b",
});

const BrandList = ({ onEdit, onDelete }) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

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

  /* ---------------- GRID COLUMNS (MEMOIZED) ---------------- */
  const columnDefs = useMemo(
    () => [
      {
        headerName: "Brand",
        field: "name",
        flex: 1,
        minWidth: 220,
        cellRenderer: (p) => (
          <div className="h-full flex items-center gap-3">
            <Avatar
              src={p.data.logo}
              size={36}
              className="rounded-lg shrink-0"
              icon={p.data.name?.[0]?.toUpperCase()}
            />
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white truncate">
                {p.data.name}
              </div>
              <div className="text-xs text-gray-500 truncate">{p.data.slug}</div>
            </div>
          </div>
        ),
      },
      {
        headerName: "Description",
        field: "description",
        flex: 1.4,
        minWidth: 200,
        valueFormatter: (p) => p.value || "-",
      },
      {
        headerName: "Sort Order",
        field: "sortOrder",
        width: 130,
        cellRenderer: (p) => <Tag color="blue">{p.value}</Tag>,
      },
      {
        headerName: "Products",
        field: "productCount",
        width: 120,
        cellRenderer: (p) => <Tag color="green">{p.value}</Tag>,
      },
      {
        headerName: "Actions",
        width: 80,
        pinned: "right",
        cellRenderer: (p) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  label: "Edit Brand",
                  icon: <IconEdit className="w-4 h-4" />,
                  onClick: () => onEdit?.(p.data),
                },
                { type: "divider" },
                {
                  key: "delete",
                  label: "Delete",
                  icon: <IconTrash className="w-4 h-4" />,
                  danger: true,
                  onClick: () => onDelete?.(p.data.id),
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
          <div className="hidden lg:block p-2">
            {isClient ? (
              <div style={{ width: "100%", height: 520 }}>
                <AgGridReact
                  theme={myDarkTheme}
                  modules={[AllCommunityModule]}
                  rowData={brands}
                  columnDefs={columnDefs}
                  defaultColDef={{ sortable: true, resizable: true }}
                  getRowId={(p) => p.data.id}
                  animateRows
                  rowHeight={56}
                  headerHeight={44}
                  pagination
                  paginationPageSize={10}
                  paginationPageSizeSelector={[10, 20, 50]}
                  overlayNoRowsTemplate="No brands yet"
                  suppressCellFocus
                />
              </div>
            ) : (
              <div className="h-[520px]" />
            )}
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
