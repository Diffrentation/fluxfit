"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminContent from "@/components/Admin/AdminContent";
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

const PaymentManagementPage = () => {
  const [activeTab, setActiveTab] = useState("history");
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [taxData, setTaxData] = useState([]);

  // Load data from localStorage on mount
  useEffect(() => {
    loadPaymentsData();
  }, []);

  const loadPaymentsData = useCallback(() => {
    try {
      // Load payments
      const storedPayments = localStorage.getItem("adminPayments");
      if (storedPayments) {
        const parsed = JSON.parse(storedPayments);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPayments(parsed);
        }
      } else {
        // Initialize with mock data
        const mockPayments = [
          {
            id: 1,
            orderId: "ORD001",
            transactionId: "TXN123456",
            amount: 5000,
            method: "credit_card",
            status: "success",
            fraudFlag: false,
            date: "2024-05-15",
            customer: "John Doe",
          },
          {
            id: 2,
            orderId: "ORD002",
            transactionId: "TXN123457",
            amount: 3000,
            method: "upi",
            status: "success",
            fraudFlag: true,
            date: "2024-05-16",
            customer: "Jane Smith",
          },
          {
            id: 3,
            orderId: "ORD003",
            transactionId: "TXN123458",
            amount: 8000,
            method: "debit_card",
            status: "failed",
            fraudFlag: false,
            date: "2024-05-17",
            customer: "Bob Johnson",
          },
        ];
        setPayments(mockPayments);
        localStorage.setItem("adminPayments", JSON.stringify(mockPayments));
      }

      // Load refunds
      const storedRefunds = localStorage.getItem("adminRefunds");
      if (storedRefunds) {
        const parsed = JSON.parse(storedRefunds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRefunds(parsed);
        }
      } else {
        const mockRefunds = [
          {
            id: 1,
            orderId: "ORD001",
            amount: 5000,
            reason: "Product damaged",
            status: "pending",
            requestedDate: "2024-05-15",
            customer: "John Doe",
          },
          {
            id: 2,
            orderId: "ORD002",
            amount: 3000,
            reason: "Wrong item received",
            status: "approved",
            requestedDate: "2024-05-14",
            processedDate: "2024-05-16",
            customer: "Jane Smith",
          },
        ];
        setRefunds(mockRefunds);
        localStorage.setItem("adminRefunds", JSON.stringify(mockRefunds));
      }

      // Load settlements
      const storedSettlements = localStorage.getItem("adminSettlements");
      if (storedSettlements) {
        const parsed = JSON.parse(storedSettlements);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSettlements(parsed);
        }
      } else {
        const mockSettlements = [
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
        ];
        setSettlements(mockSettlements);
        localStorage.setItem(
          "adminSettlements",
          JSON.stringify(mockSettlements)
        );
      }

      // Load tax data
      const storedTaxData = localStorage.getItem("adminTaxData");
      if (storedTaxData) {
        const parsed = JSON.parse(storedTaxData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTaxData(parsed);
        }
      } else {
        const mockTaxData = [
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
        ];
        setTaxData(mockTaxData);
        localStorage.setItem("adminTaxData", JSON.stringify(mockTaxData));
      }
    } catch (error) {
      console.error("Error loading payments data:", error);
    }
  }, []);

  // Save payments to localStorage whenever payments state changes
  useEffect(() => {
    try {
      localStorage.setItem("adminPayments", JSON.stringify(payments));
    } catch (error) {
      console.error("Error saving payments:", error);
    }
  }, [payments]);

  // Save refunds to localStorage whenever refunds state changes
  useEffect(() => {
    try {
      localStorage.setItem("adminRefunds", JSON.stringify(refunds));
    } catch (error) {
      console.error("Error saving refunds:", error);
    }
  }, [refunds]);

  // Save settlements to localStorage whenever settlements state changes
  useEffect(() => {
    try {
      localStorage.setItem("adminSettlements", JSON.stringify(settlements));
    } catch (error) {
      console.error("Error saving settlements:", error);
    }
  }, [settlements]);

  // Save tax data to localStorage whenever taxData state changes
  useEffect(() => {
    try {
      localStorage.setItem("adminTaxData", JSON.stringify(taxData));
    } catch (error) {
      console.error("Error saving tax data:", error);
    }
  }, [taxData]);

  // Calculate stats from data
  const stats = useMemo(() => {
    const totalRevenue = payments
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalRefunds = refunds
      .filter((r) => r.status === "approved" || r.status === "processed")
      .reduce((sum, r) => sum + r.amount, 0);
    const pendingSettlements = settlements
      .filter((s) => s.status === "pending")
      .reduce((sum, s) => sum + s.settlement, 0);
    const taxCollected = taxData.reduce((sum, t) => sum + t.totalTax, 0);
    const fraudDetected = payments.filter((p) => p.fraudFlag).length;

    return {
      totalRevenue,
      totalRefunds,
      pendingSettlements,
      taxCollected,
      fraudDetected,
    };
  }, [payments, refunds, settlements, taxData]);

  const handleUpdatePayments = useCallback((updatedPayments) => {
    setPayments(updatedPayments);
  }, []);

  const handleUpdateRefunds = useCallback((updatedRefunds) => {
    setRefunds(updatedRefunds);
  }, []);

  const handleUpdateSettlements = useCallback((updatedSettlements) => {
    setSettlements(updatedSettlements);
  }, []);

  const handleUpdateTaxData = useCallback((updatedTaxData) => {
    setTaxData(updatedTaxData);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        <AdminSidebar activeItem="payments" />

        <AdminContent>
          <div className="p-2 sm:p-4 md:p-6 pb-4 sm:pb-6 md:pb-8 w-full overflow-x-hidden">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 md:mb-6"
            >
              <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Payment & Finance Management
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
                    Manage payments, refunds, settlements, and tax calculations
                  </p>
                </div>
              </div>

              {/* Statistics Cards - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6 w-full">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full min-w-0">
                  <Statistic
                    title="Total Revenue"
                    value={stats.totalRevenue}
                    prefix={<IconCurrencyRupee className="w-4 h-4" />}
                    formatter={(value) => `₹${formatPrice(value)}`}
                    valueStyle={{ color: "#3f8600" }}
                  />
                </Card>
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full min-w-0">
                  <Statistic
                    title="Total Refunds"
                    value={stats.totalRefunds}
                    prefix={<IconTrendingDown className="w-4 h-4" />}
                    formatter={(value) => `₹${formatPrice(value)}`}
                    valueStyle={{ color: "#cf1322" }}
                  />
                </Card>
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full min-w-0">
                  <Statistic
                    title="Pending Settlements"
                    value={stats.pendingSettlements}
                    prefix={<IconCurrencyRupee className="w-4 h-4" />}
                    formatter={(value) => `₹${formatPrice(value)}`}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full min-w-0">
                  <Statistic
                    title="Tax Collected (GST)"
                    value={stats.taxCollected}
                    prefix={<IconTrendingUp className="w-4 h-4" />}
                    formatter={(value) => `₹${formatPrice(value)}`}
                    valueStyle={{ color: "#722ed1" }}
                  />
                </Card>
              </div>

              {/* Fraud Alert */}
              {stats.fraudDetected > 0 && (
                <Card className="mb-3 sm:mb-4 md:mb-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <IconAlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm sm:text-base text-orange-900 dark:text-orange-200">
                        {stats.fraudDetected} Potential Fraud Cases Detected
                      </div>
                      <div className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">
                        Review flagged transactions in Payment History
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                className="payment-tabs"
                items={[
                  {
                    key: "history",
                    label: (
                      <span className="text-xs sm:text-sm md:text-base">
                        Payment History
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <PaymentHistory
                          payments={payments}
                          onUpdatePayments={handleUpdatePayments}
                        />
                      </div>
                    ),
                  },
                  {
                    key: "refunds",
                    label: (
                      <span className="text-xs sm:text-sm md:text-base">
                        Refund Management
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <RefundManagement
                          refunds={refunds}
                          onUpdateRefunds={handleUpdateRefunds}
                        />
                      </div>
                    ),
                  },
                  {
                    key: "settlements",
                    label: (
                      <span className="text-xs sm:text-sm md:text-base">
                        Settlement Reports
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <SettlementReports
                          settlements={settlements}
                          onUpdateSettlements={handleUpdateSettlements}
                        />
                      </div>
                    ),
                  },
                  {
                    key: "tax",
                    label: (
                      <span className="text-xs sm:text-sm md:text-base">
                        Tax (GST) Management
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <TaxManagement
                          taxData={taxData}
                          onUpdateTaxData={handleUpdateTaxData}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </motion.div>
          </div>
        </AdminContent>
      </div>
    </div>
  );
};

export default PaymentManagementPage;
