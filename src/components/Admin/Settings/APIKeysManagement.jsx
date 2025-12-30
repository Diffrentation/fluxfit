"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  message,
  Alert,
  Space,
  Tooltip,
  Select,
} from "antd";
import { IconPlus, IconEdit, IconTrash, IconEye, IconEyeOff, IconCopy } from "@tabler/icons-react";

const { Option } = Select;

const APIKeysManagement = ({ onSave }) => {
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: "Stripe Payment",
      key: "sk_live_51H...",
      type: "payment",
      status: "active",
      createdAt: "2024-01-15",
      lastUsed: "2024-05-20",
    },
    {
      id: 2,
      name: "Cloudinary Upload",
      key: "cloudinary://123...",
      type: "storage",
      status: "active",
      createdAt: "2024-02-01",
      lastUsed: "2024-05-19",
    },
    {
      id: 3,
      name: "SMS Gateway",
      key: "sms_api_key_...",
      type: "sms",
      status: "inactive",
      createdAt: "2024-03-10",
      lastUsed: "2024-04-15",
    },
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [form] = Form.useForm();
  const [visibleKeys, setVisibleKeys] = useState({});

  const handleAdd = () => {
    setSelectedKey(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (key) => {
    setSelectedKey(key);
    form.setFieldsValue({
      name: key.name,
      key: key.key,
      type: key.type,
      status: key.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
    message.success("API key deleted successfully");
  };

  const handleSave = (values) => {
    if (selectedKey) {
      setApiKeys(
        apiKeys.map((k) => (k.id === selectedKey.id ? { ...values, id: selectedKey.id, createdAt: selectedKey.createdAt } : k))
      );
      message.success("API key updated successfully");
    } else {
      setApiKeys([
        ...apiKeys,
        {
          ...values,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
        },
      ]);
      message.success("API key added successfully");
    }
    setIsModalVisible(false);
    form.resetFields();
    onSave();
  };

  const toggleVisibility = (id) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("API key copied to clipboard");
  };

  const getTypeColor = (type) => {
    const colors = {
      payment: "red",
      storage: "blue",
      sms: "green",
      email: "purple",
      analytics: "orange",
    };
    return colors[type] || "default";
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span className="font-semibold">{name}</span>,
    },
    {
      title: "API Key",
      dataIndex: "key",
      key: "key",
      render: (key, record) => (
        <div className="flex items-center gap-2">
          <code className="text-sm">
            {visibleKeys[record.id] ? key : `${key.substring(0, 15)}...`}
          </code>
          <Tooltip title={visibleKeys[record.id] ? "Hide" : "Show"}>
            <Button
              type="text"
              size="small"
              icon={visibleKeys[record.id] ? <IconEyeOff className="w-3 h-3" /> : <IconEye className="w-3 h-3" />}
              onClick={() => toggleVisibility(record.id)}
            />
          </Tooltip>
          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<IconCopy className="w-3 h-3" />}
              onClick={() => copyToClipboard(key)}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag color={getTypeColor(type)} className="capitalize">{type}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Last Used",
      dataIndex: "lastUsed",
      key: "lastUsed",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<IconEdit className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<IconTrash className="w-4 h-4" />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Alert
        message="Security Warning"
        description="Keep your API keys secure. Never share them publicly or commit them to version control."
        type="warning"
        showIcon
        className="mb-4"
      />

      <Card
        title="API Keys"
        extra={
          <Button
            type="primary"
            icon={<IconPlus className="w-4 h-4" />}
            onClick={handleAdd}
          >
            Add API Key
          </Button>
        }
      >
        <Table
          dataSource={apiKeys.map((k) => ({ ...k, key: k.id }))}
          columns={columns}
          pagination={false}
        />
      </Card>

      <Modal
        title={selectedKey ? "Edit API Key" : "Add API Key"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="API Key Name"
            rules={[{ required: true, message: "Please enter API key name" }]}
          >
            <Input placeholder="Stripe Payment" />
          </Form.Item>

          <Form.Item
            name="key"
            label="API Key"
            rules={[{ required: true, message: "Please enter API key" }]}
          >
            <Input.Password placeholder="Enter API key" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: "Please select type" }]}
          >
            <Select>
              <Option value="payment">Payment</Option>
              <Option value="storage">Storage</Option>
              <Option value="sms">SMS</Option>
              <Option value="email">Email</Option>
              <Option value="analytics">Analytics</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="active"
          >
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {selectedKey ? "Update" : "Add"} API Key
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default APIKeysManagement;

