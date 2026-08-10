"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, Select, Row, Col, Statistic, Table, Tag, message } from "antd";
import { formatPrice } from "@/lib/formatPrice";

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

const FinanceOverview = () => {
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
                <Table
                  size="small"
                  rowKey="status"
                  pagination={false}
                  dataSource={data.ordersByStatus}
                  columns={[
                    {
                      title: "Status",
                      dataIndex: "status",
                      render: (v) => (
                        <Tag color={statusColor[v] || "default"} className="capitalize">
                          {v}
                        </Tag>
                      ),
                    },
                    { title: "Count", dataIndex: "count" },
                    {
                      title: "Total",
                      dataIndex: "total",
                      render: (v) => `₹${formatPrice(v)}`,
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Payments by Method" size="small">
                <Table
                  size="small"
                  rowKey="method"
                  pagination={false}
                  dataSource={data.paymentsByMethod}
                  columns={[
                    {
                      title: "Method",
                      dataIndex: "method",
                      render: (v) => <span className="uppercase">{v}</span>,
                    },
                    { title: "Count", dataIndex: "count" },
                    {
                      title: "Amount",
                      dataIndex: "amount",
                      render: (v) => `₹${formatPrice(v)}`,
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default FinanceOverview;
