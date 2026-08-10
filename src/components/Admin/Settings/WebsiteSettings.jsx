"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Form, Input, Button, Upload, Divider, message, Spin } from "antd";
import { IconUpload, IconDeviceFloppy } from "@tabler/icons-react";
import axios from "axios";
import { uploadImage } from "@/lib/upload-client";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const WebsiteSettings = ({ onSave }) => {
  const [form] = Form.useForm();
  const [logo, setLogo] = useState("");
  const [favicon, setFavicon] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/settings");
      const website = data?.data?.website || {};
      setLogo(website.logo || "");
      setFavicon(website.favicon || "");
      form.setFieldsValue({
        name: website.name || "FluxFit",
        email: website.email || "",
        phone: website.phone || "",
        addressLine1: website.address?.line1 || "",
        addressLine2: website.address?.line2 || "",
        city: website.address?.city || "",
        state: website.address?.state || "",
        country: website.address?.country || "India",
        pincode: website.address?.pincode || "",
        facebook: website.socialMedia?.facebook || "",
        twitter: website.socialMedia?.twitter || "",
        instagram: website.socialMedia?.instagram || "",
        linkedin: website.socialMedia?.linkedin || "",
        youtube: website.socialMedia?.youtube || "",
      });
    } catch (e) {
      message.error(e.response?.data?.message || "Failed to load website settings");
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = useCallback(
    async (values) => {
      setSaving(true);
      try {
        const website = {
          name: values.name,
          logo: logo || null,
          favicon: favicon || null,
          email: values.email,
          phone: values.phone,
          address: {
            line1: values.addressLine1 || "",
            line2: values.addressLine2 || "",
            city: values.city || "",
            state: values.state || "",
            country: values.country || "India",
            pincode: values.pincode || "",
          },
          socialMedia: {
            facebook: values.facebook || "",
            twitter: values.twitter || "",
            instagram: values.instagram || "",
            linkedin: values.linkedin || "",
            youtube: values.youtube || "",
          },
        };
        await axios.put("/api/settings", { website }, { headers: authHeaders() });
        message.success("Website settings saved successfully");
        onSave();
      } catch (e) {
        message.error(e.response?.data?.message || "Failed to save settings");
      } finally {
        setSaving(false);
      }
    },
    [logo, favicon, onSave]
  );

  const handleLogoUpload = async (info) => {
    if (info.file.status === "uploading") return;
    if (info.file.status === "done" || info.file.originFileObj) {
      try {
        const file = info.file.originFileObj || info.file;
        const result = await uploadImage(file, { folder: "fluxfit/settings" });
        setLogo(result.url);
        message.success("Logo uploaded — click Save Settings to apply it");
      } catch (error) {
        message.error("Failed to upload logo");
      }
    }
  };

  const handleFaviconUpload = async (info) => {
    if (info.file.status === "uploading") return;
    if (info.file.status === "done" || info.file.originFileObj) {
      try {
        const file = info.file.originFileObj || info.file;
        const result = await uploadImage(file, { folder: "fluxfit/settings" });
        setFavicon(result.url);
        message.success("Favicon uploaded — click Save Settings to apply it");
      } catch (error) {
        message.error("Failed to upload favicon");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card title="General Settings" className="mb-3 sm:mb-4 w-full min-w-0">
          <Form.Item
            name="name"
            label="Site Name"
            rules={[{ required: true, message: "Please enter site name" }]}
          >
            <Input placeholder="FluxFit" />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Form.Item
              name="email"
              label="Contact Email"
              rules={[{ type: "email", message: "Please enter a valid email" }]}
            >
              <Input placeholder="support@fluxfit.com" />
            </Form.Item>

            <Form.Item name="phone" label="Contact Phone">
              <Input placeholder="+91 1234567890" />
            </Form.Item>
          </div>
        </Card>

        <Card title="Address" className="mb-3 sm:mb-4 w-full min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Form.Item name="addressLine1" label="Address Line 1">
              <Input placeholder="Street address" />
            </Form.Item>
            <Form.Item name="addressLine2" label="Address Line 2">
              <Input placeholder="Apartment, suite, etc. (optional)" />
            </Form.Item>
            <Form.Item name="city" label="City">
              <Input placeholder="City" />
            </Form.Item>
            <Form.Item name="state" label="State">
              <Input placeholder="State" />
            </Form.Item>
            <Form.Item name="country" label="Country">
              <Input placeholder="India" />
            </Form.Item>
            <Form.Item name="pincode" label="Pincode">
              <Input placeholder="Pincode" />
            </Form.Item>
          </div>
        </Card>

        <Card title="Social Media" className="mb-3 sm:mb-4 w-full min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Form.Item name="facebook" label="Facebook URL">
              <Input placeholder="https://facebook.com/..." />
            </Form.Item>
            <Form.Item name="twitter" label="Twitter / X URL">
              <Input placeholder="https://x.com/..." />
            </Form.Item>
            <Form.Item name="instagram" label="Instagram URL">
              <Input placeholder="https://instagram.com/..." />
            </Form.Item>
            <Form.Item name="linkedin" label="LinkedIn URL">
              <Input placeholder="https://linkedin.com/..." />
            </Form.Item>
            <Form.Item name="youtube" label="YouTube URL">
              <Input placeholder="https://youtube.com/..." />
            </Form.Item>
          </div>
        </Card>

        <Card title="Branding" className="mb-3 sm:mb-4 w-full min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Site Logo
              </label>
              <Upload
                listType="picture-card"
                fileList={
                  logo
                    ? [{ uid: "1", name: "logo.png", status: "done", url: logo }]
                    : []
                }
                onChange={handleLogoUpload}
                onRemove={() => setLogo("")}
                accept="image/*"
                maxCount={1}
              >
                {!logo && (
                  <div>
                    <IconUpload className="w-6 h-6" />
                    <div className="mt-2">Upload Logo</div>
                  </div>
                )}
              </Upload>
              <p className="text-xs text-gray-500 mt-2">
                Recommended size: 200x50px (PNG, SVG)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Favicon
              </label>
              <Upload
                listType="picture-card"
                fileList={
                  favicon
                    ? [{ uid: "1", name: "favicon.ico", status: "done", url: favicon }]
                    : []
                }
                onChange={handleFaviconUpload}
                onRemove={() => setFavicon("")}
                accept="image/*"
                maxCount={1}
              >
                {!favicon && (
                  <div>
                    <IconUpload className="w-6 h-6" />
                    <div className="mt-2">Upload Favicon</div>
                  </div>
                )}
              </Upload>
              <p className="text-xs text-gray-500 mt-2">
                Recommended size: 32x32px (ICO, PNG)
              </p>
            </div>
          </div>
        </Card>

        <Divider className="!my-3" />

        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            icon={<IconDeviceFloppy className="w-4 h-4" />}
            size="large"
            loading={saving}
            className="w-full sm:w-auto"
          >
            Save Settings
          </Button>
        </div>
      </Form>
    </motion.div>
  );
};

export default WebsiteSettings;
