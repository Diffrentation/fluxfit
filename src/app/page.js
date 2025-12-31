import React from "react";
import Herobanner from "@/components/Home/Herobanner";
import RecentlyViewedProducts from "@/components/Home/RecentlyViewedProducts";
import WishlistPreview from "@/components/Home/WishlistPreview";
import ProductOverview from "@/components/Home/ProductOverview";
import GetInTouch from "@/components/GetInTouch/GetInTouch";

function page() {
  return (
    <div className="pt-15 bg-white dark:bg-gray-900 transition-colors duration-300 min-h-screen">
      <Herobanner />
      <RecentlyViewedProducts />
      <WishlistPreview />
      <ProductOverview />
      <GetInTouch />
    </div>
  );
}

export default page;
