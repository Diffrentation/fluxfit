"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Button, Input, Switch, Table, message, Upload } from "antd";
import { IconUpload, IconSparkles, IconTrash } from "@tabler/icons-react";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminContent from "@/components/Admin/AdminContent";

const readToken = () => {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  const t = String(raw).trim();
  if (!t || t === "undefined" || t === "null") return null;
  return t;
};

export default function CustomClothesDesignsAdminPage() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const authHeaders = useCallback(() => {
    const token = readToken();
    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  }, []);

  const load = useCallback(async () => {
    const token = readToken();
    if (!token) {
      setDesigns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/custom-clothes-designs", {
        headers: { ...authHeaders() },
      });
      if (!data?.success) throw new Error(data?.message || "Load failed");
      setDesigns(data.data?.designs ?? []);
    } catch (e) {
      message.error(e.response?.data?.message || e.message || "Failed to load");
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSeed = async () => {
    const token = readToken();
    if (!token) {
      message.error("Please log in as admin.");
      return;
    }
    setSeeding(true);
    try {
      const { data } = await axios.post(
        "/api/admin/custom-clothes-designs/seed",
        {},
        { headers: { ...authHeaders() } }
      );
      if (!data?.success) throw new Error(data?.message || "Seed failed");
      message.success(data.message);
      await load();
    } catch (e) {
      message.error(e.response?.data?.message || e.message || "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  const beforeUpload = async (file) => {
    const token = readToken();
    if (!token) {
      message.error("Please log in as admin.");
      return Upload.LIST_IGNORE;
    }
    if (!file.type?.startsWith("image/")) {
      message.error("Please choose an image file.");
      return Upload.LIST_IGNORE;
    }
    const label = name.trim() || file.name.replace(/\.[^.]+$/, "");
    if (!label) {
      message.error("Enter a display name for this design.");
      return Upload.LIST_IGNORE;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "fluxfit/custom-clothes-designs");

      const up = await axios.post("/api/upload/image", formData, {
        headers: {
          ...authHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      if (!up.data?.success || !up.data?.data?.url) {
        throw new Error(up.data?.message || "Upload failed");
      }

      const create = await axios.post(
        "/api/admin/custom-clothes-designs",
        {
          name: label,
          imageUrl: up.data.data.url,
          description: "",
        },
        { headers: { ...authHeaders(), "Content-Type": "application/json" } }
      );

      if (!create.data?.success) {
        throw new Error(create.data?.message || "Save failed");
      }

      message.success("Design added to the Custom Clothes catalog.");
      setName("");
      await load();
    } catch (e) {
      message.error(
        e.response?.data?.message || e.message || "Upload failed"
      );
    } finally {
      setUploading(false);
    }

    return Upload.LIST_IGNORE;
  };

  const toggleActive = async (record, next) => {
    try {
      const { data } = await axios.patch(
        `/api/admin/custom-clothes-designs/${record.id}`,
        { active: next },
        { headers: { ...authHeaders(), "Content-Type": "application/json" } }
      );
      if (!data?.success) throw new Error(data?.message || "Update failed");
      await load();
    } catch (e) {
      message.error(e.response?.data?.message || e.message || "Update failed");
    }
  };

  const remove = async (record) => {
    try {
      const { data } = await axios.delete(
        `/api/admin/custom-clothes-designs/${record.id}`,
        { headers: { ...authHeaders() } }
      );
      if (!data?.success) throw new Error(data?.message || "Delete failed");
      message.success("Removed.");
      await load();
    } catch (e) {
      message.error(e.response?.data?.message || e.message || "Delete failed");
    }
  };

  const columns = [
    {
      title: "Preview",
      dataIndex: "imageUrl",
      width: 88,
      render: (url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-14 w-14 rounded-lg border border-neutral-200 object-contain bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
        />
      ),
    },
    { title: "Name", dataIndex: "name", ellipsis: true },
    {
      title: "Type",
      dataIndex: "kind",
      width: 90,
      render: (k) => (
        <span className="text-xs uppercase text-neutral-500">
          {k === "seed" ? "Demo" : "Upload"}
        </span>
      ),
    },
    {
      title: "Active",
      dataIndex: "active",
      width: 100,
      render: (active, record) => (
        <Switch checked={active} onChange={(v) => toggleActive(record, v)} />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 72,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<IconTrash className="h-4 w-4" />}
          onClick={() => remove(record)}
          aria-label="Delete design"
        />
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar activeItem="custom-clothes-designs" />
      <AdminContent>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Custom clothes prints
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Upload images that appear only in the Custom Clothes designer (not
            the main shop). Use{" "}
            <span className="font-medium text-gray-800 dark:text-gray-200">
              Load 10 demo characters
            </span>{" "}
            once to seed bundled SVG mascots, or add your own via Cloudinary
            upload.
          </p>

          <div className="mt-8 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="min-w-[200px] flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Display name
              </label>
              <Input
                className="mt-1"
                placeholder="e.g. Team mascot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
              />
            </div>
            <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
              <Button
                type="primary"
                icon={<IconUpload className="h-4 w-4" />}
                loading={uploading}
                disabled={uploading}
              >
                Upload image
              </Button>
            </Upload>
            <Button
              icon={<IconSparkles className="h-4 w-4" />}
              loading={seeding}
              onClick={handleSeed}
            >
              Load 10 demo characters
            </Button>
          </div>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <Table
              rowKey="id"
              loading={loading}
              dataSource={designs}
              columns={columns}
              pagination={{ pageSize: 12 }}
              locale={{
                emptyText:
                  "No designs yet. Seed demos or upload an image (log in as admin).",
              }}
            />
          </div>
        </motion.div>
      </AdminContent>
    </div>
  );
}
