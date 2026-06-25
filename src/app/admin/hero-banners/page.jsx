"use client";
import React from "react";
import AdminContent from "@/components/Admin/AdminContent";
import HeroBannerManagement from "@/components/Admin/HeroBanners/HeroBannerManagement";

export default function HeroBannersAdminPage() {
  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      <AdminContent>
        <HeroBannerManagement />
      </AdminContent>
    </div>
  );
}
