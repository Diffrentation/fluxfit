"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Tag,
  Modal,
  Select,
  Switch,
  message,
  Divider,
  Spin,
  Popconfirm,
} from "antd";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import axios from "axios";
import { formatPrice } from "@/lib/formatPrice";
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

const ShippingRules = ({ onSave }) => {
  const [shippingRules, setShippingRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRuleModalVisible, setIsRuleModalVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [ruleForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const ruleType = Form.useWatch("type", ruleForm);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/settings/shipping-rules", {
        params: { sort: "sortOrder" },
        headers: authHeaders(),
      });
      setShippingRules(data?.data?.shippingRules || []);
    } catch (e) {
      message.error(e.response?.data?.message || "Failed to load shipping rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddRule = () => {
    setSelectedRule(null);
    ruleForm.resetFields();
    ruleForm.setFieldsValue({
      type: "flat",
      isActive: true,
      sortOrder: 0,
      estimatedMin: 3,
      estimatedMax: 7,
      zones: [],
      rules: [],
    });
    setIsRuleModalVisible(true);
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    ruleForm.setFieldsValue({
      name: rule.name,
      description: rule.description || "",
      type: rule.type,
      basePrice: rule.basePrice,
      freeShippingThreshold: rule.freeShippingThreshold,
      estimatedMin: rule.estimatedDays?.min || 3,
      estimatedMax: rule.estimatedDays?.max || 7,
      isActive: rule.isActive,
      sortOrder: rule.sortOrder || 0,
      zones: (rule.zones || []).map((z) => ({
        name: z.name,
        states: z.states || [],
        cities: z.cities || [],
        pincodes: z.pincodes || [],
      })),
      rules: (rule.rules || []).map((r) => ({ min: r.min, max: r.max, price: r.price })),
    });
    setIsRuleModalVisible(true);
  };

  const handleDeleteRule = async (id) => {
    try {
      await axios.delete(`/api/admin/settings/shipping-rules/${id}`, {
        headers: authHeaders(),
      });
      message.success("Shipping rule deleted successfully");
      load();
    } catch (e) {
      message.error(e.response?.data?.message || "Failed to delete shipping rule");
    }
  };

  const handleSaveRule = useCallback(
    async (values) => {
      setSaving(true);
      try {
        const payload = {
          name: values.name,
          description: values.description || "",
          type: values.type,
          basePrice: values.basePrice,
          freeShippingThreshold:
            values.freeShippingThreshold !== undefined && values.freeShippingThreshold !== null
              ? values.freeShippingThreshold
              : null,
          estimatedDays: { min: values.estimatedMin || 3, max: values.estimatedMax || 7 },
          isActive: values.isActive !== undefined ? values.isActive : true,
          sortOrder: values.sortOrder || 0,
          zones: (values.zones || []).map((z) => ({
            name: z.name,
            states: z.states || [],
            cities: z.cities || [],
            pincodes: z.pincodes || [],
          })),
          rules: (values.rules || []).map((r) => ({
            min: r.min ?? 0,
            max: r.max ?? null,
            price: r.price,
          })),
        };

        if (selectedRule) {
          await axios.put(`/api/admin/settings/shipping-rules/${selectedRule.id}`, payload, {
            headers: authHeaders(),
          });
          message.success("Shipping rule updated successfully");
        } else {
          await axios.post("/api/admin/settings/shipping-rules", payload, {
            headers: authHeaders(),
          });
          message.success("Shipping rule added successfully");
        }
        setIsRuleModalVisible(false);
        ruleForm.resetFields();
        load();
        onSave?.();
      } catch (e) {
        message.error(e.response?.data?.message || "Failed to save shipping rule");
      } finally {
        setSaving(false);
      }
    },
    [selectedRule, ruleForm, load, onSave]
  );

  const ruleColumnDefs = useMemo(
    () => [
      {
        headerName: "Rule Name",
        field: "name",
        flex: 1,
        minWidth: 150,
        cellRenderer: (p) => <span className="font-semibold">{p.value}</span>,
      },
      {
        headerName: "Type",
        field: "type",
        width: 110,
        cellRenderer: (p) => <Tag>{p.value}</Tag>,
      },
      {
        headerName: "Base Price",
        field: "basePrice",
        width: 120,
        cellRenderer: (p) => (
          <span className="font-semibold">
            {p.value === 0 ? <Tag color="green">Free</Tag> : `₹${formatPrice(p.value)}`}
          </span>
        ),
      },
      {
        headerName: "Free Above",
        field: "freeShippingThreshold",
        width: 120,
        valueGetter: (p) => (p.data.freeShippingThreshold != null ? `₹${formatPrice(p.data.freeShippingThreshold)}` : "—"),
      },
      {
        headerName: "Zones",
        field: "zones",
        flex: 1,
        minWidth: 160,
        valueGetter: (p) => (p.data.zones?.length ? p.data.zones.map((z) => z.name).join(", ") : "All destinations"),
      },
      {
        headerName: "Est. Days",
        width: 110,
        valueGetter: (p) => `${p.data.estimatedDays?.min ?? 3}-${p.data.estimatedDays?.max ?? 7}`,
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
              onClick={() => handleEditRule(p.data)}
            />
            <Popconfirm title="Delete this shipping rule?" onConfirm={() => handleDeleteRule(p.data.id)}>
              <Button type="text" danger icon={<IconTrash className="w-4 h-4" />} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shippingRules]
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
        <p className="text-xs text-gray-500 mb-3">
          Checkout picks the first active rule whose zone matches the order&apos;s shipping state/city/pincode
          (by sort order), or the first rule with no zones configured at all. If nothing matches, a flat
          ₹50 default applies.
        </p>
        {isClient ? (
          <div style={{ width: "100%", height: 400 }}>
            <AgGridReact
              theme={myDarkTheme}
              modules={[AllCommunityModule]}
              rowData={shippingRules}
              columnDefs={ruleColumnDefs}
              defaultColDef={{ sortable: true, resizable: true }}
              getRowId={(p) => String(p.data.id)}
              animateRows
              rowHeight={52}
              headerHeight={44}
              loading={loading}
              suppressCellFocus
              overlayNoRowsTemplate="No shipping rules yet — orders will use the ₹50 flat-rate fallback."
            />
          </div>
        ) : (
          <div className="h-[400px]" />
        )}
      </Card>

      <Modal
        title={selectedRule ? "Edit Shipping Rule" : "Add Shipping Rule"}
        open={isRuleModalVisible}
        onCancel={() => {
          setIsRuleModalVisible(false);
          ruleForm.resetFields();
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: 900 }}
        className="!bg-zinc-950"
        centered
      >
        <Form form={ruleForm} layout="vertical" onFinish={handleSaveRule} className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Form.Item
                name="name"
                label="Rule Name"
                rules={[{ required: true, message: "Please enter rule name" }]}
              >
                <Input placeholder="Standard Shipping" />
              </Form.Item>

              <Form.Item name="description" label="Description">
                <Input placeholder="Optional" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="basePrice"
                  label="Base Price (₹)"
                  rules={[{ required: true, message: "Please enter base price" }]}
                  className="mb-0"
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  name="freeShippingThreshold"
                  label="Free Above (₹)"
                  tooltip="Leave empty for no free-shipping threshold"
                  className="mb-0"
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </div>
            </div>

            <div className="space-y-4">
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: "Please select type" }]}
                tooltip="Only Flat and Order Value currently affect checkout — Weight/Distance tiers aren't evaluated yet since checkout doesn't compute package weight or distance."
              >
                <Select>
                  <Option value="flat">Flat rate</Option>
                  <Option value="price">Tiered by order value</Option>
                  <Option value="weight">Tiered by weight (not yet evaluated at checkout)</Option>
                  <Option value="distance">Tiered by distance (not yet evaluated at checkout)</Option>
                </Select>
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="estimatedMin" label="Est. Days (min)" className="mb-0">
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="estimatedMax" label="Est. Days (max)" className="mb-0">
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </div>

              <Form.Item name="sortOrder" label="Priority (lower checked first)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          </div>

          {ruleType && ruleType !== "flat" && (
            <>
              <Divider>Tiers</Divider>
              <Form.List name="rules">
                {(fields, { add, remove }) => (
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.key} className="flex gap-3 items-start">
                        <Form.Item
                          {...field}
                          name={[field.name, "min"]}
                          label="Min"
                          className="mb-0 flex-1"
                        >
                          <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, "max"]}
                          label="Max"
                          className="mb-0 flex-1"
                          tooltip="Leave empty for no upper bound"
                        >
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, "price"]}
                          label="Price (₹)"
                          rules={[{ required: true, message: "Required" }]}
                          className="mb-0 flex-1"
                        >
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<IconTrash className="w-4 h-4" />}
                          onClick={() => remove(field.name)}
                          className="mt-6"
                        />
                      </div>
                    ))}
                    <Button icon={<IconPlus className="w-4 h-4" />} onClick={() => add({ min: 0 })} block>
                      Add Tier
                    </Button>
                  </div>
                )}
              </Form.List>
            </>
          )}

          <Divider>Zones (optional — leave empty to apply everywhere)</Divider>
          <Form.List name="zones">
            {(fields, { add, remove }) => (
              <div className="space-y-4">
                {fields.map((field) => (
                  <Card key={field.key} size="small" className="!bg-zinc-900">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <Form.Item
                          {...field}
                          name={[field.name, "name"]}
                          label="Zone Name"
                          rules={[{ required: true, message: "Zone name is required" }]}
                          className="mb-0"
                        >
                          <Input placeholder="Metro Cities" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, "states"]} label="States" className="mb-0">
                          <Select mode="tags" placeholder="e.g. Maharashtra, Karnataka" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, "cities"]} label="Cities" className="mb-0">
                          <Select mode="tags" placeholder="e.g. Mumbai, Bengaluru" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, "pincodes"]}
                          label="Pincodes"
                          className="mb-0"
                        >
                          <Select mode="tags" placeholder="e.g. 400001" />
                        </Form.Item>
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={<IconTrash className="w-4 h-4" />}
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  </Card>
                ))}
                <Button icon={<IconPlus className="w-4 h-4" />} onClick={() => add({})} block>
                  Add Zone
                </Button>
              </div>
            )}
          </Form.List>

          <div className="flex justify-end gap-2 mt-6 border-t border-zinc-800 pt-4">
            <Button onClick={() => setIsRuleModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {selectedRule ? "Update" : "Add"} Rule
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default ShippingRules;
