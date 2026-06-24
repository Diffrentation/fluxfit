"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronRight } from "@tabler/icons-react";

function CategoryMenuItem({ category, activeCategoryId, onSelect, depth = 0 }) {
  const [isHovered, setIsHovered] = useState(false);
  const catId = category.id || category._id;
  const isActive = String(activeCategoryId || "") === String(catId || "");
  const hasChildren = category.children && category.children.length > 0;

  // For nested items, adjust styling slightly
  const isTopLevel = depth === 0;

  return (
    <li
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsHovered(false);
          onSelect({ ...category, id: catId });
        }}
        className={[
          "w-full flex items-center justify-between transition-colors duration-200 font-medium",
          isTopLevel ? "px-3 py-2.5 rounded-xl text-sm" : "px-3 py-2 rounded-lg text-sm",
          isActive
            ? "bg-[#1e9a58] text-white shadow-md shadow-[#1e9a58]/30"
            : isHovered
            ? "bg-gray-100 dark:bg-gray-700/60 text-gray-900 dark:text-white"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
        ].join(" ")}
      >
        <span>{category.name}</span>
        {hasChildren && (
          <IconChevronRight
            size={16}
            className={
              isActive
                ? "text-green-200"
                : isHovered
                ? "text-gray-600"
                : "text-gray-400"
            }
          />
        )}
      </button>

      {/* Flyout Submenu */}
      <AnimatePresence>
        {isHovered && hasChildren && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-0 ml-3 min-w-[220px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-visible z-50 py-2"
          >
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {category.name} Types
              </p>
            </div>
            <ul className="flex flex-col px-2 gap-1 relative">
              {category.children.map((sub) => (
                <CategoryMenuItem
                  key={String(sub.id || sub._id)}
                  category={sub}
                  activeCategoryId={activeCategoryId}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function CategoryList({ categories, activeCategoryId, onSelect }) {
  return (
    <div className="relative rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col p-2">
      <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">
          Categories
        </h3>
      </div>

      <ul className="flex flex-col gap-1 relative z-10">
        {categories.map((cat) => (
          <CategoryMenuItem
            key={String(cat.id || cat._id)}
            category={cat}
            activeCategoryId={activeCategoryId}
            onSelect={onSelect}
            depth={0}
          />
        ))}
      </ul>
    </div>
  );
}
