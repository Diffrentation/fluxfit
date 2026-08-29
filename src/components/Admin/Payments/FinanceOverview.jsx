"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, Select, Row, Col, Statistic, Tag, message } from "antd";
import { formatPrice } from "@/lib/formatPrice";
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

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const statusColor = {
  pending: "gold",
  confirmed: "blue",
  processing: "blue",
  shipped: "cyan",
  delivered: "green",
  cancelled: "red",
  returned: "orange",
};

const orderStatusColumnDefs = [
  {
    headerName: "Status",
    field: "status",
    flex: 1,
    cellRenderer: (p) => (
      <Tag color={statusColor[p.value] || "default"} className="capitalize">
        {p.value}
      </Tag>
    ),
  },
  { headerName: "Count", field: "count", flex: 1 },
  {
    headerName: "Total",
    field: "total",
    flex: 1,
    cellRenderer: (p) => `₹${formatPrice(p.value)}`,
  },
];

const paymentMethodColumnDefs = [
  {
    headerName: "Method",
    field: "method",
    flex: 1,
    cellRenderer: (p) => <span className="uppercase">{p.value}</span>,
  },
  { headerName: "Count", field: "count", flex: 1 },
  {
    headerName: "Amount",
    field: "amount",
    flex: 1,
    cellRenderer: (p) => `₹${formatPrice(p.value)}`,
  },
];

const FinanceOverview = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(id);
  }, []);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await axios.get("/api/admin/finance", {
        params: { period },
        headers: authHeaders(),
      });
      if (!res?.success) throw new Error(res?.message);
      setData(res.data);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to load finance overview"
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <Select
        value={period}
        onChange={setPeriod}
        style={{ width: 150 }}
        options={[
          { value: "day", label: "Today" },
          { value: "week", label: "Last 7 Days" },
          { value: "month", label: "This Month" },
          { value: "year", label: "This Year" },
        ]}
      />

      {data && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Card size="small" loading={loading}>
                <Statistic
                  title="Gross Revenue"
                  value={data.revenue.gross}
                  formatter={(v) => `₹${formatPrice(v)}`}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" loading={loading}>
                <Statistic
                  title="Net Revenue (after refunds)"
                  value={data.revenue.net}
                  formatter={(v) => `₹${formatPrice(v)}`}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" loading={loading}>
                <Statistic
                  title="Tax Collected"
                  value={data.revenue.taxCollected}
                  formatter={(v) => `₹${formatPrice(v)}`}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" loading={loading}>
                <Statistic title="Orders" value={data.revenue.orderCount} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Card size="small" loading={loading}>
                <Statistic
                  title="Refunded"
                  value={data.refunds.completedAmount}
                  formatter={(v) => `₹${formatPrice(v)}`}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" loading={loading}>
                <Statistic
                  title="Pending Settlements"
                  value={data.settlements.pendingAmount}
                  formatter={(v) => `₹${formatPrice(v)}`}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" loading={loading}>
                <Statistic
                  title="Avg Order Value"
                  value={data.revenue.averageOrderValue}
                  formatter={(v) => `₹${formatPrice(v)}`}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" loading={loading}>
                <Statistic
                  title="Discount Given"
                  value={data.revenue.discount}
                  formatter={(v) => `₹${formatPrice(v)}`}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Orders by Status" size="small">
                {isClient ? (
                  <div style={{ width: "100%", height: 280 }}>
                    <AgGridReact
                      theme={myDarkTheme}
                      modules={[AllCommunityModule]}
                      rowData={data.ordersByStatus}
                      columnDefs={orderStatusColumnDefs}
                      defaultColDef={{ sortable: true, resizable: true }}
                      getRowId={(p) => String(p.data.status)}
                      animateRows
                      rowHeight={40}
                      headerHeight={36}
                      suppressCellFocus
                      overlayNoRowsTemplate="No data"
                    />
                  </div>
                ) : (
                  <div className="h-[280px]" />
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Payments by Method" size="small">
                {isClient ? (
                  <div style={{ width: "100%", height: 280 }}>
                    <AgGridReact
                      theme={myDarkTheme}
                      modules={[AllCommunityModule]}
                      rowData={data.paymentsByMethod}
                      columnDefs={paymentMethodColumnDefs}
                      defaultColDef={{ sortable: true, resizable: true }}
                      getRowId={(p) => String(p.data.method)}
                      animateRows
                      rowHeight={40}
                      headerHeight={36}
                      suppressCellFocus
                      overlayNoRowsTemplate="No data"
                    />
                  </div>
                ) : (
                  <div className="h-[280px]" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default FinanceOverview;
