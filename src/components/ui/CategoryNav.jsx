"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Spin, message } from "antd";

/**
 * Hierarchical interactive category selector:
 * - Shows only root categories initially
 * - Hover opens nested submenu (parent -> child -> sub-child)
 * - Clicking any node selects it:
 *   - backend returns products for that node + its descendants
 */
const CategoryNav = ({ activeCategory, onCategoryChange }) => {
  // `activeCategory` can be either category id (preferred) or slug (legacy).
  const [flatCategories, setFlatCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Hover-open path of category ids: [rootId, childId, ...]
  const [openPath, setOpenPath] = useState([]);
  // Left offset (in wrapper coordinates) for positioning submenu close to the hovered category.
  const [submenuLeft, setSubmenuLeft] = useState(0);

  /* ---------------- FETCH CATEGORIES ---------------- */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await axios.get("/api/categories", {
        params: {
          format: "flat",
          includeInactive: false,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        
      });

      if (!data.success) throw new Error(data.message);

      setFlatCategories(data.data.categories || []);
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

  useEffect(() => {
    const handleRefresh = () => {
      fetchCategories();
    };
    window.addEventListener("categories:refresh", handleRefresh);
    return () => window.removeEventListener("categories:refresh", handleRefresh);
  }, [fetchCategories]);

  // Close submenu on outside click
  useEffect(() => {
    const onDown = (e) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpenPath([]);
      setSubmenuLeft(0);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const {
    idToCat,
    roots,
    childrenById,
    selectedCategoryId,
    breadcrumb,
    selectedAncestors,
  } = useMemo(() => {
    const idTo = new Map();
    const byParent = new Map(); // parentId -> [childId]
    const slugTo = new Map();

    const normalizeId = (v) => (v ? String(v) : null);
    flatCategories.forEach((cat) => {
      const id = normalizeId(cat.id || cat._id);
      if (!id) return;
      const parentId = normalizeId(cat.parent) || null;

      idTo.set(id, {
        id,
        name: String(cat.name || id),
        slug: cat.slug ? String(cat.slug) : null,
        parentId,
      });

      if (cat.slug) slugTo.set(String(cat.slug), id);

      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId).push(id);
    });

    const rootIds = (byParent.get(null) || []).slice().sort((a, b) => {
      const na = idTo.get(a)?.name || "";
      const nb = idTo.get(b)?.name || "";
      return na.localeCompare(nb);
    });

    const selectedId = (() => {
      const prop = activeCategory ? String(activeCategory) : null;
      if (!prop) return null;
      if (idTo.has(prop)) return prop;
      if (slugTo.has(prop)) return slugTo.get(prop) || null;
      return prop; // fallback
    })();

    const breadcrumbParts = [];
    const ancestors = new Set();
    if (selectedId && idTo.has(selectedId)) {
      let cur = selectedId;
      const guard = new Set();
      while (cur && idTo.has(cur) && !guard.has(cur)) {
        guard.add(cur);
        ancestors.add(cur);
        breadcrumbParts.push(idTo.get(cur).name);
        cur = idTo.get(cur).parentId;
      }
      breadcrumbParts.reverse();
    }

    return {
      idToCat: idTo,
      roots: rootIds,
      childrenById: byParent,
      selectedCategoryId: selectedId,
      breadcrumb: breadcrumbParts.length ? breadcrumbParts.join(" > ") : "",
      selectedAncestors: ancestors,
    };
  }, [flatCategories, activeCategory]);

  const hasChildren = useCallback(
    (id) => {
      const parentChildren = childrenById.get(id) || [];
      return parentChildren.length > 0;
    },
    [childrenById],
  );

  const handleSelect = useCallback(
    (categoryId) => {
      const nextId = categoryId ? String(categoryId) : null;
      const breadcrumbText = (() => {
        if (!nextId || !idToCat.has(nextId)) return "";
        const parts = [];
        let cur = nextId;
        const guard = new Set();
        while (cur && idToCat.has(cur) && !guard.has(cur)) {
          guard.add(cur);
          parts.push(idToCat.get(cur).name);
          cur = idToCat.get(cur).parentId;
        }
        return parts.reverse().join(" > ");
      })();

      if (process.env.NODE_ENV !== "production") {
        console.log("[CategoryNav] selected categoryId:", nextId, breadcrumbText);
      }

      onCategoryChange?.(nextId, breadcrumbText);
      setOpenPath([]);
      setSubmenuLeft(0);
    },
    [idToCat, onCategoryChange],
  );

  /* ---------------- RENDER ---------------- */
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Spin size="small" />
      </div>
    );
  }

  const selectedId = selectedCategoryId;

  return (
    <div className="relative">
      <div
        ref={wrapperRef}
        className="flex items-center gap-6 border-b border-gray-200 pb-4 mb-2 overflow-x-auto"
      >
        <button
          key="all"
          onClick={() => handleSelect(null)}
          className={`text-sm font-medium transition-colors pb-2 relative whitespace-nowrap ${
            !selectedId
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
          suppressHydrationWarning
        >
          All Products
          {!selectedId && (
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

        {roots.map((rootId) => {
          const cat = idToCat.get(rootId);
          if (!cat) return null;
          const isSelected = selectedId === rootId;
          const isInPath = selectedAncestors.has(rootId);
          const openThisRoot = openPath[0] === rootId;
          const arrow = hasChildren(rootId) ? "→" : "";

          return (
            <button
              key={rootId}
              onClick={() => handleSelect(rootId)}
              onMouseEnter={(e) => {
                if (!hasChildren(rootId)) {
                  setOpenPath([]);
                  return;
                }

                const wrapperEl = wrapperRef.current;
                if (wrapperEl) {
                  const w = wrapperEl.getBoundingClientRect();
                  const r = e.currentTarget.getBoundingClientRect();
                  setSubmenuLeft(Math.max(0, r.left - w.left));
                }

                setOpenPath([rootId]);
              }}
              className={`text-sm font-medium transition-colors pb-2 relative whitespace-nowrap flex items-center gap-2 ${
                isSelected || openThisRoot || isInPath
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              aria-haspopup={hasChildren(rootId) ? "menu" : undefined}
              suppressHydrationWarning
            >
              {cat.name}
              {arrow && (
                <span className="text-gray-500 text-xs" aria-hidden="true">
                  {arrow}
                </span>
              )}
              {isSelected && (
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
          );
        })}
      </div>

      {selectedId && breadcrumb && (
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
          {breadcrumb}
        </div>
      )}

      <AnimatePresence>
        {openPath.length > 0 && (
          <motion.div
            key="submenu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{ left: submenuLeft }}
            className="absolute top-full z-50 mt-[-8px] -translate-y-1"
            onMouseLeave={() => {
              setOpenPath([]);
              setSubmenuLeft(0);
            }}
          >
            <div className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex gap-6">
                {openPath.map((parentId, level) => {
                  const children = childrenById.get(parentId) || [];
                  if (!children.length) return null;

                  return (
                    <div key={`${parentId}-${level}`} className="min-w-[160px]">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        {idToCat.get(parentId)?.name}
                      </div>
                      <div className="space-y-1">
                        {children.map((childId) => {
                          const child = idToCat.get(childId);
                          if (!child) return null;

                          const isSelected = selectedId === childId;
                          const hasSub = hasChildren(childId);
                          const arrow = hasSub ? "→" : "";

                          return (
                            <button
                              key={childId}
                              onClick={() => handleSelect(childId)}
                              onMouseEnter={() => {
                                const next = openPath.slice(0, level + 1);
                                next[level + 1] = childId;
                                setOpenPath(next.filter(Boolean));
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                                isSelected
                                  ? "bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-white"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-700/40 text-gray-700 dark:text-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm truncate">{child.name}</span>
                                {arrow && (
                                  <span className="text-gray-500 text-xs" aria-hidden="true">
                                    {arrow}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryNav;
