"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import AdminContent from "@/components/Admin/AdminContent";
import {
  Card,
  Tabs,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Statistic,
  Checkbox,
  InputNumber,
  message,
} from "antd";
import { IconDownload, IconFileAnalytics } from "@tabler/icons-react";
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

const { RangePicker } = DatePicker;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function titleCase(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// Reports come back as flat arrays of plain objects whose shape depends on
// the report type/groupBy — rather than hardcode a columnDefs list per
// variant, derive columns from whatever keys the first row actually has.
function buildColumnDefs(rows) {
  if (!rows || rows.length === 0) return [];
  const sample = rows[0];
  return Object.keys(sample).map((key) => {
    const lower = key.toLowerCase();
    const isMoney =
      /revenue|amount|spent|price|total|discount|tax|shipping|subtotal/.test(
        lower
      ) && typeof sample[key] === "number";
    const isDate = /date|period/.test(lower) && lower !== "period";
    return {
      headerName: titleCase(key),
      field: key,
      flex: 1,
      minWidth: 130,
      valueFormatter: isMoney
        ? (params) =>
            params.value == null
              ? ""
              : `₹${Number(params.value).toLocaleString("en-IN")}`
        : isDate
          ? (params) =>
              params.value ? dayjs(params.value).format("DD MMM YYYY") : ""
          : undefined,
    };
  });
}

function ReportGrid({ rows, height = 420 }) {
  const columnDefs = useMemo(() => buildColumnDefs(rows), [rows]);
  return (
    <div style={{ width: "100%", height }}>
      <AgGridReact
        theme={myDarkTheme}
        modules={[AllCommunityModule]}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={{ sortable: true, resizable: true, filter: true }}
        animateRows
        rowHeight={44}
        headerHeight={40}
        overlayNoRowsTemplate="No data for the selected filters"
        suppressCellFocus
        pagination
        paginationPageSize={20}
        paginationPageSizeSelector={[20, 50, 100]}
      />
    </div>
  );
}

function StatRow({ items }) {
  return (
    <Row gutter={[16, 16]} className="mb-4">
      {items.map((it) => (
        <Col xs={12} sm={8} md={6} key={it.title}>
          <Card size="small" className="shadow-sm">
            <Statistic
              title={it.title}
              value={it.value}
              precision={it.precision}
              prefix={it.prefix}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

async function downloadCsv(url, params, filenameFallback) {
  try {
    const res = await axios.get(url, {
      params: { ...params, format: "csv" },
      headers: authHeaders(),
      responseType: "blob",
    });
    const disposition = res.headers["content-disposition"] || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : filenameFallback;
    const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("CSV export error:", error);
    message.error("Failed to export CSV");
  }
}

function SalesReportTab() {
  const [range, setRange] = useState([dayjs().subtract(29, "day"), dayjs()]);
  const [groupBy, setGroupBy] = useState("day");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);

  const params = useMemo(
    () => ({
      startDate: range[0].startOf("day").toISOString(),
      endDate: range[1].endOf("day").toISOString(),
      groupBy,
    }),
    [range, groupBy]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/reports/sales", {
        params,
        headers: authHeaders(),
      });
      if (!data?.success) throw new Error(data?.message);
      setSummary(data.data.summary);
      setRows(data.data.data || []);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to load sales report"
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <RangePicker
          value={range}
          onChange={(v) => v && setRange(v)}
          allowClear={false}
        />
        <Select
          value={groupBy}
          onChange={setGroupBy}
          style={{ width: 160 }}
          options={[
            { value: "day", label: "Group by Day" },
            { value: "week", label: "Group by Week" },
            { value: "month", label: "Group by Month" },
            { value: "product", label: "Group by Product" },
            { value: "category", label: "Group by Category" },
          ]}
        />
        <Button type="primary" loading={loading} onClick={load}>
          Refresh
        </Button>
        <Button
          icon={<IconDownload className="w-4 h-4" />}
          onClick={() => downloadCsv("/api/admin/reports/sales", params, "sales-report.csv")}
        >
          Export CSV
        </Button>
      </div>

      {summary && (
        <StatRow
          items={[
            { title: "Total Revenue", value: summary.totalRevenue, prefix: "₹" },
            { title: "Discount", value: summary.totalDiscount, prefix: "₹" },
            { title: "Net Revenue", value: summary.netRevenue, prefix: "₹" },
            { title: "Orders", value: summary.totalOrders },
            { title: "Items Sold", value: summary.totalItems },
            { title: "Avg Order Value", value: summary.averageOrderValue, prefix: "₹" },
          ]}
        />
      )}

      <Card className="shadow-sm">
        <ReportGrid rows={rows} />
      </Card>
    </div>
  );
}

function OrdersReportTab() {
  const [range, setRange] = useState([dayjs().subtract(29, "day"), dayjs()]);
  const [status, setStatus] = useState(undefined);
  const [paymentStatus, setPaymentStatus] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);

  const params = useMemo(
    () => ({
      startDate: range[0].startOf("day").toISOString(),
      endDate: range[1].endOf("day").toISOString(),
      status,
      paymentStatus,
    }),
    [range, status, paymentStatus]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/reports/orders", {
        params,
        headers: authHeaders(),
      });
      if (!data?.success) throw new Error(data?.message);
      setSummary(data.data.summary);
      setRows(
        (data.data.orders || []).map((o) => ({
          orderNumber: o.orderNumber,
          orderDate: o.orderDate,
          customerName: o.customer?.name,
          customerEmail: o.customer?.email,
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          itemCount: o.itemCount,
          subtotal: o.subtotal,
          discount: o.discount,
          shipping: o.shipping,
          tax: o.tax,
          total: o.total,
          coupon: o.coupon,
        }))
      );
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to load orders report"
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <RangePicker
          value={range}
          onChange={(v) => v && setRange(v)}
          allowClear={false}
        />
        <Select
          allowClear
          placeholder="Order Status"
          value={status}
          onChange={setStatus}
          style={{ width: 170 }}
          options={[
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "returned",
          ].map((s) => ({ value: s, label: titleCase(s) }))}
        />
        <Select
          allowClear
          placeholder="Payment Status"
          value={paymentStatus}
          onChange={setPaymentStatus}
          style={{ width: 170 }}
          options={["pending", "completed", "failed", "refunded"].map((s) => ({
            value: s,
            label: titleCase(s),
          }))}
        />
        <Button type="primary" loading={loading} onClick={load}>
          Refresh
        </Button>
        <Button
          icon={<IconDownload className="w-4 h-4" />}
          onClick={() =>
            downloadCsv("/api/admin/reports/orders", params, "orders-report.csv")
          }
        >
          Export CSV
        </Button>
      </div>

      {summary && (
        <StatRow
          items={[
            { title: "Total Orders", value: summary.totalOrders },
            { title: "Total Revenue", value: summary.totalRevenue, prefix: "₹" },
            { title: "Total Discount", value: summary.totalDiscount, prefix: "₹" },
            { title: "Items Sold", value: summary.totalItems },
            { title: "Avg Order Value", value: summary.averageOrderValue, prefix: "₹" },
          ]}
        />
      )}

      <Card className="shadow-sm">
        <ReportGrid rows={rows} />
      </Card>
    </div>
  );
}

function ProductsReportTab() {
  const [status, setStatus] = useState(undefined);
  const [inStock, setInStock] = useState(undefined);
  const [includeSales, setIncludeSales] = useState(false);
  const [range, setRange] = useState([dayjs().subtract(29, "day"), dayjs()]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axios
      .get("/api/categories", { params: { format: "flat" } })
      .then(({ data }) =>
        setCategories((data?.data?.categories || []).map((c) => ({ value: c.id || c._id, label: c.name })))
      )
      .catch(() => {});
  }, []);

  const params = useMemo(() => {
    const p = { status, category };
    if (inStock !== undefined) p.inStock = String(inStock);
    if (includeSales) {
      p.includeSales = "true";
      p.startDate = range[0].startOf("day").toISOString();
      p.endDate = range[1].endOf("day").toISOString();
    }
    return p;
  }, [status, category, inStock, includeSales, range]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/reports/products", {
        params,
        headers: authHeaders(),
      });
      if (!data?.success) throw new Error(data?.message);
      setSummary(data.data.summary);
      setRows(
        (data.data.products || []).map((p) => ({
          name: p.name,
          sku: p.sku,
          basePrice: p.basePrice,
          stock: p.stock,
          inStock: p.inStock ? "Yes" : "No",
          status: p.status,
          category: p.category?.name || "",
          ...(includeSales
            ? {
                salesQuantity: p.sales?.quantity || 0,
                salesRevenue: p.sales?.revenue || 0,
                salesOrders: p.sales?.orders || 0,
              }
            : {}),
        }))
      );
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to load products report"
      );
    } finally {
      setLoading(false);
    }
  }, [params, includeSales]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          allowClear
          placeholder="Status"
          value={status}
          onChange={setStatus}
          style={{ width: 140 }}
          options={["active", "inactive", "pending"].map((s) => ({
            value: s,
            label: titleCase(s),
          }))}
        />
        <Select
          allowClear
          placeholder="Stock"
          value={inStock}
          onChange={setInStock}
          style={{ width: 140 }}
          options={[
            { value: true, label: "In Stock" },
            { value: false, label: "Out of Stock" },
          ]}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Category"
          value={category}
          onChange={setCategory}
          style={{ width: 170 }}
          options={categories}
        />
        <Checkbox
          checked={includeSales}
          onChange={(e) => setIncludeSales(e.target.checked)}
        >
          Include sales data
        </Checkbox>
        {includeSales && (
          <RangePicker
            value={range}
            onChange={(v) => v && setRange(v)}
            allowClear={false}
          />
        )}
        <Button type="primary" loading={loading} onClick={load}>
          Refresh
        </Button>
        <Button
          icon={<IconDownload className="w-4 h-4" />}
          onClick={() =>
            downloadCsv(
              "/api/admin/reports/products",
              params,
              "products-report.csv"
            )
          }
        >
          Export CSV
        </Button>
      </div>

      {summary && (
        <StatRow
          items={[
            { title: "Total Products", value: summary.totalProducts },
            { title: "Active", value: summary.activeProducts },
            { title: "In Stock", value: summary.inStockProducts },
            { title: "Out of Stock", value: summary.outOfStockProducts },
            { title: "Total Stock Value", value: summary.totalValue, prefix: "₹" },
            ...(summary.totalSalesRevenue != null
              ? [{ title: "Sales Revenue", value: summary.totalSalesRevenue, prefix: "₹" }]
              : []),
          ].filter((it) => it.value !== undefined)}
        />
      )}

      <Card className="shadow-sm">
        <ReportGrid rows={rows} />
      </Card>
    </div>
  );
}

const CUSTOM_REPORT_TYPES = [
  { value: "sales-by-category", label: "Sales by Category", needsDates: true },
  { value: "customer-orders", label: "Top Customers by Orders", needsDates: true },
  { value: "product-performance", label: "Product Performance", needsDates: false },
  { value: "revenue-trends", label: "Revenue Trends", needsDates: true },
];

function CustomReportTab() {
  const [reportType, setReportType] = useState("revenue-trends");
  const [range, setRange] = useState([dayjs().subtract(29, "day"), dayjs()]);
  const [groupBy, setGroupBy] = useState("day");
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);

  const meta = CUSTOM_REPORT_TYPES.find((r) => r.value === reportType);

  const params = useMemo(() => {
    const p = { reportType, limit };
    if (meta?.needsDates) {
      p.startDate = range[0].startOf("day").toISOString();
      p.endDate = range[1].endOf("day").toISOString();
    }
    if (reportType === "revenue-trends") p.groupBy = groupBy;
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, range, groupBy, limit]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/reports/custom", {
        params,
        headers: authHeaders(),
      });
      if (!data?.success) throw new Error(data?.message);
      setSummary(data.data.summary);
      setRows(data.data.data || []);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to load custom report"
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={reportType}
          onChange={setReportType}
          style={{ width: 220 }}
          options={CUSTOM_REPORT_TYPES}
        />
        {meta?.needsDates && (
          <RangePicker
            value={range}
            onChange={(v) => v && setRange(v)}
            allowClear={false}
          />
        )}
        {reportType === "revenue-trends" && (
          <Select
            value={groupBy}
            onChange={setGroupBy}
            style={{ width: 150 }}
            options={[
              { value: "day", label: "By Day" },
              { value: "week", label: "By Week" },
              { value: "month", label: "By Month" },
            ]}
          />
        )}
        <InputNumber
          min={1}
          max={500}
          value={limit}
          onChange={(v) => setLimit(v || 100)}
          addonBefore="Limit"
          style={{ width: 140 }}
        />
        <Button type="primary" loading={loading} onClick={load}>
          Refresh
        </Button>
        <Button
          icon={<IconDownload className="w-4 h-4" />}
          onClick={() =>
            downloadCsv(
              "/api/admin/reports/custom",
              params,
              `custom-report-${reportType}.csv`
            )
          }
        >
          Export CSV
        </Button>
      </div>

      {summary && Object.keys(summary).length > 0 && (
        <StatRow
          items={Object.entries(summary).map(([k, v]) => ({
            title: titleCase(k),
            value: v,
            prefix: /revenue|spent/i.test(k) ? "₹" : undefined,
          }))}
        />
      )}

      <Card className="shadow-sm">
        <ReportGrid rows={rows} />
      </Card>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <AdminContent>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#1e9a58]/15 rounded-xl">
            <IconFileAnalytics className="w-6 h-6 text-[#1e9a58]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-sm text-gray-400">
              Sales, orders, products and custom analytics reports generated
              directly from live order/product data
            </p>
          </div>
        </div>

        <Tabs
          defaultActiveKey="sales"
          items={[
            { key: "sales", label: "Sales", children: <SalesReportTab /> },
            { key: "orders", label: "Orders", children: <OrdersReportTab /> },
            { key: "products", label: "Products", children: <ProductsReportTab /> },
            { key: "custom", label: "Custom Reports", children: <CustomReportTab /> },
          ]}
        />
      </motion.div>
    </AdminContent>
  );
}
