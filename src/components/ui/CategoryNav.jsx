"use client";
import React from "react";
import { motion } from "framer-motion";

const CategoryNav = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="flex items-center gap-6 border-b border-gray-200 pb-4 mb-6">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`text-sm font-medium transition-colors pb-2 relative ${
            activeCategory === category
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {category}
          {activeCategory === category && (
            <motion.span
              layoutId="activeCategory"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
              initial={false}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default CategoryNav;

