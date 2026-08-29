"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Dropdown, Tag, message, Card, Spin } from "antd";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconChevronDown,
  IconChevronRight,
  IconDots,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);
const myDarkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "#09090b",
  foregroundColor: "#e4e4e7",
  headerBackgroundColor: "#18181b",
  borderColor: "#27272a",
  rowHoverColor: "#18181b",
});

const CategoryTree = ({
  categories: categoriesProp,
  onEdit,
  onDelete,
  onAddSubcategory,
  onMoveUp,
  onMoveDown,
}) => {
  const [fetchedCategories, setFetchedCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  const categories = useMemo(
    () => (fetchedCategories.length > 0 ? fetchedCategories : (categoriesProp || [])),
    [fetchedCategories, categoriesProp]
  );
  const getCategoryId = useCallback((category) => category?.id ?? category?._id, []);

  const getCategoryActionItems = useCallback(
    (category) => {
      const categoryId = getCategoryId(category);
      return [
        {
          key: "add-sub",
          label: "Add Subcategory",
          icon: <IconPlus className="w-4 h-4" />,
          onClick: () => onAddSubcategory?.(categoryId),
        },
        {
          key: "edit",
          label: "Edit",
          icon: <IconEdit className="w-4 h-4" />,
          onClick: () => onEdit?.(category),
        },
        {
          key: "move-up",
          label: "Move Up",
          icon: <IconArrowUp className="w-4 h-4" />,
          onClick: () => onMoveUp?.(categoryId),
        },
        {
          key: "move-down",
          label: "Move Down",
          icon: <IconArrowDown className="w-4 h-4" />,
          onClick: () => onMoveDown?.(categoryId),
        },
        { type: "divider" },
        {
          key: "delete",
          label: "Delete",
          icon: <IconTrash className="w-4 h-4" />,
          danger: true,
          onClick: () => {
            if (category.children?.length > 0) {
              message.warning("Cannot delete category with subcategories");
            } else {
              onDelete?.(categoryId);
            }
          },
        },
      ];
    },
    [getCategoryId, onAddSubcategory, onDelete, onEdit, onMoveDown, onMoveUp]
  );

  /* ---------------- FETCH CATEGORIES ---------------- */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await axios.get("/api/categories", {
        params: {
          format: "tree",
          includeInactive: true,
          includeProductCount: true,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!data.success) throw new Error(data.message);
      setFetchedCategories(data.data.categories);
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
    return () => {
      window.removeEventListener("categories:refresh", handleRefresh);
    };
  }, [fetchCategories]);

  /* ---------------- DESKTOP GRID VIEW ----------------
   * AG Grid Community has no tree/hierarchical row-grouping support
   * (that's Enterprise-only), so the nested category tree is flattened
   * into a single depth-first array here. Hierarchy is then conveyed
   * visually via indentation (+ a small connector) in the Name column's
   * cellRenderer rather than via real grid grouping. */
  const flattenTree = useCallback(
    (cats, depth = 0) => {
      const rows = [];
      (cats || []).forEach((category) => {
        rows.push({ ...category, depth });
        if (category.children && category.children.length > 0) {
          rows.push(...flattenTree(category.children, depth + 1));
        }
      });
      return rows;
    },
    []
  );

  const flatRows = useMemo(() => flattenTree(categories), [flattenTree, categories]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Name",
        field: "name",
        flex: 1,
        minWidth: 260,
        sortable: false,
        cellRenderer: (p) => {
          const category = p.data;
          const depth = category.depth || 0;
          return (
            <div
              className="h-full flex items-center gap-2 sm:gap-3 min-w-0"
              style={{ paddingLeft: depth * 20 }}
            >
              {depth > 0 && (
                <span className="text-gray-500 dark:text-gray-600 shrink-0">└─</span>
              )}
              <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                {category.name}
              </span>
              <Tag color="blue" className="text-xs sm:text-sm shrink-0">
                {category.slug}
              </Tag>
              {category.children?.length > 0 && (
                <Tag color="gray" className="hidden sm:inline-flex text-xs sm:text-sm shrink-0">
                  {category.children.length} subcategories
                </Tag>
              )}
            </div>
          );
        },
      },
      {
        headerName: "Product Count",
        width: 160,
        valueGetter: (p) => p.data.productCount ?? 0,
        cellRenderer: (p) => <Tag color="green">{p.value} products</Tag>,
      },
      {
        headerName: "Status",
        width: 130,
        valueGetter: (p) => (p.data.isActive ? "Active" : "Inactive"),
        cellRenderer: (p) => (
          <Tag color={p.data.isActive ? "green" : "default"}>{p.value}</Tag>
        ),
      },
      {
        headerName: "Actions",
        width: 90,
        pinned: "right",
        sortable: false,
        cellRenderer: (p) => (
          <Dropdown menu={{ items: getCategoryActionItems(p.data) }} trigger={["click"]}>
            <Button type="text" icon={<IconDots className="w-4 h-4" />} />
          </Dropdown>
        ),
      },
    ],
    [getCategoryActionItems]
  );

  /* ---------------- MOBILE CARD VIEW ---------------- */
  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const CategorySubTree = ({ category, level = 0 }) => {
    const hasChildren = category.children?.length > 0;
    const categoryId = getCategoryId(category);
    const isExpanded = expandedCategories[categoryId];

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card
          className={`mb-2 border hover:shadow-md ${level > 0 ? "ml-6" : ""}`}
          bodyStyle={{ padding: "12px 16px" }}
        >
          <div className="flex justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {hasChildren && (
                  <Button
                    type="text"
                    size="small"
                    icon={isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                    onClick={() => toggleCategoryExpand(categoryId)}
                  />
                )}
                <h3 className="font-semibold m-0">{category.name}</h3>
                <Tag color="blue">{category.slug}</Tag>
                {category.productCount !== undefined && (
                  <Tag color="green">{category.productCount} products</Tag>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-500 mt-2">{category.description}</p>
              )}
            </div>
            <Dropdown menu={{ items: getCategoryActionItems(category) }} trigger={["click"]}>
              <Button
                type="text"
                size="small"
                icon={<IconDots className="w-4 h-4" />}
                className="shrink-0"
              />
            </Dropdown>
          </div>

          <AnimatePresence>
            {hasChildren && isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                {category.children.map((child) => (
                  <CategorySubTree
                    key={child.id?.toString?.() ?? child.id}
                    category={child}
                    level={level + 1}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  /* ---------------- RENDER ---------------- */
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="!bg-zinc-950 p-4 rounded-lg shadow-sm">
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Desktop Grid */}
          <div className="hidden lg:block">
            {isClient ? (
              <div style={{ width: "100%", height: 560 }}>
                <AgGridReact
                  theme={myDarkTheme}
                  modules={[AllCommunityModule]}
                  rowData={flatRows}
                  columnDefs={columnDefs}
                  // Rows are a fixed depth-first tree order (indentation
                  // conveys parent/child) — sorting any column would scatter
                  // that order and make the hierarchy display misleading.
                  defaultColDef={{ sortable: false, resizable: true }}
                  getRowId={(p) => String(getCategoryId(p.data))}
                  animateRows
                  rowHeight={56}
                  headerHeight={44}
                  suppressCellFocus
                  overlayNoRowsTemplate="No categories found"
                />
              </div>
            ) : (
              <div className="h-[560px]" />
            )}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((category) => (
              <CategorySubTree
                key={category.id?.toString?.() ?? category.id}
                category={category}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default CategoryTree;
