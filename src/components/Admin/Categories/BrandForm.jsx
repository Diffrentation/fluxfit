"use client";
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, InputNumber, Upload, Button, message } from "antd";
import { IconUpload } from "@tabler/icons-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

const { TextArea } = Input;

const BrandForm = ({ visible, brand, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [logoList, setLogoList] = useState([]);

  useEffect(() => {
    if (brand) {
      form.setFieldsValue({
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        sortOrder: brand.sortOrder || 0,
      });
      setLogoList(brand.logo ? [brand.logo] : []);
    } else {
      form.resetFields();
      setLogoList([]);
    }
  }, [brand, form]);

  const handleSubmit = async (values) => {
    try {
      const brandData = {
        ...values,
        logo: logoList[0] || "",
        id: brand?.id || Date.now(),
      };
      onSave(brandData);
    } catch (error) {
      message.error("Please fill in all required fields");
    }
  };

  const handleLogoUpload = async (info) => {
    if (info.file.status === "uploading") return;
    if (info.file.status === "done" || info.file.originFileObj) {
      try {
        const file = info.file.originFileObj || info.file;
        const result = await uploadToCloudinary(file);
        setLogoList([result.secure_url || result.url]);
        message.success("Logo uploaded successfully");
      } catch (error) {
        message.error("Failed to upload logo");
      }
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <Modal
      title={brand ? "Edit Brand" : "Add New Brand"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
        <Form.Item
          name="name"
          label="Brand Name"
          rules={[{ required: true, message: "Please enter brand name" }]}
        >
          <Input
            placeholder="Enter brand name"
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
            { pattern: /^[a-z0-9-]+$/, message: "Slug can only contain lowercase letters, numbers, and hyphens" },
          ]}
        >
          <Input placeholder="brand-slug" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Enter brand description" />
        </Form.Item>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Logo
          </label>
          <Upload
            listType="picture-card"
            fileList={logoList.map((url, index) => ({
              uid: index.toString(),
              name: `logo-${index}.jpg`,
              status: "done",
              url,
            }))}
            onChange={handleLogoUpload}
            accept="image/*"
            maxCount={1}
          >
            {logoList.length < 1 && (
              <div>
                <IconUpload className="w-6 h-6" />
                <div className="mt-2">Upload</div>
              </div>
            )}
          </Upload>
        </div>

        <Form.Item
          name="sortOrder"
          label="Sort Order"
          initialValue={0}
        >
          <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" size="large">
            {brand ? "Update Brand" : "Create Brand"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default BrandForm;

