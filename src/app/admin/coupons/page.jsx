"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useDebounce } from "@/hooks/useDebounce";
import { motion } from "framer-motion";
import AdminContent from "@/components/Admin/AdminContent";
import CouponList from "@/components/Admin/Coupons/CouponList";
import CouponForm from "@/components/Admin/Coupons/CouponForm";
import FlashSaleManager from "@/components/Admin/Coupons/FlashSaleManager";
import { Button, Tabs, Input, Select, message, Modal } from "antd";
import { IconPlus, IconSearch, IconTag } from "@tabler/icons-react";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// CouponList/CouponForm were built independently and expect slightly
// different field names for the same coupon (list wants `value`/`usedCount`/
// `status`, the form wants the real API names `discount`/`usageCount`/
// `isActive`) — map once here so neither child component needs to change.
function toDisplayCoupon(c) {
  const now = new Date();
  const status = c.isDeleted
    ? "deleted"
    : !c.isActive
      ? "inactive"
      : c.validUntil && now > new Date(c.validUntil)
        ? "expired"
        : "active";
  return {
    ...c,
    value: c.discount,
    usedCount: c.usageCount || 0,
    status,
    expiryDate: c.validUntil,
  };
}

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const CouponManagementPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("coupons");

  const loadCoupons = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin/coupons", {
        params: { limit: 100 },
        headers: authHeaders(),
      });
      if (!data?.success) throw new Error(data?.message || "Failed to load coupons");
      setCoupons((data.data.coupons || []).map(toDisplayCoupon));
    } catch (error) {
      console.error("Load coupons error:", error);
      message.error(error.response?.data?.message || "Failed to load coupons");
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    filterCoupons();
  }, [coupons, debouncedSearchQuery, statusFilter]);

  const filterCoupons = () => {
    let filtered = [...coupons];

    if (debouncedSearchQuery) {
      filtered = filtered.filter((coupon) =>
        coupon.code.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((coupon) => coupon.status === statusFilter);
    }

    setFilteredCoupons(filtered);
  };

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setIsFormVisible(true);
  };

  const handleEditCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setIsFormVisible(true);
  };

  const handleDeleteCoupon = (couponId) => {
    Modal.confirm({
      title: "Delete this coupon?",
      content: "This cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const { data } = await axios.delete(`/api/admin/coupons/${couponId}`, {
            headers: authHeaders(),
          });
          if (!data?.success) throw new Error(data?.message || "Failed to delete coupon");
          message.success("Coupon deleted successfully");
          loadCoupons();
        } catch (error) {
          console.error("Delete coupon error:", error);
          message.error(error.response?.data?.message || "Failed to delete coupon");
        }
      },
    });
  };

  // CouponForm performs the real create/update API call itself and passes
  // the saved coupon back here — this just needs to close the modal and
  // refresh the list.
  const handleSaveCoupon = () => {
    setIsFormVisible(false);
    setSelectedCoupon(null);
    loadCoupons();
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex">
        <AdminContent className="pt-20 lg:pt-16">
          <div className="p-4 md:p-6 pb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Coupon & Offer Management
                  </h1>
                  <p className="text-gray-600">
                    Create and manage discount coupons and flash sales
                  </p>
                </div>
              </div>

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: "coupons",
                    label: (
                      <span className="flex items-center gap-2">
                        <IconTag className="w-4 h-4" />
                        Coupons
                      </span>
                    ),
                    children: (
                      <div>
                        <div className="flex flex-col sm:flex-row gap-3 !bg-zinc-950 p-4 rounded-lg shadow-sm border border-zinc-800 mb-4">
                          <div className="flex-1">
                            <Search
                              placeholder="Search by coupon code"
                              allowClear
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              prefix={
                                <IconSearch className="w-4 h-4 text-gray-400" />
                              }
                              size="large"
                            />
                          </div>
                          <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: 150 }}
                            size="large"
                          >
                            <Option value="all">All Status</Option>
                            <Option value="active">Active</Option>
                            <Option value="expired">Expired</Option>
                            <Option value="inactive">Inactive</Option>
                          </Select>
                          <Button
                            type="primary"
                            icon={<IconPlus className="w-4 h-4" />}
                            onClick={handleAddCoupon}
                            size="large"
                          >
                            Add Coupon
                          </Button>
                        </div>
                        <CouponList
                          coupons={filteredCoupons}
                          onEdit={handleEditCoupon}
                          onDelete={handleDeleteCoupon}
                        />
                      </div>
                    ),
                  },
                  {
                    key: "flash-sales",
                    label: "Flash Sales",
                    children: <FlashSaleManager />,
                  },
                ]}
              />
            </motion.div>
          </div>
        </AdminContent>
      </div>

      <CouponForm
        visible={isFormVisible}
        coupon={selectedCoupon}
        onClose={() => {
          setIsFormVisible(false);
          setSelectedCoupon(null);
        }}
        onSave={handleSaveCoupon}
      />
    </div>
  );
};

export default CouponManagementPage;
