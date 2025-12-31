"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tree, Button, Dropdown, Tag, message } from "antd";
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

const CategoryTree = ({ categories, onEdit, onDelete }) => {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);

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
                        // Handle add subcategory
                        message.info("Add subcategory functionality");
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
                        message.info("Move up functionality");
                      },
                    },
                    {
                      key: "move-down",
                      label: "Move Down",
                      icon: <IconArrowDown className="w-4 h-4" />,
                      onClick: () => {
                        message.info("Move down functionality");
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4"
    >
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
    </motion.div>
  );
};

export default CategoryTree;

