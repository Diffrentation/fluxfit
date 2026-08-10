"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import AdminContent from "@/components/Admin/AdminContent";
import PaymentHistory from "@/components/Admin/Payments/PaymentHistory";
import RefundManagement from "@/components/Admin/Payments/RefundManagement";
import SettlementReports from "@/components/Admin/Payments/SettlementReports";
import TaxManagement from "@/components/Admin/Payments/TaxManagement";
import CommissionTracking from "@/components/Admin/Payments/CommissionTracking";
import FraudDetection from "@/components/Admin/Payments/FraudDetection";
import FinanceOverview from "@/components/Admin/Payments/FinanceOverview";
import { Tabs, Card, Statistic, Row, Col, message } from "antd";
import {
  IconCurrencyRupee,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// PaymentHistory/RefundManagement/SettlementReports/TaxManagement were built
// against mock field names — map the real API responses onto those same
// names here so none of those presentational components need to change.
function toDisplayPayment(p) {
  return {
    id: p.id,
    orderId: p.order?.orderNumber || "",
    transactionId: p.transactionId || p.paymentId || p.id,
    amount: p.amount,
    method: p.method,
    status: p.status === "completed" ? "success" : p.status,
    fraudFlag: false,
    date: p.createdAt,
    customer: p.user?.name || "",
  };
}

function toDisplayRefund(r) {
  return {
    id: r.id,
    paymentId: r.paymentId,
    refundIndex: r.refundIndex,
    orderId: r.payment?.order?.orderNumber || "",
    amount: r.amount,
    reason: r.reason,
    status: r.status === "completed" ? "processed" : r.status,
    requestedDate: r.createdAt,
    processedDate: r.processedAt || null,
    customer: r.payment?.user
      ? `${r.payment.user.firstname || ""} ${r.payment.user.lastname || ""}`.trim()
      : "",
    // Razorpay refunds complete automatically via webhook; COD (and any
    // other non-gateway) refunds need the manual "Mark as Refunded" action
    // since there's nothing to auto-confirm them.
    gateway: r.payment?.gateway || null,
    method: r.payment?.method || null,
  };
}

function toDisplaySettlement(s) {
  const periodLabel =
    s.period?.startDate && s.period?.endDate
      ? `${new Date(s.period.startDate).toLocaleDateString()} – ${new Date(s.period.endDate).toLocaleDateString()}`
      : "";
  return {
    id: s.id,
    vendorId: s.vendor?.id || s.id,
    vendorName: s.vendor?.name?.trim() || "FluxFit",
    period: periodLabel,
    totalSales: s.summary?.totalSales ?? 0,
    commission: s.summary?.totalCommission ?? 0,
    tax: s.summary?.tax ?? 0,
    settlement: s.summary?.netAmount ?? 0,
    status: s.status || "pending",
    // No separate "due date" field on the model — the period's end date is
    // the natural point a settlement becomes payable.
    dueDate: s.period?.endDate || s.createdAt,
    processedDate: s.settlement?.processedAt || null,
  };
}

const PaymentManagementPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [taxData, setTaxData] = useState([]);
  const [fraudAlertCount, setFraudAlertCount] = useState(0);

  const loadPaymentsData = useCallback(async () => {
    try {
      const [paymentsRes, refundsRes, settlementsRes, taxRatesRes, fraudRes] =
        await Promise.allSettled([
          axios.get("/api/admin/payments", { params: { limit: 100 }, headers: authHeaders() }),
          axios.get("/api/admin/refunds", { params: { limit: 100 }, headers: authHeaders() }),
          axios.get("/api/admin/finance/settlements", { params: { limit: 100 }, headers: authHeaders() }),
          axios.get("/api/admin/settings/tax-rates", { headers: authHeaders() }),
          axios.get("/api/admin/finance/fraud-detection", { params: { limit: 1, status: "pending" }, headers: authHeaders() }),
        ]);

      if (paymentsRes.status === "fulfilled" && paymentsRes.value.data?.success) {
        setPayments((paymentsRes.value.data.data.payments || []).map(toDisplayPayment));
      }
      if (refundsRes.status === "fulfilled" && refundsRes.value.data?.success) {
        setRefunds((refundsRes.value.data.data.refunds || []).map(toDisplayRefund));
      }
      if (settlementsRes.status === "fulfilled" && settlementsRes.value.data?.success) {
        setSettlements(
          (settlementsRes.value.data.data.settlements || []).map(toDisplaySettlement)
        );
      }
      // Tax (GST) Management shows the real configured tax rates — there is
      // no separate per-order tax ledger endpoint, so this tab is a rate
      // configuration view rather than a collected-tax report.
      if (taxRatesRes.status === "fulfilled" && taxRatesRes.value.data?.success) {
        const rates = taxRatesRes.value.data.data?.taxRates || taxRatesRes.value.data.data || [];
        setTaxData(
          (Array.isArray(rates) ? rates : []).map((t) => ({
            id: t.id || t._id,
            orderId: t.code,
            amount: null,
            gstRate: t.rate,
            cgst: null,
            sgst: null,
            igst: null,
            totalTax: null,
            date: t.updatedAt,
            state: (t.states || []).join(", ") || "All states",
          }))
        );
      }
      if (fraudRes.status === "fulfilled" && fraudRes.value.data?.success) {
        setFraudAlertCount(fraudRes.value.data.data.statistics?.total || 0);
      }
    } catch (error) {
      console.error("Error loading payments data:", error);
      message.error("Failed to load some payment/finance data");
    }
  }, []);

  // Initial data load from multiple independent endpoints.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPaymentsData();
  }, [loadPaymentsData]);

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
      .reduce((sum, s) => sum + (s.settlement || 0), 0);
    // No per-order tax ledger endpoint exists — this tab shows configured
    // GST rates, not collected tax, so the stat reflects that.
    const activeTaxRates = taxData.length;

    return {
      totalRevenue,
      totalRefunds,
      pendingSettlements,
      activeTaxRates,
      fraudDetected: fraudAlertCount,
    };
  }, [payments, refunds, settlements, taxData, fraudAlertCount]);

  // RefundManagement performs the real approve/reject API calls itself and
  // just asks for a refresh afterward — same shape kept for the other tabs
  // in case they ever need a real mutation too.
  const handleUpdatePayments = useCallback(() => {
    loadPaymentsData();
  }, [loadPaymentsData]);

  const handleUpdateRefunds = useCallback(() => {
    loadPaymentsData();
  }, [loadPaymentsData]);

  const handleUpdateSettlements = useCallback(() => {
    loadPaymentsData();
  }, [loadPaymentsData]);

  const handleUpdateTaxData = useCallback(() => {
    loadPaymentsData();
  }, [loadPaymentsData]);

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      <div className="flex">
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
                <Card className="!bg-zinc-950 border-zinc-800 w-full min-w-0">
                  <Statistic
                    title="Total Revenue"
                    value={stats.totalRevenue}
                    prefix={<IconCurrencyRupee className="w-4 h-4" />}
                    formatter={(value) => `₹${formatPrice(value)}`}
                    valueStyle={{ color: "#3f8600" }}
                  />
                </Card>
                <Card className="!bg-zinc-950 border-zinc-800 w-full min-w-0">
                  <Statistic
                    title="Total Refunds"
                    value={stats.totalRefunds}
                    prefix={<IconTrendingDown className="w-4 h-4" />}
                    formatter={(value) => `₹${formatPrice(value)}`}
                    valueStyle={{ color: "#cf1322" }}
                  />
                </Card>
                <Card className="!bg-zinc-950 border-zinc-800 w-full min-w-0">
                  <Statistic
                    title="Pending Settlements"
                    value={stats.pendingSettlements}
                    prefix={<IconCurrencyRupee className="w-4 h-4" />}
                    formatter={(value) => `₹${formatPrice(value)}`}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
                <Card className="!bg-zinc-950 border-zinc-800 w-full min-w-0">
                  <Statistic
                    title="Active Tax Rates (GST)"
                    value={stats.activeTaxRates}
                    prefix={<IconTrendingUp className="w-4 h-4" />}
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
                        Review flagged activity in the Fraud Detection tab
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
                    key: "overview",
                    label: (
                      <span className="text-xs sm:text-sm md:text-base">
                        Overview
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <FinanceOverview />
                      </div>
                    ),
                  },
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
                  {
                    key: "commissions",
                    label: (
                      <span className="text-xs sm:text-sm md:text-base">
                        Commissions
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <CommissionTracking />
                      </div>
                    ),
                  },
                  {
                    key: "fraud",
                    label: (
                      <span className="text-xs sm:text-sm md:text-base">
                        Fraud Detection
                        {fraudAlertCount > 0 ? ` (${fraudAlertCount})` : ""}
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <FraudDetection />
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
