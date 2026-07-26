"use client";
import React from "react";
import { motion } from "framer-motion";
import Accordion from "./Accordion";
import { IconWallet, IconTagFilled } from "@tabler/icons-react";

const PriceFilter = ({ value, onChange, options }) => {
  return (
    <Accordion title="Price" icon={IconWallet} defaultOpen={true}>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {options.map((option, index) => {
          const isSelected = value === option.value;
          return (
            <motion.button
              key={option.value}
              onClick={() => onChange(option.value)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-center px-2 h-[36px] rounded-lg border transition-all ${
                isSelected
                  ? "bg-[#f4fbf7] border-[#1e9a58] text-[#1e9a58] shadow-sm font-bold"
                  : "bg-white border-gray-200 text-gray-700 hover:border-[#1e9a58] hover:shadow-sm font-medium"
              }`}
            >
              <span className="text-[12px] truncate">
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="bg-[#f4fbf7] rounded-lg p-2.5 flex gap-2 items-start border border-[#d1f4e0]">
        <IconTagFilled className="w-3.5 h-3.5 text-[#1e9a58] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#1B8A4D] leading-tight font-medium">
          Choose a price range that fits your budget perfectly.
        </p>
      </div>
    </Accordion>
  );
};

export default PriceFilter;
