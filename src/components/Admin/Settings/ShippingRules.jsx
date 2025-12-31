"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Table,
  Tag,
  Modal,
  Select,
  Switch,
  message,
  Divider,
} from "antd";
import { IconPlus, IconTrash, IconDeviceFloppy, IconEdit } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";

const { Option } = Select;
const { TextArea } = Input;

const defaultShippingRules = [
  {
    id: 1,
    name: "Free Shipping",
    minOrder: 2000,
    maxOrder: null,
    cost: 0,
    estimatedDays: "5-7",
    applicableRegions: ["All"],
    isActive: true,
  },
  {
    id: 2,
    name: "Standard Shipping",
    minOrder: 0,
    maxOrder: 2000,
    cost: 50,
    estimatedDays: "3-5",
    applicableRegions: ["All"],
    isActive: true,
  },
  {
    id: 3,
    name: "Express Shipping",
    minOrder: 0,
    maxOrder: null,
    cost: 150,
    estimatedDays: "1-2",
    applicableRegions: ["Metro Cities"],
    isActive: true,
  },
];

const ShippingRules = ({ onSave }) => {
  const [form] = Form.useForm();
  const [shippingRules, setShippingRules] = useState([]);
  const [isRuleModalVisible, setIsRuleModalVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [ruleForm] = Form.useForm();

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminShippingSettings");
      if (stored) {
        const settings = JSON.parse(stored);
        setShippingRules(settings.shippingRules || defaultShippingRules);
        form.setFieldsValue(settings);
      } else {
        setShippingRules(defaultShippingRules);
        form.setFieldsValue({
          defaultShippingMethod: "standard",
          enableFreeShipping: true,
          freeShippingThreshold: 2000,
          enableInternationalShipping: false,
        });
      }
    } catch (error) {
      console.error("Error loading shipping settings:", error);
      setShippingRules(defaultShippingRules);
    }
  }, [form]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      const formValues = form.getFieldsValue();
      const settings = {
        ...formValues,
        shippingRules,
      };
      localStorage.setItem("adminShippingSettings", JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving shipping settings:", error);
    }
  }, [shippingRules, form]);

  const handleSubmit = useCallback((values) => {
    const settings = {
      ...values,
      shippingRules,
    };
    try {
      localStorage.setItem("adminShippingSettings", JSON.stringify(settings));
      message.success("Shipping rules saved successfully");
      onSave();
    } catch (error) {
      message.error("Failed to save settings");
      console.error("Error saving shipping settings:", error);
    }
  }, [shippingRules, onSave]);

  const handleAddRule = () => {
    setSelectedRule(null);
    ruleForm.resetFields();
    setIsRuleModalVisible(true);
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    ruleForm.setFieldsValue(rule);
    setIsRuleModalVisible(true);
  };

  const handleDeleteRule = (id) => {
    setShippingRules(shippingRules.filter((r) => r.id !== id));
    message.success("Shipping rule deleted successfully");
  };

  const handleSaveRule = useCallback((values) => {
    if (selectedRule) {
      setShippingRules(
        shippingRules.map((r) => (r.id === selectedRule.id ? { ...values, id: selectedRule.id } : r))
      );
      message.success("Shipping rule updated successfully");
    } else {
      setShippingRules([...shippingRules, { ...values, id: Date.now() }]);
      message.success("Shipping rule added successfully");
    }
    setIsRuleModalVisible(false);
    ruleForm.resetFields();
  }, [selectedRule, shippingRules, ruleForm]);

  const ruleColumns = [
    {
      title: "Rule Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span className="font-semibold">{name}</span>,
    },
    {
      title: "Order Range",
      key: "range",
      render: (_, record) => (
        <span>
          ₹{formatPrice(record.minOrder || 0)} - {record.maxOrder ? `₹${formatPrice(record.maxOrder)}` : "∞"}
        </span>
      ),
    },
    {
      title: "Cost",
      dataIndex: "cost",
      key: "cost",
      render: (cost) => (
        <span className="font-semibold">
          {cost === 0 ? <Tag color="green">Free</Tag> : `₹${formatPrice(cost)}`}
        </span>
      ),
    },
    {
      title: "Estimated Days",
      dataIndex: "estimatedDays",
      key: "estimatedDays",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<IconEdit className="w-4 h-4" />}
            onClick={() => handleEditRule(record)}
          />
          <Button
            type="text"
            danger
            icon={<IconTrash className="w-4 h-4" />}
            onClick={() => handleDeleteRule(record.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card title="General Shipping Settings" className="mb-3 sm:mb-4 w-full min-w-0">
          <div className="space-y-4">
            <Form.Item
              name="defaultShippingMethod"
              label="Default Shipping Method"
            >
              <Select>
                <Option value="standard">Standard Shipping</Option>
                <Option value="express">Express Shipping</Option>
                <Option value="free">Free Shipping</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="enableFreeShipping"
              label="Enable Free Shipping"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="freeShippingThreshold"
              label="Free Shipping Threshold (₹)"
              rules={[{ required: true, message: "Please enter free shipping threshold" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="enableInternationalShipping"
              label="Enable International Shipping"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Card>

        <Card
          title="Shipping Rules"
          extra={
            <Button
              type="primary"
              icon={<IconPlus className="w-4 h-4" />}
              onClick={handleAddRule}
              className="w-full sm:w-auto"
              size="small sm:default"
            >
              <span className="hidden sm:inline">Add Shipping Rule</span>
              <span className="sm:hidden">Add</span>
            </Button>
          }
          className="mb-3 sm:mb-4 w-full min-w-0"
        >
          <div className="overflow-x-auto">
            <Table
              dataSource={shippingRules.map((r) => ({ ...r, key: r.id }))}
              columns={ruleColumns}
              pagination={false}
              scroll={{ x: 800 }}
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            icon={<IconDeviceFloppy className="w-4 h-4" />}
            size="large"
            className="w-full sm:w-auto"
          >
            Save Settings
          </Button>
        </div>
      </Form>

      <Modal
        title={selectedRule ? "Edit Shipping Rule" : "Add Shipping Rule"}
        open={isRuleModalVisible}
        onCancel={() => {
          setIsRuleModalVisible(false);
          ruleForm.resetFields();
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: 600 }}
        className="dark:bg-gray-800"
        centered
      >
        <Form form={ruleForm} layout="vertical" onFinish={handleSaveRule}>
          <Form.Item
            name="name"
            label="Rule Name"
            rules={[{ required: true, message: "Please enter rule name" }]}
          >
            <Input placeholder="Free Shipping" />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Form.Item
              name="minOrder"
              label="Minimum Order (₹)"
              rules={[{ required: true, message: "Please enter minimum order" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="maxOrder"
              label="Maximum Order (₹)"
              tooltip="Leave empty for no maximum"
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Form.Item
              name="cost"
              label="Shipping Cost (₹)"
              rules={[{ required: true, message: "Please enter shipping cost" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="estimatedDays"
              label="Estimated Delivery Days"
              rules={[{ required: true, message: "Please enter estimated days" }]}
            >
              <Input placeholder="3-5" />
            </Form.Item>
          </div>

          <Form.Item
            name="applicableRegions"
            label="Applicable Regions"
            initialValue={["All"]}
          >
            <Select mode="tags" placeholder="Select or add regions">
              <Option value="All">All</Option>
              <Option value="Metro Cities">Metro Cities</Option>
              <Option value="Tier 1 Cities">Tier 1 Cities</Option>
              <Option value="Tier 2 Cities">Tier 2 Cities</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsRuleModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {selectedRule ? "Update" : "Add"} Rule
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default ShippingRules;

