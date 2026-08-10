"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Card, Select, Row, Col, Statistic, Table, Empty, message } from "antd";
import { formatPrice } from "@/lib/formatPrice";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// FluxFit currently sells only its own catalog — there is no live vendor
// marketplace yet, so commission data will legitimately be empty until
// Settlement records with a vendor exist. This view surfaces whatever the
// real /api/admin/finance/commissions endpoint returns rather than mocking
// numbers, so it reads as "no data yet" instead of fake activity.
const CommissionTracking = () => {
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

  const columns = useMemo(() => {
    if (groupBy === "vendor") {
      return [
        {
          title: "Vendor",
          dataIndex: "vendor",
          render: (v) => v?.name || "Platform",
        },
        {
          title: "Total Sales",
          dataIndex: "totalSales",
          render: (v) => `₹${formatPrice(v)}`,
        },
        {
          title: "Commission",
          dataIndex: "totalCommission",
          render: (v) => `₹${formatPrice(v)}`,
        },
        { title: "Orders", dataIndex: "totalOrders" },
        {
          title: "Avg Rate",
          dataIndex: "averageCommissionRate",
          render: (v) => `${v}%`,
        },
        { title: "Settlements", dataIndex: "settlementCount" },
      ];
    }
    if (groupBy === "settlement") {
      return [
        {
          title: "Vendor",
          dataIndex: "vendor",
          render: (v) => v?.name || "Platform",
        },
        {
          title: "Period",
          dataIndex: "period",
          render: (p) =>
            p?.startDate
              ? `${new Date(p.startDate).toLocaleDateString()} – ${new Date(p.endDate).toLocaleDateString()}`
              : "",
        },
        {
          title: "Total Sales",
          dataIndex: "totalSales",
          render: (v) => `₹${formatPrice(v)}`,
        },
        {
          title: "Commission",
          dataIndex: "totalCommission",
          render: (v) => `₹${formatPrice(v)}`,
        },
        { title: "Status", dataIndex: "status" },
      ];
    }
    return [
      { title: "Period", dataIndex: "period" },
      {
        title: "Total Sales",
        dataIndex: "totalSales",
        render: (v) => `₹${formatPrice(v)}`,
      },
      {
        title: "Commission",
        dataIndex: "totalCommission",
        render: (v) => `₹${formatPrice(v)}`,
      },
      { title: "Orders", dataIndex: "totalOrders" },
      { title: "Settlements", dataIndex: "settlementCount" },
    ];
  }, [groupBy]);

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
        <Table
          rowKey={(r, i) => r.vendor?.id || r.settlementId || r.period || i}
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                description="No vendor settlement/commission records yet — FluxFit currently sells only its own catalog, so this fills in once a multi-vendor settlement flow is used"
              />
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default CommissionTracking;
