"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  Modal,
  Form,
  Input,
  Select,
  Cascader,
  InputNumber,
  Switch,
  Button,
  Upload,
  Tabs,
  Popover,
  message,
  Divider,
  Space,
} from "antd";
import {
  IconUpload,
  IconX,
  IconPlus,
  IconTrash,
  IconChevronRight,
} from "@tabler/icons-react";
import { uploadImage } from "@/lib/upload-client";
import { HexColorInput, HexColorPicker } from "react-colorful";
import slugify from "slugify";

const { TextArea } = Input;
const { Option } = Select;
const COLOR_PRESETS = [
  { label: "Black", value: "#111827" },
  { label: "White", value: "#F9FAFB" },
  { label: "Red", value: "#DC2626" },
  { label: "Blue", value: "#2563EB" },
  { label: "Green", value: "#16A34A" },
  { label: "Yellow", value: "#EAB308" },
  { label: "Orange", value: "#EA580C" },
  { label: "Purple", value: "#7C3AED" },
  { label: "Pink", value: "#EC4899" },
  { label: "Gray", value: "#6B7280" },
];

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
  const [nameValue, setNameValue] = useState("");
  const [metaTitleValue, setMetaTitleValue] = useState("");
  const buildCategoryTreeData = useCallback(() => {
    const nodeById = new Map();
    const childrenByParentId = new Map();

    const getId = (cat) => String(cat?.id ?? cat?._id ?? "");
    const getParentId = (cat) => {
      const p = cat?.parent ?? null;
      if (!p) return null;
      return String(p);
    };

    (categories || []).forEach((cat) => {
      const id = getId(cat);
      if (!id) return;

      const name = cat?.name ? String(cat.name) : id;
      const parentId = getParentId(cat);

      nodeById.set(id, { id, name, parentId });

      if (parentId) {
        const existing = childrenByParentId.get(parentId) || [];
        childrenByParentId.set(parentId, [...existing, id]);
      }
    });

    const roots = [...nodeById.values()]
      .filter((n) => n.parentId === null)
      .map((n) => n.id);

    const pathById = {};
    const hasChildrenById = {};

    const buildOption = (id, path, stack) => {
      // Cycle guard (should never happen, but prevents infinite recursion).
      if (stack.has(id)) {
        console.warn("Cycle detected in category tree:", id);
        pathById[id] = path;
        hasChildrenById[id] = false;
        return { value: id, label: nodeById.get(id)?.name || id };
      }

      const childrenIds = childrenByParentId.get(id) || [];
      hasChildrenById[id] = childrenIds.length > 0;
      pathById[id] = path;

      const nextStack = new Set(stack);
      nextStack.add(id);

      const children =
        childrenIds.length > 0
          ? childrenIds.map((childId) =>
              buildOption(childId, [...path, childId], nextStack),
            )
          : undefined;

      return children && children.length > 0
        ? { value: id, label: nodeById.get(id)?.name || id, children }
        : { value: id, label: nodeById.get(id)?.name || id };
    };

    const options = roots.map((rootId) =>
      buildOption(rootId, [rootId], new Set()),
    );

    return { options, pathById, hasChildrenById };
  }, [categories]);

  const { options: categoryOptions, pathById, hasChildrenById } = useMemo(
    () => buildCategoryTreeData(),
    [buildCategoryTreeData],
  );

  // Wrapper around Cascader so Form can store the *leaf* category id string,
  // while Cascader internally needs the full value path array.
  const CategoryHierarchyCascader = useCallback(
    ({ value, onChange }) => {
      const leafId = value ? String(value) : null;
      const cascaderValue =
        leafId && pathById?.[leafId] ? pathById[leafId] : [];

      return (
        <Cascader
          options={categoryOptions}
          loading={!categories.length}
          placeholder="Select category"
          expandTrigger="hover"
          changeOnSelect={false}
          value={cascaderValue}
          displayRender={(labels) => labels.join(" > ")}
          expandIcon={(meta) => (
            <IconChevronRight
              className="text-gray-500"
              style={{
                transform: meta?.expanded ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          )}
          onChange={(valuePath) => {
            const pathArr = Array.isArray(valuePath) ? valuePath : [];
            const nextLeafId = pathArr.length
              ? String(pathArr[pathArr.length - 1])
              : null;
            if (!nextLeafId) return;

            // Defensive: only allow leaf nodes as final selection.
            if (hasChildrenById?.[nextLeafId]) {
              message.warning("Please select a final (leaf) category");
              return;
            }

            onChange?.(nextLeafId);
          }}
        />
      );
    },
    [categoryOptions, categories.length, hasChildrenById, pathById],
  );

  const normalizeCategoryId = useCallback((cat) => {
    if (!cat) return null;
    if (typeof cat === "string") return cat;
    if (typeof cat === "object") return String(cat.id ?? cat._id ?? "");
    return null;
  }, []);

  /** Normalized slug loaded for edit; omit `slug` on PUT when unchanged so URLs stay stable */
  const initialEditSlugRef = useRef("");

  /* ---------------- FETCH CATEGORIES ---------------- */
  const fetchCategories = useCallback(async () => {
    try {
      // Include inactive so edit prefill doesn't fail when a product still references
      // a category that is currently inactive.
      const { data } = await axios.get(
        "/api/categories?format=flat&includeInactive=true",
      );
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
      const productId = product?._id || product?.id;
      if (productId) {
        try {
          setLoading(true);
          const { data } = await axios.get(`/api/products/${productId}`);
          if (data.success) {
            const productData = data.data.product;
            // Ensure category is set correctly (handle object vs ID)
            const formattedProduct = {
              ...productData,
              // API returns category as object with id, or just ID if not populated
              category:
                productData.category?.id ||
                productData.category?._id ||
                productData.category,
              keywords: Array.isArray(productData.metaKeywords)
                ? productData.metaKeywords.join(", ")
                : productData.metaKeywords,
              status: productData.status || "draft",
              lowStockThreshold: productData.lowStockThreshold || 10,
            };

            form.setFieldsValue({
              ...formattedProduct,
              category: normalizeCategoryId(formattedProduct.category),
            });
            initialEditSlugRef.current = String(
              productData.slug || "",
            )
              .trim()
              .toLowerCase();
            setImageList(
              productData.images?.map((img) =>
                typeof img === "string" ? img : img.url,
              ) || [],
            );
            setVariants(productData.variants || []);
            setNameValue(productData.name || "");
            setMetaTitleValue(productData.metaTitle || "");
          }
        } catch (error) {
          console.error("Failed to fetch product details:", error);
          message.error("Failed to load latest product details");
          // Fallback to passed product data if API fails
          form.setFieldsValue({
            ...product,
            category: normalizeCategoryId(product?.category),
          });
          initialEditSlugRef.current = String(product?.slug || "")
            .trim()
            .toLowerCase();
          setImageList(
            product.images?.map((img) =>
              typeof img === "string" ? img : img.url,
            ) || [],
          );
          setVariants(product.variants || []);
          setNameValue(product.name || "");
          setMetaTitleValue(product.metaTitle || "");
        } finally {
          setLoading(false);
        }
      } else if (product) {
        // Fallback for cases where we might not have _id (e.g. legacy data)
        form.setFieldsValue({
          ...product,
          category: normalizeCategoryId(product?.category),
        });
        initialEditSlugRef.current = String(product?.slug || "")
          .trim()
          .toLowerCase();
        setImageList(product.images || []);
        setVariants(product.variants || []);
        setNameValue(product.name || "");
        setMetaTitleValue(product.metaTitle || "");
      } else {
        form.resetFields();
        initialEditSlugRef.current = "";
        setImageList([]);
        setVariants([]);
        setNameValue("");
        setMetaTitleValue("");
      }
    };

    fetchProductDetails();
  }, [product, form]);

  /* ---------------- SLUG GENERATOR ---------------- */
  const generateSlug = useCallback((value) => {
    return slugify(String(value || ""), {
      lower: true,
      strict: true,
      trim: true,
    });
  }, []);

  /* ---------------- AUTO-COMPUTED VALUES ---------------- */
  const slugSource = useMemo(
    () => metaTitleValue || nameValue,
    [metaTitleValue, nameValue],
  );

  const autoSlug = useMemo(
    () => generateSlug(slugSource || ""),
    [slugSource, generateSlug],
  );

  const computedStock = useMemo(
    () => variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    [variants],
  );

  const autoSkuForVariant = useCallback(
    (variant) => {
      const prefix = (nameValue || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
      const colorCode = (variant.color || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
      const sizeCode = (variant.size || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const seed = variant._randSuffix || "????";
      return [prefix, colorCode, sizeCode, seed].filter(Boolean).join("-") || "—";
    },
    [nameValue],
  );

  /* ---------------- IMAGE UPLOAD ---------------- */
  const handleImageUpload = useCallback(async (info) => {
    if (!info.file.originFileObj) return;
    try {
      const result = await uploadImage(info.file.originFileObj, {
        folder: "fluxfit/products",
      });
      // Ensure we're storing the URL as a string
      const imageUrl = typeof result === "string" ? result : result.url;
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
      { size: "", color: "", price: 0, stock: 0, sku: "", _randSuffix: Math.floor(1000 + Math.random() * 9000) },
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

  const renderColorPickerContent = useCallback(
    (variant, index) => (
      <div className="w-64 space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Preset colors</p>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                type="button"
                aria-label={color.label}
                title={color.label}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  String(variant.color || "").toLowerCase() === color.value.toLowerCase()
                    ? "border-gray-900 scale-105"
                    : "border-gray-200"
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleVariantChange(index, "color", color.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Custom color</p>
          <div className="space-y-3">
            <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-3">
              <HexColorPicker
                color={variant.color || "#1677ff"}
                onChange={(value) => handleVariantChange(index, "color", value)}
              />
            </div>
            <HexColorInput
              color={variant.color || "#1677ff"}
              onChange={(value) => handleVariantChange(index, "color", value)}
              prefixed
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">Color value</p>
          <Input
            value={variant.color}
            onChange={(e) => handleVariantChange(index, "color", e.target.value)}
            placeholder="#111827 or black"
          />
        </div>
      </div>
    ),
    [handleVariantChange],
  );

  /* ---------------- FORM SUBMIT ---------------- */
  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const editingId = product?._id || product?.id;
        const isEdit = !!editingId;

        const payload = {
          name: values.name,
          description: values.description,
          shortDescription: values.description,
          category: values.category,
          basePrice: values.basePrice,
          originalPrice: values.originalPrice,
          images: imageList.map((url, i) => ({ url, isPrimary: i === 0 })),
          variants,
          // stock and inStock are auto-computed by the model pre-save hook
          metaTitle: values.metaTitle,
          metaDescription: values.metaDescription,
          metaKeywords:
            typeof values.keywords === "string"
              ? values.keywords.split(",").map((k) => k.trim())
              : values.keywords,
          status: values.status,
          slug: autoSlug,
        };

        if (isEdit && autoSlug === initialEditSlugRef.current) {
          payload.slug = initialEditSlugRef.current;
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        };

        const { data } = isEdit
          ? await axios.put(`/api/products/${editingId}`, payload, { headers })
          : await axios.post("/api/products", payload, { headers });

        message.success(
          isEdit
            ? "Product updated successfully 🎉"
            : "Product saved successfully 🎉",
        );
        onSave?.(data.data.product);

        // Ensure other admin screens (category tree, product list) update instantly.
        window.dispatchEvent(new Event("products:refresh"));
        window.dispatchEvent(new Event("categories:refresh"));

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
    [autoSlug, imageList, initialEditSlugRef, onClose, onSave, product, variants],
  );

  const uploadFileList = useMemo(
    () =>
      imageList.map((url, index) => {
        // Ensure url is a string
        const urlString = typeof url === "string" ? url : url?.url || "";
        return {
          uid: index.toString(),
          name: `image-${index}.jpg`,
          status: "done",
          url: urlString,
        };
      }),
    [imageList],
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
            rules={[{ required: true, message: "Please enter product name" }]}
          >
            <Input
              placeholder="Enter product name"
              onChange={(e) => setNameValue(e.target.value)}
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
              <CategoryHierarchyCascader />
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

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter description" },
              { max: 200, message: "Description must be 200 characters or less" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter product description"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <p className="text-xs text-gray-500 -mt-2 mb-0">
            Stock and availability are set in the Inventory tab.
          </p>
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
                const fileUrl =
                  typeof file === "string"
                    ? file
                    : file.url || file.response?.url;
                const index = imageList.findIndex((url) => {
                  const urlString = typeof url === "string" ? url : url?.url;
                  return urlString === fileUrl;
                });
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
              Upload up to 5 images. First image will be the main product image.
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
                  const imageUrl =
                    typeof url === "string" ? url : url?.url || "";

                  return (
                    <div key={index} className="relative group">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
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
              <h3 className="font-semibold text-gray-900">Product Variants</h3>
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
                <div key={index}>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      <div className="flex gap-2">
                        <Input
                          value={variant.color}
                          onChange={(e) =>
                            handleVariantChange(index, "color", e.target.value)
                          }
                          placeholder="#111827 or black"
                        />
                        <Popover
                          trigger="click"
                          placement="bottomRight"
                          content={renderColorPickerContent(variant, index)}
                        >
                          <Button
                            type="default"
                            className="shrink-0"
                            style={{
                              backgroundColor: variant.color || "transparent",
                              color: variant.color ? "#ffffff" : undefined,
                              borderColor: variant.color || undefined,
                            }}
                          >
                            Pick
                          </Button>
                        </Popover>
                      </div>
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
                  </div>
                  {/* Auto-SKU preview */}
                  <div className="mt-3 grid gap-2 md:grid-cols-[120px_1fr] md:items-center">
                    <span className="text-xs text-gray-500">Auto SKU</span>
                    <Input
                      readOnly
                      value={
                        variant.sku && !variant._randSuffix
                          ? variant.sku
                          : autoSkuForVariant(variant)
                      }
                    />
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
          {/* Auto-computed total stock */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Stock</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Auto-calculated from variant stocks
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-3xl font-bold ${
                    computedStock > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {computedStock}
                </span>
                <p
                  className={`text-xs font-medium mt-0.5 ${
                    computedStock > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {computedStock > 0 ? "● In Stock" : "● Out of Stock"}
                </p>
              </div>
            </div>
            {variants.length === 0 && (
              <p className="text-xs text-amber-600 mt-3 border-t border-amber-200 pt-2">
                Add variants in the Variants tab to calculate stock automatically.
              </p>
            )}
            {variants.length > 0 && (
              <div className="mt-3 border-t border-gray-200 pt-3 space-y-1">
                {variants.map((v, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-600">
                    <span>
                      {v.size || "—"} / {v.color || "—"}
                    </span>
                    <span className="font-medium">{Number(v.stock) || 0} units</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Form.Item
            name="lowStockThreshold"
            label="Low Stock Alert Threshold"
            initialValue={10}
            help="Get notified when stock falls below this number."
          >
            <Space.Compact style={{ width: "100%" }}>
              <InputNumber placeholder="10" min={0} style={{ width: "100%" }} />
              <Button disabled>units</Button>
            </Space.Compact>
          </Form.Item>
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
            help="Slug updates live from meta title. If meta title is empty, product name is used as fallback."
          >
            <Input
              placeholder="Enter meta title"
              maxLength={60}
              showCount
              onChange={(e) => setMetaTitleValue(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="URL Slug"
            help="Preview only. The backend auto-adjusts duplicates instead of blocking save."
          >
            <Input
              readOnly
              value={autoSlug}
              placeholder="slug-preview"
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
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
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
