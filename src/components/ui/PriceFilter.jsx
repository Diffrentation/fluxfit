"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  IconWallet,
  IconCircle,
  IconCircleCheckFilled,
  IconTagFilled
} from "@tabler/icons-react";

const PriceFilter = ({ value, onChange, options }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-extrabold text-[#0d1c2f]">Price</h3>
        <IconWallet className="w-4 h-4 text-[#1e9a58]" />
      </div>
      <div className="flex-1 space-y-2 mb-6">
        {options.map((option, index) => {
          const isSelected = value === option.value;
          return (
            <motion.button
              key={option.value}
              onClick={() => onChange(option.value)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                isSelected
                  ? "bg-[#f2fcf6] border-[#1e9a58] shadow-sm"
                  : "bg-white border-gray-200 hover:border-[#1e9a58] hover:shadow-sm"
              }`}
            >
              <div className="flex flex-col items-start">
                <span className={`text-sm font-semibold ${isSelected ? "text-[#1e9a58]" : "text-gray-700"}`}>
                  {option.label}
                </span>
                {option.value === "all" && (
                  <span className={`text-xs mt-0.5 transition-opacity duration-200 ${isSelected ? "text-[#1e9a58] opacity-80" : "opacity-0"}`}>
                    Show all products
                  </span>
                )}
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
      <div className="mt-auto bg-[#f2fcf6] rounded-xl p-4 flex gap-3 items-start border border-[#d1f4e0]">
        <IconTagFilled className="w-5 h-5 text-[#1e9a58] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#1B8A4D] leading-relaxed font-medium">
          Choose a price range that fits your budget.
        </p>
      </div>
    </div>
  );
};

export default PriceFilter;
