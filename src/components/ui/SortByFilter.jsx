"use client";
import React from "react";
import { motion } from "framer-motion";
import Accordion from "./Accordion";
import {
  IconArrowsSort,
  IconAdjustmentsHorizontal,
  IconNewSection,
  IconFlame,
  IconStar,
  IconTrendingUp,
  IconTrendingDown,
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
    <Accordion title="Sort By" icon={IconArrowsSort} defaultOpen={true}>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const Icon = getSortIcon(option.value);
          return (
            <motion.button
              key={option.value}
              onClick={() => onChange(option.value)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-center gap-1.5 px-2 h-[36px] rounded-lg border text-[12px] transition-all ${
                isSelected
                  ? "bg-[#f4fbf7] border-[#1e9a58] text-[#1e9a58] font-bold shadow-sm"
                  : "bg-white border-gray-200 text-gray-700 hover:border-[#1e9a58] font-medium"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{option.label}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="bg-[#f0f4f8] rounded-lg p-2.5 flex gap-2 items-start border border-gray-100">
        <IconInfoCircleFilled className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-600 leading-tight">
          Sort products based on latest additions or price to match your needs.
        </p>
      </div>
    </Accordion>
  );
};

export default SortByFilter;
