"use client";
import React, { useState, useEffect } from "react";
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
} from "antd";
import { IconUpload, IconX, IconPlus, IconTrash } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { uploadImage } from "@/lib/upload-client";

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const ProductForm = ({ visible, product, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [imageList, setImageList] = useState([]);
  const [variants, setVariants] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        name: product.name,
        price: parseFloat(product.price),
        originalPrice: product.originalPrice
          ? parseFloat(product.originalPrice)
          : undefined,
        category: product.category,
        description: product.description,
        stock: product.stock || 0,
        status: product.status || "draft",
        metaTitle: product.metaTitle || product.name,
        slug: product.slug || product.name?.toLowerCase().replace(/\s+/g, "-"),
        inStock: product.inStock !== false,
        rating: product.rating || 0,
        reviews: product.reviews || 0,
      });
      setImageList(product.images || [product.image].filter(Boolean));
      // Initialize variants from product
      if (product.sizes && product.colors) {
        const variantList = [];
        product.sizes.forEach((size) => {
          product.colors.forEach((color) => {
            variantList.push({
              size,
              color,
              price: parseFloat(product.price),
              stock: product.stock || 0,
              sku: `${product.id}-${size}-${color}`.toUpperCase(),
            });
          });
        });
        setVariants(variantList);
      }
    } else {
      form.resetFields();
      setImageList([]);
      setVariants([]);
    }
  }, [product, form]);

  const handleSubmit = async (values) => {
    try {
      const productData = {
        ...values,
        images: imageList,
        variants,
        id: product?.id || Date.now(),
        createdAt: product?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSave(productData);
    } catch (error) {
      message.error("Please fill in all required fields");
    }
  };

  const handleImageUpload = async (info) => {
    if (info.file.status === "uploading") {
      return;
    }

    if (info.file.status === "done" || info.file.originFileObj) {
      try {
        const file = info.file.originFileObj || info.file;
        const result = await uploadImage(file, { folder: "fluxfit/products" });
        setImageList([...imageList, result.url]);
        message.success("Image uploaded successfully");
      } catch (error) {
        message.error("Failed to upload image");
        console.error(error);
      }
    }
  };

  const handleRemoveImage = (index) => {
    setImageList(imageList.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        size: "",
        color: "",
        price: form.getFieldValue("price") || 0,
        stock: 0,
        sku: "",
      },
    ]);
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "size" || field === "color") {
      updated[index].sku = `${form.getFieldValue("name") || "PROD"}-${
        updated[index].size
      }-${updated[index].color}`
        .toUpperCase()
        .replace(/\s+/g, "-");
    }
    setVariants(updated);
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <Modal
      title={product ? "Edit Product" : "Add New Product"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      className="product-form-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Basic Information */}
          <TabPane tab="Basic Information" key="basic">
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
                  name="price"
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
                  rules={[
                    { required: true, message: "Please select category" },
                  ]}
                >
                  <Select placeholder="Select category">
                    <Option value="Women">Women</Option>
                    <Option value="Men">Men</Option>
                    <Option value="Bag">Bag</Option>
                    <Option value="Shoes">Shoes</Option>
                    <Option value="Watches">Watches</Option>
                  </Select>
                </Form.Item>

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
          </TabPane>

          {/* Images */}
          <TabPane tab="Images" key="images">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                <Upload
                  listType="picture-card"
                  fileList={imageList.map((url, index) => ({
                    uid: index.toString(),
                    name: `image-${index}.jpg`,
                    status: "done",
                    url,
                  }))}
                  onChange={handleImageUpload}
                  onRemove={(file) => {
                    const index = imageList.findIndex(
                      (url) => url === file.url
                    );
                    handleRemoveImage(index);
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
                    {imageList.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={url}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover"
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabPane>

          {/* Variants */}
          <TabPane tab="Variants" key="variants">
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
          </TabPane>

          {/* Inventory */}
          <TabPane tab="Inventory" key="inventory">
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
                <InputNumber
                  placeholder="10"
                  min={0}
                  style={{ width: "100%" }}
                  addonAfter="units"
                />
              </Form.Item>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You will receive notifications when
                  stock falls below the threshold.
                </p>
              </div>
            </div>
          </TabPane>

          {/* SEO */}
          <TabPane tab="SEO" key="seo">
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
          </TabPane>

          {/* Status */}
          <TabPane tab="Status" key="status">
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
          </TabPane>
        </Tabs>

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
