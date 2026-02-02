"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Tree, Button, Dropdown, Tag, message, Card, Spin } from "antd";
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

const CategoryTree = ({
  onEdit,
  onDelete,
  onAddSubcategory,
  onMoveUp,
  onMoveDown,
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

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
      setCategories(data.data.categories);
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

  /* ---------------- DESKTOP TREE VIEW ---------------- */
  const buildTreeData = (cats) =>
    cats.map((category) => ({
      title: (
        <div className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
              {category.name}
            </span>

            <Tag color="blue" className="text-xs sm:text-sm">
              {category.slug}
            </Tag>

            {category.productCount !== undefined && (
              <Tag color="green" className="hidden sm:inline-flex text-xs sm:text-sm">
                {category.productCount} products
              </Tag>
            )}

            {category.children?.length > 0 && (
              <Tag color="gray" className="hidden sm:inline-flex text-xs sm:text-sm">
                {category.children.length} subcategories
              </Tag>
            )}
          </div>

          <Dropdown
            menu={{
              items: [
                {
                  key: "add-sub",
                  label: "Add Subcategory",
                  icon: <IconPlus className="w-4 h-4" />,
                  onClick: () => onAddSubcategory?.(category.id),
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
                  onClick: () => onMoveUp?.(category.id),
                },
                {
                  key: "move-down",
                  label: "Move Down",
                  icon: <IconArrowDown className="w-4 h-4" />,
                  onClick: () => onMoveDown?.(category.id),
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
                      onDelete?.(category.id);
                    }
                  },
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button
              type="text"
              icon={<IconDots className="w-4 h-4" />}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </Dropdown>
        </div>
      ),
      key: category.id.toString(),
      children: category.children ? buildTreeData(category.children) : undefined,
    }));

  const treeData = buildTreeData(categories);

  /* ---------------- MOBILE CARD VIEW ---------------- */
  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const renderCategoryCard = (category, level = 0) => {
    const hasChildren = category.children?.length > 0;
    const isExpanded = expandedCategories[category.id];

    return (
      <motion.div key={category.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card
          className={`mb-2 border hover:shadow-md ${level > 0 ? "ml-6" : ""}`}
          bodyStyle={{ padding: "12px 16px" }}
        >
          <div className="flex justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {hasChildren && (
                  <Button
                    type="text"
                    size="small"
                    icon={isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                    onClick={() => toggleCategoryExpand(category.id)}
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
          </div>

          <AnimatePresence>
            {hasChildren && isExpanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
                {category.children.map((child) => renderCategoryCard(child, level + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  /* ---------------- RENDER ---------------- */
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Desktop Tree */}
          <div className="hidden lg:block">
            <Tree
              showLine
              switcherIcon={({ expanded }) =>
                expanded ? <IconChevronDown /> : <IconChevronRight />
              }
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              onExpand={setExpandedKeys}
              onSelect={setSelectedKeys}
              treeData={treeData}
            />
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((category) => renderCategoryCard(category))}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default CategoryTree;
