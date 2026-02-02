"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Spin, message } from "antd";

const CategoryNav = ({ activeCategory, onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH CATEGORIES ---------------- */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await axios.get("/api/categories", {
        params: {
          format: "tree",
          includeInactive: false,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        
      });

      if (!data.success) throw new Error(data.message);

      // Only top-level categories for nav
      const topLevelNames = data.data.categories.map((cat) => cat.name);

      setCategories(topLevelNames);
    } catch (error) {
      console.error(error);
      message.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* ---------------- RENDER ---------------- */
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Spin size="small" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 border-b border-gray-200 pb-4 mb-6 overflow-x-auto">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`text-sm font-medium transition-colors pb-2 relative whitespace-nowrap ${
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
