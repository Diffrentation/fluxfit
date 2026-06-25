"use client";
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, DatePicker, Switch, Button, message } from "antd";
import { IconCopy } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const CouponForm = ({ visible, coupon, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [discountType, setDiscountType] = useState("percentage");

  useEffect(() => {
    if (coupon) {
      form.setFieldsValue({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount,
        usageLimit: coupon.usageLimit,
        expiryDate: dayjs(coupon.expiryDate),
        status: coupon.status,
        description: coupon.description,
      });
      setDiscountType(coupon.type);
    } else {
      form.resetFields();
      setDiscountType("percentage");
      // Generate random coupon code
      const randomCode = `COUPON${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      form.setFieldsValue({ code: randomCode });
    }
  }, [coupon, form]);

  const handleSubmit = async (values) => {
    try {
      const couponData = {
        ...values,
        expiryDate: values.expiryDate.format("YYYY-MM-DD"),
        id: coupon?.id || Date.now(),
        usedCount: coupon?.usedCount || 0,
        createdAt: coupon?.createdAt || new Date().toISOString(),
      };
      onSave(couponData);
    } catch (error) {
      message.error("Please fill in all required fields");
    }
  };

  const generateCode = () => {
    const randomCode = `COUPON${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    form.setFieldsValue({ code: randomCode });
  };

  const copyCode = () => {
    const code = form.getFieldValue("code");
    if (code) {
      navigator.clipboard.writeText(code);
      message.success("Coupon code copied to clipboard");
    }
  };

  return (
    <Modal
      title={coupon ? "Edit Coupon" : "Create New Coupon"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={850}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <Form.Item
              name="code"
              label="Coupon Code"
              rules={[{ required: true, message: "Please enter coupon code" }]}
            >
              <Input
                placeholder="Enter coupon code"
                addonAfter={
                  <div className="flex gap-1">
                    <Button type="text" size="small" onClick={generateCode}>
                      Generate
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      icon={<IconCopy className="w-3 h-3" />}
                      onClick={copyCode}
                    />
                  </div>
                }
              />
            </Form.Item>

            <Form.Item
              name="type"
              label="Discount Type"
              rules={[{ required: true, message: "Please select discount type" }]}
            >
              <Select
                placeholder="Select discount type"
                onChange={(value) => setDiscountType(value)}
              >
                <Option value="percentage">Percentage (%)</Option>
                <Option value="flat">Flat Amount (₹)</Option>
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="value"
                label={discountType === "percentage" ? "Discount Percentage" : "Discount Amount (₹)"}
                rules={[{ required: true, message: "Please enter discount value" }]}
                className="mb-0"
              >
                <InputNumber
                  min={0}
                  max={discountType === "percentage" ? 100 : undefined}
                  style={{ width: "100%" }}
                  placeholder={discountType === "percentage" ? "0-100" : "0"}
                  formatter={discountType === "percentage" ? (value) => `${value}%` : (value) => `₹ ${value}`}
                  parser={discountType === "percentage" ? (value) => value.replace("%", "") : (value) => value.replace("₹ ", "")}
                />
              </Form.Item>

              {discountType === "percentage" ? (
                <Form.Item
                  name="maxDiscount"
                  label="Max Discount (₹)"
                  help="Optional limit"
                  className="mb-0"
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="No limit"
                    formatter={(value) => `₹ ${value}`}
                    parser={(value) => value.replace("₹ ", "")}
                  />
                </Form.Item>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="minPurchase"
                label="Min Purchase (₹)"
                rules={[{ required: true, message: "Please enter minimum purchase amount" }]}
                className="mb-0"
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="0"
                  formatter={(value) => `₹ ${value}`}
                  parser={(value) => value.replace("₹ ", "")}
                />
              </Form.Item>

              <Form.Item
                name="usageLimit"
                label="Usage Limit"
                rules={[{ required: true, message: "Please enter usage limit" }]}
                className="mb-0"
              >
                <InputNumber
                  min={1}
                  style={{ width: "100%" }}
                  placeholder="100"
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="expiryDate"
                label="Expiry Date"
                rules={[{ required: true, message: "Please select expiry date" }]}
                className="mb-0"
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  disabledDate={(current) => current && current < dayjs().startOf("day")}
                />
              </Form.Item>

              <Form.Item
                name="status"
                label="Status"
                initialValue="active"
                className="mb-0"
              >
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item name="description" label="Description (Optional)">
              <TextArea rows={2} placeholder="Enter coupon description" />
            </Form.Item>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 border-t border-zinc-800 pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" size="large">
            {coupon ? "Update Coupon" : "Create Coupon"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CouponForm;

