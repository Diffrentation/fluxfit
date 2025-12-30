"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import PaymentHistory from "@/components/Admin/Payments/PaymentHistory";
import RefundManagement from "@/components/Admin/Payments/RefundManagement";
import SettlementReports from "@/components/Admin/Payments/SettlementReports";
import TaxManagement from "@/components/Admin/Payments/TaxManagement";
import { Tabs, Card, Statistic, Row, Col } from "antd";
import {
  IconCurrencyRupee,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";

const { TabPane } = Tabs;

const PaymentManagementPage = () => {
  const [activeTab, setActiveTab] = useState("history");
  const [stats, setStats] = useState({
    totalRevenue: 1250000,
    totalRefunds: 45000,
    pendingSettlements: 125000,
    taxCollected: 225000,
    fraudDetected: 3,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar activeItem="payments" />

        <div className="flex-1 ml-0 lg:ml-64 pt-20 lg:pt-16">
          <div className="p-4 md:p-6 pb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Payment & Finance Management
                </h1>
                <p className="text-gray-600">
                  Manage payments, refunds, settlements, and tax calculations
                </p>
              </div>

              {/* Statistics Cards */}
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Total Revenue"
                      value={stats.totalRevenue}
                      prefix={<IconCurrencyRupee className="w-4 h-4" />}
                      formatter={(value) => `₹${formatPrice(value)}`}
                      valueStyle={{ color: "#3f8600" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Total Refunds"
                      value={stats.totalRefunds}
                      prefix={<IconTrendingDown className="w-4 h-4" />}
                      formatter={(value) => `₹${formatPrice(value)}`}
                      valueStyle={{ color: "#cf1322" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Pending Settlements"
                      value={stats.pendingSettlements}
                      prefix={<IconCurrencyRupee className="w-4 h-4" />}
                      formatter={(value) => `₹${formatPrice(value)}`}
                      valueStyle={{ color: "#1890ff" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Tax Collected (GST)"
                      value={stats.taxCollected}
                      prefix={<IconTrendingUp className="w-4 h-4" />}
                      formatter={(value) => `₹${formatPrice(value)}`}
                      valueStyle={{ color: "#722ed1" }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Fraud Alert */}
              {stats.fraudDetected > 0 && (
                <Card className="mb-6 border-orange-200 bg-orange-50">
                  <div className="flex items-center gap-3">
                    <IconAlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-semibold text-orange-900">
                        {stats.fraudDetected} Potential Fraud Cases Detected
                      </div>
                      <div className="text-sm text-orange-700">
                        Review flagged transactions in Payment History
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="Payment History" key="history">
                  <PaymentHistory />
                </TabPane>
                <TabPane tab="Refund Management" key="refunds">
                  <RefundManagement />
                </TabPane>
                <TabPane tab="Settlement Reports" key="settlements">
                  <SettlementReports />
                </TabPane>
                <TabPane tab="Tax (GST) Management" key="tax">
                  <TaxManagement />
                </TabPane>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagementPage;

