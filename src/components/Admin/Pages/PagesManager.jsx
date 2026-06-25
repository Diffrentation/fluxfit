"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Spin, Tabs } from "antd";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import axios from "axios";
import dynamic from "next/dynamic";

const { TextArea } = Input;

export default function PagesManager() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [form] = Form.useForm();

  const fetchPages = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/pages");
      if (data.success) {
        setPages(data.data);
      }
    } catch (error) {
      message.error("Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const openModal = (page = null) => {
    setEditingPage(page);
    if (page) {
      form.setFieldsValue({
        title: page.title,
        slug: page.slug,
        data: JSON.stringify(page.data, null, 2),
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      let parsedData = {};
      if (values.data) {
        try {
          parsedData = JSON.parse(values.data);
        } catch (e) {
          message.error("Invalid JSON format in Data field");
          return;
        }
      }

      const payload = {
        title: values.title,
        data: parsedData,
      };

      const res = await axios.put(`/api/pages/${values.slug}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data.success) {
        message.success("Page saved successfully");
        setModalVisible(false);
        fetchPages();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save page");
    }
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      className: "font-medium",
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      render: (slug) => <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded">/{slug}</span>,
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="text"
          icon={<IconEdit className="w-4 h-4 text-[#1e9a58]" />}
          onClick={() => openModal(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="!bg-zinc-950/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-800 p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Content Pages</h2>
          <p className="text-sm text-gray-500">Manage structured content for static pages like About Us, Home, etc.</p>
        </div>
        <Button
          type="primary"
          icon={<IconPlus className="w-5 h-5" />}
          onClick={() => openModal()}
          className="bg-gradient-to-r from-[#1e9a58] to-[#146c3d] hover:from-[#188149] hover:to-[#0f542f] text-white border-none shadow-lg hover:shadow-xl flex items-center px-6 h-11"
        >
          Create Page Content
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={pages}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={<span className="text-xl font-bold text-gray-900">{editingPage ? "Edit Page Content" : "Create Page Content"}</span>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        okButtonProps={{ className: "bg-gradient-to-r from-[#1e9a58] to-[#146c3d] border-none shadow-md px-6 h-10" }}
        cancelButtonProps={{ className: "h-10 px-6 rounded-lg" }}
        centered
        className="backdrop-blur-sm"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="slug"
            label="Slug (e.g. about, home)"
            rules={[{ required: true, message: "Please enter a slug" }]}
          >
            <Input disabled={!!editingPage} placeholder="about" />
          </Form.Item>
          <Form.Item
            name="title"
            label="Page Title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input placeholder="About Us" />
          </Form.Item>
          <Form.Item
            name="data"
            label="Structured Data (JSON format)"
            rules={[{ required: true, message: "Please enter JSON data" }]}
          >
            <TextArea rows={12} className="font-mono text-xs" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
