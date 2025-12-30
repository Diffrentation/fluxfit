"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table, Tag, Button, Select, DatePicker, Card, Statistic, Row, Col } from "antd";
import { IconDownload, IconCurrencyRupee } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const { RangePicker } = DatePicker;
const { Option } = Select;

const SettlementReports = () => {
  const [settlements] = useState([
    {
      id: 1,
      vendorId: "V001",
      vendorName: "Vendor A",
      period: "2024-05",
      totalSales: 50000,
      commission: 5000,
      tax: 9000,
      settlement: 36000,
      status: "pending",
      dueDate: "2024-06-05",
    },
    {
      id: 2,
      vendorId: "V002",
      vendorName: "Vendor B",
      period: "2024-05",
      totalSales: 30000,
      commission: 3000,
      tax: 5400,
      settlement: 21600,
      status: "processed",
      dueDate: "2024-06-05",
      processedDate: "2024-06-01",
    },
  ]);

  const getStatusColor = (status) => {
    const colors = {
      pending: "orange",
      processed: "green",
      failed: "red",
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Vendor ID",
      dataIndex: "vendorId",
      key: "vendorId",
      width: 100,
      render: (id) => <span className="font-mono">#{id}</span>,
    },
    {
      title: "Vendor Name",
      dataIndex: "vendorName",
      key: "vendorName",
      width: 150,
    },
    {
      title: "Period",
      dataIndex: "period",
      key: "period",
      width: 120,
    },
    {
      title: "Total Sales",
      dataIndex: "totalSales",
      key: "totalSales",
      width: 120,
      render: (amount) => <span className="font-semibold">₹{formatPrice(amount)}</span>,
    },
    {
      title: "Commission (10%)",
      dataIndex: "commission",
      key: "commission",
      width: 130,
      render: (amount) => <span className="text-gray-600">₹{formatPrice(amount)}</span>,
    },
    {
      title: "Tax (GST)",
      dataIndex: "tax",
      key: "tax",
      width: 120,
      render: (amount) => <span className="text-gray-600">₹{formatPrice(amount)}</span>,
    },
    {
      title: "Settlement Amount",
      dataIndex: "settlement",
      key: "settlement",
      width: 150,
      render: (amount) => (
        <span className="font-semibold text-green-600">₹{formatPrice(amount)}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (date) => format(new Date(date), "MMM dd, yyyy"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="text"
          icon={<IconDownload className="w-4 h-4" />}
          onClick={() => {
            // Export settlement report
            console.log("Export settlement", record);
          }}
        >
          Export
        </Button>
      ),
    },
  ];

  const totalPending = settlements
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.settlement, 0);
  const totalProcessed = settlements
    .filter((s) => s.status === "processed")
    .reduce((sum, s) => sum + s.settlement, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Settlements"
              value={totalPending}
              prefix={<IconCurrencyRupee className="w-4 h-4" />}
              formatter={(value) => `₹${formatPrice(value)}`}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Processed This Month"
              value={totalProcessed}
              prefix={<IconCurrencyRupee className="w-4 h-4" />}
              formatter={(value) => `₹${formatPrice(value)}`}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Vendors"
              value={settlements.length}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <Select placeholder="All Vendors" style={{ width: 200 }} size="large">
          <Option value="all">All Vendors</Option>
          <Option value="V001">Vendor A</Option>
          <Option value="V002">Vendor B</Option>
        </Select>
        <Select placeholder="All Status" style={{ width: 150 }} size="large">
          <Option value="all">All Status</Option>
          <Option value="pending">Pending</Option>
          <Option value="processed">Processed</Option>
        </Select>
        <RangePicker size="large" format="YYYY-MM-DD" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table
          dataSource={settlements.map((s) => ({ ...s, key: s.id }))}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} settlements`,
          }}
          scroll={{ x: 1200 }}
        />
      </div>
    </motion.div>
  );
};

export default SettlementReports;

