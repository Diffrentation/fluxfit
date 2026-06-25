"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Table,
  Tag,
  Modal,
  Input,
  message,
  Divider,
  Switch,
} from "antd";
import { IconPlus, IconTrash, IconDeviceFloppy, IconEdit } from "@tabler/icons-react";

const { Option } = Select;
const { TextArea } = Input;

const defaultTaxRates = [
  { id: 1, name: "GST 5%", rate: 5, type: "gst", applicableTo: "Essential Goods" },
  { id: 2, name: "GST 12%", rate: 12, type: "gst", applicableTo: "Standard Goods" },
  { id: 3, name: "GST 18%", rate: 18, type: "gst", applicableTo: "Premium Goods" },
  { id: 4, name: "GST 28%", rate: 28, type: "gst", applicableTo: "Luxury Goods" },
];

const CurrencyTaxSettings = ({ onSave }) => {
  const [form] = Form.useForm();
  const [taxRates, setTaxRates] = useState([]);
  const [isTaxModalVisible, setIsTaxModalVisible] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);
  const [taxForm] = Form.useForm();

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminCurrencyTaxSettings");
      if (stored) {
        const settings = JSON.parse(stored);
        setTaxRates(settings.taxRates || defaultTaxRates);
        form.setFieldsValue(settings);
      } else {
        setTaxRates(defaultTaxRates);
        form.setFieldsValue({
          currency: "INR",
          currencySymbol: "₹",
          currencyPosition: "before",
          defaultTaxRate: 18,
          enableGST: true,
          gstNumber: "27AAAAA0000A1Z5",
          hsnCode: "6109",
        });
      }
    } catch (error) {
      console.error("Error loading currency tax settings:", error);
      setTaxRates(defaultTaxRates);
    }
  }, [form]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      const formValues = form.getFieldsValue();
      const settings = {
        ...formValues,
        taxRates,
      };
      localStorage.setItem("adminCurrencyTaxSettings", JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving currency tax settings:", error);
    }
  }, [taxRates, form]);

  const handleSubmit = useCallback((values) => {
    const settings = {
      ...values,
      taxRates,
    };
    try {
      localStorage.setItem("adminCurrencyTaxSettings", JSON.stringify(settings));
      message.success("Currency & Tax settings saved successfully");
      onSave();
    } catch (error) {
      message.error("Failed to save settings");
      console.error("Error saving currency tax settings:", error);
    }
  }, [taxRates, onSave]);

  const handleAddTax = () => {
    setSelectedTax(null);
    taxForm.resetFields();
    setIsTaxModalVisible(true);
  };

  const handleEditTax = (tax) => {
    setSelectedTax(tax);
    taxForm.setFieldsValue(tax);
    setIsTaxModalVisible(true);
  };

  const handleDeleteTax = (id) => {
    setTaxRates(taxRates.filter((t) => t.id !== id));
    message.success("Tax rate deleted successfully");
  };

  const handleSaveTax = useCallback((values) => {
    if (selectedTax) {
      setTaxRates(taxRates.map((t) => (t.id === selectedTax.id ? { ...values, id: selectedTax.id } : t)));
      message.success("Tax rate updated successfully");
    } else {
      setTaxRates([...taxRates, { ...values, id: Date.now() }]);
      message.success("Tax rate added successfully");
    }
    setIsTaxModalVisible(false);
    taxForm.resetFields();
  }, [selectedTax, taxRates, taxForm]);

  const taxColumns = [
    {
      title: "Tax Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span className="font-semibold">{name}</span>,
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      render: (rate) => <Tag color="blue">{rate}%</Tag>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag color="green">{type.toUpperCase()}</Tag>,
    },
    {
      title: "Applicable To",
      dataIndex: "applicableTo",
      key: "applicableTo",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<IconEdit className="w-4 h-4" />}
            onClick={() => handleEditTax(record)}
          />
          <Button
            type="text"
            danger
            icon={<IconTrash className="w-4 h-4" />}
            onClick={() => handleDeleteTax(record.id)}
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
        <Card title="Currency Settings" className="mb-3 sm:mb-4 w-full min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Form.Item
              name="currency"
              label="Default Currency"
              rules={[{ required: true, message: "Please select currency" }]}
            >
              <Select>
                <Option value="INR">Indian Rupee (INR)</Option>
                <Option value="USD">US Dollar (USD)</Option>
                <Option value="EUR">Euro (EUR)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="currencySymbol"
              label="Currency Symbol"
              rules={[{ required: true, message: "Please enter currency symbol" }]}
            >
              <Input placeholder="₹" maxLength={5} />
            </Form.Item>
          </div>

          <Form.Item
            name="currencyPosition"
            label="Currency Position"
          >
            <Select>
              <Option value="before">Before amount (₹100)</Option>
              <Option value="after">After amount (100₹)</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title="Tax Settings" className="mb-3 sm:mb-4 w-full min-w-0">
          <div className="space-y-3 sm:space-y-4">
            <Form.Item
              name="enableGST"
              label="Enable GST"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Form.Item
                name="gstNumber"
                label="GST Number"
                rules={[
                  { required: true, message: "Please enter GST number" },
                  { pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: "Invalid GST number format" },
                ]}
              >
                <Input placeholder="27AAAAA0000A1Z5" />
              </Form.Item>

              <Form.Item
                name="hsnCode"
                label="HSN Code"
                rules={[{ required: true, message: "Please enter HSN code" }]}
              >
                <Input placeholder="6109" />
              </Form.Item>
            </div>

            <Form.Item
              name="defaultTaxRate"
              label="Default Tax Rate (%)"
              rules={[{ required: true, message: "Please enter default tax rate" }]}
            >
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </Card>

        <Card
          title="Tax Rates"
          extra={
            <Button
              type="primary"
              icon={<IconPlus className="w-4 h-4" />}
              onClick={handleAddTax}
              className="w-full sm:w-auto"
              size="small sm:default"
            >
              <span className="hidden sm:inline">Add Tax Rate</span>
              <span className="sm:hidden">Add</span>
            </Button>
          }
          className="mb-3 sm:mb-4 w-full min-w-0"
        >
          <div className="overflow-x-auto">
            <Table
              dataSource={taxRates.map((t) => ({ ...t, key: t.id }))}
              columns={taxColumns}
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
        title={selectedTax ? "Edit Tax Rate" : "Add Tax Rate"}
        open={isTaxModalVisible}
        onCancel={() => {
          setIsTaxModalVisible(false);
          taxForm.resetFields();
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: 850 }}
        className="!bg-zinc-950"
        centered
      >
        <Form form={taxForm} layout="vertical" onFinish={handleSaveTax} className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <Form.Item
                name="name"
                label="Tax Name"
                rules={[{ required: true, message: "Please enter tax name" }]}
              >
                <Input placeholder="GST 18%" />
              </Form.Item>

              <Form.Item
                name="rate"
                label="Tax Rate (%)"
                rules={[{ required: true, message: "Please enter tax rate" }]}
              >
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Form.Item
                name="type"
                label="Tax Type"
                rules={[{ required: true, message: "Please select tax type" }]}
              >
                <Select>
                  <Option value="gst">GST</Option>
                  <Option value="vat">VAT</Option>
                  <Option value="sales">Sales Tax</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="applicableTo"
                label="Applicable To"
                rules={[{ required: true, message: "Please enter applicable category" }]}
              >
                <Input placeholder="Premium Goods" />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 border-t border-zinc-800 pt-4">
            <Button onClick={() => setIsTaxModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {selectedTax ? "Update" : "Add"} Tax Rate
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default CurrencyTaxSettings;

