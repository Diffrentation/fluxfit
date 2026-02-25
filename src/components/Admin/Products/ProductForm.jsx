"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Upload,
  Tabs,
  message,
  Divider,
  Space,
} from "antd";
import { IconUpload, IconX, IconPlus, IconTrash } from "@tabler/icons-react";
import { uploadImage } from "@/lib/upload-client";

const { TextArea } = Input;
const { Option } = Select;

const ProductForm = ({ visible, product, onClose, onSave }) => {
  // Early return if not visible to prevent useForm warning
  // The form hook should only be created when the Modal is actually rendered
  if (!visible) {
    return null;
  }

  const [form] = Form.useForm();
  const [imageList, setImageList] = useState([]);
  const [variants, setVariants] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  /* ---------------- FETCH CATEGORIES ---------------- */
  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/categories?format=flat");
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (err) {
      message.error("Failed to load categories");
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* ---------------- PREFILL WHEN EDITING ---------------- */
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (product?._id) {
        try {
          setLoading(true);
          const { data } = await axios.get(`/api/products/${product._id}`);
          if (data.success) {
            const productData = data.data.product;
            // Ensure category is set correctly (handle object vs ID)
            const formattedProduct = {
              ...productData,
              // API returns category as object with id, or just ID if not populated
              category: productData.category?.id || productData.category?._id || productData.category,
              keywords: Array.isArray(productData.metaKeywords) 
                ? productData.metaKeywords.join(", ") 
                : productData.metaKeywords,
              status: productData.status || 'draft',
              lowStockThreshold: productData.lowStockThreshold || 10,
            };
            
            form.setFieldsValue(formattedProduct);
            setImageList(productData.images?.map(img => typeof img === 'string' ? img : img.url) || []);
            setVariants(productData.variants || []);
          }
        } catch (error) {
          console.error("Failed to fetch product details:", error);
          message.error("Failed to load latest product details");
          // Fallback to passed product data if API fails
          form.setFieldsValue(product);
          setImageList(product.images?.map(img => typeof img === 'string' ? img : img.url) || []);
          setVariants(product.variants || []);
        } finally {
          setLoading(false);
        }
      } else if (product) {
        // Fallback for cases where we might not have _id (e.g. legacy data)
        form.setFieldsValue(product);
        setImageList(product.images || []);
        setVariants(product.variants || []);
      } else {
        form.resetFields();
        setImageList([]);
        setVariants([]);
      }
    };

    fetchProductDetails();
  }, [product, form]);

  /* ---------------- SLUG GENERATOR ---------------- */
  const generateSlug = useCallback((name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }, []);

  /* ---------------- IMAGE UPLOAD ---------------- */
  const handleImageUpload = useCallback(async (info) => {
    if (!info.file.originFileObj) return;
    try {
      const result = await uploadImage(info.file.originFileObj, {
        folder: "fluxfit/products",
      });
      // Ensure we're storing the URL as a string
      const imageUrl = typeof result === 'string' ? result : result.url;
      setImageList((prev) => [...prev, imageUrl]);
      message.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload error:", error);
      message.error("Failed to upload image");
    }
  }, []);

  const handleRemoveImage = useCallback((index) => {
    setImageList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ---------------- VARIANTS ---------------- */
  const handleAddVariant = useCallback(() => {
    setVariants((prev) => [
      ...prev,
      { size: "", color: "", price: 0, stock: 0, sku: "" },
    ]);
  }, []);

  const handleVariantChange = useCallback((index, field, value) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleRemoveVariant = useCallback((index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ---------------- FORM SUBMIT ---------------- */
  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const payload = {
          name: values.name,
          description: values.description,
          shortDescription: values.description,
          category: values.category,
          basePrice: values.basePrice,
          originalPrice: values.originalPrice,
          images: imageList.map((url, i) => ({ url, isPrimary: i === 0 })),
          variants,
          stock: values.stock,
          inStock: values.inStock,
          metaTitle: values.metaTitle,
          metaDescription: values.metaDescription,
          metaKeywords: typeof values.keywords === 'string' ? values.keywords.split(",").map((k) => k.trim()) : values.keywords,
          status: values.status,
        };

        const { data } = await axios.post("/api/products", payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        message.success("Product saved successfully 🎉");
        onSave?.(data.data.product);
        onClose();
      } catch (error) {
        const res = error.response;
        if (res?.data?.errors) {
          res.data.errors.forEach((err) => {
            form.setFields([{ name: err.field, errors: [err.message] }]);
          });
        } else {
          message.error(res?.data?.message || "Failed to save product");
        }
      } finally {
        setLoading(false);
      }
    },
    [imageList, variants, form, onClose, onSave]
  );

  const uploadFileList = useMemo(
    () =>
      imageList.map((url, index) => {
        // Ensure url is a string
        const urlString = typeof url === 'string' ? url : (url?.url || '');
        return {
          uid: index.toString(),
          name: `image-${index}.jpg`,
          status: "done",
          url: urlString,
        };
      }),
    [imageList]
  );

  useEffect(() => {
    if (!visible) {
      form.resetFields();
    }
  }, [visible, form]);
  
  const tabItems = [
    {
      key: "basic",
      label: "Basic Information",
      children: (
        <div className="space-y-4">
          <Form.Item
            name="name"
            label="Product Name"
            rules={[
              { required: true, message: "Please enter product name" },
            ]}
          >
            <Input
              placeholder="Enter product name"
              onChange={(e) => {
                const slug = generateSlug(e.target.value);
                form.setFieldsValue({ slug });
              }}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="basePrice"
              label="Price (₹)"
              rules={[{ required: true, message: "Please enter price" }]}
            >
              <InputNumber
                placeholder="0.00"
                min={0}
                step={0.01}
                style={{ width: "100%" }}
                formatter={(value) =>
                  `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
              />
            </Form.Item>

            <Form.Item name="originalPrice" label="Original Price (₹)">
              <InputNumber
                placeholder="0.00"
                min={0}
                step={0.01}
                style={{ width: "100%" }}
                formatter={(value) =>
                  `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
          <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select category" }]}
            >
              <Select placeholder="Select category" loading={!categories.length}>
                {categories.map((cat) => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
 
            <Form.Item
              name="status"
              label="Status"
              initialValue="draft"
              rules={[{ required: true, message: "Please select status" }]}
            >
              <Select placeholder="Select status">
                <Option value="draft">Draft</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="stock"
              label="Stock Quantity"
              rules={[
                { required: true, message: "Please enter stock quantity" },
              ]}
            >
              <InputNumber
                placeholder="0"
                min={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter description" },
            ]}
          >
            <TextArea rows={4} placeholder="Enter product description" />
          </Form.Item>

          <Form.Item
            name="inStock"
            label="In Stock"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </div>
      ),
    },
    {
      key: "images",
      label: "Images",
      children: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            <Upload
              listType="picture-card"
              fileList={uploadFileList}
              onChange={handleImageUpload}
              onRemove={(file) => {
                // Handle both string URLs and file objects
                const fileUrl = typeof file === 'string' ? file : (file.url || file.response?.url);
                const index = imageList.findIndex(
                  (url) => {
                    const urlString = typeof url === 'string' ? url : url?.url;
                    return urlString === fileUrl;
                  }
                );
                if (index !== -1) {
                  handleRemoveImage(index);
                }
              }}
              accept="image/*"
              multiple
            >
              {imageList.length < 5 && (
                <div>
                  <IconPlus className="w-6 h-6" />
                  <div className="mt-2">Upload</div>
                </div>
              )}
            </Upload>
            <p className="text-xs text-gray-500 mt-2">
              Upload up to 5 images. First image will be the main product
              image.
            </p>
          </div>

          {imageList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Preview
              </label>
              <div className="grid grid-cols-5 gap-4">
                {imageList.map((url, index) => {
                  // Ensure url is a string for the img src
                  const imageUrl = typeof url === 'string' ? url : (url?.url || '');
                  
                  return (
                    <div key={index} className="relative group">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Main
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "variants",
      label: "Variants",
      children: (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                Product Variants
              </h3>
              <p className="text-sm text-gray-500">
                Manage different sizes, colors, and pricing for this product
              </p>
            </div>
            <Button
              type="primary"
              icon={<IconPlus className="w-4 h-4" />}
              onClick={handleAddVariant}
            >
              Add Variant
            </Button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
              No variants added. Click "Add Variant" to create product
              variations.
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Size
                      </label>
                      <Select
                        value={variant.size}
                        onChange={(value) =>
                          handleVariantChange(index, "size", value)
                        }
                        placeholder="Size"
                        style={{ width: "100%" }}
                      >
                        <Option value="XS">XS</Option>
                        <Option value="S">S</Option>
                        <Option value="M">M</Option>
                        <Option value="L">L</Option>
                        <Option value="XL">XL</Option>
                        <Option value="XXL">XXL</Option>
                        <Option value="One Size">One Size</Option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <Input
                        value={variant.color}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "color",
                            e.target.value
                          )
                        }
                        placeholder="Color"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price (₹)
                      </label>
                      <InputNumber
                        value={variant.price}
                        onChange={(value) =>
                          handleVariantChange(index, "price", value)
                        }
                        min={0}
                        step={0.01}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Stock
                      </label>
                      <InputNumber
                        value={variant.stock}
                        onChange={(value) =>
                          handleVariantChange(index, "stock", value)
                        }
                        min={0}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        SKU
                      </label>
                      <Input
                        value={variant.sku}
                        onChange={(e) =>
                          handleVariantChange(index, "sku", e.target.value)
                        }
                        placeholder="SKU"
                      />
                    </div>
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<IconTrash className="w-4 h-4" />}
                    onClick={() => handleRemoveVariant(index)}
                    className="mt-3"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "inventory",
      label: "Inventory",
      children: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="stock"
              label="Total Stock"
              rules={[
                { required: true, message: "Please enter stock quantity" },
              ]}
            >
              <InputNumber
                placeholder="0"
                min={0}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="inStock"
              label="In Stock"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>

          <Divider>Low Stock Alert</Divider>

          <Form.Item
            name="lowStockThreshold"
            label="Low Stock Threshold"
            initialValue={10}
          >
            <Space.Compact style={{ width: "100%" }}>
              <InputNumber
                placeholder="10"
                min={0}
                style={{ width: "100%" }}
              />
              <Button disabled>units</Button>
            </Space.Compact>
          </Form.Item>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You will receive notifications when
              stock falls below the threshold.
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "seo",
      label: "SEO",
      children: (
         <div className="space-y-4">
          <Form.Item
            name="metaTitle"
            label="Meta Title"
            rules={[{ required: true, message: "Please enter meta title" }]}
            help="Title for search engines (50-60 characters recommended)"
          >
            <Input
              placeholder="Enter meta title"
              maxLength={60}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="slug"
            label="URL Slug"
            rules={[
              { required: true, message: "Please enter URL slug" },
              {
                pattern: /^[a-z0-9-]+$/,
                message:
                  "Slug can only contain lowercase letters, numbers, and hyphens",
              },
            ]}
            help="URL-friendly version of the product name"
          >
            <Input
              placeholder="product-name"
              onChange={(e) => {
                const value = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-");
                form.setFieldsValue({ slug: value });
              }}
            />
          </Form.Item>

          <Form.Item
            name="metaDescription"
            label="Meta Description"
            help="Description for search engines (150-160 characters recommended)"
          >
            <TextArea
              rows={3}
              placeholder="Enter meta description"
              maxLength={160}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="keywords"
            label="Keywords"
            help="Comma-separated keywords for SEO"
          >
            <Input placeholder="keyword1, keyword2, keyword3" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      children: (
        <div className="space-y-4">
          <Form.Item
            name="status"
            label="Product Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select placeholder="Select status">
              <Option value="draft">Draft</Option>
              <Option value="pending">Pending Approval</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Form.Item>

          {form.getFieldValue("status") === "rejected" && (
            <Form.Item name="rejectionReason" label="Rejection Reason">
              <TextArea rows={3} placeholder="Enter reason for rejection" />
            </Form.Item>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">
              Status Workflow
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • <strong>Draft:</strong> Product is being created/edited
              </li>
              <li>
                • <strong>Pending:</strong> Awaiting admin approval
              </li>
              <li>
                • <strong>Approved:</strong> Product is live and visible to
                customers
              </li>
              <li>
                • <strong>Rejected:</strong> Product was rejected and needs
                revision
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={product ? "Edit Product" : "Add New Product"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden={true}   
      className="product-form-modal"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        <Divider />

        <div className="flex justify-end gap-3">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" size="large">
            {product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ProductForm;
