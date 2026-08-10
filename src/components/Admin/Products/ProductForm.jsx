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
  Image,
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
  const watchedValues = Form.useWatch([], form) || {};
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
              isCustomizable: productData.isCustomizable || false,
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
          isCustomizable: product?.isCustomizable || false,
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
    const currentBasePrice = form.getFieldValue("basePrice") || 0;
    setVariants((prev) => [
      ...prev,
      { size: "", color: "", price: currentBasePrice, stock: 0, sku: "", _randSuffix: Math.floor(1000 + Math.random() * 9000) },
    ]);
  }, [form]);

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
          <p className="text-xs font-medium text-zinc-400 mb-2">Preset colors</p>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                type="button"
                aria-label={color.label}
                title={color.label}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  String(variant.color || "").toLowerCase() === color.value.toLowerCase()
                    ? "border-white scale-105"
                    : "border-zinc-800"
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleVariantChange(index, "color", color.value)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-400 mb-2">Custom color</p>
          <div className="space-y-3">
            <div className="flex justify-center rounded-lg border border-zinc-800 !bg-zinc-950 p-3">
              <HexColorPicker
                color={variant.color || "#1677ff"}
                onChange={(value) => handleVariantChange(index, "color", value)}
              />
            </div>
            <HexColorInput
              color={variant.color || "#1677ff"}
              onChange={(value) => handleVariantChange(index, "color", value)}
              prefixed
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 text-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-400 mb-2">Color value</p>
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

        const derivedColors = [
          ...new Set(
            variants.map((v) => v.color).filter(Boolean).map((c) => String(c).trim())
          ),
        ];
        const derivedSizes = [
          ...new Set(
            variants.map((v) => v.size).filter(Boolean).map((s) => String(s).trim())
          ),
        ];

        const payload = {
          name: values.name,
          description: values.description,
          shortDescription: values.description,
          category: values.category,
          basePrice: values.basePrice,
          originalPrice: values.originalPrice,
          images: imageList.map((url, i) => ({ url, isPrimary: i === 0 })),
          variants,
          colors: derivedColors,
          sizes: derivedSizes,
          details: values.details,
          keyHighlights: values.keyHighlights,
          specifications: values.specifications,
          featureCards: values.featureCards,
          shipping: values.shipping,
          isCustomizable: values.isCustomizable || false,
          // stock and inStock are auto-computed by the model pre-save hook
          metaTitle: values.metaTitle,
          metaDescription: values.metaDescription,
          metaKeywords:
            typeof values.keywords === "string"
              ? values.keywords.split(",").map((k) => k.trim())
              : values.keywords,
          tags: Array.isArray(values.tags) ? values.tags : [],
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

  const isBasicStepComplete = useMemo(() => {
    return Boolean(
      watchedValues.name?.trim() &&
      watchedValues.category &&
      watchedValues.status &&
      watchedValues.description?.trim() &&
      watchedValues.description.trim().length <= 200 &&
      watchedValues.basePrice !== undefined &&
      watchedValues.basePrice !== null,
    );
  }, [watchedValues]);

  const areImagesStepComplete = imageList.length > 0;

  const areVariantsStepComplete = useMemo(() => {
    return (
      variants.length > 0 &&
      variants.every(
        (variant) =>
          variant.size?.trim() &&
          variant.color?.trim() &&
          variant.price !== undefined &&
          variant.price !== null &&
          Number(variant.price) >= 0 &&
          variant.stock !== undefined &&
          variant.stock !== null &&
          Number(variant.stock) >= 0,
      )
    );
  }, [variants]);

  const isInventoryStepComplete = useMemo(() => {
    return watchedValues.lowStockThreshold === undefined
      ? true
      : Number(watchedValues.lowStockThreshold) >= 0;
  }, [watchedValues.lowStockThreshold]);

  const isSeoStepComplete = useMemo(() => {
    return Boolean(watchedValues.metaTitle?.trim() && autoSlug);
  }, [autoSlug, watchedValues.metaTitle]);

  const createStepOrder = useMemo(
    () => ["basic", "images", "variants", "inventory", "details", "seo"],
    [],
  );

  const stepCompletion = useMemo(
    () => ({
      basic: isBasicStepComplete,
      images: areImagesStepComplete,
      variants: areVariantsStepComplete,
      inventory: isInventoryStepComplete,
      details: true,
      seo: isSeoStepComplete,
    }),
    [
      areImagesStepComplete,
      areVariantsStepComplete,
      isBasicStepComplete,
      isInventoryStepComplete,
      isSeoStepComplete,
    ],
  );

  const allCreateStepsComplete = useMemo(
    () => createStepOrder.every((step) => stepCompletion[step]),
    [createStepOrder, stepCompletion],
  );

  const validateCurrentCreateStep = useCallback(async () => {
    if (activeTab === "basic") {
      await form.validateFields([
        "name",
        "basePrice",
        "category",
        "status",
        "description",
      ]);
      return true;
    }

    if (activeTab === "images") {
      if (!imageList.length) {
        message.error("Please upload at least one product image");
        return false;
      }
      return true;
    }

    if (activeTab === "variants") {
      if (!variants.length) {
        message.error("Please add at least one variant");
        return false;
      }

      const hasInvalidVariant = variants.some(
        (variant) =>
          !variant.size?.trim() ||
          !variant.color?.trim() ||
          variant.price === undefined ||
          variant.price === null ||
          Number(variant.price) < 0 ||
          variant.stock === undefined ||
          variant.stock === null ||
          Number(variant.stock) < 0,
      );

      if (hasInvalidVariant) {
        message.error("Please complete all variant fields before continuing");
        return false;
      }
      return true;
    }

    if (activeTab === "inventory") {
      await form.validateFields(["lowStockThreshold"]);
      return true;
    }

    if (activeTab === "seo") {
      await form.validateFields(["metaTitle"]);
      return Boolean(autoSlug);
    }

    return true;
  }, [activeTab, autoSlug, form, imageList.length, variants]);

  const handlePrimaryAction = useCallback(async () => {
    const isEdit = Boolean(product?._id || product?.id);
    if (isEdit) {
      form.submit();
      return;
    }

    if (allCreateStepsComplete) {
      form.submit();
      return;
    }

    try {
      const currentStepValid = await validateCurrentCreateStep();
      if (!currentStepValid) return;

      const currentIndex = createStepOrder.indexOf(activeTab);
      const nextIncompleteStep = createStepOrder.find(
        (step, index) => index > currentIndex && !stepCompletion[step],
      );
      const nextStep = nextIncompleteStep || createStepOrder[currentIndex + 1];
      if (nextStep) {
        setActiveTab(nextStep);
      }
    } catch {
      // Field validation already surfaced the relevant error.
    }
  }, [
    activeTab,
    allCreateStepsComplete,
    createStepOrder,
    form,
    product,
    stepCompletion,
    validateCurrentCreateStep,
  ]);

  const primaryButtonLabel = useMemo(() => {
    if (product?._id || product?.id) {
      return "Update Product";
    }
    return allCreateStepsComplete ? "Create Product" : "Next";
  }, [allCreateStepsComplete, product]);

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
              label="Base Price (₹)"
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
                onKeyPress={(event) => {
                  if (!/[0-9.]/.test(event.key)) {
                    event.preventDefault();
                  }
                }}
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
                onKeyPress={(event) => {
                  if (!/[0-9.]/.test(event.key)) {
                    event.preventDefault();
                  }
                }}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
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

            <Form.Item
              name="isCustomizable"
              label="Enable Custom Design"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
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

          <Form.Item
            name="tags"
            label="Tags"
            help="Drives the storefront Tags filter — press Enter to add a tag"
          >
            <Select
              mode="tags"
              placeholder="e.g. fashion, streetstyle, denim"
              tokenSeparators={[","]}
              options={["Fashion", "Lifestyle", "Denim", "Streetstyle", "Crafts"].map(
                (t) => ({ value: t.toLowerCase(), label: t })
              )}
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
            <label className="block text-sm font-medium text-zinc-300 mb-2">
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
            <p className="text-xs text-zinc-500 mt-2">
              Upload up to 5 images. First image will be the main product image.
            </p>
          </div>

          {imageList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Image Preview
              </label>
              <div className="grid grid-cols-5 gap-4">
                {imageList.map((url, index) => {
                  // Ensure url is a string for the img src
                  const imageUrl =
                    typeof url === "string" ? url : url?.url || "";

                  return (
                    <div key={index} className="relative group">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center">
                        <Image
                          src={imageUrl}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                          fallback='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'
                          preview={{
                            mask: <div className="text-white text-xs bg-black/50 w-full h-full flex items-center justify-center">Preview</div>
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
              <h3 className="font-semibold text-zinc-100">Product Variants</h3>
              <p className="text-sm text-zinc-400">
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
            <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
              No variants added. Click "Add Variant" to create product
              variations.
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index}>
                  <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/40">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
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
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
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
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
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
                        onKeyPress={(event) => {
                          if (!/[0-9.]/.test(event.key)) {
                            event.preventDefault();
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Stock
                      </label>
                      <InputNumber
                        value={variant.stock}
                        onChange={(value) =>
                          handleVariantChange(index, "stock", value)
                        }
                        min={0}
                        style={{ width: "100%" }}
                        onKeyPress={(event) => {
                          if (!/[0-9]/.test(event.key)) {
                            event.preventDefault();
                          }
                        }}
                      />
                    </div>
                  </div>
                  {/* Auto-SKU preview */}
                  <div className="mt-3 grid gap-2 md:grid-cols-[120px_1fr] md:items-center">
                    <span className="text-xs text-zinc-400">Auto SKU</span>
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
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-300">Total Stock</p>
                <p className="text-xs text-zinc-500 mt-0.5">
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
              <p className="text-xs text-amber-600 mt-3 border-t border-amber-900/50 pt-2">
                Add variants in the Variants tab to calculate stock automatically.
              </p>
            )}
            {variants.length > 0 && (
              <div className="mt-3 border-t border-zinc-800 pt-3 space-y-1">
                {variants.map((v, i) => (
                  <div key={i} className="flex justify-between text-xs text-zinc-400">
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
      key: "details",
      label: "Features & Details",
      children: (
        <div className="space-y-6">
          {/* Story & Materials */}
          <div className="space-y-4">
            <h3 className="font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Overview</h3>
            <Form.Item name={["details", "story"]} label="Product Story">
              <TextArea rows={4} placeholder="Write a compelling story about this product..." />
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name={["details", "material"]} label="Material">
                <Input placeholder="e.g., 100% Cotton" />
              </Form.Item>
              <Form.Item name={["details", "washingInstructions"]} label="Care Instructions">
                <Input placeholder="e.g., Machine wash cold" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name={["details", "sizeAndFit"]} label="Size & Fit">
                <Input placeholder="e.g., True to size. Model is 6'1 wearing Medium." />
              </Form.Item>
              <Form.Item name="shipping" label="Shipping Information">
                <Input placeholder="e.g., Free shipping over ₹500" />
              </Form.Item>
            </div>
          </div>

          {/* Key Highlights */}
          <div className="space-y-4">
            <h3 className="font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Key Highlights</h3>
            <p className="text-xs text-zinc-500 -mt-2">Bullet points that appear next to the product images.</p>
            <Form.List name="keyHighlights">
              {(fields, { add, remove }) => (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.key} className="flex gap-2">
                      <Form.Item {...field} noStyle>
                        <Input placeholder="e.g., Premium breathable fabric" />
                      </Form.Item>
                      <Button type="text" danger icon={<IconTrash className="w-4 h-4" />} onClick={() => remove(field.name)} />
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<IconPlus className="w-4 h-4" />}>
                    Add Highlight
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Specifications</h3>
            <Form.List name="specifications">
              {(fields, { add, remove }) => (
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div key={field.key} className="flex gap-2">
                      <Form.Item name={[field.name, "label"]} noStyle>
                        <Input placeholder="Label (e.g., Weight)" style={{ width: "40%" }} />
                      </Form.Item>
                      <Form.Item name={[field.name, "value"]} noStyle>
                        <Input placeholder="Value (e.g., 200g)" style={{ width: "60%" }} />
                      </Form.Item>
                      <Button type="text" danger icon={<IconTrash className="w-4 h-4" />} onClick={() => remove(field.name)} />
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<IconPlus className="w-4 h-4" />}>
                    Add Specification
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <h3 className="font-semibold text-zinc-100 border-b border-zinc-800 pb-2">Detailed Feature Cards</h3>
            <Form.List name="featureCards">
              {(fields, { add, remove }) => (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.key} className="p-4 border border-zinc-800 rounded-lg bg-zinc-950/40 relative mt-2">
                      <Button 
                        type="text" danger 
                        icon={<IconX className="w-4 h-4" />} 
                        onClick={() => remove(field.name)} 
                        className="absolute top-2 right-2"
                      />
                      <div className="grid grid-cols-2 gap-4 pr-8">
                        <Form.Item name={[field.name, "title"]} label="Title">
                          <Input placeholder="e.g., Built for Performance" />
                        </Form.Item>
                        <Form.Item name={[field.name, "icon"]} label="Icon Name">
                          <Select placeholder="Select Icon">
                            <Option value="activity">Activity / Performance</Option>
                            <Option value="battery">Battery / Power</Option>
                            <Option value="bluetooth">Bluetooth / Connectivity</Option>
                            <Option value="leaf">Leaf / Eco-friendly</Option>
                            <Option value="wash_machine">Wash / Care</Option>
                            <Option value="shield">Shield / Protection</Option>
                            <Option value="star">Star / Premium</Option>
                            <Option value="droplet">Droplet / Water Resistant</Option>
                            <Option value="sun">Sun / UV Protection</Option>
                            <Option value="wind">Wind / Breathable</Option>
                          </Select>
                        </Form.Item>
                      </div>
                      <Form.Item name={[field.name, "description"]} label="Description" className="mb-0">
                        <TextArea rows={2} placeholder="Description for this feature" />
                      </Form.Item>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<IconPlus className="w-4 h-4" />}>
                    Add Feature Card
                  </Button>
                </div>
              )}
            </Form.List>
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
      maskClosable={false}
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
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handlePrimaryAction}
          >
            {primaryButtonLabel}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ProductForm;
