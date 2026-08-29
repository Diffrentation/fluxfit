"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
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
  InputNumber,
  Switch,
  DatePicker,
  Spin,
  Popconfirm,
} from "antd";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCopy,
  IconRefresh,
} from "@tabler/icons-react";
import axios from "axios";
import dayjs from "dayjs";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);
const myDarkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "#09090b",
  foregroundColor: "#e4e4e7",
  headerBackgroundColor: "#18181b",
  borderColor: "#27272a",
  rowHoverColor: "#18181b",
});

const { Option } = Select;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const PERMISSIONS = ["read", "write", "delete", "admin", "products", "orders", "payments", "users"];

const APIKeysManagement = ({ onSave }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [revealedCredential, setRevealedCredential] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/settings/api-keys", {
        headers: authHeaders(),
      });
      setApiKeys(data?.data?.apiKeys || []);
    } catch (e) {
      message.error(e.response?.data?.message || "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = () => {
    setSelectedKey(null);
    form.resetFields();
    form.setFieldsValue({
      type: "public",
      isActive: true,
      rateLimitRequests: 100,
      rateLimitPeriod: "minute",
    });
    setIsModalVisible(true);
  };

  const handleEdit = (key) => {
    setSelectedKey(key);
    form.setFieldsValue({
      name: key.name,
      type: key.type,
      permissions: key.permissions || [],
      rateLimitRequests: key.rateLimit?.requests ?? 100,
      rateLimitPeriod: key.rateLimit?.period || "minute",
      expiresAt: key.expiresAt ? dayjs(key.expiresAt) : null,
      allowedIPs: key.allowedIPs || [],
      webhookUrl: key.webhookUrl || "",
      isActive: key.isActive,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/settings/api-keys/${id}`, {
        headers: authHeaders(),
      });
      message.success("API key deleted successfully");
      load();
    } catch (e) {
      message.error(e.response?.data?.message || "Failed to delete API key");
    }
  };

  const handleRegenerate = async (id) => {
    try {
      const { data } = await axios.post(
        `/api/admin/settings/api-keys/${id}/regenerate`,
        {},
        { headers: authHeaders() }
      );
      setRevealedCredential({
        name: data.data.apiKey.name,
        key: data.data.apiKey.key,
        secret: data.data.apiKey.secret,
        regenerated: true,
      });
      load();
    } catch (e) {
      message.error(e.response?.data?.message || "Failed to regenerate API key");
    }
  };

  const handleSave = useCallback(
    async (values) => {
      setSaving(true);
      try {
        const payload = {
          name: values.name,
          type: values.type,
          permissions: values.permissions || [],
          rateLimit: {
            requests: values.rateLimitRequests,
            period: values.rateLimitPeriod,
          },
          expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
          allowedIPs: values.allowedIPs || [],
          webhookUrl: values.webhookUrl || null,
          isActive: values.isActive !== undefined ? values.isActive : true,
        };

        if (selectedKey) {
          await axios.put(`/api/admin/settings/api-keys/${selectedKey.id}`, payload, {
            headers: authHeaders(),
          });
          message.success("API key updated successfully");
          setIsModalVisible(false);
          form.resetFields();
        } else {
          const { data } = await axios.post("/api/admin/settings/api-keys", payload, {
            headers: authHeaders(),
          });
          setIsModalVisible(false);
          form.resetFields();
          setRevealedCredential({
            name: data.data.apiKey.name,
            key: data.data.apiKey.key,
            secret: data.data.apiKey.secret,
            regenerated: false,
          });
        }
        load();
        onSave?.();
      } catch (e) {
        message.error(e.response?.data?.message || "Failed to save API key");
      } finally {
        setSaving(false);
      }
    },
    [selectedKey, form, load, onSave]
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("Copied to clipboard");
  };

  const getTypeColor = (type) => {
    const colors = { public: "blue", private: "purple", webhook: "orange" };
    return colors[type] || "default";
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Name",
        field: "name",
        flex: 1,
        minWidth: 140,
        cellRenderer: (p) => <span className="font-semibold">{p.value}</span>,
      },
      {
        headerName: "Key",
        field: "key",
        flex: 1,
        minWidth: 160,
        cellRenderer: (p) => <code className="text-xs">{p.value}</code>,
      },
      {
        headerName: "Type",
        field: "type",
        width: 110,
        cellRenderer: (p) => (
          <Tag color={getTypeColor(p.value)} className="capitalize">
            {p.value}
          </Tag>
        ),
      },
      {
        headerName: "Permissions",
        field: "permissions",
        flex: 1,
        minWidth: 160,
        valueGetter: (p) => (p.data.permissions?.length ? p.data.permissions.join(", ") : "—"),
      },
      {
        headerName: "Rate Limit",
        width: 130,
        valueGetter: (p) => `${p.data.rateLimit?.requests ?? 100}/${p.data.rateLimit?.period ?? "minute"}`,
      },
      {
        headerName: "Usage",
        width: 90,
        valueGetter: (p) => p.data.usage?.count ?? 0,
      },
      {
        headerName: "Status",
        field: "isValid",
        width: 140,
        cellRenderer: (p) => (
          <Tag color={p.value ? "green" : "red"}>{p.value ? "Active" : "Inactive/Expired"}</Tag>
        ),
      },
      {
        headerName: "Actions",
        width: 130,
        pinned: "right",
        cellRenderer: (p) => (
          <div className="h-full flex items-center">
            <Space>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={<IconEdit className="w-4 h-4" />}
                  onClick={() => handleEdit(p.data)}
                />
              </Tooltip>
              <Popconfirm
                title="Regenerate key & secret?"
                description="The old key/secret stop working immediately."
                onConfirm={() => handleRegenerate(p.data.id)}
              >
                <Tooltip title="Regenerate">
                  <Button type="text" icon={<IconRefresh className="w-4 h-4" />} />
                </Tooltip>
              </Popconfirm>
              <Popconfirm title="Delete this API key?" onConfirm={() => handleDelete(p.data.id)}>
                <Button type="text" danger icon={<IconTrash className="w-4 h-4" />} />
              </Popconfirm>
            </Space>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiKeys]
  );

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
      <Alert
        message="Security Warning"
        description="Keep your API keys secure. Never share them publicly or commit them to version control. The full key/secret is shown only once, right after creating or regenerating."
        type="warning"
        showIcon
        className="mb-3 sm:mb-4"
      />

      <Card
        title="API Keys"
        extra={
          <Button
            type="primary"
            icon={<IconPlus className="w-4 h-4" />}
            onClick={handleAdd}
            className="w-full sm:w-auto"
            size="small sm:default"
          >
            <span className="hidden sm:inline">Add API Key</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
        className="w-full min-w-0"
      >
        {isClient ? (
          <div style={{ width: "100%", height: 400 }}>
            <AgGridReact
              theme={myDarkTheme}
              modules={[AllCommunityModule]}
              rowData={apiKeys}
              columnDefs={columnDefs}
              defaultColDef={{ sortable: true, resizable: true }}
              getRowId={(p) => String(p.data.id)}
              animateRows
              rowHeight={52}
              headerHeight={44}
              loading={loading}
              suppressCellFocus
              overlayNoRowsTemplate="No API keys found"
            />
          </div>
        ) : (
          <div className="h-[400px]" />
        )}
      </Card>

      <Modal
        title={selectedKey ? "Edit API Key" : "Add API Key"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: 850 }}
        className="!bg-zinc-950"
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Form.Item
                name="name"
                label="API Key Name"
                rules={[{ required: true, message: "Please enter API key name" }]}
              >
                <Input placeholder="Mobile App" />
              </Form.Item>

              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: "Please select type" }]}
                tooltip="Public keys authenticate with just the key. Private/webhook keys also require the matching secret."
              >
                <Select>
                  <Option value="public">Public</Option>
                  <Option value="private">Private</Option>
                  <Option value="webhook">Webhook</Option>
                </Select>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.type !== cur.type}
              >
                {({ getFieldValue }) =>
                  getFieldValue("type") === "webhook" && (
                    <Form.Item
                      name="webhookUrl"
                      label="Webhook URL"
                      rules={[{ required: true, message: "Required for webhook type" }]}
                    >
                      <Input placeholder="https://example.com/webhook" />
                    </Form.Item>
                  )
                }
              </Form.Item>

              <Form.Item name="permissions" label="Permissions">
                <Select mode="multiple" placeholder="Select permissions">
                  {PERMISSIONS.map((p) => (
                    <Option key={p} value={p}>{p}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="rateLimitRequests"
                  label="Rate Limit (requests)"
                  rules={[{ required: true, message: "Required" }]}
                  className="mb-0"
                >
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="rateLimitPeriod" label="Per" className="mb-0">
                  <Select>
                    <Option value="minute">Minute</Option>
                    <Option value="hour">Hour</Option>
                    <Option value="day">Day</Option>
                  </Select>
                </Form.Item>
              </div>

              <Form.Item name="expiresAt" label="Expires At" tooltip="Leave empty for a key that never expires">
                <DatePicker showTime style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="allowedIPs"
                label="IP Allowlist"
                tooltip="Leave empty to allow requests from any IP"
              >
                <Select mode="tags" placeholder="e.g. 203.0.113.10" />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 border-t border-zinc-800 pt-4">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {selectedKey ? "Update" : "Add"} API Key
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={revealedCredential?.regenerated ? "API Key Regenerated" : "API Key Created"}
        open={!!revealedCredential}
        onCancel={() => setRevealedCredential(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setRevealedCredential(null)}>
            I&apos;ve saved these credentials
          </Button>,
        ]}
        closable={false}
        maskClosable={false}
        centered
      >
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="This is the only time the full key and secret will be shown."
        />
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Name</div>
            <div className="font-semibold">{revealedCredential?.name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">API Key</div>
            <div className="flex items-center gap-2">
              <code className="text-xs break-all">{revealedCredential?.key}</code>
              <Button
                type="text"
                size="small"
                icon={<IconCopy className="w-3 h-3" />}
                onClick={() => copyToClipboard(revealedCredential?.key)}
              />
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Secret</div>
            <div className="flex items-center gap-2">
              <code className="text-xs break-all">{revealedCredential?.secret}</code>
              <Button
                type="text"
                size="small"
                icon={<IconCopy className="w-3 h-3" />}
                onClick={() => copyToClipboard(revealedCredential?.secret)}
              />
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default APIKeysManagement;
