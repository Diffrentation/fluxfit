"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, Table, Tag, Button, Select, DatePicker, Statistic, Row, Col } from "antd";
import { IconDownload, IconCalculator } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const { RangePicker } = DatePicker;
const { Option } = Select;

const TaxManagement = () => {
  const [taxData] = useState([
    {
      id: 1,
      orderId: "ORD001",
      amount: 5000,
      gstRate: 18,
      cgst: 450,
      sgst: 450,
      igst: 0,
      totalTax: 900,
      date: "2024-05-15",
      state: "Maharashtra",
    },
    {
      id: 2,
      orderId: "ORD002",
      amount: 3000,
      gstRate: 18,
      cgst: 270,
      sgst: 270,
      igst: 0,
      totalTax: 540,
      date: "2024-05-16",
      state: "Maharashtra",
    },
    {
      id: 3,
      orderId: "ORD003",
      amount: 8000,
      gstRate: 18,
      cgst: 0,
      sgst: 0,
      igst: 1440,
      totalTax: 1440,
      date: "2024-05-17",
      state: "Delhi",
    },
  ]);

  const totalCGST = taxData.reduce((sum, item) => sum + item.cgst, 0);
  const totalSGST = taxData.reduce((sum, item) => sum + item.sgst, 0);
  const totalIGST = taxData.reduce((sum, item) => sum + item.igst, 0);
  const totalTax = taxData.reduce((sum, item) => sum + item.totalTax, 0);

  const columns = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      width: 120,
      render: (id) => <span className="font-mono">#{id}</span>,
    },
    {
      title: "Order Amount",
      dataIndex: "amount",
      key: "amount",
      width: 130,
      render: (amount) => <span className="font-semibold">₹{formatPrice(amount)}</span>,
    },
    {
      title: "GST Rate",
      dataIndex: "gstRate",
      key: "gstRate",
      width: 100,
      render: (rate) => <Tag color="blue">{rate}%</Tag>,
    },
    {
      title: "CGST (9%)",
      dataIndex: "cgst",
      key: "cgst",
      width: 120,
      render: (amount) => <span>₹{formatPrice(amount)}</span>,
    },
    {
      title: "SGST (9%)",
      dataIndex: "sgst",
      key: "sgst",
      width: 120,
      render: (amount) => <span>₹{formatPrice(amount)}</span>,
    },
    {
      title: "IGST (18%)",
      dataIndex: "igst",
      key: "igst",
      width: 120,
      render: (amount) => <span>₹{formatPrice(amount)}</span>,
    },
    {
      title: "Total Tax",
      dataIndex: "totalTax",
      key: "totalTax",
      width: 120,
      render: (amount) => (
        <span className="font-semibold text-purple-600">₹{formatPrice(amount)}</span>
      ),
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      width: 150,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) => format(new Date(date), "MMM dd, yyyy"),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total CGST"
              value={totalCGST}
              prefix={<IconCalculator className="w-4 h-4" />}
              formatter={(value) => `₹${formatPrice(value)}`}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total SGST"
              value={totalSGST}
              prefix={<IconCalculator className="w-4 h-4" />}
              formatter={(value) => `₹${formatPrice(value)}`}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total IGST"
              value={totalIGST}
              prefix={<IconCalculator className="w-4 h-4" />}
              formatter={(value) => `₹${formatPrice(value)}`}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Tax Collected"
              value={totalTax}
              prefix={<IconCalculator className="w-4 h-4" />}
              formatter={(value) => `₹${formatPrice(value)}`}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <Select placeholder="All States" style={{ width: 200 }} size="large">
          <Option value="all">All States</Option>
          <Option value="Maharashtra">Maharashtra</Option>
          <Option value="Delhi">Delhi</Option>
        </Select>
        <RangePicker size="large" format="YYYY-MM-DD" />
        <Button
          type="primary"
          icon={<IconDownload className="w-4 h-4" />}
          size="large"
        >
          Export Tax Report
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table
          dataSource={taxData.map((t) => ({ ...t, key: t.id }))}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} transactions`,
          }}
          scroll={{ x: 1200 }}
        />
      </div>
    </motion.div>
  );
};

export default TaxManagement;

