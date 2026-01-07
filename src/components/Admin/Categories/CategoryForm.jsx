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
} from "antd";
import { IconUpload, IconX } from "@tabler/icons-react";
import { uploadImage } from "@/lib/upload-client";

const { TextArea } = Input;
const { Option } = Select;

const CategoryForm = ({ visible, category, categories, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [imageList, setImageList] = useState([]);
  const [bannerList, setBannerList] = useState([]);

  useEffect(() => {
    if (category) {
      // Check if this is a new subcategory (only has parentId)
      if (category.parentId && !category.id) {
        form.setFieldsValue({
          name: "",
          slug: "",
          description: "",
          parentId: category.parentId,
          sortOrder: 0,
        });
        setImageList([]);
        setBannerList([]);
      } else {
        // Existing category or new top-level category
        form.setFieldsValue({
          name: category.name || "",
          slug: category.slug || "",
          description: category.description || "",
          parentId: category.parentId || null,
          sortOrder: category.sortOrder || 0,
        });
        setImageList(category.image ? [category.image] : []);
        setBannerList(category.banner ? [category.banner] : []);
      }
    } else {
      form.resetFields();
      setImageList([]);
      setBannerList([]);
    }
  }, [category, form]);

  const handleSubmit = async (values) => {
    try {
      const categoryData = {
        ...values,
        image: imageList[0] || "",
        banner: bannerList[0] || "",
        id: category?.id || Date.now(),
      };
      onSave(categoryData);
    } catch (error) {
      message.error("Please fill in all required fields");
    }
  };

  const handleImageUpload = async (info) => {
    if (info.file.status === "uploading") return;
    if (info.file.status === "done" || info.file.originFileObj) {
      try {
        const file = info.file.originFileObj || info.file;
        const result = await uploadImage(file, {
          folder: "fluxfit/categories",
        });
        setImageList([result.url]);
        message.success("Image uploaded successfully");
      } catch (error) {
        message.error("Failed to upload image");
      }
    }
  };

  const handleBannerUpload = async (info) => {
    if (info.file.status === "uploading") return;
    if (info.file.status === "done" || info.file.originFileObj) {
      try {
        const file = info.file.originFileObj || info.file;
        const result = await uploadImage(file, {
          folder: "fluxfit/categories/banners",
        });
        setBannerList([result.url]);
        message.success("Banner uploaded successfully");
      } catch (error) {
        message.error("Failed to upload banner");
      }
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const getParentCategories = () => {
    const flattenCategories = (cats, result = []) => {
      cats.forEach((cat) => {
        if (!category || cat.id !== category.id) {
          result.push(cat);
          if (cat.children && cat.children.length > 0) {
            flattenCategories(cat.children, result);
          }
        }
      });
      return result;
    };
    return flattenCategories(categories);
  };

  return (
    <Modal
      title={category ? "Edit Category" : "Add New Category"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <Form.Item
          name="name"
          label="Category Name"
          rules={[{ required: true, message: "Please enter category name" }]}
        >
          <Input
            placeholder="Enter category name"
            onChange={(e) => {
              const slug = generateSlug(e.target.value);
              form.setFieldsValue({ slug });
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
              message:
                "Slug can only contain lowercase letters, numbers, and hyphens",
            },
          ]}
        >
          <Input placeholder="category-slug" />
        </Form.Item>

        <Form.Item name="parentId" label="Parent Category">
          <Select placeholder="Select parent category (optional)" allowClear>
            <Option value={null}>None (Top Level)</Option>
            {getParentCategories().map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Enter category description" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image
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
              accept="image/*"
              maxCount={1}
            >
              {imageList.length < 1 && (
                <div>
                  <IconUpload className="w-6 h-6" />
                  <div className="mt-2">Upload</div>
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
              fileList={bannerList.map((url, index) => ({
                uid: index.toString(),
                name: `banner-${index}.jpg`,
                status: "done",
                url,
              }))}
              onChange={handleBannerUpload}
              accept="image/*"
              maxCount={1}
            >
              {bannerList.length < 1 && (
                <div>
                  <IconUpload className="w-6 h-6" />
                  <div className="mt-2">Upload</div>
                </div>
              )}
            </Upload>
          </div>
        </div>

        <Form.Item name="sortOrder" label="Sort Order" initialValue={0}>
          <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" size="large">
            {category ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CategoryForm;
