"use client";
import React, { useState, useEffect } from "react";
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

const CategoryForm = ({ visible, category, categories, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [imageList, setImageList] = useState([]);
  const [bannerList, setBannerList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reset form when modal visibility changes
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setImageList([]);
      setBannerList([]);
    }
  }, [visible, form]);

  // Populate form when editing
  useEffect(() => {
    if (category && visible) {
      // Handle both ID formats (id or _id)
      const categoryId = category.id || category._id;
      
      // Format the category data for the form
      const formData = {
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        parentId: category.parentId || category.parent?.id || category.parent?._id || null,
        sortOrder: category.sortOrder || 0,
        isActive: category.isActive ?? true,
        isFeatured: category.isFeatured ?? false,
        metaTitle: category.metaTitle || "",
        metaDescription: category.metaDescription || "",
        metaKeywords: Array.isArray(category.metaKeywords) 
          ? category.metaKeywords.join(", ") 
          : category.metaKeywords || "",
      };

      form.setFieldsValue(formData);

      // Set image and banner lists
      if (category.image) {
        setImageList([typeof category.image === 'string' ? category.image : category.image.url]);
      } else {
        setImageList([]);
      }

      if (category.banner) {
        setBannerList([typeof category.banner === 'string' ? category.banner : category.banner.url]);
      } else {
        setBannerList([]);
      }
    } else {
      form.resetFields();
      setImageList([]);
      setBannerList([]);
    }
  }, [category, visible, form]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Prepare the payload
      const payload = {
        name: values.name,
        slug: values.slug || generateSlug(values.name),
        description: values.description || "",
        parentId: values.parentId || null,
        image: imageList[0] || null,
        banner: bannerList[0] || null,
        sortOrder: values.sortOrder || 0,
        isActive: values.isActive ?? true,
        isFeatured: values.isFeatured ?? false,
        metaTitle: values.metaTitle || "",
        metaDescription: values.metaDescription || "",
        metaKeywords: values.metaKeywords 
          ? values.metaKeywords.split(",").map(k => k.trim()).filter(k => k)
          : [],
      };

      // Determine if we're creating or updating
      const categoryId = category?.id || category?._id;
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
        
        // Call onSuccess with the updated/created category
        onSuccess?.(data.data.category);
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
          form.setFields([{ 
            name: e.field, 
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
      title={category ? "Edit Category" : "Add New Category"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={720}
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
              if (!form.getFieldValue("slug")) {
                form.setFieldsValue({ slug: generateSlug(e.target.value) });
              }
            }}
          />
        </Form.Item>

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
              const value = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "-");
              form.setFieldsValue({ slug: value });
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
            {categories
              ?.filter(cat => cat.id !== category?.id && cat._id !== category?._id) // Prevent self-parenting
              .map((cat) => (
                <Option key={cat.id || cat._id} value={cat.id || cat._id}>
                  {cat.name}
                </Option>
              ))}
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

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <div className="mt-2">Upload Image</div>
                </div>
              )}
            </Upload>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <div className="mt-2">Upload Banner</div>
                </div>
              )}
            </Upload>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="sortOrder" label="Sort Order">
            <InputNumber 
              min={0} 
              max={999} 
              style={{ width: "100%" }} 
              placeholder="0"
            />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>

          <Form.Item name="isFeatured" label="Featured" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>

        <div className="border-t border-gray-200 my-4 pt-4">
          <h3 className="text-lg font-medium mb-4">SEO Settings</h3>
          
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
          >
            <Input placeholder="keyword1, keyword2, keyword3" />
          </Form.Item>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
          >
            {category ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CategoryForm;