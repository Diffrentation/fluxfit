"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import CategoryTree from "@/components/Admin/Categories/CategoryTree";
import BrandList from "@/components/Admin/Categories/BrandList";
import CategoryForm from "@/components/Admin/Categories/CategoryForm";
import BrandForm from "@/components/Admin/Categories/BrandForm";
import { Button, Tabs, message, Modal } from "antd";
import { IconPlus, IconTag } from "@tabler/icons-react";

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isCategoryFormVisible, setIsCategoryFormVisible] = useState(false);
  const [isBrandFormVisible, setIsBrandFormVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [activeTab, setActiveTab] = useState("categories");

  const loadCategories = useCallback(() => {
    // Mock data - in production, fetch from API
    const mockCategories = [
      {
        id: 1,
        name: "Women",
        slug: "women",
        description: "Women's fashion and clothing",
        image: "",
        banner: "",
        sortOrder: 1,
        parentId: null,
        children: [
          {
            id: 11,
            name: "Dresses",
            slug: "women-dresses",
            description: "Women's dresses",
            image: "",
            banner: "",
            sortOrder: 1,
            parentId: 1,
            children: [],
          },
          {
            id: 12,
            name: "Tops",
            slug: "women-tops",
            description: "Women's tops",
            image: "",
            banner: "",
            sortOrder: 2,
            parentId: 1,
            children: [],
          },
        ],
      },
      {
        id: 2,
        name: "Men",
        slug: "men",
        description: "Men's fashion and clothing",
        image: "",
        banner: "",
        sortOrder: 2,
        parentId: null,
        children: [
          {
            id: 21,
            name: "Shirts",
            slug: "men-shirts",
            description: "Men's shirts",
            image: "",
            banner: "",
            sortOrder: 1,
            parentId: 2,
            children: [],
          },
        ],
      },
      {
        id: 3,
        name: "Bag",
        slug: "bag",
        description: "Bags and accessories",
        image: "",
        banner: "",
        sortOrder: 3,
        parentId: null,
        children: [],
      },
      {
        id: 4,
        name: "Shoes",
        slug: "shoes",
        description: "Footwear",
        image: "",
        banner: "",
        sortOrder: 4,
        parentId: null,
        children: [],
      },
      {
        id: 5,
        name: "Watches",
        slug: "watches",
        description: "Watches and timepieces",
        image: "",
        banner: "",
        sortOrder: 5,
        parentId: null,
        children: [],
      },
    ];
    setCategories(mockCategories);
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
    // Check if category has children
    const hasChildren = (cats, id) => {
      for (const cat of cats) {
        if (cat.id === id) {
          return cat.children && cat.children.length > 0;
        }
        if (cat.children && cat.children.length > 0) {
          if (hasChildren(cat.children, id)) return true;
        }
      }
      return false;
    };

    if (hasChildren(categories, categoryId)) {
      message.warning("Cannot delete category with subcategories");
      return;
    }

    Modal.confirm({
      title: "Delete Category",
      content:
        "Are you sure you want to delete this category? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        const deleteCategory = (cats, id) => {
          return cats
            .filter((cat) => cat.id !== id)
            .map((cat) => {
              if (cat.children && cat.children.length > 0) {
                return {
                  ...cat,
                  children: deleteCategory(cat.children, id),
                };
              }
              return cat;
            });
        };

        setCategories((prev) => deleteCategory(prev, categoryId));
        message.success("Category deleted successfully");
      },
    });
  };

  const handleSaveCategory = (categoryData) => {
    if (selectedCategory && selectedCategory.id) {
      // Update existing category
      const updateCategory = (cats, updatedCategory) => {
        return cats.map((cat) => {
          if (cat.id === updatedCategory.id) {
            const updated = {
              ...cat,
              ...updatedCategory,
              children: cat.children || [],
            };
            return updated;
          }
          if (cat.children && cat.children.length > 0) {
            return {
              ...cat,
              children: updateCategory(cat.children, updatedCategory),
            };
          }
          return cat;
        });
      };

      setCategories((prev) => updateCategory(prev, categoryData));
      message.success("Category updated successfully");
    } else {
      // Add new category
      const getMaxId = (cats) => {
        let maxId = 0;
        const traverse = (items) => {
          items.forEach((item) => {
            if (item.id > maxId) maxId = item.id;
            if (item.children && item.children.length > 0) {
              traverse(item.children);
            }
          });
        };
        traverse(cats);
        return maxId;
      };

      const getNextSortOrder = (cats, parentId) => {
        const findSiblings = (items, pid) => {
          if (pid === null) {
            return items.filter((cat) => !cat.parentId);
          }
          for (const item of items) {
            if (item.id === pid) {
              return item.children || [];
            }
            if (item.children && item.children.length > 0) {
              const result = findSiblings(item.children, pid);
              if (result !== null) return result;
            }
          }
          return [];
        };

        const siblings = findSiblings(cats, parentId);
        if (siblings.length === 0) return 1;
        return Math.max(...siblings.map((s) => s.sortOrder || 0)) + 1;
      };

      const newCategory = {
        ...categoryData,
        id: getMaxId(categories) + 1,
        children: [],
        sortOrder:
          categoryData.sortOrder ||
          getNextSortOrder(categories, categoryData.parentId || null),
      };

      if (
        categoryData.parentId ||
        (selectedCategory && selectedCategory.parentId)
      ) {
        // Add as subcategory
        const parentId = categoryData.parentId || selectedCategory?.parentId;
        const addSubcategory = (cats, pid, newCat) => {
          return cats.map((cat) => {
            if (cat.id === pid) {
              return {
                ...cat,
                children: [...(cat.children || []), newCat].sort(
                  (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
                ),
              };
            }
            if (cat.children && cat.children.length > 0) {
              return {
                ...cat,
                children: addSubcategory(cat.children, pid, newCat),
              };
            }
            return cat;
          });
        };

        setCategories((prev) => addSubcategory(prev, parentId, newCategory));
      } else {
        // Add as top-level category
        setCategories((prev) =>
          [...prev, newCategory].sort(
            (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
          )
        );
      }
      message.success("Category added successfully");
    }

    setIsCategoryFormVisible(false);
    setSelectedCategory(null);
  };

  const handleMoveCategory = (categoryId, direction) => {
    const findCategoryAndSiblings = (cats, id, parentId = null) => {
      for (let i = 0; i < cats.length; i++) {
        const cat = cats[i];
        if (cat.id === id) {
          return {
            category: cat,
            siblings: cats,
            index: i,
            parentId,
          };
        }
        if (cat.children && cat.children.length > 0) {
          const result = findCategoryAndSiblings(cat.children, id, cat.id);
          if (result) return result;
        }
      }
      return null;
    };

    const result = findCategoryAndSiblings(categories, categoryId);
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
    const reorderedSiblings = [...siblings];
    [reorderedSiblings[index], reorderedSiblings[newIndex]] = [
      reorderedSiblings[newIndex],
      reorderedSiblings[index],
    ];

    // Update sort orders
    reorderedSiblings.forEach((cat, idx) => {
      cat.sortOrder = idx + 1;
    });

    const updateSiblingsInTree = (cats, parentId, newSiblings) => {
      if (parentId === null) {
        // Top level - replace the entire array
        return newSiblings;
      }
      return cats.map((cat) => {
        if (cat.id === parentId) {
          return { ...cat, children: newSiblings };
        }
        if (cat.children && cat.children.length > 0) {
          return {
            ...cat,
            children: updateSiblingsInTree(cat.children, parentId, newSiblings),
          };
        }
        return cat;
      });
    };

    const updated = updateSiblingsInTree(
      categories,
      result.parentId,
      reorderedSiblings
    );

    setCategories(updated);
    message.success(`Category moved ${direction}`);
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
          brand.id === selectedBrand.id ? { ...brand, ...brandData } : brand
        )
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
          (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
        )
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

        <div className="flex-1 ml-0 lg:ml-64 pt-14 sm:pt-16 lg:pt-16">
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
        </div>
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
