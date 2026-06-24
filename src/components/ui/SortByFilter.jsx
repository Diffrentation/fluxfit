"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  IconArrowsSort,
  IconAdjustmentsHorizontal,
  IconNewSection,
  IconFlame,
  IconStar,
  IconTrendingUp,
  IconTrendingDown,
  IconCircle,
  IconCircleCheckFilled,
  IconInfoCircleFilled
} from "@tabler/icons-react";

const getSortIcon = (value) => {
  switch (value) {
    case "default": return IconAdjustmentsHorizontal;
    case "newness": return IconNewSection;
    case "popularity": return IconFlame;
    case "rating": return IconStar;
    case "price-low": return IconTrendingUp;
    case "price-high": return IconTrendingDown;
    default: return IconAdjustmentsHorizontal;
  }
};

const SortByFilter = ({ value, onChange, options }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-extrabold text-[#0d1c2f]">Sort By</h3>
        <IconArrowsSort className="w-4 h-4 text-[#1e9a58]" />
      </div>
      <div className="flex-1 space-y-2 mb-6">
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const Icon = getSortIcon(option.value);
          return (
            <motion.button
              key={option.value}
              onClick={() => onChange(option.value)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                isSelected
                  ? "bg-[#f2fcf6] border-[#1e9a58] text-[#1e9a58] shadow-sm"
                  : "bg-white border-gray-200 text-gray-700 hover:border-[#1e9a58] hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-md ${isSelected ? "bg-[#1e9a58] text-white" : "text-gray-500"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-semibold">{option.label}</span>
              </div>
              {isSelected ? (
                <IconCircleCheckFilled className="w-5 h-5 text-[#1e9a58]" />
              ) : (
                <IconCircle className="w-5 h-5 text-gray-300" />
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-auto bg-[#f0f4f8] rounded-xl p-4 flex gap-3 items-start border border-gray-100">
        <IconInfoCircleFilled className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 leading-relaxed font-medium">
          Sort products based on latest additions to our collection.
        </p>
      </div>
    </div>
  );
};

export default SortByFilter;
