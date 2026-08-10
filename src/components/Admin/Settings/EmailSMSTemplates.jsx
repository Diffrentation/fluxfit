"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Form,
  Input,
  Button,
  Tabs,
  Select,
  Switch,
  message,
  Modal,
  Tag,
  Popconfirm,
} from "antd";
import { IconPlus, IconEdit, IconTrash, IconMail, IconMessage } from "@tabler/icons-react";
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

const { TextArea } = Input;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Which {{variable}} keys each template type is actually substituted with —
// pulled straight from the renderEmailTemplate()/SMSTemplate.findOne() call
// sites in lib/email.js and lib/sms.js, so this can't drift out of sync
// with what really gets sent. Types with an empty list aren't consumed by
// any automatic send yet (available for manual/future use).
const EMAIL_TYPE_INFO = {
  "welcome": { label: "Welcome Email", vars: ["firstname", "lastname", "email"], usedBy: "sendWelcomeEmail() — sent after email verification" },
  "order-confirmation": { label: "Order Confirmation", vars: ["customerName", "orderId", "orderDate", "totalAmount"], usedBy: "sendOrderConfirmationEmail() — sent after order creation" },
  "order-shipped": { label: "Order Shipped", vars: ["orderId", "status", "customerName", "note"], usedBy: "sendOrderStatusUpdateEmail() — sent when admin marks an order shipped" },
  "order-delivered": { label: "Order Delivered", vars: ["orderId", "status", "customerName", "note"], usedBy: "sendOrderStatusUpdateEmail() — sent when admin marks an order delivered" },
  "order-cancelled": { label: "Order Cancelled", vars: ["orderId", "status", "customerName", "note"], usedBy: "sendOrderStatusUpdateEmail() — sent when admin cancels an order" },
  "password-reset": { label: "Password Reset (OTP)", vars: ["otp", "otpExpiryMinutes"], usedBy: "sendOTPEmail() — self-service forgot-password OTP" },
  "admin-password-reset": { label: "Admin Password Reset", vars: ["newPassword", "firstname"], usedBy: "sendAdminPasswordResetEmail() — admin sets a user's password directly" },
  "email-verification": { label: "Email Verification (OTP)", vars: ["otp", "otpExpiryMinutes"], usedBy: "sendOTPEmail() — signup verification OTP" },
  "payment-success": { label: "Payment Success", vars: [], usedBy: null },
  "payment-failed": { label: "Payment Failed", vars: [], usedBy: null },
  "refund-processed": { label: "Refund Processed", vars: [], usedBy: null },
  "newsletter": { label: "Newsletter", vars: [], usedBy: null },
  "custom": { label: "Custom", vars: [], usedBy: null },
};

const SMS_TYPE_INFO = {
  "otp": { label: "OTP", vars: ["otp", "otpExpiryMinutes"], usedBy: "sendOTPSMS() — login/verification OTP" },
  "order-confirmation": { label: "Order Confirmation", vars: [], usedBy: null },
  "order-shipped": { label: "Order Shipped", vars: [], usedBy: null },
  "order-delivered": { label: "Order Delivered", vars: [], usedBy: null },
  "payment-success": { label: "Payment Success", vars: [], usedBy: null },
  "payment-failed": { label: "Payment Failed", vars: [], usedBy: null },
  "custom": { label: "Custom", vars: [], usedBy: null },
};

function VariablesHint({ typeInfo }) {
  if (!typeInfo) return null;
  return (
    <div className="mt-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
      {typeInfo.vars.length > 0 ? (
        <>
          <div className="text-zinc-400 mb-1.5">Variables substituted for this type:</div>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {typeInfo.vars.map((v) => (
              <code key={v} className="px-1.5 py-0.5 bg-zinc-800 text-emerald-400 rounded">
                {`{{${v}}}`}
              </code>
            ))}
          </div>
        </>
      ) : (
        <div className="text-amber-400 mb-1">No variables — this type isn&apos;t wired to any automatic send yet.</div>
      )}
      {typeInfo.usedBy && <div className="text-zinc-500">{typeInfo.usedBy}</div>}
    </div>
  );
}

const EmailSMSTemplates = () => {
  const [activeTab, setActiveTab] = useState("email");
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState("email"); // "email" | "sms"
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const selectedType = Form.useWatch("type", form);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emailRes, smsRes] = await Promise.allSettled([
        axios.get("/api/admin/settings/email-templates", { headers: authHeaders() }),
        axios.get("/api/admin/settings/sms-templates", { headers: authHeaders() }),
      ]);
      if (emailRes.status === "fulfilled" && emailRes.value.data?.success) {
        setEmailTemplates(emailRes.value.data.data.templates || []);
      }
      if (smsRes.status === "fulfilled" && smsRes.value.data?.success) {
        setSmsTemplates(smsRes.value.data.data.templates || []);
      }
    } catch (error) {
      console.error("Load templates error:", error);
      message.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    load();
  }, [load]);

  const openCreate = (kind) => {
    setModalKind(kind);
    setEditingTemplate(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const openEdit = (kind, record) => {
    setModalKind(kind);
    setEditingTemplate(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      subject: record.subject,
      body: record.body,
      message: record.message,
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = async (kind, record) => {
    const path = kind === "email" ? "email-templates" : "sms-templates";
    try {
      const { data } = await axios.delete(`/api/admin/settings/${path}/${record.id}`, {
        headers: authHeaders(),
      });
      if (!data?.success) throw new Error(data?.message);
      message.success("Template deleted");
      load();
    } catch (error) {
      message.error(error.response?.data?.message || error.message || "Delete failed");
    }
  };

  const handleSubmit = async (values) => {
    const path = modalKind === "email" ? "email-templates" : "sms-templates";
    setSaving(true);
    try {
      const payload =
        modalKind === "email"
          ? {
              name: values.name,
              subject: values.subject,
              body: values.body,
              type: values.type,
              isActive: values.isActive,
            }
          : {
              name: values.name,
              message: values.message,
              type: values.type,
              isActive: values.isActive,
            };

      const { data } = editingTemplate
        ? await axios.put(`/api/admin/settings/${path}/${editingTemplate.id}`, payload, {
            headers: authHeaders(),
          })
        : await axios.post(`/api/admin/settings/${path}`, payload, {
            headers: authHeaders(),
          });

      if (!data?.success) throw new Error(data?.message);
      message.success(editingTemplate ? "Template updated" : "Template created");
      setModalOpen(false);
      load();
    } catch (error) {
      message.error(error.response?.data?.message || error.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const emailColumnDefs = useMemo(
    () => [
      { headerName: "Name", field: "name", flex: 1, minWidth: 160 },
      {
        headerName: "Type",
        field: "type",
        width: 190,
        valueFormatter: (p) => EMAIL_TYPE_INFO[p.value]?.label || p.value,
      },
      { headerName: "Subject", field: "subject", flex: 1.4, minWidth: 200 },
      {
        headerName: "Active",
        field: "isActive",
        width: 100,
        cellRenderer: (p) => (
          <Tag color={p.value ? "green" : "default"}>{p.value ? "Active" : "Inactive"}</Tag>
        ),
      },
      {
        headerName: "Actions",
        width: 110,
        pinned: "right",
        cellRenderer: (p) => (
          <div className="h-full flex items-center gap-1">
            <Button
              type="text"
              size="small"
              icon={<IconEdit className="w-4 h-4" />}
              onClick={() => openEdit("email", p.data)}
            />
            <Popconfirm
              title="Delete this email template?"
              onConfirm={() => handleDelete("email", p.data)}
            >
              <Button type="text" danger size="small" icon={<IconTrash className="w-4 h-4" />} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [emailTemplates]
  );

  const smsColumnDefs = useMemo(
    () => [
      { headerName: "Name", field: "name", flex: 1, minWidth: 160 },
      {
        headerName: "Type",
        field: "type",
        width: 190,
        valueFormatter: (p) => SMS_TYPE_INFO[p.value]?.label || p.value,
      },
      { headerName: "Message", field: "message", flex: 1.6, minWidth: 220 },
      {
        headerName: "Active",
        field: "isActive",
        width: 100,
        cellRenderer: (p) => (
          <Tag color={p.value ? "green" : "default"}>{p.value ? "Active" : "Inactive"}</Tag>
        ),
      },
      {
        headerName: "Actions",
        width: 110,
        pinned: "right",
        cellRenderer: (p) => (
          <div className="h-full flex items-center gap-1">
            <Button
              type="text"
              size="small"
              icon={<IconEdit className="w-4 h-4" />}
              onClick={() => openEdit("sms", p.data)}
            />
            <Popconfirm
              title="Delete this SMS template?"
              onConfirm={() => handleDelete("sms", p.data)}
            >
              <Button type="text" danger size="small" icon={<IconTrash className="w-4 h-4" />} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [smsTemplates]
  );

  const typeOptions =
    modalKind === "email"
      ? Object.entries(EMAIL_TYPE_INFO).map(([value, info]) => ({ value, label: info.label }))
      : Object.entries(SMS_TYPE_INFO).map(([value, info]) => ({ value, label: info.label }));

  const activeTypeInfo =
    selectedType && (modalKind === "email" ? EMAIL_TYPE_INFO[selectedType] : SMS_TYPE_INFO[selectedType]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 sm:space-y-4">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "email",
            label: (
              <span className="flex items-center gap-2 text-xs sm:text-sm">
                <IconMail className="w-4 h-4" />
                <span className="hidden sm:inline">Email Templates</span>
                <span className="sm:hidden">Email</span>
              </span>
            ),
            children: (
              <Card
                title={`Email Templates (${emailTemplates.length})`}
                extra={
                  <Button type="primary" icon={<IconPlus className="w-4 h-4" />} onClick={() => openCreate("email")}>
                    New Template
                  </Button>
                }
              >
                {isClient ? (
                  <div style={{ width: "100%", height: 460 }}>
                    <AgGridReact
                      theme={myDarkTheme}
                      modules={[AllCommunityModule]}
                      rowData={emailTemplates}
                      columnDefs={emailColumnDefs}
                      defaultColDef={{ sortable: true, resizable: true }}
                      getRowId={(p) => p.data.id}
                      animateRows
                      rowHeight={52}
                      headerHeight={44}
                      loading={loading}
                      suppressCellFocus
                      overlayNoRowsTemplate="No email templates yet — create one to override the default hardcoded copy."
                    />
                  </div>
                ) : (
                  <div className="h-[460px]" />
                )}
              </Card>
            ),
          },
          {
            key: "sms",
            label: (
              <span className="flex items-center gap-2 text-xs sm:text-sm">
                <IconMessage className="w-4 h-4" />
                <span className="hidden sm:inline">SMS Templates</span>
                <span className="sm:hidden">SMS</span>
              </span>
            ),
            children: (
              <Card
                title={`SMS Templates (${smsTemplates.length})`}
                extra={
                  <Button type="primary" icon={<IconPlus className="w-4 h-4" />} onClick={() => openCreate("sms")}>
                    New Template
                  </Button>
                }
              >
                {isClient ? (
                  <div style={{ width: "100%", height: 460 }}>
                    <AgGridReact
                      theme={myDarkTheme}
                      modules={[AllCommunityModule]}
                      rowData={smsTemplates}
                      columnDefs={smsColumnDefs}
                      defaultColDef={{ sortable: true, resizable: true }}
                      getRowId={(p) => p.data.id}
                      animateRows
                      rowHeight={52}
                      headerHeight={44}
                      loading={loading}
                      suppressCellFocus
                      overlayNoRowsTemplate="No SMS templates yet — create one to override the default hardcoded copy."
                    />
                  </div>
                ) : (
                  <div className="h-[460px]" />
                )}
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={`${editingTemplate ? "Edit" : "New"} ${modalKind === "email" ? "Email" : "SMS"} Template`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
          <Form.Item
            name="name"
            label="Template Name (unique)"
            rules={[{ required: true, message: "Please enter a unique name" }]}
          >
            <Input placeholder="e.g. Default Welcome Email" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: "Please select a type" }]}>
            <Select options={typeOptions} placeholder="Select template type" />
          </Form.Item>
          {modalKind === "email" ? (
            <>
              <Form.Item
                name="subject"
                label="Subject"
                rules={[{ required: true, message: "Please enter the email subject" }]}
              >
                <Input placeholder="e.g. Welcome to FluxFit, {{firstname}}!" />
              </Form.Item>
              <Form.Item
                name="body"
                label="Body (HTML or plain text)"
                rules={[{ required: true, message: "Please enter the email body" }]}
              >
                <TextArea rows={8} placeholder="Enter email template..." />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="message"
              label="Message"
              rules={[{ required: true, message: "Please enter the SMS message" }]}
              help="Maximum 160 characters"
            >
              <TextArea rows={4} maxLength={160} showCount placeholder="Enter SMS template..." />
            </Form.Item>
          )}
          <VariablesHint typeInfo={activeTypeInfo} />
          <Form.Item name="isActive" label="Active" valuePropName="checked" className="mt-4">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default EmailSMSTemplates;
