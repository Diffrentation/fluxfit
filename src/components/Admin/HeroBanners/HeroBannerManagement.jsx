"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  Popconfirm,
  Tooltip,
  message,
  Spin,
  Card,
} from "antd";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconArrowUp,
  IconArrowDown,
  IconPhoto,
  IconRefresh,
} from "@tabler/icons-react";
import axios from "axios";
import { uploadImage } from "@/lib/upload-client";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

const { TextArea } = Input;

const getToken = () => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("token");
  if (!raw || raw === "undefined" || raw === "null") return null;
  return raw.trim();
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  description: "",
  buttonText: "SHOP NOW",
  buttonLink: "/product-list",
  image: "",
  badge: "",
  discountText: "",
  originalPrice: null,
  salePrice: null,
  bgColor: "",
  isActive: true,
  order: 0,
};

const KNOWN_IMAGE_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];

const isLikelyImageUrl = (value) => {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value.trim());
    const pathname = parsed.pathname.toLowerCase();
    const hasImageExt = /\.(avif|bmp|gif|jpe?g|png|svg|tiff?|webp)$/i.test(pathname);
    return hasImageExt || KNOWN_IMAGE_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
};

export default function HeroBannerManagement() {
  const fileInputRef = useRef(null);
  const [banners, setBanners] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [form] = Form.useForm();

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await axios.get("/api/admin/hero-banners", {
        headers: authHeaders(),
      });
      if (data.success) {
        const normalized = (data.data.banners || []).map((item) => ({
          ...item,
          _id: String(item._id || item.id),
          image: item.image || "",
        }));
        setBanners(normalized);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load hero banners";
      setLoadError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchBanners();
  }, [fetchBanners]);

  const openCreate = () => {
    setEditingBanner(null);
    setPreviewImage("");
    form.setFieldsValue({ ...EMPTY_FORM, order: banners.length });
    setModalOpen(true);
  };

  const openEdit = (banner) => {
    setEditingBanner(banner);
    setPreviewImage(banner.image || "");
    form.setFieldsValue({
      title: banner.title,
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      buttonText: banner.buttonText || "SHOP NOW",
      buttonLink: banner.buttonLink || "/product-list",
      image: banner.image || "",
      badge: banner.badge || "",
      discountText: banner.discountText || "",
      originalPrice: banner.originalPrice || null,
      salePrice: banner.salePrice || null,
      bgColor: banner.bgColor || "",
      isActive: banner.isActive !== false,
      order: banner.order ?? 0,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingBanner) {
        const { data } = await axios.put(
          `/api/admin/hero-banners/${editingBanner._id}`,
          values,
          { headers: authHeaders() }
        );
        if (data.success) {
          message.success("Hero banner updated");
          setModalOpen(false);
          fetchBanners();
        }
      } else {
        const { data } = await axios.post("/api/admin/hero-banners", values, {
          headers: authHeaders(),
        });
        if (data.success) {
          message.success("Hero banner created");
          setModalOpen(false);
          fetchBanners();
        }
      }
    } catch (err) {
      if (err?.response?.data?.message) {
        message.error(err.response.data.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(`/api/admin/hero-banners/${id}`, {
        headers: authHeaders(),
      });
      if (data.success) {
        message.success("Hero banner deleted");
        fetchBanners();
      }
    } catch {
      message.error("Failed to delete hero banner");
    }
  };

  const toggleActive = async (banner) => {
    try {
      const { data } = await axios.put(
        `/api/admin/hero-banners/${banner._id}`,
        { isActive: !banner.isActive },
        { headers: authHeaders() }
      );
      if (data.success) {
        message.success(`Banner ${!banner.isActive ? "activated" : "deactivated"}`);
        fetchBanners();
      }
    } catch {
      message.error("Failed to update banner status");
    }
  };

  const moveOrder = async (banner, direction) => {
    const sorted = [...banners].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((b) => b._id === banner._id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swapBanner = sorted[swapIdx];
    try {
      await Promise.all([
        axios.put(
          `/api/admin/hero-banners/${banner._id}`,
          { order: swapBanner.order },
          { headers: authHeaders() }
        ),
        axios.put(
          `/api/admin/hero-banners/${swapBanner._id}`,
          { order: banner.order },
          { headers: authHeaders() }
        ),
      ]);
      fetchBanners();
    } catch {
      message.error("Failed to reorder banners");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const result = await uploadImage(file, { folder: "fluxfit/hero-banners" });
      if (result?.url) {
        form.setFieldValue("image", result.url);
        setPreviewImage(result.url);
        message.success("Image uploaded");
      } else {
        message.error("Upload completed but no image URL was returned");
      }
    } catch (err) {
      message.error(err?.message || "Image upload failed");
    } finally {
      setImageUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const rowData = useMemo(
    () => [...banners].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [banners]
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Order",
        field: "order",
        width: 120,
        sortable: true,
        cellRenderer: (params) => {
          const record = params.data;
          const idx = rowData.findIndex((b) => b._id === record._id);
          return (
            <div className="h-full flex items-center gap-2">
              <Button
                icon={<IconArrowUp size={14} />}
                size="small"
                disabled={idx === 0}
                onClick={() => moveOrder(record, "up")}
              />
              <Button
                icon={<IconArrowDown size={14} />}
                size="small"
                disabled={idx === rowData.length - 1}
                onClick={() => moveOrder(record, "down")}
              />
            </div>
          );
        },
      },
      {
        headerName: "Image",
        field: "image",
        width: 130,
        cellRenderer: (params) => {
          const imageUrl = params.value;
          return imageUrl ? (
            <img
              src={imageUrl}
              alt="banner"
              className="w-[70px] h-[50px] rounded object-cover border border-gray-200"
            />
          ) : (
            <div className="w-[70px] h-[50px] bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <IconPhoto size={20} className="text-gray-400" />
            </div>
          );
        },
      },
      {
        headerName: "Title / Subtitle",
        field: "title",
        flex: 1,
        minWidth: 220,
        cellRenderer: (params) => {
          const record = params.data;
          return (
            <div className="h-full flex flex-col justify-center py-2">
              <div className="font-semibold text-gray-900 dark:text-white">{record.title}</div>
              {record.subtitle ? (
                <div className="text-xs text-gray-500 dark:text-gray-400">{record.subtitle}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        headerName: "Badge / Discount",
        field: "discountText",
        flex: 1,
        minWidth: 260,
        cellRenderer: (params) => {
          const record = params.data;
          return (
            <div className="h-full flex items-center gap-2 flex-wrap py-2">
              {record.badge ? (
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                  {record.badge}
                </span>
              ) : null}
              {record.discountText ? (
                <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                  {record.discountText}
                </span>
              ) : null}
              {record.salePrice ? (
                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                  ₹{Number(record.salePrice).toLocaleString()}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        headerName: "Button",
        field: "buttonText",
        minWidth: 180,
        cellRenderer: (params) => {
          const record = params.data;
          return (
            <div className="h-full flex flex-col justify-center py-2">
              <div className="font-medium text-gray-900 dark:text-white">{record.buttonText}</div>
              <div className="text-xs text-gray-400 truncate max-w-[180px]">{record.buttonLink}</div>
            </div>
          );
        },
      },
      {
        headerName: "Status",
        field: "isActive",
        width: 130,
        cellRenderer: (params) => (
          <span
            className={`px-2 py-1 text-xs rounded font-medium ${
              params.value
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {params.value ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        headerName: "Actions",
        field: "_id",
        width: 170,
        pinned: "right",
        cellRenderer: (params) => {
          const record = params.data;
          return (
            <div className="h-full flex items-center gap-2">
              <Tooltip title="Edit">
                <Button
                  icon={<IconEdit size={15} />}
                  size="small"
                  onClick={() => openEdit(record)}
                />
              </Tooltip>
              <Tooltip title={record.isActive ? "Deactivate" : "Activate"}>
                <Button
                  icon={record.isActive ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                  size="small"
                  onClick={() => toggleActive(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Delete this banner?"
                onConfirm={() => handleDelete(record._id)}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete">
                  <Button icon={<IconTrash size={15} />} size="small" danger />
                </Tooltip>
              </Popconfirm>
            </div>
          );
        },
      },
    ],
    [rowData, openEdit, toggleActive, handleDelete]
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hero Banner Slides
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your homepage hero carousel slides
          </p>
          {!loading && !loadError && (
            <p className="text-xs text-gray-400 mt-1">Total slides: {rowData.length}</p>
          )}
          {!!loadError && (
            <p className="text-xs text-red-500 mt-1">{loadError}</p>
          )}
        </div>
        <Space>
          <Button
            icon={<IconRefresh size={16} />}
            onClick={fetchBanners}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<IconPlus size={16} />}
            onClick={openCreate}
          >
            Add Slide
          </Button>
        </Space>
      </div>

      <Card>
        {isClient ? (
          <div style={{ width: "100%", height: 460 }}>
            <AgGridReact
              theme={themeQuartz}
              modules={[AllCommunityModule]}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={{ sortable: true, resizable: true }}
              getRowId={(params) => params.data._id}
              animateRows
              rowHeight={84}
              headerHeight={52}
              overlayNoRowsTemplate="No hero banners yet"
              loading={loading}
              suppressCellFocus
            />
          </div>
        ) : (
          <div className="h-[460px] flex items-center justify-center text-sm text-gray-500">
            Loading banners...
          </div>
        )}

        {!loading && rowData.length > 0 && (
          <div className="mt-3 rounded border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-500 mb-2">Fallback list:</p>
            <div className="space-y-1">
              {rowData.map((item) => (
                <div key={item._id} className="text-sm text-gray-700 dark:text-gray-300">
                  {item.title} ({item.isActive ? "Active" : "Inactive"})
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingBanner ? "Edit Hero Banner" : "Add Hero Banner"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={saving ? "Saving…" : "Save"}
        confirmLoading={saving}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          {/* Image Upload */}
          <Form.Item
            label="Slide Image"
            name="image"
            rules={[
              { required: true, message: "Please provide an image" },
              {
                validator: (_, value) => {
                  if (!value || isLikelyImageUrl(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Please provide a valid direct image URL")
                  );
                },
              },
            ]}
          >
            <div className="space-y-3">
              {previewImage && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Image URL"
                  value={form.getFieldValue("image") || ""}
                  onChange={(e) => {
                    form.setFieldValue("image", e.target.value);
                    setPreviewImage(e.target.value);
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  icon={
                    imageUploading ? <Spin size="small" /> : <IconPhoto size={15} />
                  }
                  loading={imageUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload
                </Button>
              </div>
            </div>
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item
              label="Title"
              name="title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input placeholder="e.g. NEW SEASON" />
            </Form.Item>

            <Form.Item label="Subtitle" name="subtitle">
              <Input placeholder="e.g. Women Collection 2026" />
            </Form.Item>

            <Form.Item label="Button Text" name="buttonText">
              <Input placeholder="SHOP NOW" />
            </Form.Item>

            <Form.Item label="Button Link" name="buttonLink">
              <Input placeholder="/product-list" />
            </Form.Item>

            <Form.Item label="Badge" name="badge">
              <Input placeholder="e.g. HOT, NEW, SALE" />
            </Form.Item>

            <Form.Item label="Discount Text" name="discountText">
              <Input placeholder="e.g. UP TO 50% OFF" />
            </Form.Item>

            <Form.Item label="Original Price (₹)" name="originalPrice">
              <InputNumber
                min={0}
                className="w-full"
                placeholder="e.g. 2999"
                prefix="₹"
              />
            </Form.Item>

            <Form.Item label="Sale Price (₹)" name="salePrice">
              <InputNumber
                min={0}
                className="w-full"
                placeholder="e.g. 1499"
                prefix="₹"
              />
            </Form.Item>

            <Form.Item label="Background Color" name="bgColor">
              <Input placeholder="e.g. #f3f4f6 or leave blank" />
            </Form.Item>

            <Form.Item label="Display Order" name="order">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="description">
            <TextArea
              rows={2}
              placeholder="Optional short description shown below the title"
            />
          </Form.Item>

          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
