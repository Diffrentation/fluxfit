"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Button,
  Input,
  Select,
  Image,
  Tooltip,
  DatePicker,
  Modal,
  Spin,
  InputNumber,
} from "antd";
import {
  IconEye,
  IconCheck,
  IconX,
  IconTool,
  IconPackageExport,
  IconRefresh,
  IconSearch,
  IconShirt,
  IconCalendar,
} from "@tabler/icons-react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminContent from "@/components/Admin/AdminContent";
import dayjs from "dayjs";
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

const STATUS_COLORS = {
  pending_review: { bg: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending Review" },
  approved: { bg: "bg-green-100 text-green-700 border-green-200", label: "Approved" },
  rejected: { bg: "bg-red-100 text-red-700 border-red-200", label: "Rejected" },
  in_production: { bg: "bg-blue-100 text-blue-700 border-blue-200", label: "In Production" },
  completed: { bg: "bg-purple-100 text-purple-700 border-purple-200", label: "Completed" },
};

function getToken() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw || raw === "undefined" || raw === "null") return null;
  return raw.trim();
}

function StatusBadge({ status }) {
  const cfg = STATUS_COLORS[status] || { bg: "bg-gray-100 text-gray-700", label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function ReviewModal({ order, onClose, onUpdated }) {
  const [newStatus, setNewStatus] = useState(order.status);
  const [remarks, setRemarks] = useState(order.adminRemarks || "");
  const [delivery, setDelivery] = useState(
    order.estimatedDelivery ? dayjs(order.estimatedDelivery) : null
  );
  const [pricePerUnit, setPricePerUnit] = useState(
    order.quote?.pricePerUnit ?? null
  );
  const [quoteNotes, setQuoteNotes] = useState(order.quote?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      await axios.patch(
        `/api/admin/custom-orders/${order.id}`,
        {
          status: newStatus,
          adminRemarks: remarks,
          estimatedDelivery: delivery ? delivery.toISOString() : null,
          ...(pricePerUnit != null
            ? { quote: { pricePerUnit, notes: quoteNotes } }
            : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  const sides = [
    { key: "front", label: "Front" },
    { key: "back", label: "Back" },
    { key: "leftSleeve", label: "Left Sleeve" },
    { key: "rightSleeve", label: "Right Sleeve" },
  ].filter((s) => order.designImages?.[s.key]);

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      width={740}
      title={
        <span className="font-bold text-gray-900">
          Review Order #{order.id.slice(-8).toUpperCase()}
        </span>
      }
      maskClosable={false}
      destroyOnClose
    >
      <div className="space-y-5 py-2">
        {/* User info */}
        <div className="flex items-center gap-3 !bg-zinc-950 rounded-xl p-4">
          {order.user?.avatar ? (
            <img src={order.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-950/30 flex items-center justify-center text-emerald-400 font-bold text-lg border border-emerald-900/40">
              {order.user?.name?.[0] || "U"}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{order.user?.name}</p>
            <p className="text-sm text-gray-500">{order.user?.email}</p>
          </div>
          <div className="ml-auto text-right">
            <StatusBadge status={order.status} />
            <p className="text-xs text-gray-400 mt-1">
              {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")}
            </p>
          </div>
        </div>

        {/* Order details chips */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-zinc-900 text-zinc-300 text-sm rounded-full font-medium border border-zinc-800">
            {order.clothType}
          </span>
          <span
            className="px-3 py-1.5 text-sm rounded-full font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: order.clothColor?.hex + "22",
              color: order.clothColor?.hex === "#FFFFFF" ? "#374151" : order.clothColor?.hex,
              border: `1px solid ${order.clothColor?.hex}44`,
            }}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: order.clothColor?.hex }}
            />
            {order.clothColor?.label}
          </span>
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full font-medium capitalize">
            {order.printPlacement?.replace(/_/g, " ")}
          </span>
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
            Qty: {order.quantity}
          </span>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <strong>Note:</strong> {order.notes}
          </div>
        )}

        {/* Design images */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Design Images</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sides.length === 0 && (
              <p className="text-sm text-gray-400 col-span-4">No images uploaded</p>
            )}
            {sides.map((s) => (
              <div key={s.key} className="text-center">
                <p className="text-xs text-gray-500 mb-1.5 font-medium">{s.label}</p>
                <Image
                  src={order.designImages[s.key]}
                  alt={s.label}
                  width="100%"
                  className="rounded-xl border border-zinc-800 object-contain !bg-zinc-900"
                  style={{ height: 120, objectFit: "contain" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Admin action form */}
        <div className="border-t border-gray-200 pt-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Update Status
            </label>
            <Select
              value={newStatus}
              onChange={setNewStatus}
              className="w-full"
              options={Object.entries(STATUS_COLORS).map(([val, cfg]) => ({
                value: val,
                label: cfg.label,
              }))}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Admin Remarks
            </label>
            <Input.TextArea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Add your remarks or instructions for the customer…"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1">
              <IconCalendar size={14} className="text-indigo-500" />
              Estimated Delivery Date
            </label>
            <DatePicker
              value={delivery}
              onChange={setDelivery}
              className="w-full"
              format="DD MMM YYYY"
              disabledDate={(d) => d && d < dayjs().startOf("day")}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Price Quote (per unit)
            </label>
            <div className="flex items-center gap-3">
              <InputNumber
                value={pricePerUnit}
                onChange={setPricePerUnit}
                min={0}
                prefix="₹"
                className="w-full"
                placeholder="e.g. 499"
              />
              {pricePerUnit != null && (
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  Total: ₹{(pricePerUnit * order.quantity).toLocaleString("en-IN")}
                </span>
              )}
            </div>
            {order.quote?.quotedAt && (
              <p className="text-xs text-gray-400 mt-1">
                Last quoted {format(new Date(order.quote.quotedAt), "dd MMM yyyy, hh:mm a")}
              </p>
            )}
            <Input
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              placeholder="Optional note about the quote (e.g. bulk discount applied)"
              className="mt-2"
              maxLength={500}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={saving}
              className="bg-emerald-600 border-emerald-600 hover:bg-emerald-700"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [statusCounts, setStatusCounts] = useState({});
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const fetchOrders = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/custom-orders", {
        params: { status: statusFilter, search },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setOrders(data.data.orders || []);
        setStatusCounts(data.data.statusCounts || {});
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPending = statusCounts["pending_review"] || 0;

  const STATUS_TABS = [
    { key: "all", label: "All", count: Object.values(statusCounts).reduce((a, b) => a + b, 0) },
    { key: "pending_review", label: "Pending", count: statusCounts["pending_review"] || 0 },
    { key: "approved", label: "Approved", count: statusCounts["approved"] || 0 },
    { key: "rejected", label: "Rejected", count: statusCounts["rejected"] || 0 },
    { key: "in_production", label: "In Production", count: statusCounts["in_production"] || 0 },
    { key: "completed", label: "Completed", count: statusCounts["completed"] || 0 },
  ];

  const quickApprove = useCallback(
    async (order) => {
      const token = getToken();
      if (!token) return;
      try {
        await axios.patch(
          `/api/admin/custom-orders/${order.id}`,
          { status: "approved" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Order approved!");
        fetchOrders();
      } catch {
        toast.error("Failed to approve");
      }
    },
    [fetchOrders]
  );

  const moveToProduction = useCallback(
    async (order) => {
      const token = getToken();
      if (!token) return;
      try {
        await axios.patch(
          `/api/admin/custom-orders/${order.id}`,
          { status: "in_production" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Moved to production!");
        fetchOrders();
      } catch {
        toast.error("Failed to update");
      }
    },
    [fetchOrders]
  );

  const markCompleted = useCallback(
    async (order) => {
      const token = getToken();
      if (!token) return;
      try {
        await axios.patch(
          `/api/admin/custom-orders/${order.id}`,
          { status: "completed" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Order completed!");
        fetchOrders();
      } catch {
        toast.error("Failed to update");
      }
    },
    [fetchOrders]
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Order",
        width: 130,
        cellRenderer: (p) => {
          const order = p.data;
          const thumbs = ["front", "back", "leftSleeve", "rightSleeve"].filter(
            (s) => order.designImages?.[s]
          );
          return (
            <div className="h-full flex flex-col justify-center gap-1 py-1">
              <div className="flex gap-1">
                {thumbs.length > 0 ? (
                  thumbs.slice(0, 2).map((s) => (
                    <img
                      key={s}
                      src={order.designImages[s]}
                      alt={s}
                      className="w-10 h-10 rounded-lg border border-zinc-800 object-contain !bg-zinc-900"
                    />
                  ))
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
                    📷
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                #{order.id?.slice(-8).toUpperCase()}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Customer",
        flex: 1,
        minWidth: 160,
        cellRenderer: (p) => {
          const order = p.data;
          return (
            <div className="h-full flex flex-col justify-center min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {order.user?.name || "Unknown User"}
              </span>
              <span className="text-xs text-gray-500 truncate">{order.user?.email}</span>
            </div>
          );
        },
      },
      {
        headerName: "Details",
        flex: 1.4,
        minWidth: 240,
        cellRenderer: (p) => {
          const order = p.data;
          return (
            <div className="h-full flex flex-wrap items-center content-center gap-1.5 py-1">
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                {order.clothType}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                style={{
                  backgroundColor: order.clothColor?.hex + "22",
                  color:
                    order.clothColor?.hex === "#FFFFFF" ? "#374151" : order.clothColor?.hex,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: order.clothColor?.hex }}
                />
                {order.clothColor?.label}
              </span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">
                Qty: {order.quantity}
              </span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                {order.printPlacement?.replace(/_/g, " ")}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Quote",
        width: 130,
        cellRenderer: (p) => {
          const order = p.data;
          return order.quote?.totalAmount != null ? (
            <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800">
              ₹{order.quote.totalAmount.toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          );
        },
      },
      {
        headerName: "Status",
        field: "status",
        width: 150,
        cellRenderer: (p) => <StatusBadge status={p.value} />,
      },
      {
        headerName: "Created",
        field: "createdAt",
        width: 120,
        cellRenderer: (p) => (
          <span className="text-xs text-gray-400">{format(new Date(p.value), "dd MMM yyyy")}</span>
        ),
      },
      {
        headerName: "Actions",
        width: 190,
        pinned: "right",
        sortable: false,
        cellRenderer: (p) => {
          const order = p.data;
          return (
            <div className="h-full flex items-center gap-2">
              <Tooltip title="Review Order">
                <Button
                  size="small"
                  icon={<IconEye size={14} />}
                  onClick={() => setReviewingOrder(order)}
                />
              </Tooltip>
              {order.status === "pending_review" && (
                <>
                  <Tooltip title="Quick Approve">
                    <Button
                      size="small"
                      icon={<IconCheck size={14} />}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => quickApprove(order)}
                    />
                  </Tooltip>
                  <Tooltip title="Quick Reject">
                    <Button
                      size="small"
                      icon={<IconX size={14} />}
                      danger
                      onClick={() => setReviewingOrder(order)}
                    />
                  </Tooltip>
                </>
              )}
              {order.status === "approved" && (
                <Tooltip title="Move to Production">
                  <Button
                    size="small"
                    icon={<IconTool size={14} />}
                    className="text-emerald-400 border-emerald-800 hover:bg-emerald-950/30"
                    onClick={() => moveToProduction(order)}
                  />
                </Tooltip>
              )}
              {order.status === "in_production" && (
                <Tooltip title="Mark Completed">
                  <Button
                    size="small"
                    icon={<IconPackageExport size={14} />}
                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                    onClick={() => markCompleted(order)}
                  />
                </Tooltip>
              )}
            </div>
          );
        },
      },
    ],
    [quickApprove, moveToProduction, markCompleted]
  );

  return (
    <div className="flex min-h-screen bg-transparent">
      <AdminContent>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <IconShirt size={24} className="text-emerald-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Custom Clothing Orders
                </h1>
                {totalPending > 0 && (
                  <span className="ml-2 px-2.5 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                    {totalPending} pending
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Review, approve, and manage custom clothing orders from users.
              </p>
            </div>
            <Button
              icon={<IconRefresh size={15} />}
              onClick={fetchOrders}
              loading={loading}
            >
              Refresh
            </Button>
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={[
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border",
                  statusFilter === tab.key
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "!bg-zinc-950 text-gray-600 dark:text-gray-300 border-zinc-800 hover:border-emerald-500",
                ].join(" ")}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs ${
                      statusFilter === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-5">
            <Input
              prefix={<IconSearch size={16} className="text-gray-400" />}
              placeholder="Search by user name, email or cloth type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
              allowClear
            />
          </div>

          {/* Orders */}
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <Spin size="large" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24 !bg-zinc-950 rounded-3xl border border-zinc-800">
              <div className="text-5xl mb-4">🧵</div>
              <p className="text-gray-500 font-medium">No orders found</p>
            </div>
          ) : (
            <div className="!bg-zinc-950 rounded-2xl border border-zinc-800 p-2">
              {isClient ? (
                <div style={{ width: "100%", height: 560 }}>
                  <AgGridReact
                    theme={myDarkTheme}
                    modules={[AllCommunityModule]}
                    rowData={orders}
                    columnDefs={columnDefs}
                    defaultColDef={{ sortable: true, resizable: true }}
                    getRowId={(p) => String(p.data.id)}
                    animateRows
                    rowHeight={84}
                    headerHeight={44}
                    suppressCellFocus
                    overlayNoRowsTemplate="No orders found"
                  />
                </div>
              ) : (
                <div className="h-[560px]" />
              )}
            </div>
          )}
        </motion.div>

        {/* Review modal */}
        {reviewingOrder && (
          <ReviewModal
            order={reviewingOrder}
            onClose={() => setReviewingOrder(null)}
            onUpdated={fetchOrders}
          />
        )}
      </AdminContent>
    </div>
  );
}
