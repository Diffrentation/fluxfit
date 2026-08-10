"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  Button,
  message,
  Spin,
} from "antd";
import axios from "axios";
import { IconCopy } from "@tabler/icons-react";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// Top-level form fields the API can return validation errors for.
const KNOWN_FIELDS = [
  "code",
  "name",
  "description",
  "type",
  "discount",
  "maxDiscount",
  "minPurchase",
  "maxPurchase",
  "usageLimit",
  "perUserLimit",
  "applicableTo",
  "categories",
  "products",
  "brands",
  "isActive",
];

const CouponForm = ({ visible, coupon, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [discountType, setDiscountType] = useState("percentage");
  const [applicableTo, setApplicableTo] = useState("all");
  const [loading, setLoading] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [brandOptions, setBrandOptions] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [productsSearching, setProductsSearching] = useState(false);
  const productSearchTimeout = useRef(null);

  const editingCouponId = coupon?.id || coupon?._id || null;

  useEffect(() => {
    if (!visible) return;

    if (coupon) {
      const initialCategories = (coupon.categories || []).map((c) => ({
        value: String(c.id || c._id),
        label: c.name,
      }));
      const initialBrands = (coupon.brands || []).map((b) => ({
        value: String(b.id || b._id),
        label: b.name,
      }));
      const initialProducts = (coupon.products || []).map((p) => ({
        value: String(p.id || p._id),
        label: p.name,
      }));

      setCategoryOptions((prev) => mergeOptions(prev, initialCategories));
      setBrandOptions((prev) => mergeOptions(prev, initialBrands));
      setProductOptions((prev) => mergeOptions(prev, initialProducts));

      form.setFieldsValue({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || undefined,
        type: coupon.type,
        discount: coupon.discount,
        maxDiscount: coupon.maxDiscount ?? undefined,
        minPurchase: coupon.minPurchase ?? 0,
        maxPurchase: coupon.maxPurchase ?? undefined,
        usageLimit: coupon.usageLimit ?? undefined,
        perUserLimit: coupon.perUserLimit ?? 1,
        validity: [
          coupon.validFrom ? dayjs(coupon.validFrom) : null,
          coupon.validUntil ? dayjs(coupon.validUntil) : null,
        ],
        applicableTo: coupon.applicableTo || "all",
        categories: initialCategories.map((o) => o.value),
        products: initialProducts.map((o) => o.value),
        brands: initialBrands.map((o) => o.value),
        isActive: coupon.isActive ?? true,
      });
      setDiscountType(coupon.type || "percentage");
      setApplicableTo(coupon.applicableTo || "all");
    } else {
      form.resetFields();
      setDiscountType("percentage");
      setApplicableTo("all");
      const randomCode = `COUPON${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      form.setFieldsValue({
        code: randomCode,
        minPurchase: 0,
        perUserLimit: 1,
        applicableTo: "all",
        isActive: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupon, visible, form]);

  const mergeOptions = (prev, next) => {
    const map = new Map(prev.map((o) => [o.value, o]));
    next.forEach((o) => map.set(o.value, o));
    return Array.from(map.values());
  };

  const loadCategoryOptions = useCallback(async () => {
    if (categoryOptions.length > 0 || categoriesLoading) return;
    try {
      setCategoriesLoading(true);
      const { data } = await axios.get("/api/categories", {
        params: { format: "flat", includeInactive: false },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!data?.success) throw new Error(data?.message);
      const opts = (data.data.categories || []).map((c) => ({
        value: String(c.id || c._id),
        label: c.name,
      }));
      setCategoryOptions((prev) => mergeOptions(prev, opts));
    } catch (error) {
      console.error("Load categories error:", error);
      message.error("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryOptions.length, categoriesLoading]);

  const loadBrandOptions = useCallback(async () => {
    if (brandOptions.length > 0 || brandsLoading) return;
    try {
      setBrandsLoading(true);
      const { data } = await axios.get("/api/brands", {
        params: { includeInactive: false },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!data?.success) throw new Error(data?.message);
      const opts = (data.data.brands || []).map((b) => ({
        value: String(b.id || b._id),
        label: b.name,
      }));
      setBrandOptions((prev) => mergeOptions(prev, opts));
    } catch (error) {
      console.error("Load brands error:", error);
      message.error("Failed to load brands");
    } finally {
      setBrandsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandOptions.length, brandsLoading]);

  const handleProductSearch = (searchText) => {
    if (productSearchTimeout.current) {
      clearTimeout(productSearchTimeout.current);
    }
    const q = (searchText || "").trim();
    if (q.length < 2) return;

    productSearchTimeout.current = setTimeout(async () => {
      try {
        setProductsSearching(true);
        const { data } = await axios.get("/api/products/search", {
          params: { q, limit: 20 },
        });
        if (!data?.success) throw new Error(data?.message);
        const opts = (data.data.products || []).map((p) => ({
          value: String(p.id),
          label: p.name,
        }));
        setProductOptions((prev) => mergeOptions(prev, opts));
      } catch (error) {
        console.error("Product search error:", error);
      } finally {
        setProductsSearching(false);
      }
    }, 400);
  };

  useEffect(() => {
    if (applicableTo === "categories") loadCategoryOptions();
    if (applicableTo === "brands") loadBrandOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicableTo]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const [validFrom, validUntil] = values.validity || [];

      const payload = {
        code: values.code?.trim(),
        name: values.name?.trim(),
        description: values.description?.trim() || null,
        type: values.type,
        discount: values.discount,
        maxDiscount:
          values.type === "percentage" && values.maxDiscount != null
            ? values.maxDiscount
            : null,
        minPurchase: values.minPurchase ?? 0,
        maxPurchase: values.maxPurchase ?? null,
        usageLimit: values.usageLimit ?? null,
        perUserLimit: values.perUserLimit ?? 1,
        validFrom: validFrom ? validFrom.startOf("day").toISOString() : null,
        validUntil: validUntil ? validUntil.endOf("day").toISOString() : null,
        applicableTo: values.applicableTo || "all",
        categories:
          values.applicableTo === "categories" ? values.categories || [] : [],
        products:
          values.applicableTo === "products" ? values.products || [] : [],
        brands: values.applicableTo === "brands" ? values.brands || [] : [],
        isActive: values.isActive ?? true,
      };

      // Code cannot be changed on update; the API doesn't accept it.
      if (editingCouponId) {
        delete payload.code;
      }

      const url = editingCouponId
        ? `/api/admin/coupons/${editingCouponId}`
        : "/api/admin/coupons";
      const method = editingCouponId ? "put" : "post";

      const { data } = await axios({
        method,
        url,
        data: payload,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (data.success) {
        message.success(
          editingCouponId
            ? "Coupon updated successfully"
            : "Coupon created successfully"
        );
        form.resetFields();
        onSave?.(data.data?.coupon);
      } else {
        message.error(data.message || "Failed to save coupon");
      }
    } catch (error) {
      console.error("Coupon form error:", error);
      const res = error.response;
      if (res?.data?.errors?.length) {
        res.data.errors.forEach((e) => {
          const fieldName =
            e.field === "validFrom" || e.field === "validUntil"
              ? "validity"
              : e.field;
          if (KNOWN_FIELDS.includes(fieldName) || fieldName === "validity") {
            form.setFields([{ name: fieldName, errors: [e.message] }]);
          }
        });
        message.error(res.data.message || "Please fix the highlighted errors");
      } else {
        message.error(res?.data?.message || "Failed to save coupon. Please try again.");
      }
    } finally {
      setLoading(false);
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
      title={editingCouponId ? "Edit Coupon" : "Create New Coupon"}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
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
                disabled={Boolean(editingCouponId)}
                addonAfter={
                  editingCouponId ? null : (
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
                  )
                }
              />
            </Form.Item>

            <Form.Item
              name="name"
              label="Coupon Name"
              rules={[{ required: true, message: "Please enter coupon name" }]}
            >
              <Input placeholder="e.g. Welcome Offer" />
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
                <Option value="fixed">Flat Amount (₹)</Option>
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="discount"
                label={discountType === "percentage" ? "Discount Percentage" : "Discount Amount (₹)"}
                rules={[{ required: true, message: "Please enter discount value" }]}
                className="mb-0"
              >
                <InputNumber
                  min={0}
                  max={discountType === "percentage" ? 100 : undefined}
                  style={{ width: "100%" }}
                  placeholder={discountType === "percentage" ? "0-100" : "0"}
                />
              </Form.Item>

              {discountType === "percentage" ? (
                <Form.Item
                  name="maxDiscount"
                  label="Max Discount (₹)"
                  help="Optional limit"
                  className="mb-0"
                >
                  <InputNumber min={0} style={{ width: "100%" }} placeholder="No limit" />
                </Form.Item>
              ) : (
                <div />
              )}
            </div>

            <Form.Item name="description" label="Description (Optional)">
              <TextArea rows={2} placeholder="Enter coupon description" />
            </Form.Item>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="minPurchase" label="Min Purchase (₹)" className="mb-0">
                <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
              </Form.Item>

              <Form.Item name="maxPurchase" label="Max Purchase (₹)" help="Optional" className="mb-0">
                <InputNumber min={0} style={{ width: "100%" }} placeholder="No limit" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="usageLimit" label="Total Usage Limit" help="Optional" className="mb-0">
                <InputNumber min={1} style={{ width: "100%" }} placeholder="Unlimited" />
              </Form.Item>

              <Form.Item
                name="perUserLimit"
                label="Per User Limit"
                rules={[{ required: true, message: "Please enter per-user limit" }]}
                className="mb-0"
              >
                <InputNumber min={1} style={{ width: "100%" }} placeholder="1" />
              </Form.Item>
            </div>

            <Form.Item
              name="validity"
              label="Validity Period"
              rules={[{ required: true, message: "Please select validity period" }]}
            >
              <RangePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item name="applicableTo" label="Applicable To" initialValue="all">
              <Select onChange={(value) => setApplicableTo(value)}>
                <Option value="all">All Products</Option>
                <Option value="categories">Specific Categories</Option>
                <Option value="products">Specific Products</Option>
                <Option value="brands">Specific Brands</Option>
              </Select>
            </Form.Item>

            {applicableTo === "categories" && (
              <Form.Item
                name="categories"
                label="Categories"
                rules={[{ required: true, message: "Please select at least one category" }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select categories"
                  loading={categoriesLoading}
                  options={categoryOptions}
                  showSearch
                  optionFilterProp="label"
                  notFoundContent={categoriesLoading ? <Spin size="small" /> : null}
                />
              </Form.Item>
            )}

            {applicableTo === "brands" && (
              <Form.Item
                name="brands"
                label="Brands"
                rules={[{ required: true, message: "Please select at least one brand" }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select brands"
                  loading={brandsLoading}
                  options={brandOptions}
                  showSearch
                  optionFilterProp="label"
                  notFoundContent={brandsLoading ? <Spin size="small" /> : null}
                />
              </Form.Item>
            )}

            {applicableTo === "products" && (
              <Form.Item
                name="products"
                label="Products"
                rules={[{ required: true, message: "Please select at least one product" }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Search and select products"
                  filterOption={false}
                  onSearch={handleProductSearch}
                  options={productOptions}
                  notFoundContent={productsSearching ? <Spin size="small" /> : null}
                />
              </Form.Item>
            )}

            <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 border-t border-zinc-800 pt-4">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" size="large" loading={loading}>
            {editingCouponId ? "Update Coupon" : "Create Coupon"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CouponForm;
