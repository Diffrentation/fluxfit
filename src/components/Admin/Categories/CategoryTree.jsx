"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tree, Button, Dropdown, Tag, message, Card } from "antd";
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
  categories,
  onEdit,
  onDelete,
  onAddSubcategory,
  onMoveUp,
  onMoveDown,
}) => {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

  const buildTreeData = (categories, parentId = null) => {
    return categories
      .filter((cat) => cat.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => {
        const children = buildTreeData(categories, category.id);
        return {
          title: (
            <div className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">{category.name}</span>
                <Tag color="blue" className="shrink-0 text-xs sm:text-sm">{category.slug}</Tag>
                {category.children && category.children.length > 0 && (
                  <Tag color="gray" className="shrink-0 text-xs sm:text-sm hidden sm:inline-flex">{category.children.length} subcategories</Tag>
                )}
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "add-sub",
                      label: "Add Subcategory",
                      icon: <IconPlus className="w-4 h-4" />,
                      onClick: () => {
                        if (onAddSubcategory) {
                          onAddSubcategory(category.id);
                        }
                      },
                    },
                    {
                      key: "edit",
                      label: "Edit",
                      icon: <IconEdit className="w-4 h-4" />,
                      onClick: () => onEdit(category),
                    },
                    {
                      key: "move-up",
                      label: "Move Up",
                      icon: <IconArrowUp className="w-4 h-4" />,
                      onClick: () => {
                        if (onMoveUp) {
                          onMoveUp(category.id);
                        }
                      },
                    },
                    {
                      key: "move-down",
                      label: "Move Down",
                      icon: <IconArrowDown className="w-4 h-4" />,
                      onClick: () => {
                        if (onMoveDown) {
                          onMoveDown(category.id);
                        }
                      },
                    },
                    {
                      type: "divider",
                    },
                    {
                      key: "delete",
                      label: "Delete",
                      icon: <IconTrash className="w-4 h-4" />,
                      danger: true,
                      onClick: () => {
                        if (category.children && category.children.length > 0) {
                          message.warning("Cannot delete category with subcategories");
                        } else {
                          onDelete(category.id);
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
          children: children.length > 0 ? children : undefined,
          category: category,
          childrenList: children,
        };
      });
  };

  const treeData = buildTreeData(categories);

  const onExpand = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue);
  };

  const onSelect = (selectedKeysValue) => {
    setSelectedKeys(selectedKeysValue);
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const renderCategoryCard = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories[category.id];

    return (
      <motion.div
        key={category.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        <Card
          className={`mb-2 sm:mb-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${
            level > 0 ? "ml-4 sm:ml-6 md:ml-8" : ""
          }`}
          bodyStyle={{ padding: "12px 16px" }}
        >
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {hasChildren && (
                  <Button
                    type="text"
                    size="small"
                    icon={
                      isExpanded ? (
                        <IconChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <IconChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )
                    }
                    onClick={() => toggleCategoryExpand(category.id)}
                    className="p-0 h-auto"
                  />
                )}
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white m-0">
                  {category.name}
                </h3>
                <Tag color="blue" className="text-xs sm:text-sm shrink-0">
                  {category.slug}
                </Tag>
                {hasChildren && (
                  <Tag color="gray" className="text-xs sm:text-sm shrink-0">
                    {category.children.length} sub
                  </Tag>
                )}
              </div>
              {category.description && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 mb-0 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "add-sub",
                    label: "Add Subcategory",
                    icon: <IconPlus className="w-4 h-4" />,
                    onClick: () => {
                      if (onAddSubcategory) {
                        onAddSubcategory(category.id);
                      }
                    },
                  },
                  {
                    key: "edit",
                    label: "Edit",
                    icon: <IconEdit className="w-4 h-4" />,
                    onClick: () => onEdit(category),
                  },
                  {
                    key: "move-up",
                    label: "Move Up",
                    icon: <IconArrowUp className="w-4 h-4" />,
                    onClick: () => {
                      if (onMoveUp) {
                        onMoveUp(category.id);
                      }
                    },
                  },
                  {
                    key: "move-down",
                    label: "Move Down",
                    icon: <IconArrowDown className="w-4 h-4" />,
                    onClick: () => {
                      if (onMoveDown) {
                        onMoveDown(category.id);
                      }
                    },
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "delete",
                    label: "Delete",
                    icon: <IconTrash className="w-4 h-4" />,
                    danger: true,
                    onClick: () => {
                      if (hasChildren) {
                        message.warning("Cannot delete category with subcategories");
                      } else {
                        onDelete(category.id);
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
                size="small"
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
                transition={{ duration: 0.2 }}
                className="mt-2 sm:mt-3 overflow-hidden"
              >
                <div className="space-y-2 sm:space-y-3">
                  {category.children.map((child) => renderCategoryCard(child, level + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  const flattenCategories = (categories, parentId = null) => {
    return categories
      .filter((cat) => cat.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        ...category,
        children: category.children || [],
      }));
  };

  const topLevelCategories = flattenCategories(categories);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-3 md:p-4"
    >
      {/* Desktop Tree View */}
      <div className="hidden lg:block">
        <Tree
          showLine
          switcherIcon={(props) =>
            props.expanded ? (
              <IconChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <IconChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )
          }
          expandedKeys={expandedKeys}
          selectedKeys={selectedKeys}
          onExpand={onExpand}
          onSelect={onSelect}
          treeData={treeData}
          className="category-tree"
        />
      </div>

      {/* Mobile/Tablet Grid View */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {topLevelCategories.map((category) => renderCategoryCard(category))}
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryTree;

