"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Avatar, Button, Dropdown, Badge, Card, Pagination } from "antd";
import { IconDots, IconEye, IconBan, IconCheck } from "@tabler/icons-react";
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
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  const getRoleColor = (role) => {
    const colors = {
      user: "blue",
      admin: "red",
    };
    return colors[role] || "default";
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "User",
        flex: 1,
        minWidth: 250,
        cellRenderer: (p) => (
          <div className="h-full flex items-center gap-3">
            <Avatar size={32} className="bg-blue-500 shrink-0">
              {p.data.name?.[0]?.toUpperCase() || "U"}
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {p.data.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {p.data.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        headerName: "Role",
        field: "role",
        width: 120,
        cellRenderer: (p) => (
          <Tag color={getRoleColor(p.value)} className="capitalize">
            {p.value}
          </Tag>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        width: 130,
        cellRenderer: (p) => (
          <Badge
            status={p.value === "active" ? "success" : "error"}
            text={p.value === "active" ? "Active" : "Blocked"}
          />
        ),
      },
      {
        headerName: "Created",
        field: "registeredAt",
        width: 140,
        valueFormatter: (p) => (p.value ? format(new Date(p.value), "MMM dd, yyyy") : "-"),
      },
      {
        headerName: "Total Spent",
        field: "totalSpent",
        width: 130,
        cellRenderer: (p) => (
          <span className="font-semibold text-gray-900 dark:text-white">
            ₹{formatPrice(p.value || 0)}
          </span>
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
                  key: "view",
                  label: "View Details",
                  icon: <IconEye className="w-4 h-4" />,
                  onClick: () => onSelect(p.data),
                },
                { type: "divider" },
                p.data.status === "active"
                  ? {
                      key: "block",
                      label: "Block User",
                      icon: <IconBan className="w-4 h-4" />,
                      danger: true,
                      disabled: !!isMutating,
                      onClick: () => onBlock(p.data.id),
                    }
                  : {
                      key: "unblock",
                      label: "Unblock User",
                      icon: <IconCheck className="w-4 h-4" />,
                      disabled: !!isMutating,
                      onClick: () => onUnblock(p.data.id),
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
    [users, isMutating]
  );

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
      {/* Desktop Table View — server-paginated (fetched one page at a time
          by the parent), so ag-grid's own client-side pagination is off
          and this instead drives the same onPageChange the parent already
          uses to refetch. */}
      <div className="hidden lg:block p-2">
        {isClient ? (
          <div style={{ width: "100%", height: 520 }}>
            <AgGridReact
              theme={myDarkTheme}
              modules={[AllCommunityModule]}
              rowData={users}
              columnDefs={columnDefs}
              defaultColDef={{ sortable: true, resizable: true }}
              getRowId={(p) => p.data.id}
              animateRows
              rowHeight={56}
              headerHeight={44}
              overlayNoRowsTemplate="No users found"
              suppressCellFocus
              onRowClicked={(p) => onSelect(p.data)}
              rowClassRules={{
                "!bg-blue-900/20": (p) => selectedUserId === p.data.id,
              }}
            />
          </div>
        ) : (
          <div className="h-[520px]" />
        )}
        {total > pageSize && (
          <div className="flex justify-end pt-3">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={(page, size) => onPageChange?.(page, size)}
              showSizeChanger
              showTotal={(t) => `Total ${t} users`}
            />
          </div>
        )}
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

