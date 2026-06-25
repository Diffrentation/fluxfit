"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Upload,
  Button,
  message,
  Switch,
} from "antd";
import axios from "axios";
import { IconUpload } from "@tabler/icons-react";
import { uploadImage } from "@/lib/upload-client";

const { TextArea } = Input;
const { Option } = Select;

/** Plain string for JSON body (avoids React/DOM refs reaching axios JSON.stringify). */
function asText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

/** Parent id for API: Select may store labelInValue `{ value, label }` or a populated parent object. */
function asParentId(v) {
  if (v == null || v === "") return null;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && v !== null) {
    if ("value" in v && v.value != null && v.value !== "") return String(v.value);
    if ("id" in v && v.id != null && v.id !== "") return String(v.id);
    if ("_id" in v && v._id != null && v._id !== "") return String(v._id);
  }
  return null;
}

function asKeywordList(v) {
  if (v == null || v === "") return [];
  if (Array.isArray(v)) {
    return v.map((k) => asText(k).trim()).filter(Boolean);
  }
  return asText(v)
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function asUrlOrNull(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  return null;
}

const CategoryForm = ({ visible, category, categories, onClose, onSuccess, onSave }) => {
  const [form] = Form.useForm();
  const [imageList, setImageList] = useState([]);
  const [bannerList, setBannerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const editingCategoryId = useMemo(
    () => category?.id || category?._id || null,
    [category]
  );
  const isEditMode = Boolean(editingCategoryId);

  // Reset form when modal visibility changes
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setImageList([]);
      setBannerList([]);
      setIsSlugManuallyEdited(false);
    }
  }, [visible, form]);

  // Populate form when editing with latest backend data (including parent)
  useEffect(() => {
    const prefillCategory = async () => {
      if (!visible) {
        return;
      }

      // Create mode: preserve parent category when opened via "Add Subcategory"
      if (!editingCategoryId) {
        form.resetFields();
        setImageList([]);
        setBannerList([]);
        setIsSlugManuallyEdited(false);
        form.setFieldsValue({
          parentId:
            category?.parentId ||
            category?.parent?.id ||
            category?.parent?._id ||
            null,
          sortOrder: 0,
          isActive: true,
          isFeatured: false,
        });
        return;
      }

      try {
        setLoading(true);
        const { data } = await axios.get(
          `/api/categories/${editingCategoryId}?includeParent=true`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const categoryData = data?.data?.category;
        if (!data?.success || !categoryData) {
          throw new Error(data?.message || "Failed to fetch category details");
        }

        const formData = {
          name: categoryData.name || "",
          slug: categoryData.slug || "",
          description: categoryData.description || "",
          parentId:
            categoryData.parent?.id ||
            categoryData.parent?._id ||
            categoryData.parent ||
            null,
          sortOrder: categoryData.sortOrder || 0,
          isActive: categoryData.isActive ?? true,
          isFeatured: categoryData.isFeatured ?? false,
          metaTitle: categoryData.metaTitle || "",
          metaDescription: categoryData.metaDescription || "",
          metaKeywords: Array.isArray(categoryData.metaKeywords)
            ? categoryData.metaKeywords.join(", ")
            : categoryData.metaKeywords || "",
        };

        form.setFieldsValue(formData);
        setIsSlugManuallyEdited(true);
        setImageList(
          categoryData.image
            ? [typeof categoryData.image === "string" ? categoryData.image : categoryData.image.url]
            : []
        );
        setBannerList(
          categoryData.banner
            ? [typeof categoryData.banner === "string" ? categoryData.banner : categoryData.banner.url]
            : []
        );
      } catch (error) {
        console.error("Category prefetch error:", error);
        message.error("Failed to prefill category details");
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      prefillCategory();
    } else {
      form.resetFields();
      setImageList([]);
      setBannerList([]);
    }
  }, [editingCategoryId, visible, form, category]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const name = asText(values.name).trim();
      const slugBase = asText(values.slug) || generateSlug(name);

      // Prepare the payload (strictly JSON-serializable — no Select/React objects)
      const payload = {
        name,
        slug: slugBase,
        description: asText(values.description),
        parent: asParentId(values.parentId),
        image: asUrlOrNull(imageList[0]),
        banner: asUrlOrNull(bannerList[0]),
        sortOrder: Number(values.sortOrder) || 0,
        isActive: values.isActive ?? true,
        isFeatured: values.isFeatured ?? false,
        metaTitle: asText(values.metaTitle),
        metaDescription: asText(values.metaDescription),
        metaKeywords: asKeywordList(values.metaKeywords),
      };

      // Determine if we're creating or updating
      const categoryId = editingCategoryId;
      const url = categoryId 
        ? `/api/categories/${categoryId}` 
        : "/api/categories";
      
      const method = categoryId ? "put" : "post";

      const { data } = await axios({
        method,
        url,
        data: payload,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (data.success) {
        message.success(
          categoryId 
            ? "Category updated successfully 🎉" 
            : "Category created successfully 🎉"
        );
        
        form.resetFields();
        setImageList([]);
        setBannerList([]);
        
        // Support both callback names used across screens.
        const savedCategory = data.data?.category;
        onSuccess?.(savedCategory);
        try {
          await Promise.resolve(onSave?.(savedCategory));
        } catch (callbackErr) {
          console.error("Category onSave error:", callbackErr);
        }
        // Notify category tree to refetch from backend.
        window.dispatchEvent(new Event("categories:refresh"));
        onClose();
      } else {
        message.error(data.message || "Failed to save category");
      }
    } catch (err) {
      console.error("Category form error:", err);
      
      const res = err.response;
      
      // Handle validation errors
      if (res?.data?.errors) {
        res.data.errors.forEach((e) => {
          const fieldName = e.field === "parent" ? "parentId" : e.field;
          form.setFields([{ 
            name: fieldName, 
            errors: [e.message] 
          }]);
        });
      } else if (res?.data?.message) {
        message.error(res.data.message);
      } else {
        message.error("Failed to save category. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (info) => {
    try {
      if (!info.file.originFileObj) return;
      
      setLoading(true);
      const result = await uploadImage(info.file.originFileObj, {
        folder: "fluxfit/categories",
      });
      
      // Handle different response formats
      const imageUrl = typeof result === 'string' ? result : result.url;
      setImageList([imageUrl]);
      message.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload error:", error);
      message.error("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = async (info) => {
    try {
      if (!info.file.originFileObj) return;
      
      setLoading(true);
      const result = await uploadImage(info.file.originFileObj, {
        folder: "fluxfit/categories/banners",
      });
      
      // Handle different response formats
      const bannerUrl = typeof result === 'string' ? result : result.url;
      setBannerList([bannerUrl]);
      message.success("Banner uploaded successfully");
    } catch (error) {
      console.error("Banner upload error:", error);
      message.error("Failed to upload banner");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (type) => {
    if (type === 'image') {
      setImageList([]);
    } else {
      setBannerList([]);
    }
  };

  // Prepare upload file lists
  const imageUploadList = imageList.map((url, index) => ({
    uid: `-${index}`,
    name: `image-${index}`,
    status: 'done',
    url: url,
  }));

  const bannerUploadList = bannerList.map((url, index) => ({
    uid: `-${index}`,
    name: `banner-${index}`,
    status: 'done',
    url: url,
  }));

  return (
    <Modal
      title={isEditMode ? "Edit Category" : "Add New Category"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose={true}
      maskClosable={false}
    >
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleSubmit}
        initialValues={{
          sortOrder: 0,
          isActive: true,
          isFeatured: false,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left Column: Basic Information */}
          <div className="space-y-4">
            <Form.Item
              name="name"
              label="Category Name"
              rules={[
                { required: true, message: "Please enter category name" },
                { min: 2, message: "Category name must be at least 2 characters" },
                { max: 50, message: "Category name cannot exceed 50 characters" }
              ]}
            >
              <Input
                placeholder="Enter category name"
                onChange={(e) => {
                  if (!isSlugManuallyEdited && !isEditMode) {
                    form.setFieldsValue({ slug: generateSlug(e.target.value) });
                  }
                }}
              />
            </Form.Item>

            <Form.Item name="parentId" label="Parent Category">
              <Select 
                allowClear 
                placeholder="None (Top Level Category)"
                showSearch
                optionFilterProp="children"
              >
                {(categories || [])
                  .filter((cat) => {
                    const cid = cat.id ?? cat._id;
                    return cid != null && String(cid) !== "";
                  })
                  .filter(
                    (cat) =>
                      String(cat.id ?? cat._id) !== String(category?.id ?? category?._id ?? "")
                  )
                  .map((cat) => {
                    const cid = String(cat.id ?? cat._id);
                    return (
                      <Option key={cid} value={cid}>
                        {cat.name}
                      </Option>
                    );
                  })}
              </Select>
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea 
                rows={3} 
                placeholder="Enter category description"
                maxLength={500}
                showCount
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Category Image
                </label>
                <Upload
                  listType="picture-card"
                  fileList={imageUploadList}
                  onChange={handleImageUpload}
                  onRemove={() => handleRemoveImage('image')}
                  maxCount={1}
                  accept="image/*"
                >
                  {imageList.length < 1 && (
                    <div>
                      <IconUpload className="w-6 h-6 mx-auto" />
                      <div className="mt-2 text-xs">Upload Image</div>
                    </div>
                  )}
                </Upload>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Category Banner
                </label>
                <Upload
                  listType="picture-card"
                  fileList={bannerUploadList}
                  onChange={handleBannerUpload}
                  onRemove={() => handleRemoveImage('banner')}
                  maxCount={1}
                  accept="image/*"
                >
                  {bannerList.length < 1 && (
                    <div>
                      <IconUpload className="w-6 h-6 mx-auto" />
                      <div className="mt-2 text-xs">Upload Banner</div>
                    </div>
                  )}
                </Upload>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <Form.Item name="sortOrder" label="Sort Order" className="mb-0">
                <InputNumber 
                  min={0} 
                  max={999} 
                  style={{ width: "100%" }} 
                  placeholder="0"
                />
              </Form.Item>

              <Form.Item name="isActive" label="Active" valuePropName="checked" className="mb-0">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item name="isFeatured" label="Featured" valuePropName="checked" className="mb-0">
                <Switch />
              </Form.Item>
            </div>
          </div>

          {/* Right Column: URL & SEO Settings */}
          <div className="space-y-4">
            <Form.Item
              name="slug"
              label="URL Slug"
              rules={[
                { required: true, message: "Please enter URL slug" },
                { 
                  pattern: /^[a-z0-9-]+$/, 
                  message: "Slug can only contain lowercase letters, numbers, and hyphens" 
                },
              ]}
              help="URL-friendly version of the category name"
            >
              <Input 
                placeholder="category-slug"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setIsSlugManuallyEdited(false);
                    const currentName = form.getFieldValue("name") || "";
                    form.setFieldsValue({ slug: generateSlug(currentName) });
                  } else {
                    setIsSlugManuallyEdited(true);
                    const value = val
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-");
                    form.setFieldsValue({ slug: value });
                  }
                }}
              />
            </Form.Item>

            <div className="border border-zinc-800 p-4 rounded-xl bg-zinc-950/40">
              <h3 className="text-base font-semibold text-zinc-200 mb-4 border-b border-zinc-800 pb-2">SEO Settings</h3>
              
              <Form.Item name="metaTitle" label="Meta Title">
                <Input 
                  placeholder="Enter meta title" 
                  maxLength={60}
                  showCount
                />
              </Form.Item>

              <Form.Item name="metaDescription" label="Meta Description">
                <TextArea 
                  maxLength={160} 
                  showCount 
                  rows={3}
                  placeholder="Enter meta description"
                />
              </Form.Item>

              <Form.Item 
                name="metaKeywords" 
                label="Meta Keywords" 
                help="Comma-separated keywords for SEO"
                className="mb-0"
              >
                <Input placeholder="keyword1, keyword2, keyword3" />
              </Form.Item>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 border-t border-zinc-800 pt-4">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
          >
            {isEditMode ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CategoryForm;