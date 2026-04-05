"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  IconCamera,
  IconHome,
  IconMail,
  IconMapPin,
  IconPhone,
  IconShield,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const { Title, Text, Paragraph } = Typography;

const jsonHeaders = () => ({
  "Content-Type": "application/json",
});

function mapServerUser(u) {
  if (!u) return null;
  const id = u.id != null ? String(u.id) : u._id != null ? String(u._id) : "";
  return { ...u, _id: id, id };
}

function ProfileContent() {
  const { user, setUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const fileInputRef = useRef(null);
  const [accountForm] = Form.useForm();
  const [addressForm] = Form.useForm();

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/users/profile", {
        _skipGlobalToast: true,
      });
      if (data?.success && data.data?.user) {
        const mapped = mapServerUser(data.data.user);
        setUser((prev) => ({ ...prev, ...mapped }));
        accountForm.setFieldsValue({
          firstname: mapped.firstname || "",
          lastname: mapped.lastname || "",
          phone: mapped.phone || "",
          city: mapped.address?.city || "",
          state: mapped.address?.state || "",
          country: mapped.address?.country || "India",
          pincode: mapped.address?.pincode || "",
        });
      }
    } catch {
      /* keep cached user from auth */
    } finally {
      setProfileLoading(false);
    }
  }, [accountForm, setUser]);

  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const { data } = await axios.get("/api/users/addresses", {
        _skipGlobalToast: true,
      });
      if (data?.success && data.data?.addresses) {
        setAddresses(
          data.data.addresses.map((a) => ({
            ...a,
            id: String(a.id),
          }))
        );
      } else {
        setAddresses([]);
      }
    } catch {
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    if (!user || profileLoading) return;
    accountForm.setFieldsValue({
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      phone: user.phone || "",
      city: user.address?.city || "",
      state: user.address?.state || "",
      country: user.address?.country || "India",
      pincode: user.address?.pincode || "",
    });
  }, [user, profileLoading, accountForm]);

  const displayName = [user?.firstname, user?.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();

  const onSaveAccount = async (v) => {
    setSavingAccount(true);
    try {
      const { data } = await axios.put(
        "/api/users/profile",
        {
          firstname: v.firstname,
          lastname: v.lastname,
          phone: v.phone || null,
          address: {
            city: v.city || null,
            state: v.state || null,
            country: v.country || "India",
            pincode: v.pincode || null,
          },
        },
        { headers: jsonHeaders(), _skipGlobalToast: true }
      );
      if (data?.success && data.data?.user) {
        const mapped = mapServerUser(data.data.user);
        setUser((prev) => ({ ...prev, ...mapped }));
        message.success("Profile saved");
      }
    } catch (e) {
      message.error(
        e?.response?.data?.message || "Could not save profile"
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const onPickPhoto = () => fileInputRef.current?.click();

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("Image must be under 5MB");
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "fluxfit/profiles");
      const up = await axios.post("/api/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        _skipGlobalToast: true,
      });
      const url = up.data?.data?.url;
      if (!url) throw new Error("No image URL");
      const { data } = await axios.put(
        "/api/users/profile",
        { profileimage: url },
        { headers: jsonHeaders(), _skipGlobalToast: true }
      );
      if (data?.success && data.data?.user) {
        const mapped = mapServerUser(data.data.user);
        setUser((prev) => ({ ...prev, ...mapped }));
        message.success("Profile photo updated");
      }
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Could not update photo"
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openNewAddress = () => {
    setEditingAddress(null);
    addressForm.resetFields();
    addressForm.setFieldsValue({
      type: "home",
      country: "India",
      isDefault: addresses.length === 0,
    });
    setAddressModalOpen(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    addressForm.setFieldsValue({
      name: addr.name,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      country: addr.country || "India",
      pincode: addr.pincode,
      type: addr.type || "home",
      landmark: addr.landmark || "",
      isDefault: addr.isDefault,
    });
    setAddressModalOpen(true);
  };

  const saveAddress = async () => {
    let v;
    try {
      v = await addressForm.validateFields();
    } catch (e) {
      if (e?.errorFields) return Promise.reject(e);
      return Promise.reject(e);
    }
    setSavingAddress(true);
    try {
      const payload = {
        name: v.name,
        phone: v.phone,
        addressLine1: v.addressLine1,
        addressLine2: v.addressLine2 || "",
        city: v.city,
        state: v.state,
        country: v.country || "India",
        pincode: v.pincode,
        type: v.type || "home",
        landmark: v.landmark || "",
        isDefault: Boolean(v.isDefault),
      };
      if (editingAddress) {
        await axios.put(
          `/api/users/addresses/${editingAddress.id}`,
          payload,
          { headers: jsonHeaders(), _skipGlobalToast: true }
        );
        message.success("Address updated");
      } else {
        await axios.post("/api/users/addresses", payload, {
          headers: jsonHeaders(),
          _skipGlobalToast: true,
        });
        message.success("Address added");
      }
      setAddressModalOpen(false);
      await loadAddresses();
    } catch (e) {
      message.error(
        e?.response?.data?.message || "Could not save address"
      );
      return Promise.reject(e);
    } finally {
      setSavingAddress(false);
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      await axios.put(
        `/api/users/addresses/${id}/default`,
        {},
        { headers: jsonHeaders(), _skipGlobalToast: true }
      );
      message.success("Default address updated");
      await loadAddresses();
    } catch (e) {
      message.error(
        e?.response?.data?.message || "Could not set default"
      );
    }
  };

  const deleteAddress = (addr) => {
    Modal.confirm({
      title: "Remove this address?",
      content: "You can add it again later from your profile.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await axios.delete(`/api/users/addresses/${addr.id}`, {
            headers: jsonHeaders(),
            _skipGlobalToast: true,
          });
          message.success("Address removed");
          await loadAddresses();
        } catch (e) {
          message.error(
            e?.response?.data?.message || "Could not delete address"
          );
        }
      },
    });
  };

  const roleTag =
    user?.role === "admin" ? (
      <Tag color="purple">
        <span className="inline-flex items-center gap-1">
          <IconShield className="w-3 h-3" />
          Admin
        </span>
      </Tag>
    ) : (
      <Tag color="blue">Buyer</Tag>
    );

  const tabItems = [
    {
      key: "account",
      label: (
        <span className="flex items-center gap-2">
          <IconUser className="w-4 h-4" />
          Account
        </span>
      ),
      children: (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-5"
          >
            <Card
              title="Photo & identity"
              className="dark:bg-neutral-900 dark:border-neutral-800 h-full"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative group">
                  <Spin spinning={uploadingPhoto}>
                    <Avatar
                      size={120}
                      src={user?.profileimage || undefined}
                      icon={
                        !user?.profileimage ? (
                          <IconUser className="h-14 w-14 opacity-80" />
                        ) : undefined
                      }
                      className="border-2 border-neutral-200 dark:border-neutral-700"
                    />
                  </Spin>
                  <button
                    type="button"
                    onClick={onPickPhoto}
                    disabled={uploadingPhoto}
                    className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/75 disabled:opacity-50"
                    aria-label="Change profile photo"
                  >
                    <IconCamera className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPhotoChange}
                  />
                </div>
                <div>
                  <Title level={4} className="!mb-1 dark:!text-white">
                    {displayName || user?.username || "Member"}
                  </Title>
                  <Space wrap className="justify-center">
                    {roleTag}
                    {user?.isverified ? (
                      <Tag color="success">Verified email</Tag>
                    ) : (
                      <Tag color="warning">Email not verified</Tag>
                    )}
                  </Space>
                </div>
                <div className="w-full space-y-2 text-left text-sm rounded-lg bg-neutral-50 dark:bg-neutral-800/60 p-4">
                  <div className="flex items-start gap-2 text-neutral-600 dark:text-neutral-300">
                    <IconMail className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="break-all">{user?.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                    <IconUser className="w-4 h-4 shrink-0" />
                    <span>@{user?.username || "—"}</span>
                  </div>
                  {user?.createdAt && (
                    <Text type="secondary" className="text-xs">
                      Member since{" "}
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  )}
                </div>
                <Paragraph type="secondary" className="!mb-0 text-xs">
                  Hover the photo and tap the camera to upload. Max 5MB.
                </Paragraph>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-7"
          >
            <Card
              title="Edit details"
              extra={
                <Link
                  href="/orders"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View orders →
                </Link>
              }
              className="dark:bg-neutral-900 dark:border-neutral-800"
            >
              <Spin spinning={profileLoading}>
                <Form
                  form={accountForm}
                  layout="vertical"
                  requiredMark={false}
                  className="max-w-xl"
                  onFinish={onSaveAccount}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Form.Item
                      name="firstname"
                      label="First name"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="First name" />
                    </Form.Item>
                    <Form.Item
                      name="lastname"
                      label="Last name"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Last name" />
                    </Form.Item>
                  </div>
                  <Form.Item name="phone" label="Phone">
                    <Input
                      placeholder="+91 …"
                      prefix={<IconPhone className="w-4 h-4 text-neutral-400" />}
                    />
                  </Form.Item>
                  <Title level={5} className="!mt-2 !mb-3 dark:!text-white">
                    Location on account
                  </Title>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Form.Item name="city" label="City">
                      <Input placeholder="City" />
                    </Form.Item>
                    <Form.Item name="state" label="State">
                      <Input placeholder="State" />
                    </Form.Item>
                    <Form.Item name="country" label="Country">
                      <Input placeholder="Country" />
                    </Form.Item>
                    <Form.Item name="pincode" label="Pincode">
                      <Input placeholder="Pincode" maxLength={10} />
                    </Form.Item>
                  </div>
                  <Form.Item className="!mb-0">
                    <Button type="primary" htmlType="submit" loading={savingAccount}>
                      Save changes
                    </Button>
                  </Form.Item>
                </Form>
              </Spin>
            </Card>
          </motion.div>
        </div>
      ),
    },
    {
      key: "addresses",
      label: (
        <span className="flex items-center gap-2">
          <IconMapPin className="w-4 h-4" />
          Saved addresses
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <Title level={5} className="!mb-0 dark:!text-white">
                Delivery addresses
              </Title>
              <Text type="secondary" className="text-sm">
                Add, edit, or remove addresses for checkout.
              </Text>
            </div>
            <Button type="primary" onClick={openNewAddress}>
              Add address
            </Button>
          </div>
          <Spin spinning={addressesLoading}>
            {addresses.length === 0 ? (
              <Empty
                description="No saved addresses yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={openNewAddress}>
                  Add your first address
                </Button>
              </Empty>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <motion.div
                    key={addr.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card
                      className="h-full dark:bg-neutral-900 dark:border-neutral-800 hover:border-blue-400/40 transition-colors"
                      title={
                        <Space>
                          <IconHome className="w-4 h-4" />
                          <span>{addr.name}</span>
                          {addr.isDefault && <Tag color="green">Default</Tag>}
                          <Tag>{addr.type}</Tag>
                        </Space>
                      }
                      actions={[
                        <Button
                          key="def"
                          type="link"
                          size="small"
                          disabled={addr.isDefault}
                          onClick={() => setDefaultAddress(addr.id)}
                        >
                          Set default
                        </Button>,
                        <Button
                          key="edit"
                          type="link"
                          size="small"
                          onClick={() => openEditAddress(addr)}
                        >
                          Edit
                        </Button>,
                        <Button
                          key="del"
                          type="link"
                          size="small"
                          danger
                          icon={<IconTrash className="w-4 h-4" />}
                          onClick={() => deleteAddress(addr)}
                        >
                          Remove
                        </Button>,
                      ]}
                    >
                      <Paragraph className="!mb-1 whitespace-pre-wrap dark:!text-neutral-200">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `\n${addr.addressLine2}` : ""}
                      </Paragraph>
                      <Text type="secondary" className="text-sm">
                        {addr.city}, {addr.state} {addr.pincode}
                      </Text>
                      <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <IconPhone className="inline w-4 h-4 mr-1 align-text-bottom" />
                        {addr.phone}
                      </div>
                      {addr.landmark ? (
                        <Text type="secondary" className="text-xs block mt-1">
                          Near: {addr.landmark}
                        </Text>
                      ) : null}
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </Spin>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <Title level={2} className="!mb-1 dark:!text-white">
              My profile
            </Title>
            <Text type="secondary">
              Manage your account, photo, and delivery addresses.
            </Text>
          </div>
        </div>

        <Tabs
          defaultActiveKey="account"
          items={tabItems}
          className="profile-tabs [&_.ant-tabs-nav]:mb-6"
          size="large"
        />

        <Modal
          title={editingAddress ? "Edit address" : "New address"}
          open={addressModalOpen}
          onCancel={() => setAddressModalOpen(false)}
          onOk={saveAddress}
          confirmLoading={savingAddress}
          okText={editingAddress ? "Save" : "Add"}
          width={560}
          destroyOnHidden
        >
          <Form form={addressForm} layout="vertical" requiredMark={false}>
            <Form.Item
              name="name"
              label="Full name"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Name on the label" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Contact phone" />
            </Form.Item>
            <Form.Item
              name="addressLine1"
              label="Address line 1"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Street, building, flat" />
            </Form.Item>
            <Form.Item name="addressLine2" label="Address line 2">
              <Input placeholder="Optional" />
            </Form.Item>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="country" label="Country">
                <Input />
              </Form.Item>
              <Form.Item
                name="pincode"
                label="Pincode"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input maxLength={10} />
              </Form.Item>
            </div>
            <Form.Item name="type" label="Type">
              <Select
                options={[
                  { value: "home", label: "Home" },
                  { value: "work", label: "Work" },
                  { value: "other", label: "Other" },
                ]}
              />
            </Form.Item>
            <Form.Item name="landmark" label="Landmark">
              <Input placeholder="Optional" />
            </Form.Item>
            <Form.Item
              name="isDefault"
              label="Default for delivery"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
