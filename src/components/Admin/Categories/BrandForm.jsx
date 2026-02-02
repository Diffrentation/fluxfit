"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Modal, Form, Input, InputNumber, Upload, Button, message } from "antd";
import { IconUpload } from "@tabler/icons-react";
import { uploadImage } from "@/lib/upload-client";

const { TextArea } = Input;

const BrandForm = ({ visible, brand, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [logoList, setLogoList] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- AUTO-FILL FORM WHEN EDITING ---------------- */
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

  /* ---------------- SLUG GENERATOR (MEMOIZED) ---------------- */
  const generateSlug = useCallback((name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, []);

  /* ---------------- HANDLE SUBMIT ---------------- */
  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const payload = {
          name: values.name,
          slug: values.slug,
          description: values.description,
          logo: logoList[0] || null,
          sortOrder: values.sortOrder || 0,
        };

        const { data } = await axios.post("/api/brands", payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!data.success) throw new Error(data.message);

        message.success("Brand saved successfully 🎉");

        onSave?.(data.data.brand);
        onClose();
        form.resetFields();
        setLogoList([]);
      } catch (error) {
        console.error(error);

        if (error.response?.data?.errors) {
          error.response.data.errors.forEach((err) => {
            form.setFields([{ name: err.field, errors: [err.message] }]);
          });
        } else {
          message.error(error.response?.data?.message || "Failed to save brand");
        }
      } finally {
        setLoading(false);
      }
    },
    [logoList, onClose, onSave, form]
  );

  /* ---------------- LOGO UPLOAD HANDLER ---------------- */
  const handleLogoUpload = useCallback(async (info) => {
    if (info.file.status === "uploading") return;

    try {
      const file = info.file.originFileObj || info.file;
      const result = await uploadImage(file, { folder: "fluxfit/brands" });
      setLogoList([result.url]);
      message.success("Logo uploaded successfully");
    } catch {
      message.error("Failed to upload logo");
    }
  }, []);

  /* ---------------- UPLOAD FILE LIST (MEMOIZED) ---------------- */
  const uploadFileList = useMemo(
    () =>
      logoList.map((url, index) => ({
        uid: index.toString(),
        name: `logo-${index}.jpg`,
        status: "done",
        url,
      })),
    [logoList]
  );

  return (
    <Modal
      title={brand ? "Edit Brand" : "Add New Brand"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
        <Form.Item
          name="name"
          label="Brand Name"
          rules={[{ required: true, message: "Please enter brand name" }]}
        >
          <Input
            placeholder="Enter brand name"
            onChange={(e) => form.setFieldsValue({ slug: generateSlug(e.target.value) })}
          />
        </Form.Item>

        <Form.Item
          name="slug"
          label="URL Slug"
          rules={[
            { required: true, message: "Please enter URL slug" },
            { pattern: /^[a-z0-9-]+$/, message: "Only lowercase letters, numbers & hyphens allowed" },
          ]}
        >
          <Input placeholder="brand-slug" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Enter brand description" />
        </Form.Item>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Brand Logo</label>
          <Upload
            listType="picture-card"
            fileList={uploadFileList}
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

        <Form.Item name="sortOrder" label="Sort Order" initialValue={0}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" size="large" loading={loading}>
            {brand ? "Update Brand" : "Create Brand"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default BrandForm;
