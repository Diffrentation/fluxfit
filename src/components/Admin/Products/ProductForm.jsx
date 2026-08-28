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
  message,
  Divider,
  Space,
} from "antd";
import {
  IconX,
  IconPlus,
  IconTrash,
  IconChevronRight,
} from "@tabler/icons-react";
import { uploadImage } from "@/lib/upload-client";
import slugify from "slugify";

const { TextArea } = Input;
const { Option } = Select;

const normaliseColors = (variant) => {
  const raw = Array.isArray(variant?.colors)
    ? variant.colors
    : variant?.color
      ? [variant.color]
      : [];

  return [...new Set(raw.map((color) => String(color || "").trim()).filter(Boolean))];
};

const normaliseSizes = (variant) => {
  const raw = Array.isArray(variant?.sizes)
    ? variant.sizes
    : variant?.size
      ? [variant.size]
      : [];

  return [...new Set(raw.map((size) => String(size || "").trim()).filter(Boolean))];
};

// The database stores one size/color combination per variant. The editor lets
// one row cover several sizes and colors (sharing price, stock and images),
// so expand those groups immediately before validation/save.
const expandVariantGroups = (groups) => {
  const seen = new Set();
  const duplicateKeys = [];
  const expanded = [];

  (groups || []).forEach((group) => {
    const colors = normaliseColors(group);
    const sizes = normaliseSizes(group);
    const isGrouped = colors.length > 1 || sizes.length > 1;

    sizes.forEach((size) => {
      colors.forEach((color) => {
        const key = `${size.toLowerCase()}::${color.toLowerCase()}`;
        if (seen.has(key)) {
          duplicateKeys.push(`${size} / ${color}`);
          return;
        }
        seen.add(key);

        const { colors: _colors, sizes: _sizes, _randSuffix, ...variant } = group;
        // A grouped row needs a distinct SKU for each combination. Let the
        // model generate these safely rather than duplicating the preview SKU.
        if (isGrouped) delete variant.sku;
        expanded.push({ ...variant, size, color });
      });
    });
  });

  return { expanded, duplicateKeys };
};

// Older products only had a top-level image gallery (no per-variant images).
// When editing one of those, seed each variant with that gallery so photos
// already uploaded stay visible instead of appearing to have vanished.
const backfillVariantImages = (productLike) => {
  const legacyImages = (productLike?.images || [])
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter(Boolean);

  return (productLike?.variants || []).map((variant) => {
    if (Array.isArray(variant.images) && variant.images.length) return variant;
    if (variant.image) return { ...variant, images: [variant.image] };
    return { ...variant, images: legacyImages };
  });
};

const ProductForm = ({ visible, product, onClose, onSave }) => {
  const [form] = Form.useForm();
  const watchedValues = Form.useWatch([], form);
  const [variants, setVariants] = useState([]);
  const [colorDrafts, setColorDrafts] = useState({});
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [nameValue, setNameValue] = useState("");
  const [metaTitleValue, setMetaTitleValue] = useState("");
  const newVariantGroup = useCallback(
    () => ({
      size: "One Size",
      sizes: ["One Size"],
      color: "",
      colors: [],
      price: Number(form.getFieldValue("basePrice")) || 0,
      stock: 0,
      images: [],
      sku: "",
      _randSuffix: Math.floor(1000 + Math.random() * 9000),
    }),
    [form],
  );
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
    if (!visible) return;
    fetchCategories();
  }, [fetchCategories, visible]);

  /* ---------------- PREFILL WHEN EDITING ---------------- */
  useEffect(() => {
    if (!visible) return;

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
            setVariants(backfillVariantImages(productData));
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
          setVariants(backfillVariantImages(product));
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
        setVariants(backfillVariantImages(product));
        setNameValue(product.name || "");
        setMetaTitleValue(product.metaTitle || "");
      } else {
        form.resetFields();
        initialEditSlugRef.current = "";
        // Start a new product with the complete variant editor already
        // visible—admins never need to create an empty row first.
        setVariants([newVariantGroup()]);
        setNameValue("");
        setMetaTitleValue("");
      }
    };

    fetchProductDetails();
  }, [visible, product, form, newVariantGroup, normalizeCategoryId]);

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
    () =>
      variants.reduce(
        (sum, variant) =>
          sum +
          (Number(variant.stock) || 0) *
            normaliseColors(variant).length *
            normaliseSizes(variant).length,
        0,
      ),
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

  /* ---------------- VARIANTS ---------------- */
  const handleAddVariant = useCallback(() => {
    setVariants((prev) => [...prev, newVariantGroup()]);
  }, [newVariantGroup]);

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

  const handleVariantColorsChange = useCallback((index, colors) => {
    const nextColors = [...new Set((colors || []).map((color) => String(color).trim()).filter(Boolean))];
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        colors: nextColors,
        // Keep a representative color for backwards-compatible previews.
        color: nextColors[0] || "",
      };
      return updated;
    });
  }, []);

  const handleVariantSizesChange = useCallback((index, sizes) => {
    const nextSizes = [...new Set((sizes || []).map((size) => String(size).trim()).filter(Boolean))];
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        sizes: nextSizes,
        // Keep a representative size for backwards-compatible previews.
        size: nextSizes[0] || "",
      };
      return updated;
    });
  }, []);

  const handleVariantImageUpload = useCallback(async (index, info) => {
    if (!info.file.originFileObj) return;
    try {
      const result = await uploadImage(info.file.originFileObj, {
        folder: "fluxfit/products",
      });
      const imageUrl = typeof result === "string" ? result : result.url;
      setVariants((prev) => {
        const updated = [...prev];
        const existing = Array.isArray(updated[index].images) ? updated[index].images : [];
        updated[index] = { ...updated[index], images: [...existing, imageUrl] };
        return updated;
      });
      message.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload error:", error);
      message.error("Failed to upload image");
    }
  }, []);

  const handleRemoveVariantImage = useCallback((index, imageIndex) => {
    setVariants((prev) => {
      const updated = [...prev];
      const existing = Array.isArray(updated[index].images) ? updated[index].images : [];
      updated[index] = { ...updated[index], images: existing.filter((_, i) => i !== imageIndex) };
      return updated;
    });
  }, []);

  /* ---------------- FORM SUBMIT ---------------- */
  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const editingId = product?._id || product?.id;
        const isEdit = !!editingId;
        const { expanded: savedVariants, duplicateKeys } = expandVariantGroups(variants);

        if (duplicateKeys.length > 0) {
          message.error(`Duplicate size/color combinations: ${duplicateKeys.join(", ")}`);
          return;
        }

        const derivedColors = [
          ...new Set(
            savedVariants.map((v) => v.color).filter(Boolean).map((c) => String(c).trim())
          ),
        ];
        const derivedSizes = [
          ...new Set(
            savedVariants.map((v) => v.size).filter(Boolean).map((s) => String(s).trim())
          ),
        ];
        const derivedImages = [
          ...new Set(
            savedVariants
              .flatMap((v) => (Array.isArray(v.images) ? v.images : []))
              .filter(Boolean)
          ),
        ];

        const payload = {
          name: values.name,
          description: values.description,
          shortDescription: values.description,
          category: values.category,
          basePrice: values.basePrice,
          originalPrice: values.originalPrice,
          images: derivedImages.map((url, i) => ({ url, isPrimary: i === 0 })),
          variants: savedVariants,
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
    [autoSlug, form, initialEditSlugRef, onClose, onSave, product, variants],
  );

  const isBasicStepComplete = useMemo(() => {
    return Boolean(
      watchedValues?.name?.trim() &&
      watchedValues?.category &&
      watchedValues?.status &&
      watchedValues?.description?.trim() &&
      watchedValues?.description.trim().length <= 200 &&
      watchedValues?.basePrice !== undefined &&
      watchedValues?.basePrice !== null,
    );
  }, [watchedValues]);

  const areVariantsStepComplete = useMemo(() => {
    return (
      variants.length > 0 &&
      variants.some((variant) => Array.isArray(variant.images) && variant.images.length > 0) &&
      variants.every(
        (variant) =>
          normaliseSizes(variant).length > 0 &&
          normaliseColors(variant).length > 0 &&
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
    return watchedValues?.lowStockThreshold === undefined
      ? true
      : Number(watchedValues?.lowStockThreshold) >= 0;
  }, [watchedValues?.lowStockThreshold]);

  const isSeoStepComplete = useMemo(() => {
    return Boolean(watchedValues?.metaTitle?.trim() && autoSlug);
  }, [autoSlug, watchedValues?.metaTitle]);

  const createStepOrder = useMemo(
    () => ["basic", "variants", "inventory", "details", "seo"],
    [],
  );

  const stepCompletion = useMemo(
    () => ({
      basic: isBasicStepComplete,
      variants: areVariantsStepComplete,
      inventory: isInventoryStepComplete,
      details: true,
      seo: isSeoStepComplete,
    }),
    [
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

    if (activeTab === "variants") {
      if (!variants.length) {
        message.error("Please add at least one variant");
        return false;
      }

      const hasInvalidVariant = variants.some(
        (variant) =>
          normaliseSizes(variant).length === 0 ||
          normaliseColors(variant).length === 0 ||
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

      const hasAnyImages = variants.some(
        (variant) => Array.isArray(variant.images) && variant.images.length > 0,
      );
      if (!hasAnyImages) {
        message.error("Please upload at least one image for a variant");
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
  }, [activeTab, autoSlug, form, variants]);

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
      key: "variants",
      label: "Variants",
      children: (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-zinc-100">Product Variants</h3>
              <p className="text-sm text-zinc-400">
                Manage sizes, colors, pricing and photos for this product. Each variant&apos;s
                images apply to every size selected in that row.
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
              No variants added. Click &quot;Add Variant&quot; to create product
              variations.
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, index) => {
                const variantImages = Array.isArray(variant.images) ? variant.images : [];
                const variantFileList = variantImages.map((url, i) => ({
                  uid: `${index}-${i}`,
                  name: `image-${i}.jpg`,
                  status: "done",
                  url,
                }));

                return (
                <div key={index}>
                  <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/40">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Sizes
                      </label>
                      <Select
                        mode="multiple"
                        value={normaliseSizes(variant)}
                        onChange={(value) =>
                          handleVariantSizesChange(index, value)
                        }
                        placeholder="Sizes"
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
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Pick every size that shares this row&apos;s colours, price and photos.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Colors
                      </label>
                      <div className="flex h-[42px] items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-950 px-3">
                        <input
                          type="color"
                          value={colorDrafts[index] || "#000000"}
                          onChange={(event) =>
                            setColorDrafts((previous) => ({
                              ...previous,
                              [index]: event.target.value,
                            }))
                          }
                          aria-label="Pick a colour"
                          className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        <span className="text-xs text-zinc-400">
                          Pick a colour
                        </span>
                        <Button
                          type="text"
                          size="small"
                          onClick={() =>
                            handleVariantColorsChange(index, [
                              ...normaliseColors(variant),
                              colorDrafts[index] || "#000000",
                            ])
                          }
                          className="ml-auto !text-[#22c55e]"
                        >
                          Add
                        </Button>
                      </div>
                      {normaliseColors(variant).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {normaliseColors(variant).map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() =>
                                handleVariantColorsChange(
                                  index,
                                  normaliseColors(variant).filter(
                                    (selectedColor) => selectedColor !== color,
                                  ),
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 py-1 pl-1 pr-2 text-xs text-zinc-200 transition hover:border-red-500 hover:text-red-300"
                              title="Remove colour"
                            >
                              <span
                                className="h-4 w-4 rounded-full border border-zinc-500"
                                style={{ backgroundColor: color }}
                              />
                              {color}
                              <IconX className="h-3 w-3" />
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Choose any custom colour, then add it. Each picked colour becomes its own sellable variant.
                      </p>
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

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Variant Images
                    </label>
                    <Upload
                      listType="picture-card"
                      fileList={variantFileList}
                      onChange={(info) => handleVariantImageUpload(index, info)}
                      onRemove={(file) => {
                        const fileUrl =
                          typeof file === "string"
                            ? file
                            : file.url || file.response?.url;
                        const imageIndex = variantImages.findIndex((url) => url === fileUrl);
                        if (imageIndex !== -1) {
                          handleRemoveVariantImage(index, imageIndex);
                        }
                      }}
                      accept="image/*"
                      multiple
                    >
                      {variantImages.length < 5 && (
                        <div>
                          <IconPlus className="w-6 h-6" />
                          <div className="mt-2">Upload</div>
                        </div>
                      )}
                    </Upload>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Upload up to 5 images for this variant. They&apos;ll be shown for every size selected above.
                    </p>
                  </div>

                  {/* Auto-SKU preview */}
                  <div className="mt-3 grid gap-2 md:grid-cols-[120px_1fr] md:items-center">
                    <span className="text-xs text-zinc-400">Generated variants</span>
                    <Input
                      readOnly
                      value={
                        normaliseColors(variant).length * normaliseSizes(variant).length > 1
                          ? `${normaliseColors(variant).length * normaliseSizes(variant).length} SKUs will be generated (${normaliseSizes(variant).length || 0} size(s) × ${normaliseColors(variant).length || 0} colour(s))`
                          : variant.sku && !variant._randSuffix
                            ? variant.sku
                            : autoSkuForVariant({
                                ...variant,
                                size: normaliseSizes(variant)[0] || "",
                                color: normaliseColors(variant)[0] || "",
                              })
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
                );
              })}
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
                      {normaliseSizes(v).join(", ") || "—"} / {normaliseColors(v).join(", ") || "—"}
                    </span>
                    <span className="font-medium">
                      {(Number(v.stock) || 0) * normaliseColors(v).length * normaliseSizes(v).length} units
                    </span>
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

  if (!visible) return null;

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
