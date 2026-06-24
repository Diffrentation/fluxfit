"use client";
import React from "react";
import { motion } from "framer-motion";
import { IconPalette } from "@tabler/icons-react";

const ColorFilter = ({ value, onChange, colors }) => {
  const colorMap = {
    black: "bg-black",
    grey: "bg-gray-400",
    green: "bg-green-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    white: "bg-white border border-gray-200",
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-extrabold text-[#0d1c2f]">Color</h3>
        <IconPalette className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 mb-6">
        <div className="flex flex-wrap gap-4">
          {colors.map((color, index) => {
            const isSelected = value === color;
            return (
              <motion.button
                key={color}
                onClick={() => onChange(color)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2"
              >
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
                  isSelected ? "border-[#1e9a58] ring-1 ring-[#1e9a58] shadow-sm bg-[#f2fcf6]" : "border-gray-200 hover:border-gray-300 bg-white"
                }`}>
                  <div className={`w-7 h-7 rounded-full shadow-sm ${colorMap[color.toLowerCase()]}`} />
                </div>
                <span className={`text-xs font-medium ${isSelected ? "text-[#1e9a58]" : "text-gray-600"}`}>
                  {color}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="mt-auto bg-blue-50 rounded-xl p-4 flex gap-3 items-start border border-blue-100">
        <IconPalette className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-blue-800 mb-0.5">Filter by color</span>
          <p className="text-xs text-blue-600 leading-relaxed">
            Select your preferred colors to narrow down results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ColorFilter;
