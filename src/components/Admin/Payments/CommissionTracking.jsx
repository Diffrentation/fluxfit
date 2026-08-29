"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Card, Select, Row, Col, Statistic, message } from "antd";
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

// FluxFit currently sells only its own catalog — there is no live vendor
// marketplace yet, so commission data will legitimately be empty until
// Settlement records with a vendor exist. This view surfaces whatever the
// real /api/admin/finance/commissions endpoint returns rather than mocking
// numbers, so it reads as "no data yet" instead of fake activity.
const CommissionTracking = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(id);
  }, []);
  const [period, setPeriod] = useState("month");
  const [groupBy, setGroupBy] = useState("vendor");
  const [loading, setLoading] = useState(false);
  const [overall, setOverall] = useState(null);
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/finance/commissions", {
        params: { period, groupBy },
        headers: authHeaders(),
      });
      if (!data?.success) throw new Error(data?.message);
      setOverall(data.data.overall);
      setRows(data.data.data || []);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Failed to load commission data"
      );
    } finally {
      setLoading(false);
    }
  }, [period, groupBy]);

  useEffect(() => {
    load();
  }, [load]);

  const columnDefs = useMemo(() => {
    if (groupBy === "vendor") {
      return [
        {
          headerName: "Vendor",
          field: "vendor",
          flex: 1,
          cellRenderer: (p) => p.value?.name || "Platform",
        },
        {
          headerName: "Total Sales",
          field: "totalSales",
          flex: 1,
          cellRenderer: (p) => `₹${formatPrice(p.value)}`,
        },
        {
          headerName: "Commission",
          field: "totalCommission",
          flex: 1,
          cellRenderer: (p) => `₹${formatPrice(p.value)}`,
        },
        { headerName: "Orders", field: "totalOrders", flex: 1 },
        {
          headerName: "Avg Rate",
          field: "averageCommissionRate",
          flex: 1,
          cellRenderer: (p) => `${p.value}%`,
        },
        { headerName: "Settlements", field: "settlementCount", flex: 1 },
      ];
    }
    if (groupBy === "settlement") {
      return [
        {
          headerName: "Vendor",
          field: "vendor",
          flex: 1,
          cellRenderer: (p) => p.value?.name || "Platform",
        },
        {
          headerName: "Period",
          field: "period",
          flex: 1,
          cellRenderer: (p) =>
            p.value?.startDate
              ? `${new Date(p.value.startDate).toLocaleDateString()} – ${new Date(p.value.endDate).toLocaleDateString()}`
              : "",
        },
        {
          headerName: "Total Sales",
          field: "totalSales",
          flex: 1,
          cellRenderer: (p) => `₹${formatPrice(p.value)}`,
        },
        {
          headerName: "Commission",
          field: "totalCommission",
          flex: 1,
          cellRenderer: (p) => `₹${formatPrice(p.value)}`,
        },
        { headerName: "Status", field: "status", flex: 1 },
      ];
    }
    return [
      { headerName: "Period", field: "period", flex: 1 },
      {
        headerName: "Total Sales",
        field: "totalSales",
        flex: 1,
        cellRenderer: (p) => `₹${formatPrice(p.value)}`,
      },
      {
        headerName: "Commission",
        field: "totalCommission",
        flex: 1,
        cellRenderer: (p) => `₹${formatPrice(p.value)}`,
      },
      { headerName: "Orders", field: "totalOrders", flex: 1 },
      { headerName: "Settlements", field: "settlementCount", flex: 1 },
    ];
  }, [groupBy]);

  const rowData = useMemo(
    () =>
      rows.map((r, i) => ({
        ...r,
        __rowKey: String(r.vendor?.id || r.settlementId || r.period || i),
      })),
    [rows]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
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
        <Select
          value={groupBy}
          onChange={setGroupBy}
          style={{ width: 170 }}
          options={[
            { value: "vendor", label: "Group by Vendor" },
            { value: "period", label: "Group by Period" },
            { value: "settlement", label: "Group by Settlement" },
          ]}
        />
      </div>

      {overall && (
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic
                title="Total Sales"
                value={overall.totalSales}
                formatter={(v) => `₹${formatPrice(v)}`}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic
                title="Total Commission"
                value={overall.totalCommission}
                formatter={(v) => `₹${formatPrice(v)}`}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic title="Orders" value={overall.totalOrders} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic
                title="Commission %"
                value={overall.commissionPercentage}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        {isClient ? (
          <div style={{ width: "100%", height: 400 }}>
            <AgGridReact
              theme={myDarkTheme}
              modules={[AllCommunityModule]}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={{ sortable: true, resizable: true }}
              getRowId={(p) => p.data.__rowKey}
              animateRows
              rowHeight={48}
              headerHeight={40}
              loading={loading}
              suppressCellFocus
              overlayNoRowsTemplate="No vendor settlement/commission records yet — FluxFit currently sells only its own catalog, so this fills in once a multi-vendor settlement flow is used"
            />
          </div>
        ) : (
          <div className="h-[400px]" />
        )}
      </Card>
    </div>
  );
};

export default CommissionTracking;
