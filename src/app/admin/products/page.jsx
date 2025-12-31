"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ProductList from "@/components/Admin/Products/ProductList";
import ProductForm from "@/components/Admin/Products/ProductForm";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import {
  IconPlus,
  IconUpload,
  IconDownload,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import { Button, Input, Select, message, Modal } from "antd";
import { productDatabase } from "@/lib/productDatabase";
import { parseCSV, validateBulkProducts } from "@/lib/csvParser";

const { Search } = Input;
const { Option } = Select;

const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isBulkUploadVisible, setIsBulkUploadVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, statusFilter, categoryFilter]);

  const loadProducts = () => {
    // Convert productDatabase object to array
    const productsArray = Object.values(productDatabase).map((product) => ({
      ...product,
      status: product.status || "approved", // Default status
      stock: product.stock || 0,
      metaTitle: product.metaTitle || product.name,
      slug: product.slug || product.name.toLowerCase().replace(/\s+/g, "-"),
    }));
    setProducts(productsArray);
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.id.toString().includes(searchQuery)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((product) => product.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormVisible(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsFormVisible(true);
  };

  const handleDeleteProduct = (productId) => {
    Modal.confirm({
      title: "Delete Product",
      content: "Are you sure you want to delete this product? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        // In a real app, this would call an API
        // For now, we'll just show a message
        message.success("Product deleted successfully");
        loadProducts();
      },
    });
  };

  const handleSaveProduct = (productData) => {
    // In a real app, this would save to database
    message.success(
      selectedProduct ? "Product updated successfully" : "Product added successfully"
    );
    setIsFormVisible(false);
    setSelectedProduct(null);
    loadProducts();
  };

  const handleBulkUpload = async (file) => {
    try {
      message.loading("Processing bulk upload...", 0);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target.result;
          const products = parseCSV(csvText);
          const validation = validateBulkProducts(products);

          if (validation.invalid.length > 0) {
            message.destroy();
            Modal.warning({
              title: "Some products have errors",
              content: (
                <div className="dark:text-gray-300">
                  <p className="text-sm sm:text-base">
                    {validation.valid.length} products are valid, {validation.invalid.length} have errors.
                  </p>
                  <ul className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {validation.invalid.slice(0, 5).map((item, idx) => (
                      <li key={idx} className="text-xs sm:text-sm">
                        Row {item.index}: {item.errors.join(", ")}
                      </li>
                    ))}
                  </ul>
                  {validation.invalid.length > 5 && (
                    <p className="text-xs sm:text-sm mt-2">... and {validation.invalid.length - 5} more</p>
                  )}
                </div>
              ),
              okText: validation.valid.length > 0 ? "Upload Valid Only" : "Cancel",
              onOk: () => {
                if (validation.valid.length > 0) {
                  // In a real app, save valid products to database
                  message.success(`${validation.valid.length} products uploaded successfully`);
                  setIsBulkUploadVisible(false);
                  loadProducts();
                }
              },
            });
          } else {
            message.destroy();
            // In a real app, save products to database
            message.success(`${validation.valid.length} products uploaded successfully`);
            setIsBulkUploadVisible(false);
            loadProducts();
          }
        } catch (error) {
          message.destroy();
          message.error(`Failed to parse CSV: ${error.message}`);
        }
      };
      reader.onerror = () => {
        message.destroy();
        message.error("Failed to read file");
      };
      reader.readAsText(file);
    } catch (error) {
      message.destroy();
      message.error("Failed to process file");
    }
  };

  const categories = ["All", "Women", "Men", "Bag", "Shoes", "Watches"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar activeItem="products" />

        {/* Main Content */}
        <div className="flex-1 ml-0 lg:ml-64 pt-16 sm:pt-20 lg:pt-16">
          <div className="p-3 sm:p-4 md:p-6 pb-6 sm:pb-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Product Management
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Manage your product catalog, inventory, and variants
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Button
                    icon={<IconUpload className="w-4 h-4" />}
                    onClick={() => setIsBulkUploadVisible(true)}
                    className="w-full sm:w-auto"
                  >
                    <span className="hidden sm:inline">Bulk </span>Upload
                  </Button>
                  <Button
                    type="primary"
                    icon={<IconPlus className="w-4 h-4" />}
                    onClick={handleAddProduct}
                    size="large"
                    className="w-full sm:w-auto"
                  >
                    Add Product
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex-1 w-full">
                  <Search
                    placeholder="Search products by name or ID"
                    allowClear
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    prefix={<IconSearch className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                    size="large"
                    className="w-full"
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: "100%", minWidth: 150 }}
                  size="large"
                  className="w-full sm:w-auto"
                >
                  <Option value="all">All Categories</Option>
                  {categories.slice(1).map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: "100%", minWidth: 150 }}
                  size="large"
                  className="w-full sm:w-auto"
                >
                  <Option value="all">All Status</Option>
                  <Option value="approved">Approved</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="rejected">Rejected</Option>
                  <Option value="draft">Draft</Option>
                </Select>
              </div>
            </motion.div>

            {/* Product List */}
            <ProductList
              products={filteredProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onView={(product) => {
                setSelectedProduct(product);
                setIsFormVisible(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductForm
        visible={isFormVisible}
        product={selectedProduct}
        onClose={() => {
          setIsFormVisible(false);
          setSelectedProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* Bulk Upload Modal */}
      <Modal
        title="Bulk Product Upload"
        open={isBulkUploadVisible}
        onCancel={() => setIsBulkUploadVisible(false)}
        footer={null}
        width="90%"
        style={{ maxWidth: 600 }}
        className="dark:bg-gray-800"
      >
        <BulkUploadForm onUpload={handleBulkUpload} />
      </Modal>
    </div>
  );
};

// Bulk Upload Component
const BulkUploadForm = ({ onUpload }) => {
  return (
    <div className="mt-4">
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
        Upload a CSV file with product data. Download the template for the correct format.
      </p>
      <div className="space-y-3 sm:space-y-4">
        <Button
          icon={<IconDownload className="w-4 h-4" />}
          onClick={() => {
            // Generate and download CSV template
            const template = `Product Name,Price,Original Price,Category,Color,Size,Stock,Description,Image URL,Meta Title,Slug
Example Product,1000,1200,Women,Red,M,10,Product description here,https://example.com/image.jpg,Example Product Meta Title,example-product
Another Product,2000,2500,Men,Blue,L,5,Another description,https://example.com/image2.jpg,Another Product,another-product`;
            const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "product_upload_template.csv";
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full sm:w-auto"
        >
          Download CSV Template
        </Button>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files[0]) {
                onUpload(e.target.files[0]);
              }
            }}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
          />
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Required fields: Product Name, Price, Category, Stock. All other fields are optional.
        </div>
      </div>
    </div>
  );
};

export default ProductManagementPage;
