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

  useEffect(() => {
    if (category) {
      form.setFieldsValue({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        parent: category.parent || null,
        sortOrder: category.sortOrder || 0,
        isActive: category.isActive ?? true,
        isFeatured: category.isFeatured ?? false,
        metaTitle: category.metaTitle || "",
        metaDescription: category.metaDescription || "",
        metaKeywords: category.metaKeywords?.join(", ") || "",
      });

      setImageList(category.image ? [category.image] : []);
      setBannerList(category.banner ? [category.banner] : []);
    } else {
      form.resetFields();
      setImageList([]);
      setBannerList([]);
    }
  }, [category, form]);

  const generateSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        image: imageList[0] || null,
        banner: bannerList[0] || null,
        parent: values.parent || null,
        metaKeywords: values.metaKeywords
          ? values.metaKeywords.split(",").map((k) => k.trim())
          : [],
      };

      const { data } = await axios.post("/api/categories", JSON.stringify(payload),{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log(data);
      message.success("Category created successfully 🎉");
      form.resetFields();
      setImageList([]);
      setBannerList([]);
      onSuccess?.(data.data.category);
      onClose();
    } catch (err) {
      const res = err.response;

      if (res?.data?.errors) {
        res.data.errors.forEach((e) => {
          form.setFields([{ name: e.field, errors: [e.message] }]);
        });
      }

      message.error(res?.data?.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (info) => {
    if (!info.file.originFileObj) return;
    try {
      const result = await uploadImage(info.file.originFileObj, {
        folder: "fluxfit/categories",
      });
      setImageList([result.url]);
      message.success("Image uploaded");
    } catch {
      message.error("Image upload failed");
    }
  };

  const handleBannerUpload = async (info) => {
    if (!info.file.originFileObj) return;
    try {
      const result = await uploadImage(info.file.originFileObj, {
        folder: "fluxfit/categories/banners",
      });
      setBannerList([result.url]);
      message.success("Banner uploaded");
    } catch {
      message.error("Banner upload failed");
    }
  };

  return (
    <Modal
      title={category ? "Edit Category" : "Add New Category"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={720}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Category Name"
          rules={[{ required: true, message: "Please enter category name" }]}
        >
          <Input
            placeholder="Enter category name"
            onChange={(e) =>
              form.setFieldsValue({ slug: generateSlug(e.target.value) })
            }
          />
        </Form.Item>

        <Form.Item
          name="slug"
          label="URL Slug"
          rules={[
            { required: true },
            { pattern: /^[a-z0-9-]+$/, message: "Invalid slug format" },
          ]}
        >
          <Input placeholder="category-slug" />
        </Form.Item>

        <Form.Item name="parent" label="Parent Category">
          <Select allowClear placeholder="None (Top Level)">
            {categories?.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Upload
            listType="picture-card"
            fileList={imageList.map((url, i) => ({
              uid: i.toString(),
              name: "image",
              status: "done",
              url,
            }))}
            onChange={handleImageUpload}
            maxCount={1}
          >
            {imageList.length < 1 && <IconUpload />}
          </Upload>

          <Upload
            listType="picture-card"
            fileList={bannerList.map((url, i) => ({
              uid: i.toString(),
              name: "banner",
              status: "done",
              url,
            }))}
            onChange={handleBannerUpload}
            maxCount={1}
          >
            {bannerList.length < 1 && <IconUpload />}
          </Upload>
        </div>

        <Form.Item name="sortOrder" label="Sort Order" initialValue={0}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch defaultChecked />
        </Form.Item>

        <Form.Item name="isFeatured" label="Featured" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item name="metaTitle" label="Meta Title">
          <Input />
        </Form.Item>

        <Form.Item name="metaDescription" label="Meta Description">
          <TextArea maxLength={160} showCount />
        </Form.Item>

        <Form.Item name="metaKeywords" label="Meta Keywords (comma separated)">
          <Input />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {category ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CategoryForm;
