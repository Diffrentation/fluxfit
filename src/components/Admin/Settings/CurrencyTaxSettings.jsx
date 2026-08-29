"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Tag,
  Modal,
  Input,
  message,
  Switch,
  Spin,
  Popconfirm,
} from "antd";
import { IconPlus, IconTrash, IconDeviceFloppy, IconEdit } from "@tabler/icons-react";
import axios from "axios";
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

const CurrencyTaxSettings = ({ onSave }) => {
  const [form] = Form.useForm();
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTaxModalVisible, setIsTaxModalVisible] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);
  const [taxForm] = Form.useForm();
  const [savingTax, setSavingTax] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadTaxRates = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin/settings/tax-rates", {
        headers: authHeaders(),
      });
      setTaxRates(data?.data?.taxRates || []);
    } catch (e) {
      message.error(e.response?.data?.message || "Failed to load tax rates");
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/settings");
      const currency = data?.data?.currency || {};
      const tax = data?.data?.tax || {};
      form.setFieldsValue({
        currency: currency.code || "INR",
        currencySymbol: currency.symbol || "₹",
        currencyPosition: currency.position || "before",
        enableGST: tax.enabled !== false,
        defaultTaxRate: tax.defaultRate ?? 18,
        taxInclusive: !!tax.inclusive,
      });
      await loadTaxRates();
    } catch (e) {
      message.error(e.response?.data?.message || "Failed to load currency/tax settings");
    } finally {
      setLoading(false);
    }
  }, [form, loadTaxRates]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = useCallback(
    async (values) => {
      setSaving(true);
      try {
        await axios.put(
          "/api/settings",
          {
            currency: {
              code: values.currency,
              symbol: values.currencySymbol,
              position: values.currencyPosition,
            },
            tax: {
              enabled: !!values.enableGST,
              defaultRate: values.defaultTaxRate,
              inclusive: !!values.taxInclusive,
            },
          },
          { headers: authHeaders() }
        );
        message.success("Currency & Tax settings saved successfully");
        onSave();
      } catch (e) {
        message.error(e.response?.data?.message || "Failed to save settings");
      } finally {
        setSaving(false);
      }
    },
    [onSave]
  );

  const handleAddTax = () => {
    setSelectedTax(null);
    taxForm.resetFields();
    taxForm.setFieldsValue({ type: "gst", isActive: true });
    setIsTaxModalVisible(true);
  };

  const handleEditTax = (tax) => {
    setSelectedTax(tax);
    taxForm.setFieldsValue({
      name: tax.name,
      code: tax.code,
      rate: tax.rate,
      type: tax.type,
      description: tax.description || "",
      states: tax.states || [],
      isActive: tax.isActive,
    });
    setIsTaxModalVisible(true);
  };

  const handleDeleteTax = async (id) => {
    try {
      await axios.delete(`/api/admin/settings/tax-rates/${id}`, {
        headers: authHeaders(),
      });
      message.success("Tax rate deleted successfully");
      loadTaxRates();
    } catch (e) {
      message.error(e.response?.data?.message || "Failed to delete tax rate");
    }
  };

  const handleSaveTax = useCallback(
    async (values) => {
      setSavingTax(true);
      try {
        const payload = {
          name: values.name,
          code: values.code,
          rate: values.rate,
          type: values.type,
          description: values.description || "",
          applicableTo: "all",
          states: values.states || [],
          isActive: values.isActive !== undefined ? values.isActive : true,
        };
        if (selectedTax) {
          await axios.put(`/api/admin/settings/tax-rates/${selectedTax.id}`, payload, {
            headers: authHeaders(),
          });
          message.success("Tax rate updated successfully");
        } else {
          await axios.post("/api/admin/settings/tax-rates", payload, {
            headers: authHeaders(),
          });
          message.success("Tax rate added successfully");
        }
        setIsTaxModalVisible(false);
        taxForm.resetFields();
        loadTaxRates();
      } catch (e) {
        message.error(e.response?.data?.message || "Failed to save tax rate");
      } finally {
        setSavingTax(false);
      }
    },
    [selectedTax, taxForm, loadTaxRates]
  );

  const taxColumnDefs = useMemo(
    () => [
      {
        headerName: "Tax Name",
        field: "name",
        flex: 1,
        minWidth: 160,
        cellRenderer: (p) => <span className="font-semibold">{p.value}</span>,
      },
      { headerName: "Code", field: "code", width: 120 },
      {
        headerName: "Rate",
        field: "rate",
        width: 100,
        cellRenderer: (p) => <Tag color="blue">{p.value}%</Tag>,
      },
      {
        headerName: "Type",
        field: "type",
        width: 110,
        cellRenderer: (p) => <Tag color="green">{p.value?.toUpperCase()}</Tag>,
      },
      {
        headerName: "States",
        field: "states",
        flex: 1,
        minWidth: 160,
        valueGetter: (p) => (p.data.states?.length ? p.data.states.join(", ") : "All states"),
      },
      {
        headerName: "Status",
        field: "isActive",
        width: 110,
        cellRenderer: (p) => (
          <Tag color={p.value ? "green" : "red"}>{p.value ? "Active" : "Inactive"}</Tag>
        ),
      },
      {
        headerName: "Actions",
        width: 100,
        pinned: "right",
        cellRenderer: (p) => (
          <div className="h-full flex items-center gap-2">
            <Button
              type="text"
              icon={<IconEdit className="w-4 h-4" />}
              onClick={() => handleEditTax(p.data)}
            />
            <Popconfirm
              title="Delete this tax rate?"
              onConfirm={() => handleDeleteTax(p.data.id)}
            >
              <Button type="text" danger icon={<IconTrash className="w-4 h-4" />} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [taxRates]
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

          <Form.Item name="currencyPosition" label="Currency Position">
            <Select>
              <Option value="before">Before amount (₹100)</Option>
              <Option value="after">After amount (100₹)</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card
          title="Tax Settings"
          className="mb-3 sm:mb-4 w-full min-w-0"
          extra={
            <span className="text-xs text-gray-500">
              Default fallback — used when no Tax Rate below matches the order&apos;s state
            </span>
          }
        >
          <div className="space-y-3 sm:space-y-4">
            <Form.Item name="enableGST" label="Enable Tax" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item
              name="defaultTaxRate"
              label="Default Tax Rate (%)"
              rules={[{ required: true, message: "Please enter default tax rate" }]}
            >
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="taxInclusive"
              label="Prices Are Tax-Inclusive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </Card>

        <div className="flex justify-end mb-3 sm:mb-4">
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
        {isClient ? (
          <div style={{ width: "100%", height: 400 }}>
            <AgGridReact
              theme={myDarkTheme}
              modules={[AllCommunityModule]}
              rowData={taxRates}
              columnDefs={taxColumnDefs}
              defaultColDef={{ sortable: true, resizable: true }}
              getRowId={(p) => String(p.data.id)}
              animateRows
              rowHeight={52}
              headerHeight={44}
              loading={loading}
              suppressCellFocus
              overlayNoRowsTemplate="No state-specific tax rates yet — the default rate above applies everywhere."
            />
          </div>
        ) : (
          <div className="h-[400px]" />
        )}
      </Card>

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
            <div className="space-y-4">
              <Form.Item
                name="name"
                label="Tax Name"
                rules={[{ required: true, message: "Please enter tax name" }]}
              >
                <Input placeholder="GST 18% — Karnataka" />
              </Form.Item>

              <Form.Item
                name="code"
                label="Code (unique)"
                rules={[{ required: true, message: "Please enter a unique code" }]}
              >
                <Input placeholder="GST18-KA" style={{ textTransform: "uppercase" }} />
              </Form.Item>

              <Form.Item
                name="rate"
                label="Tax Rate (%)"
                rules={[{ required: true, message: "Please enter tax rate" }]}
              >
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </div>

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
                  <Option value="service">Service Tax</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="states"
                label="Applicable States"
                tooltip="Leave empty to apply to every state. Otherwise this rate only applies when the order's shipping state matches one of these."
              >
                <Select mode="tags" placeholder="e.g. Karnataka, Maharashtra" />
              </Form.Item>

              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          </div>

          <Form.Item name="description" label="Description (optional)">
            <Input placeholder="Internal note" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6 border-t border-zinc-800 pt-4">
            <Button onClick={() => setIsTaxModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={savingTax}>
              {selectedTax ? "Update" : "Add"} Tax Rate
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default CurrencyTaxSettings;
