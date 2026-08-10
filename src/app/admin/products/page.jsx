"use client";
import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import ProductList from "@/components/Admin/Products/ProductList";
import ProductForm from "@/components/Admin/Products/ProductForm";
import ProductDetailsModal from "@/components/Admin/Products/ProductDetailsModal";
import AdminContent from "@/components/Admin/AdminContent";
import { IconPlus, IconUpload, IconDownload } from "@tabler/icons-react";
import { Button, message, Modal } from "antd";
import { parseCSV, validateBulkProducts } from "@/lib/csvParser";

const ProductManagementPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isBulkUploadVisible, setIsBulkUploadVisible] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormVisible(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsFormVisible(true);
  };

  // `ProductList` performs the real DELETE call itself and refetches its own
  // data; this is just an optional notification hook, kept for API parity.
  const handleDeleteProduct = () => {};

  // `ProductForm` performs the real POST/PUT call itself, shows its own
  // success/error messages, and dispatches "products:refresh" so `ProductList`
  // reloads from the server. Nothing to do here beyond closing the modal,
  // which `onClose` already handles.
  const handleSaveProduct = () => {};

  /**
   * Bulk upload: parses the CSV client-side (existing `csvParser` helper),
   * resolves each row's category name to a real category ObjectId (backend
   * requires a valid ObjectId), then creates each product via the real
   * POST /api/products endpoint. This replaces the previous version which
   * only pushed parsed rows into local component state / localStorage.
   */
  const handleBulkUpload = async (file) => {
    const reader = new FileReader();

    reader.onerror = () => {
      message.error("Failed to read file");
    };

    reader.onload = async (e) => {
      let parsedProducts;
      try {
        parsedProducts = parseCSV(e.target.result);
      } catch (error) {
        message.error(`Failed to parse CSV: ${error.message}`);
        return;
      }

      const validation = validateBulkProducts(parsedProducts);

      if (validation.valid.length === 0) {
        Modal.warning({
          title: "No valid products found",
          content: (
            <div className="dark:text-gray-300">
              <p className="text-sm sm:text-base">
                All {validation.invalid.length} row(s) failed validation.
              </p>
              <ul className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {validation.invalid.slice(0, 5).map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm">
                    Row {item.index}: {item.errors.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          ),
        });
        return;
      }

      const uploadValid = async () => {
        await createProductsFromRows(validation.valid);
        setIsBulkUploadVisible(false);
        setUploadKey((prev) => prev + 1);
      };

      if (validation.invalid.length > 0) {
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
          okText: "Upload Valid Only",
          onOk: uploadValid,
        });
      } else {
        await uploadValid();
      }
    };

    reader.readAsText(file);
  };

  // Creates each parsed CSV row as a real product via POST /api/products.
  const createProductsFromRows = async (rows) => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };

    const hide = message.loading("Uploading products...", 0);

    try {
      // Resolve category names -> ObjectIds (backend requires a valid category ObjectId).
      let categories = [];
      try {
        const { data } = await axios.get(
          "/api/categories?format=flat&includeInactive=true",
          { headers }
        );
        if (data.success) categories = data.data.categories || [];
      } catch (error) {
        console.error("Failed to load categories for bulk upload:", error);
      }

      const categoryIdByName = new Map(
        categories.map((cat) => [
          String(cat.name || "").trim().toLowerCase(),
          cat._id || cat.id,
        ])
      );

      let successCount = 0;
      const failures = [];

      for (const row of rows) {
        const categoryId = categoryIdByName.get(
          String(row.category || "").trim().toLowerCase()
        );

        if (!categoryId) {
          failures.push(`${row.name}: category "${row.category}" not found`);
          continue;
        }

        const description = (row.description || row.name || "")
          .trim()
          .slice(0, 200);

        const payload = {
          name: row.name,
          description: description || row.name,
          category: categoryId,
          basePrice: row.price,
          originalPrice: row.originalPrice,
          images: row.image ? [{ url: row.image, isPrimary: true }] : [],
          variants:
            row.size || row.color || row.stock
              ? [
                  {
                    size: row.size || "One Size",
                    color: row.color || "Default",
                    price: row.price,
                    stock: row.stock || 0,
                  },
                ]
              : [],
          metaTitle: row.metaTitle,
          slug: row.slug,
          status: row.status || "draft",
        };

        try {
          const { data } = await axios.post("/api/products", payload, {
            headers,
          });
          if (data.success) {
            successCount += 1;
          } else {
            failures.push(`${row.name}: ${data.message || "Failed"}`);
          }
        } catch (error) {
          failures.push(
            `${row.name}: ${
              error.response?.data?.message || "Failed to create"
            }`
          );
        }
      }

      if (successCount > 0) {
        message.success(`${successCount} product(s) uploaded successfully`);
        window.dispatchEvent(new Event("products:refresh"));
      }

      if (failures.length > 0) {
        Modal.warning({
          title: `${failures.length} product(s) failed to upload`,
          content: (
            <ul className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {failures.slice(0, 10).map((msg, idx) => (
                <li key={idx} className="text-xs sm:text-sm">
                  {msg}
                </li>
              ))}
            </ul>
          ),
        });
      }
    } finally {
      hide();
    }
  };

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
            </motion.div>

            {/* Product List */}
            <ProductList
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
        correct format. The &quot;Category&quot; column must match an existing
        category name exactly.
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
          Stock. All other fields are optional. Category must match an
          existing category name.
        </div>
      </div>
    </div>
  );
};

export default ProductManagementPage;
