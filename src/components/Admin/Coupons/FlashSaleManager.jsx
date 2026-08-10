"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Card, Button, Tag, Modal, Form, Input, DatePicker, InputNumber, Select, Spin, message } from "antd";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { format } from "date-fns";
import dayjs from "dayjs";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz, colorSchemeDark } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);
const myDarkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "#09090b",
  foregroundColor: "#e4e4e7",
  headerBackgroundColor: "#18181b",
  borderColor: "#27272a",
  rowHoverColor: "#18181b",
});

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const FlashSaleManager = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [isClient, setIsClient] = useState(false);

  // Search/status filtering happens server-side via query params, not
  // client-side row filtering.
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const searchDebounceRef = useRef(null);

  const [productOptions, setProductOptions] = useState([]);
  const [productsSearching, setProductsSearching] = useState(false);
  const productSearchTimeout = useRef(null);

  const loadFlashSales = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/flash-sales", {
        params: {
          limit: 100,
          search: params.search || undefined,
          status: params.status && params.status !== "all" ? params.status : undefined,
        },
        headers: authHeaders(),
      });
      if (!data?.success) throw new Error(data?.message || "Failed to load flash sales");
      setFlashSales(data.data.flashSales || []);
    } catch (error) {
      console.error("Load flash sales error:", error);
      message.error(error.response?.data?.message || "Failed to load flash sales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    loadFlashSales({ search, status: statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (value) => {
    setSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      loadFlashSales({ search: value, status: statusFilter });
    }, 400);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    loadFlashSales({ search, status: value });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "green",
      scheduled: "blue",
      ended: "default",
      cancelled: "red",
    };
    return colors[status] || "default";
  };

  const searchProducts = useCallback((search) => {
    if (productSearchTimeout.current) clearTimeout(productSearchTimeout.current);
    productSearchTimeout.current = setTimeout(async () => {
      setProductsSearching(true);
      try {
        const { data } = await axios.get("/api/products", {
          params: { search, limit: 20, status: "active" },
        });
        if (data?.success) {
          setProductOptions(
            (data.data.products || []).map((p) => ({
              value: p.id || p._id,
              label: `${p.name} — ₹${p.basePrice} (stock: ${p.stock})`,
              basePrice: p.basePrice,
              stock: p.stock,
            }))
          );
        }
      } catch (error) {
        console.error("Product search error:", error);
      } finally {
        setProductsSearching(false);
      }
    }, 300);
  }, []);

  const handleAdd = () => {
    setSelectedSale(null);
    form.resetFields();
    setProductOptions([]);
    setIsFormVisible(true);
  };

  const handleEdit = (sale) => {
    setSelectedSale(sale);
    setProductOptions(
      (sale.products || []).map((p) => ({
        value: p.id,
        label: `${p.name} — ₹${p.originalPrice} (stock: ${p.stock})`,
        basePrice: p.originalPrice,
        stock: p.stock,
      }))
    );
    form.setFieldsValue({
      name: sale.name,
      discount: sale.products?.[0]?.discount || 0,
      dateRange: [dayjs(sale.startDate), dayjs(sale.endDate)],
      description: sale.description,
      productIds: (sale.products || []).map((p) => p.id),
    });
    setIsFormVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete this flash sale?",
      content: "This cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const { data } = await axios.delete(`/api/admin/flash-sales/${id}`, {
            headers: authHeaders(),
          });
          if (!data?.success) throw new Error(data?.message || "Failed to delete flash sale");
          message.success("Flash sale deleted successfully");
          loadFlashSales({ search, status: statusFilter });
        } catch (error) {
          console.error("Delete flash sale error:", error);
          message.error(error.response?.data?.message || "Failed to delete flash sale");
        }
      },
    });
  };

  const handleSave = async (values) => {
    if (!values.productIds || values.productIds.length === 0) {
      message.error("Select at least one product for this flash sale");
      return;
    }

    const products = values.productIds.map((id) => {
      const opt = productOptions.find((o) => o.value === id);
      return {
        product: id,
        discount: values.discount,
        stock: opt?.stock ?? 0,
      };
    });

    const payload = {
      name: values.name,
      description: values.description || null,
      products,
      startDate: values.dateRange[0].toISOString(),
      endDate: values.dateRange[1].toISOString(),
    };

    setSaving(true);
    try {
      const { data } = selectedSale
        ? await axios.put(`/api/admin/flash-sales/${selectedSale.id}`, payload, {
            headers: authHeaders(),
          })
        : await axios.post("/api/admin/flash-sales", payload, { headers: authHeaders() });

      if (!data?.success) throw new Error(data?.message || "Failed to save flash sale");

      message.success(selectedSale ? "Flash sale updated successfully" : "Flash sale created successfully");
      setIsFormVisible(false);
      form.resetFields();
      loadFlashSales({ search, status: statusFilter });
    } catch (error) {
      console.error("Save flash sale error:", error);
      message.error(error.response?.data?.message || "Failed to save flash sale");
    } finally {
      setSaving(false);
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Sale Name",
        field: "name",
        flex: 1,
        minWidth: 180,
        cellRenderer: (params) => <span className="font-semibold">{params.value}</span>,
      },
      {
        headerName: "Products",
        field: "productCount",
        width: 120,
        valueFormatter: (params) => params.value || 0,
      },
      {
        headerName: "Discount",
        width: 130,
        cellRenderer: (params) => (
          <Tag color="red">{params.data.products?.[0]?.discount ?? 0}% OFF</Tag>
        ),
      },
      {
        headerName: "Start Date",
        field: "startDate",
        width: 150,
        valueFormatter: (params) => format(new Date(params.value), "MMM dd, yyyy"),
      },
      {
        headerName: "End Date",
        field: "endDate",
        width: 150,
        valueFormatter: (params) => format(new Date(params.value), "MMM dd, yyyy"),
      },
      {
        headerName: "Status",
        field: "status",
        width: 130,
        cellRenderer: (params) => (
          <Tag color={getStatusColor(params.value)} className="capitalize">
            {params.value}
          </Tag>
        ),
      },
      {
        headerName: "Actions",
        width: 120,
        pinned: "right",
        cellRenderer: (params) => (
          <div className="h-full flex items-center gap-2">
            <Button
              type="text"
              icon={<IconEdit className="w-4 h-4" />}
              onClick={() => handleEdit(params.data)}
            />
            <Button
              type="text"
              danger
              icon={<IconTrash className="w-4 h-4" />}
              onClick={() => handleDelete(params.data.id)}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flashSales]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
        <div className="flex flex-1 gap-3">
          <Input.Search
            placeholder="Search flash sales by name"
            allowClear
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={{ width: 160 }}
            options={[
              { value: "all", label: "All Status" },
              { value: "scheduled", label: "Scheduled" },
              { value: "active", label: "Active" },
              { value: "ended", label: "Ended" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>
        <Button
          type="primary"
          icon={<IconPlus className="w-4 h-4" />}
          onClick={handleAdd}
          size="large"
        >
          Schedule Flash Sale
        </Button>
      </div>

      <Card className="shadow-sm">
        {isClient ? (
          <div style={{ width: "100%", height: 460 }}>
            <AgGridReact
              theme={myDarkTheme}
              modules={[AllCommunityModule]}
              rowData={flashSales}
              columnDefs={columnDefs}
              defaultColDef={{ sortable: true, resizable: true }}
              getRowId={(params) => params.data.id}
              animateRows
              rowHeight={56}
              headerHeight={44}
              overlayNoRowsTemplate="No flash sales yet"
              loading={loading}
              suppressCellFocus
            />
          </div>
        ) : (
          <div className="h-[460px] flex items-center justify-center text-sm text-gray-500">
            Loading flash sales...
          </div>
        )}
      </Card>

      <Modal
        title={selectedSale ? "Edit Flash Sale" : "Schedule Flash Sale"}
        open={isFormVisible}
        onCancel={() => {
          setIsFormVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={850}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <Form.Item
                name="name"
                label="Sale Name"
                rules={[{ required: true, message: "Please enter sale name" }]}
              >
                <Input placeholder="Enter flash sale name" />
              </Form.Item>

              <Form.Item
                name="discount"
                label="Discount Percentage (applied to all selected products)"
                rules={[{ required: true, message: "Please enter discount" }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: "100%" }}
                  placeholder="0-100"
                  formatter={(value) => `${value}%`}
                  parser={(value) => value.replace("%", "")}
                />
              </Form.Item>

              <Form.Item
                name="productIds"
                label="Products on sale"
                rules={[{ required: true, message: "Select at least one product" }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Search and select products"
                  filterOption={false}
                  onSearch={searchProducts}
                  notFoundContent={productsSearching ? <Spin size="small" /> : null}
                  options={productOptions}
                />
              </Form.Item>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Form.Item
                name="dateRange"
                label="Sale Period"
                rules={[{ required: true, message: "Please select sale period" }]}
              >
                <RangePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  disabledDate={(current) => current && current < dayjs().startOf("day")}
                />
              </Form.Item>

              <Form.Item name="description" label="Description (Optional)">
                <TextArea rows={2} placeholder="Enter sale description" />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 border-t border-zinc-800 pt-4">
            <Button onClick={() => setIsFormVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {selectedSale ? "Update" : "Create"} Sale
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default FlashSaleManager;
