"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Avatar, Button, Dropdown, Card, Pagination } from "antd";
import { IconDots, IconEye } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";
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

const STATUS_BADGE_CLASS = {
  delivered: "bg-green-900/20 text-green-300 border-green-800/30",
  cancelled: "bg-red-900/20 text-red-300 border-red-800/30",
  shipped: "bg-purple-900/20 text-purple-300 border-purple-800/30",
  processing: "bg-orange-900/20 text-orange-300 border-orange-800/30",
  confirmed: "bg-blue-900/20 text-blue-300 border-blue-800/30",
  pending: "bg-amber-900/20 text-amber-300 border-amber-800/30",
};
const STATUS_DOT_CLASS = {
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  shipped: "bg-purple-500",
  processing: "bg-orange-500",
  confirmed: "bg-blue-500",
  pending: "bg-amber-500",
};

function StatusBadge({ status, small }) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize inline-flex items-center gap-1.5 border ${
        STATUS_BADGE_CLASS[status] || "bg-zinc-800/40 text-zinc-400 border-zinc-700/50"
      }`}
    >
      <span
        className={`rounded-full ${small ? "w-1 h-1" : "w-1.5 h-1.5"} ${
          STATUS_DOT_CLASS[status] || "bg-zinc-500"
        }`}
      />
      {status}
    </span>
  );
}

const OrderList = ({ orders, onSelect, selectedOrderId, onStatusChange }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Order ID",
        field: "orderId",
        width: 150,
        cellRenderer: (p) => (
          <span className="font-mono font-semibold text-blue-400">#{p.value}</span>
        ),
      },
      {
        headerName: "Customer",
        width: 210,
        cellRenderer: (p) => (
          <div className="h-full flex items-center gap-3">
            <Avatar size={32} className="bg-blue-500 shrink-0">
              {p.data.address?.name?.[0]?.toUpperCase() || "C"}
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium text-zinc-100 truncate">
                {p.data.address?.name || "N/A"}
              </div>
              <div className="text-xs text-zinc-400 truncate">
                {p.data.address?.phone || ""}
              </div>
            </div>
          </div>
        ),
      },
      {
        headerName: "Items",
        width: 100,
        valueGetter: (p) => p.data.items?.length || 0,
        valueFormatter: (p) => `${p.value} items`,
      },
      {
        headerName: "Total",
        width: 130,
        valueGetter: (p) => p.data.orderSummary?.grandTotal || 0,
        cellRenderer: (p) => (
          <span className="font-semibold text-zinc-100">₹{formatPrice(p.value)}</span>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        width: 140,
        cellRenderer: (p) => <StatusBadge status={p.value} />,
      },
      {
        headerName: "Date",
        field: "orderDate",
        width: 130,
        valueFormatter: (p) => format(new Date(p.value), "MMM dd, yyyy"),
      },
      {
        headerName: "Actions",
        width: 90,
        pinned: "right",
        cellRenderer: (p) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "view",
                  label: "View Details",
                  icon: <IconEye className="w-4 h-4" />,
                  onClick: () => onSelect(p.data),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders]
  );

  // Calculate pagination for mobile/tablet
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  const renderOrderCard = (order) => {
    const isSelected = selectedOrderId === order.orderId;
    
    return (
      <motion.div
        key={order.orderId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onSelect(order)}
        className={`cursor-pointer transition-all ${
          isSelected
            ? "ring-2 ring-blue-500 dark:ring-blue-400"
            : "hover:shadow-md"
        }`}
      >
        <Card
          className={`h-full border ${
            isSelected
              ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-zinc-800"
          } hover:shadow-md transition-shadow`}
          bodyStyle={{ padding: "16px" }}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Order ID and Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-sm sm:text-base text-blue-600 dark:text-blue-400">
                      #{order.orderId}
                    </span>
                    <StatusBadge status={order.status} small />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(order.orderDate), "MMM dd, yyyy")}
                  </div>
                </div>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "view",
                        label: "View Details",
                        icon: <IconEye className="w-4 h-4" />,
                        onClick: () => onSelect(order),
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

              {/* Customer Info */}
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Avatar size={40} className="bg-blue-500 shrink-0">
                  {order.address?.name?.[0]?.toUpperCase() || "C"}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm sm:text-base text-zinc-100 truncate">
                    {order.address?.name || "N/A"}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {order.address?.phone || ""}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <div className="text-xs sm:text-sm text-zinc-300">
                  {order.items?.length || 0} items
                </div>
                <div className="font-semibold text-sm sm:text-base text-zinc-100">
                  ₹{formatPrice(order.orderSummary?.grandTotal || 0)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="!bg-zinc-950 rounded-lg shadow-sm border border-zinc-800 overflow-hidden"
    >
      {/* Desktop Table View */}
      <div className="hidden lg:block p-2">
        {isClient ? (
          <div style={{ width: "100%", height: 560 }}>
            <AgGridReact
              theme={myDarkTheme}
              modules={[AllCommunityModule]}
              rowData={orders}
              columnDefs={columnDefs}
              defaultColDef={{ sortable: true, resizable: true }}
              getRowId={(p) => p.data.orderId}
              animateRows
              rowHeight={56}
              headerHeight={44}
              pagination
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50]}
              overlayNoRowsTemplate="No orders yet"
              suppressCellFocus
              onRowClicked={(p) => onSelect(p.data)}
              rowClassRules={{
                "!bg-blue-900/20": (p) => selectedOrderId === p.data.orderId,
              }}
            />
          </div>
        ) : (
          <div className="h-[560px]" />
        )}
      </div>

      {/* Mobile/Tablet Grid View */}
      <div className="lg:hidden p-2 sm:p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <AnimatePresence mode="popLayout">
            {paginatedOrders.map((order) => renderOrderCard(order))}
          </AnimatePresence>
        </div>

        {orders.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-zinc-800">
            <div className="text-xs sm:text-sm text-zinc-300">
              Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} orders
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={orders.length}
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

export default OrderList;

