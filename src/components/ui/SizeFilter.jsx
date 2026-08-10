"use client";
import React from "react";
import { motion } from "framer-motion";
import Accordion from "./Accordion";
import { IconRuler2 } from "@tabler/icons-react";

const SizeFilter = ({ value, onChange, sizes }) => {
  if (!sizes || sizes.length === 0) return null;

  return (
    <Accordion title="Size" icon={IconRuler2} defaultOpen={true}>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size, index) => {
          const isSelected = value === size;
          return (
            <motion.button
              key={size}
              onClick={() => onChange(isSelected ? null : size)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`min-w-[36px] h-8 px-2 rounded-lg border text-[12px] font-bold transition-all ${
                isSelected
                  ? "bg-[#1e9a58] text-white border-[#1e9a58] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1e9a58] hover:text-[#1e9a58]"
              }`}
            >
              {size}
            </motion.button>
          );
        })}
      </div>
    </Accordion>
  );
};

export default SizeFilter;
