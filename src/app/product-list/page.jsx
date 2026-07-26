"use client";

import React, { Suspense } from "react";
import ProductOverview from "@/components/Home/ProductOverview";
import GetInTouch from "@/components/GetInTouch/GetInTouch";
import { Spin } from "antd";

export const dynamic = "force-dynamic";

function ProductListFallback() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-10 flex justify-center items-center">
      <Spin size="large" tip="Loading..." />
    </div>
  );
}

export default function ProductListPage() {
  return (
    <Suspense fallback={<ProductListFallback />}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-4 transition-colors duration-300">
        <ProductOverview />
        <GetInTouch />
      </div>
    </Suspense>
  );
}
