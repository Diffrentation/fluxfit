import React from "react";
import Herobanner from "@/components/Home/Herobanner";
import RecentlyViewedProducts from "@/components/Home/RecentlyViewedProducts";
import WishlistPreview from "@/components/Home/WishlistPreview";
import ProductOverview from "@/components/Home/ProductOverview";
import WhyChooseUs from "@/components/Home/WhyChooseUs";
import GetInTouch from "@/components/GetInTouch/GetInTouch";

function page() {
  return (
    <div className="pt-16 bg-gradient-to-b from-[#eef4ff] via-[#f8fbff] to-[#e6f0fe] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 min-h-screen overflow-x-hidden">
      <Herobanner />
      <RecentlyViewedProducts />
      <WishlistPreview />
      <ProductOverview />
      <WhyChooseUs />
      <GetInTouch />
    </div>
  );
}

export default page;
