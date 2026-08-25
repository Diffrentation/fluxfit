"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import AdminContent from "@/components/Admin/AdminContent";
import CategoryTree from "@/components/Admin/Categories/CategoryTree";
import CategoryForm from "@/components/Admin/Categories/CategoryForm";
import { Button, message, Modal } from "antd";
import { IconPlus } from "@tabler/icons-react";
import axios from "axios";

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [isCategoryFormVisible, setIsCategoryFormVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/categories", {
        params: { format: "flat", includeInactive: true },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!data?.success) throw new Error(data?.message || "Failed to load categories");
      setCategories(data.data.categories || []);
    } catch (error) {
      console.error("Load categories error:", error);
      message.error(error.response?.data?.message || "Failed to load categories");
    }
  }, []);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCategory = (parentId = null) => {
    setSelectedCategory(parentId ? { parentId } : null);
    setIsCategoryFormVisible(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setIsCategoryFormVisible(true);
  };

  const handleDeleteCategory = (categoryId) => {
    Modal.confirm({
      title: "Delete Category",
      content:
        "Are you sure you want to delete this category? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const { data } = await axios.delete(`/api/categories/${categoryId}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          if (!data?.success) throw new Error(data?.message || "Failed to delete category");
          message.success("Category deleted successfully");
          await loadCategories();
          window.dispatchEvent(new Event("categories:refresh"));
        } catch (error) {
          message.error(error.response?.data?.message || "Failed to delete category");
        }
      },
    });
  };

  const handleSaveCategory = async () => {
    await loadCategories();
    window.dispatchEvent(new Event("categories:refresh"));
    setIsCategoryFormVisible(false);
    setSelectedCategory(null);
  };

  const handleMoveCategory = async (categoryId, direction) => {
    try {
      const { data } = await axios.get("/api/categories", {
        params: { format: "tree", includeInactive: true, includeProductCount: true },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!data?.success) throw new Error(data?.message || "Failed to load category tree");
      const tree = data.data.categories || [];

      const findCategoryAndSiblings = (cats, id, parentId = null) => {
        const targetId = String(id);
        const getId = (cat) => String(cat.id || cat._id);
        for (let i = 0; i < cats.length; i++) {
          const cat = cats[i];
          if (getId(cat) === targetId) {
            return { category: cat, siblings: cats, index: i, parentId };
          }
          if (cat.children && cat.children.length > 0) {
            const result = findCategoryAndSiblings(cat.children, id, cat.id || cat._id);
            if (result) return result;
          }
        }
        return null;
      };

      const result = findCategoryAndSiblings(tree, categoryId);
      if (!result) return;
      const { siblings, index } = result;

      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === siblings.length - 1)
      ) {
        message.warning("Cannot move category further in this direction");
        return;
      }

      const newIndex = direction === "up" ? index - 1 : index + 1;
      const current = siblings[index];
      const target = siblings[newIndex];
      const currentId = current.id || current._id;
      const targetId = target.id || target._id;

      await Promise.all([
        axios.put(
          `/api/categories/${currentId}/sort-order`,
          { sortOrder: target.sortOrder || newIndex + 1 },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
        axios.put(
          `/api/categories/${targetId}/sort-order`,
          { sortOrder: current.sortOrder || index + 1 },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ),
      ]);

      message.success(`Category moved ${direction}`);
      await loadCategories();
      window.dispatchEvent(new Event("categories:refresh"));
    } catch (error) {
      console.error("Move category error:", error);
      message.error(error.response?.data?.message || "Failed to move category");
    }
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      <div className="flex">
        <AdminContent>
          <div className="p-2 sm:p-4 md:p-6 pb-4 sm:pb-6 md:pb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 md:mb-6"
            >
              <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Category Management
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
                    Manage product categories and subcategories
                  </p>
                </div>
              </div>

              <div className="mt-2 sm:mt-3 md:mt-4">
                <div className="flex justify-end mb-2 sm:mb-3 md:mb-4">
                  <Button
                    type="primary"
                    icon={<IconPlus className="w-4 h-4" />}
                    onClick={handleAddCategory}
                    size="large"
                    className="w-full sm:w-auto"
                  >
                    <span className="hidden sm:inline">Add Category</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
                <CategoryTree
                  categories={categories}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onAddSubcategory={handleAddCategory}
                  onMoveUp={(categoryId) => handleMoveCategory(categoryId, "up")}
                  onMoveDown={(categoryId) => handleMoveCategory(categoryId, "down")}
                />
              </div>
            </motion.div>
          </div>
        </AdminContent>
      </div>

      <CategoryForm
        visible={isCategoryFormVisible}
        category={selectedCategory}
        categories={categories}
        onClose={() => {
          setIsCategoryFormVisible(false);
          setSelectedCategory(null);
        }}
        onSave={handleSaveCategory}
      />
    </div>
  );
};

export default CategoryManagementPage;
