"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { motion } from "framer-motion";
import ProductList from "@/components/Admin/Products/ProductList";
import ProductForm from "@/components/Admin/Products/ProductForm";
import ProductDetailsModal from "@/components/Admin/Products/ProductDetailsModal";
import AdminContent from "@/components/Admin/AdminContent";
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
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isBulkUploadVisible, setIsBulkUploadVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [uploadKey, setUploadKey] = useState(0);

  const loadProducts = useCallback(() => {
    // Try to load from localStorage first, then fallback to productDatabase
    try {
      const savedProducts = localStorage.getItem("adminProducts");
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          return;
        }
      }
    } catch (error) {
      console.error("Error loading products from localStorage:", error);
    }

    // Convert productDatabase object to array
    const productsArray = Object.values(productDatabase).map((product) => ({
      ...product,
      status: product.status || "approved", // Default status
      stock: product.stock || 0,
      metaTitle: product.metaTitle || product.name,
      slug: product.slug || product.name.toLowerCase().replace(/\s+/g, "-"),
    }));
    setProducts(productsArray);
  }, []);

  // Save products to localStorage whenever products state changes
  useEffect(() => {
    if (products.length > 0) {
      try {
        localStorage.setItem("adminProducts", JSON.stringify(products));
      } catch (error) {
        console.error("Error saving products to localStorage:", error);
      }
    }
  }, [products]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          product.id.toString().includes(debouncedSearchQuery)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((product) => product.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (product) => product.category === categoryFilter
      );
    }

    setFilteredProducts(filtered);
  }, [products, debouncedSearchQuery, statusFilter, categoryFilter]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormVisible(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsFormVisible(true);
  };

  const handleDeleteProduct = (productId) => {
    // Update state by removing the product
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== productId)
    );
  };

  const handleSaveProduct = (productData) => {
    try {
      if (selectedProduct) {
        // Update existing product
        setProducts((prevProducts) => {
          const updated = prevProducts.map((product) =>
            product.id === selectedProduct.id
              ? {
                  ...productData,
                  id: selectedProduct.id,
                  createdAt: product.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  // Preserve existing fields that might not be in productData
                  images: productData.images || product.images || [],
                  image: productData.images?.[0] || product.image || "",
                  variants: productData.variants || product.variants || [],
                  colors: productData.colors || product.colors || [],
                  sizes: productData.sizes || product.sizes || [],
                }
              : product
          );
          return updated;
        });
        message.success("Product updated successfully");
      } else {
        // Add new product
        const newProduct = {
          ...productData,
          id: Date.now(), // Generate unique ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: productData.status || "draft",
          stock: productData.stock || 0,
          inStock: productData.inStock !== false,
          images: productData.images || [],
          image: productData.images?.[0] || "",
          variants: productData.variants || [],
          colors: productData.colors || [],
          sizes: productData.sizes || [],
          rating: productData.rating || 0,
          reviews: productData.reviews || 0,
        };
        setProducts((prevProducts) => [...prevProducts, newProduct]);
        message.success("Product added successfully");
      }
      setIsFormVisible(false);
      setSelectedProduct(null);
    } catch (error) {
      message.error("Failed to save product. Please try again.");
      console.error("Error saving product:", error);
    }
  };

  const handleBulkUpload = async (file) => {
    try {
      message.loading("Processing bulk upload...", 0);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target.result;
          const parsedProducts = parseCSV(csvText);
          const validation = validateBulkProducts(parsedProducts);

          if (validation.invalid.length > 0) {
            message.destroy();
            Modal.warning({
              title: "Some products have errors",
              content: (
                <div className="dark:text-gray-300">
                  <p className="text-sm sm:text-base">
                    {validation.valid.length} products are valid,{" "}
                    {validation.invalid.length} have errors.
                  </p>
                  <ul className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {validation.invalid.slice(0, 5).map((item, idx) => (
                      <li key={idx} className="text-xs sm:text-sm">
                        Row {item.index}: {item.errors.join(", ")}
                      </li>
                    ))}
                  </ul>
                  {validation.invalid.length > 5 && (
                    <p className="text-xs sm:text-sm mt-2">
                      ... and {validation.invalid.length - 5} more
                    </p>
                  )}
                </div>
              ),
              okText:
                validation.valid.length > 0 ? "Upload Valid Only" : "Cancel",
              onOk: () => {
                if (validation.valid.length > 0) {
                  // Add valid products to state
                  const newProducts = validation.valid.map(
                    (product, index) => ({
                      ...product,
                      id: Date.now() + index, // Generate unique IDs
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      status: product.status || "draft",
                      stock: product.stock || 0,
                      inStock: product.inStock !== false,
                      images: product.image ? [product.image] : [],
                      image: product.image || "",
                      metaTitle: product.metaTitle || product.name,
                      slug:
                        product.slug ||
                        product.name.toLowerCase().replace(/\s+/g, "-"),
                    })
                  );
                  setProducts((prevProducts) => [
                    ...prevProducts,
                    ...newProducts,
                  ]);
                  message.success(
                    `${validation.valid.length} products uploaded successfully`
                  );
                  setIsBulkUploadVisible(false);
                  setUploadKey((prev) => prev + 1); // Reset file input
                }
              },
            });
          } else {
            message.destroy();
            // Add all valid products to state
            const newProducts = validation.valid.map((product, index) => ({
              ...product,
              id: Date.now() + index, // Generate unique IDs
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: product.status || "draft",
              stock: product.stock || 0,
              inStock: product.inStock !== false,
              images: product.image ? [product.image] : [],
              image: product.image || "",
              metaTitle: product.metaTitle || product.name,
              slug:
                product.slug || product.name.toLowerCase().replace(/\s+/g, "-"),
            }));
            setProducts((prevProducts) => [...prevProducts, ...newProducts]);
            message.success(
              `${validation.valid.length} products uploaded successfully`
            );
            setIsBulkUploadVisible(false);
            setUploadKey((prev) => prev + 1); // Reset file input
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
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      <div className="flex">
        {/* Main Content */}
        <AdminContent>
          <div className="p-2 sm:p-4 md:p-6 pb-4 sm:pb-6 md:pb-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 md:mb-6"
            >
              <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Product Management
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
                    Manage your product catalog, inventory, and variants
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    icon={<IconUpload className="w-4 h-4" />}
                    onClick={() => setIsBulkUploadVisible(true)}
                    className="w-full sm:w-auto flex-1 sm:flex-none"
                    size="large"
                  >
                    <span className="hidden sm:inline">Bulk </span>Upload
                  </Button>
                  <Button
                    type="primary"
                    icon={<IconPlus className="w-4 h-4" />}
                    onClick={handleAddProduct}
                    size="large"
                    className="w-full sm:w-auto flex-1 sm:flex-none"
                  >
                    Add Product
                  </Button>
                </div>
              </div>

              {/* Filters */}
            </motion.div>

            {/* Product List */}
            <ProductList
              products={filteredProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onView={(product) => {
                setSelectedProduct(product);
                setIsDetailsVisible(true);
              }}
            />
          </div>
        </AdminContent>
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

      {/* Product Details Modal */}
      <ProductDetailsModal
        visible={isDetailsVisible}
        product={selectedProduct}
        onClose={() => {
          setIsDetailsVisible(false);
          setSelectedProduct(null);
        }}
      />

      {/* Bulk Upload Modal */}
      <Modal
        title="Bulk Product Upload"
        open={isBulkUploadVisible}
        onCancel={() => setIsBulkUploadVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: 600 }}
        className="!bg-zinc-950"
        centered
      >
        <BulkUploadForm onUpload={handleBulkUpload} uploadKey={uploadKey} />
      </Modal>
    </div>
  );
};

// Bulk Upload Component
const BulkUploadForm = ({ onUpload, uploadKey }) => {
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      onUpload(e.target.files[0]);
      // Reset file input after processing
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 100);
    }
  };

  return (
    <div className="mt-4">
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
        Upload a CSV file with product data. Download the template for the
        correct format.
      </p>
      <div className="space-y-3 sm:space-y-4">
        <Button
          icon={<IconDownload className="w-4 h-4" />}
          onClick={() => {
            // Generate and download CSV template
            const template = `Product Name,Price,Original Price,Category,Color,Size,Stock,Description,Image URL,Meta Title,Slug
Example Product,1000,1200,Women,Red,M,10,Product description here,https://example.com/image.jpg,Example Product Meta Title,example-product
Another Product,2000,2500,Men,Blue,L,5,Another description,https://example.com/image2.jpg,Another Product,another-product`;
            const blob = new Blob([template], {
              type: "text/csv;charset=utf-8;",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "product_upload_template.csv";
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full"
          size="large"
        >
          Download CSV Template
        </Button>
        <div>
          <input
            key={uploadKey}
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
          />
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Required fields: Product Name, Price, Category,
          Stock. All other fields are optional.
        </div>
      </div>
    </div>
  );
};

export default ProductManagementPage;
