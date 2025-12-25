"use client";
import React from "react";
import { motion } from "framer-motion";

const ColorFilter = ({ value, onChange, colors }) => {
  const colorMap = {
    black: "bg-black",
    grey: "bg-gray-400",
    green: "bg-green-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    white: "bg-white border-2 border-gray-300",
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Color</h3>
      <div className="flex flex-wrap gap-3">
        {colors.map((color, index) => (
          <motion.button
            key={color}
            onClick={() => onChange(color)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-8 h-8 rounded-full ${colorMap[color.toLowerCase()]} transition-all ${
              value === color
                ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
                : ""
            }`}
            aria-label={color}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorFilter;

