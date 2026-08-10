"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Tag, Button, Dropdown, Progress } from "antd";
import { IconEdit, IconTrash, IconDots, IconCopy } from "@tabler/icons-react";
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

const getStatusColor = (status) => {
  const colors = { active: "green", expired: "red", inactive: "gray" };
  return colors[status] || "default";
};

const CouponList = ({ coupons, onEdit, onDelete }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Coupon Code",
        field: "code",
        width: 170,
        cellRenderer: (p) => (
          <div className="h-full flex items-center gap-2">
            <span className="font-mono font-semibold text-blue-400">{p.value}</span>
            <Button
              type="text"
              size="small"
              icon={<IconCopy className="w-3 h-3" />}
              onClick={() => navigator.clipboard.writeText(p.value)}
            />
          </div>
        ),
      },
      {
        headerName: "Type",
        width: 110,
        cellRenderer: (p) => (
          <Tag color={p.data.type === "percentage" ? "blue" : "green"}>
            {p.data.type === "percentage" ? `${p.data.value}%` : `₹${p.data.value}`}
          </Tag>
        ),
      },
      {
        headerName: "Discount",
        width: 220,
        cellRenderer: (p) => (
          <div className="text-sm leading-tight">
            {p.data.type === "percentage" ? (
              <>
                <span>{p.data.value}% off</span>
                {p.data.maxDiscount && (
                  <span className="text-gray-500"> (max ₹{formatPrice(p.data.maxDiscount)})</span>
                )}
              </>
            ) : (
              <span>₹{formatPrice(p.data.value)} off</span>
            )}
            <div className="text-xs text-gray-500">
              Min purchase: ₹{formatPrice(p.data.minPurchase)}
            </div>
          </div>
        ),
      },
      {
        headerName: "Usage",
        width: 170,
        cellRenderer: (p) => (
          <div className="w-full py-1.5">
            <div className="text-sm font-medium">
              {p.data.usedCount} / {p.data.usageLimit}
            </div>
            <Progress
              percent={Math.round((p.data.usedCount / p.data.usageLimit) * 100)}
              size="small"
              status={p.data.usedCount >= p.data.usageLimit ? "exception" : "active"}
            />
          </div>
        ),
      },
      {
        headerName: "Expiry Date",
        field: "expiryDate",
        width: 140,
        valueFormatter: (p) => format(new Date(p.value), "MMM dd, yyyy"),
      },
      {
        headerName: "Status",
        field: "status",
        width: 110,
        cellRenderer: (p) => (
          <Tag color={getStatusColor(p.value)} className="capitalize">
            {p.value}
          </Tag>
        ),
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
                  key: "edit",
                  label: "Edit Coupon",
                  icon: <IconEdit className="w-4 h-4" />,
                  onClick: () => onEdit(p.data),
                },
                { type: "divider" },
                {
                  key: "delete",
                  label: "Delete",
                  icon: <IconTrash className="w-4 h-4" />,
                  danger: true,
                  onClick: () => onDelete(p.data.id),
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
    [coupons]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="!bg-zinc-950 rounded-lg shadow-sm border border-zinc-800 overflow-hidden p-2"
    >
      {isClient ? (
        <div style={{ width: "100%", height: 560 }}>
          <AgGridReact
            theme={myDarkTheme}
            modules={[AllCommunityModule]}
            rowData={coupons}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, resizable: true }}
            getRowId={(p) => p.data.id}
            animateRows
            rowHeight={64}
            headerHeight={44}
            pagination
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 20, 50]}
            overlayNoRowsTemplate="No coupons yet"
            suppressCellFocus
          />
        </div>
      ) : (
        <div className="h-[560px]" />
      )}
    </motion.div>
  );
};

export default CouponList;
