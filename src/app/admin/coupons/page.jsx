"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import CouponList from "@/components/Admin/Coupons/CouponList";
import CouponForm from "@/components/Admin/Coupons/CouponForm";
import FlashSaleManager from "@/components/Admin/Coupons/FlashSaleManager";
import { Button, Tabs, Input, Select, message } from "antd";
import { IconPlus, IconSearch, IconTag } from "@tabler/icons-react";

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const CouponManagementPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("coupons");

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    filterCoupons();
  }, [coupons, searchQuery, statusFilter]);

  const loadCoupons = () => {
    // Mock data - in production, fetch from API
    const mockCoupons = [
      {
        id: 1,
        code: "WELCOME10",
        type: "percentage",
        value: 10,
        minPurchase: 1000,
        maxDiscount: 500,
        usageLimit: 100,
        usedCount: 45,
        expiryDate: "2024-12-31",
        status: "active",
        createdAt: "2024-01-01",
      },
      {
        id: 2,
        code: "FLAT500",
        type: "flat",
        value: 500,
        minPurchase: 2000,
        maxDiscount: null,
        usageLimit: 50,
        usedCount: 12,
        expiryDate: "2024-06-30",
        status: "active",
        createdAt: "2024-02-01",
      },
      {
        id: 3,
        code: "SUMMER20",
        type: "percentage",
        value: 20,
        minPurchase: 3000,
        maxDiscount: 1000,
        usageLimit: 200,
        usedCount: 200,
        expiryDate: "2024-08-31",
        status: "expired",
        createdAt: "2024-03-01",
      },
    ];
    setCoupons(mockCoupons);
  };

  const filterCoupons = () => {
    let filtered = [...coupons];

    if (searchQuery) {
      filtered = filtered.filter((coupon) =>
        coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
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
    message.success("Coupon deleted successfully");
    loadCoupons();
  };

  const handleSaveCoupon = (couponData) => {
    message.success(
      selectedCoupon
        ? "Coupon updated successfully"
        : "Coupon created successfully"
    );
    setIsFormVisible(false);
    setSelectedCoupon(null);
    loadCoupons();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar activeItem="coupons" />

        <div className="flex-1 ml-0 lg:ml-64 pt-20 lg:pt-16">
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
                        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
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
        </div>
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
