"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminContent from "@/components/Admin/AdminContent";
import CategoryTree from "@/components/Admin/Categories/CategoryTree";
import BrandList from "@/components/Admin/Categories/BrandList";
import CategoryForm from "@/components/Admin/Categories/CategoryForm";
import BrandForm from "@/components/Admin/Categories/BrandForm";
import { Button, Tabs, message, Modal } from "antd";
import { IconPlus, IconTag } from "@tabler/icons-react";
import axios from "axios";

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isCategoryFormVisible, setIsCategoryFormVisible] = useState(false);
  const [isBrandFormVisible, setIsBrandFormVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [activeTab, setActiveTab] = useState("categories");

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

  const loadBrands = useCallback(() => {
    // Mock data - in production, fetch from API
    const mockBrands = [
      {
        id: 1,
        name: "Nike",
        slug: "nike",
        logo: "",
        description: "Just Do It",
        sortOrder: 1,
      },
      {
        id: 2,
        name: "Adidas",
        slug: "adidas",
        logo: "",
        description: "Impossible is Nothing",
        sortOrder: 2,
      },
      {
        id: 3,
        name: "Puma",
        slug: "puma",
        logo: "",
        description: "Forever Faster",
        sortOrder: 3,
      },
      {
        id: 4,
        name: "Zara",
        slug: "zara",
        logo: "",
        description: "Fast Fashion",
        sortOrder: 4,
      },
    ];
    setBrands(mockBrands);
  }, []);

  useEffect(() => {
    loadCategories();
    loadBrands();
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

  const handleAddBrand = () => {
    setSelectedBrand(null);
    setIsBrandFormVisible(true);
  };

  const handleEditBrand = (brand) => {
    setSelectedBrand(brand);
    setIsBrandFormVisible(true);
  };

  const handleDeleteBrand = (brandId) => {
    Modal.confirm({
      title: "Delete Brand",
      content:
        "Are you sure you want to delete this brand? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        setBrands((prev) => prev.filter((brand) => brand.id !== brandId));
        message.success("Brand deleted successfully");
      },
    });
  };

  const handleSaveBrand = (brandData) => {
    if (selectedBrand && selectedBrand.id) {
      // Update existing brand
      setBrands((prev) =>
        prev.map((brand) =>
          brand.id === selectedBrand.id ? { ...brand, ...brandData } : brand,
        ),
      );
      message.success("Brand updated successfully");
    } else {
      // Add new brand
      const getMaxId = (brandsList) => {
        return brandsList.length > 0
          ? Math.max(...brandsList.map((b) => b.id || 0))
          : 0;
      };

      const getNextSortOrder = (brandsList) => {
        return brandsList.length > 0
          ? Math.max(...brandsList.map((b) => b.sortOrder || 0)) + 1
          : 1;
      };

      const newBrand = {
        ...brandData,
        id: getMaxId(brands) + 1,
        sortOrder: brandData.sortOrder || getNextSortOrder(brands),
      };
      setBrands((prev) =>
        [...prev, newBrand].sort(
          (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
        ),
      );
      message.success("Brand added successfully");
    }

    setIsBrandFormVisible(false);
    setSelectedBrand(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        <AdminSidebar activeItem="categories" />

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
                    Category & Brand Management
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
                    Manage product categories, subcategories, and brands
                  </p>
                </div>
              </div>

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                className="category-tabs"
                items={[
                  {
                    key: "categories",
                    label: (
                      <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                        <IconTag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Categories</span>
                        <span className="sm:hidden">Cats</span>
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <div className="flex justify-end mb-2 sm:mb-3 md:mb-4">
                          <Button
                            type="primary"
                            icon={<IconPlus className="w-4 h-4" />}
                            onClick={handleAddCategory}
                            size="large"
                            className="w-full sm:w-auto"
                          >
                            <span className="hidden sm:inline">
                              Add Category
                            </span>
                            <span className="sm:hidden">Add</span>
                          </Button>
                        </div>
                        <CategoryTree
                          categories={categories}
                          onEdit={handleEditCategory}
                          onDelete={handleDeleteCategory}
                          onAddSubcategory={handleAddCategory}
                          onMoveUp={(categoryId) =>
                            handleMoveCategory(categoryId, "up")
                          }
                          onMoveDown={(categoryId) =>
                            handleMoveCategory(categoryId, "down")
                          }
                        />
                      </div>
                    ),
                  },
                  {
                    key: "brands",
                    label: (
                      <span className="text-xs sm:text-sm md:text-base">
                        Brands
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <div className="flex justify-end mb-2 sm:mb-3 md:mb-4">
                          <Button
                            type="primary"
                            icon={<IconPlus className="w-4 h-4" />}
                            onClick={handleAddBrand}
                            size="large"
                            className="w-full sm:w-auto"
                          >
                            <span className="hidden sm:inline">Add Brand</span>
                            <span className="sm:hidden">Add</span>
                          </Button>
                        </div>
                        <BrandList
                          brands={brands}
                          onEdit={handleEditBrand}
                          onDelete={handleDeleteBrand}
                        />
                      </div>
                    ),
                  },
                ]}
              />
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

      <BrandForm
        visible={isBrandFormVisible}
        brand={selectedBrand}
        onClose={() => {
          setIsBrandFormVisible(false);
          setSelectedBrand(null);
        }}
        onSave={handleSaveBrand}
      />
    </div>
  );
};

export default CategoryManagementPage;
