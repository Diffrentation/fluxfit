"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import CategoryTree from "@/components/Admin/Categories/CategoryTree";
import BrandList from "@/components/Admin/Categories/BrandList";
import CategoryForm from "@/components/Admin/Categories/CategoryForm";
import BrandForm from "@/components/Admin/Categories/BrandForm";
import { Button, Tabs, message } from "antd";
import { IconPlus, IconTag } from "@tabler/icons-react";

const { TabPane } = Tabs;

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isCategoryFormVisible, setIsCategoryFormVisible] = useState(false);
  const [isBrandFormVisible, setIsBrandFormVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [activeTab, setActiveTab] = useState("categories");

  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  const loadCategories = () => {
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
  };

  const loadBrands = () => {
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
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCategoryFormVisible(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setIsCategoryFormVisible(true);
  };

  const handleDeleteCategory = (categoryId) => {
    message.success("Category deleted successfully");
    loadCategories();
  };

  const handleSaveCategory = (categoryData) => {
    message.success(
      selectedCategory
        ? "Category updated successfully"
        : "Category added successfully"
    );
    setIsCategoryFormVisible(false);
    setSelectedCategory(null);
    loadCategories();
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
    message.success("Brand deleted successfully");
    loadBrands();
  };

  const handleSaveBrand = (brandData) => {
    message.success(
      selectedBrand ? "Brand updated successfully" : "Brand added successfully"
    );
    setIsBrandFormVisible(false);
    setSelectedBrand(null);
    loadBrands();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar activeItem="categories" />

        <div className="flex-1 ml-0 lg:ml-64 pt-20 lg:pt-16">
          <div className="p-4 md:p-6 pb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Category & Brand Management
                  </h1>
                  <p className="text-gray-600">
                    Manage product categories, subcategories, and brands
                  </p>
                </div>
              </div>

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: "categories",
                    label: (
                      <span className="flex items-center gap-2">
                        <IconTag className="w-4 h-4" />
                        Categories
                      </span>
                    ),
                    children: (
                      <div>
                        <div className="flex justify-end mb-4">
                          <Button
                            type="primary"
                            icon={<IconPlus className="w-4 h-4" />}
                            onClick={handleAddCategory}
                            size="large"
                          >
                            Add Category
                          </Button>
                        </div>
                        <CategoryTree
                          categories={categories}
                          onEdit={handleEditCategory}
                          onDelete={handleDeleteCategory}
                        />
                      </div>
                    ),
                  },
                  {
                    key: "brands",
                    label: "Brands",
                    children: (
                      <div>
                        <div className="flex justify-end mb-4">
                          <Button
                            type="primary"
                            icon={<IconPlus className="w-4 h-4" />}
                            onClick={handleAddBrand}
                            size="large"
                          >
                            Add Brand
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
