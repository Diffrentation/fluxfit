import React from "react";
import Herobanner from "@/components/Home/Herobanner";
import ProductOverview from "@/components/Home/ProductOverview";

function page() {
  return (
    <div className="pt-15">
      <Herobanner />
      <ProductOverview />
    </div>
  );
}

export default page;
