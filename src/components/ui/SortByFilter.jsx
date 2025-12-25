"use client";
import React from "react";
import { motion } from "framer-motion";

const SortByFilter = ({ value, onChange, options }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Sort By</h3>
      <div className="space-y-2">
        {options.map((option, index) => (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              value === option.value
                ? "bg-blue-500 text-white font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SortByFilter;

