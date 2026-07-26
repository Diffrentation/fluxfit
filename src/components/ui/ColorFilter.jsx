"use client";
import React from "react";
import { motion } from "framer-motion";
import Accordion from "./Accordion";
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
    <Accordion title="Color" icon={IconPalette} defaultOpen={true}>
      <div className="flex flex-wrap gap-3">
        {colors.map((color, index) => {
          const isSelected = value === color;
          return (
            <motion.button
              key={color}
              onClick={() => onChange(color)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={color}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                isSelected 
                  ? "border-[#1e9a58] ring-2 ring-[#1e9a58] ring-offset-1 bg-white" 
                  : "border-gray-200 hover:border-gray-400 bg-white"
              }`}
            >
              <div className={`w-6 h-6 rounded-full shadow-sm ${colorMap[color.toLowerCase()]}`} />
            </motion.button>
          );
        })}
      </div>
    </Accordion>
  );
};

export default ColorFilter;
