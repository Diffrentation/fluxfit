import React from "react";
import Herobanner from "@/components/Home/Herobanner";
import ProductOverview from "@/components/Home/ProductOverview";
import GetInTouch from "@/components/GetInTouch/GetInTouch";

function page() {
  return (
    <div className="pt-15">
      <Herobanner />
      <ProductOverview />
      <GetInTouch />
    </div>
  );
}

export default page;
