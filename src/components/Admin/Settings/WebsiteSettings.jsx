"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  Upload,
  Select,
  InputNumber,
  Divider,
  message,
} from "antd";
import { IconUpload, IconDeviceFloppy } from "@tabler/icons-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

const { TextArea } = Input;
const { Option } = Select;

const WebsiteSettings = ({ onSave }) => {
  const [form] = Form.useForm();
  const [logo, setLogo] = useState("");
  const [favicon, setFavicon] = useState("");

  const handleSubmit = (values) => {
    const settings = {
      ...values,
      logo,
      favicon,
    };
    console.log("Website Settings:", settings);
    onSave();
  };

  const handleLogoUpload = async (info) => {
    if (info.file.status === "uploading") return;
    if (info.file.status === "done" || info.file.originFileObj) {
      try {
        const file = info.file.originFileObj || info.file;
        const result = await uploadToCloudinary(file);
        setLogo(result.secure_url || result.url);
        message.success("Logo uploaded successfully");
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
        const result = await uploadToCloudinary(file);
        setFavicon(result.secure_url || result.url);
        message.success("Favicon uploaded successfully");
      } catch (error) {
        message.error("Failed to upload favicon");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{
        siteName: "FluxFit",
        siteDescription: "Your one-stop fashion destination",
        siteUrl: "https://fluxfit.com",
        contactEmail: "support@fluxfit.com",
        contactPhone: "+91 1234567890",
        enableRegistration: true,
        enableReviews: true,
        enableWishlist: true,
        itemsPerPage: 20,
      }}>
        <Card title="General Settings" className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="siteName"
              label="Site Name"
              rules={[{ required: true, message: "Please enter site name" }]}
            >
              <Input placeholder="FluxFit" />
            </Form.Item>

            <Form.Item
              name="siteUrl"
              label="Site URL"
              rules={[
                { required: true, message: "Please enter site URL" },
                { type: "url", message: "Please enter a valid URL" },
              ]}
            >
              <Input placeholder="https://fluxfit.com" />
            </Form.Item>
          </div>

          <Form.Item
            name="siteDescription"
            label="Site Description"
            rules={[{ required: true, message: "Please enter site description" }]}
          >
            <TextArea rows={3} placeholder="Enter site description for SEO" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="contactEmail"
              label="Contact Email"
              rules={[
                { required: true, message: "Please enter contact email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="support@fluxfit.com" />
            </Form.Item>

            <Form.Item
              name="contactPhone"
              label="Contact Phone"
              rules={[{ required: true, message: "Please enter contact phone" }]}
            >
              <Input placeholder="+91 1234567890" />
            </Form.Item>
          </div>
        </Card>

        <Card title="Branding" className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Logo
              </label>
              <Upload
                listType="picture-card"
                fileList={logo ? [{
                  uid: "1",
                  name: "logo.png",
                  status: "done",
                  url: logo,
                }] : []}
                onChange={handleLogoUpload}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favicon
              </label>
              <Upload
                listType="picture-card"
                fileList={favicon ? [{
                  uid: "1",
                  name: "favicon.ico",
                  status: "done",
                  url: favicon,
                }] : []}
                onChange={handleFaviconUpload}
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

        <Card title="Features" className="mb-4">
          <div className="space-y-4">
            <Form.Item
              name="enableRegistration"
              label="User Registration"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="enableReviews"
              label="Product Reviews"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="enableWishlist"
              label="Wishlist Feature"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Card>

        <Card title="Display Settings" className="mb-4">
          <Form.Item
            name="itemsPerPage"
            label="Items Per Page"
            rules={[{ required: true, message: "Please enter items per page" }]}
          >
            <InputNumber min={10} max={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="defaultLanguage"
            label="Default Language"
            initialValue="en"
          >
            <Select>
              <Option value="en">English</Option>
              <Option value="hi">Hindi</Option>
              <Option value="ta">Tamil</Option>
              <Option value="te">Telugu</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="timezone"
            label="Timezone"
            initialValue="Asia/Kolkata"
          >
            <Select>
              <Option value="Asia/Kolkata">Asia/Kolkata (IST)</Option>
              <Option value="UTC">UTC</Option>
            </Select>
          </Form.Item>
        </Card>

        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            icon={<IconDeviceFloppy className="w-4 h-4" />}
            size="large"
          >
            Save Settings
          </Button>
        </div>
      </Form>
    </motion.div>
  );
};

export default WebsiteSettings;

