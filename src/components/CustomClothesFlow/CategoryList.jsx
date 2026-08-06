"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronRight } from "@tabler/icons-react";

function CategoryMenuItem({
  category,
  activeCategoryId,
  onSelect,
  onCloseMenus,
  rootOpen = false,
  onRootToggle,
  depth = 0,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const catId = category.id || category._id;
  const isActive = String(activeCategoryId || "") === String(catId || "");
  const hasChildren = category.children && category.children.length > 0;
  const expanded = depth === 0 ? rootOpen : isExpanded;
  const isOpen = hasChildren && (isHovered || expanded);

  // For nested items, adjust styling slightly
  const isTopLevel = depth === 0;

  return (
    <li
      className="relative"
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) {
            if (depth === 0) onRootToggle(catId);
            else setIsExpanded((open) => !open);
          } else {
            onSelect({ ...category, id: catId });
            onCloseMenus();
          }
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
        aria-haspopup={hasChildren ? "menu" : undefined}
        aria-expanded={hasChildren ? isOpen : undefined}
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
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative lg:absolute lg:left-full lg:top-0 mt-2 lg:mt-0 ml-0 lg:ml-3 w-full lg:w-auto lg:min-w-[220px] bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg lg:shadow-xl overflow-hidden lg:overflow-visible z-50 py-2"
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
                  onCloseMenus={onCloseMenus}
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
  const [menuVersion, setMenuVersion] = useState(0);
  const [openRootId, setOpenRootId] = useState(null);

  const closeMenus = () => {
    setOpenRootId(null);
    setMenuVersion((version) => version + 1);
  };

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
            key={`${String(cat.id || cat._id)}-${menuVersion}`}
            category={cat}
            activeCategoryId={activeCategoryId}
            onSelect={onSelect}
            onCloseMenus={closeMenus}
            rootOpen={String(openRootId || "") === String(cat.id || cat._id)}
            onRootToggle={(categoryId) => {
              setOpenRootId((openId) =>
                String(openId || "") === String(categoryId) ? null : categoryId,
              );
            }}
            depth={0}
          />
        ))}
      </ul>
    </div>
  );
}
