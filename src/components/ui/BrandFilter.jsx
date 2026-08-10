"use client";
import React from "react";
import { motion } from "framer-motion";
import Accordion from "./Accordion";
import { IconBuildingStore } from "@tabler/icons-react";

const BrandFilter = ({ value, onChange, brands }) => {
  if (!brands || brands.length === 0) return null;

  return (
    <Accordion title="Brand" icon={IconBuildingStore} defaultOpen={true}>
      <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
        {brands.map((brand, index) => {
          const isSelected = value === brand.id;
          return (
            <motion.button
              key={brand.id}
              onClick={() => onChange(isSelected ? null : brand.id)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? "bg-[#f4fbf7] border-[#1e9a58] text-[#1e9a58] font-bold"
                  : "bg-white border-gray-200 text-gray-700 hover:border-[#1e9a58] font-medium"
              }`}
            >
              <span className="text-[12px] truncate">{brand.name}</span>
              {typeof brand.productCount === "number" && (
                <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                  {brand.productCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </Accordion>
  );
};

export default BrandFilter;
