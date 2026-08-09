import React from "react";
import Herobanner from "@/components/Home/Herobanner";
import RecentlyViewedProducts from "@/components/Home/RecentlyViewedProducts";
import WishlistPreview from "@/components/Home/WishlistPreview";
import ProductOverview from "@/components/Home/ProductOverview";
import WhyChooseUs from "@/components/Home/WhyChooseUs";
import GetInTouch from "@/components/GetInTouch/GetInTouch";
import connectDB from "@/lib/db";
import HeroBanner from "@/models/herobanner.model";
import Page from "@/models/page.model";

// Hero content is admin-editable, so always render the current data
// server-side rather than a statically-generated snapshot.
export const dynamic = "force-dynamic";

async function getHeroData() {
  try {
    await connectDB();

    const [banners, homePage] = await Promise.all([
      HeroBanner.find({ isActive: true })
        .sort({ order: 1, createdAt: 1 })
        .lean(),
      Page.findOne({ slug: "home" }).lean(),
    ]);

    return {
      slides: JSON.parse(JSON.stringify(banners)),
      pageData: homePage?.data ? JSON.parse(JSON.stringify(homePage.data)) : null,
    };
  } catch (error) {
    console.error("Failed to load hero data:", error);
    return { slides: [], pageData: null };
  }
}

async function page() {
  const { slides, pageData } = await getHeroData();

  return (
    <div className="pt-16 bg-gradient-to-b from-[#eef4ff] via-[#f8fbff] to-[#e6f0fe] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 min-h-screen overflow-x-hidden">
      <Herobanner initialSlides={slides} initialPageData={pageData} />
      <RecentlyViewedProducts />
      <WishlistPreview />
      <ProductOverview />
      <WhyChooseUs />
      <GetInTouch />
    </div>
  );
}

export default page;
