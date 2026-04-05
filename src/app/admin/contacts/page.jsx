"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Button,
  Empty,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from "antd";
import { IconBrandWhatsapp, IconMail } from "@tabler/icons-react";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminContent from "@/components/Admin/AdminContent";

const { Option } = Select;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function digitsOnlyPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  const d = phone.replace(/\D/g, "");
  return d.length >= 8 ? d : "";
}

function buildMailto(email, subject, body) {
  const q = new URLSearchParams();
  if (subject) q.set("subject", subject);
  if (body) q.set("body", body);
  const qs = q.toString();
  return `mailto:${email}${qs ? `?${qs}` : ""}`;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });
  const [actionId, setActionId] = useState(null);

  const statusParam = statusFilter === "all" ? undefined : statusFilter;

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/contacts", {
        params: {
          page,
          limit,
          status: statusParam,
        },
        headers: getAuthHeaders(),
      });
      if (data?.success && data.data) {
        setContacts(data.data.contacts || []);
        setPagination(data.data.pagination || { total: 0, totalPages: 1 });
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error("Admin contacts fetch:", error);
      message.error(error?.response?.data?.message || "Failed to load queries");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [limit, page, statusParam]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const tableRows = useMemo(
    () => contacts.map((c) => ({ ...c, key: c.id })),
    [contacts]
  );

  const openWhatsApp = useCallback((row) => {
    const wa = digitsOnlyPhone(row.phone);
    if (!wa) {
      message.warning("No valid phone number on this query.");
      return;
    }
    const text = `Hi ${row.name},\n\nRe: ${row.subject}\n\n---\n${row.message}`;
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const openEmail = useCallback((row) => {
    const subj = `Re: ${row.subject} — FluxFit`;
    const body = `Hi ${row.name},\n\nRegarding your message:\n\n"${row.message}"\n\n`;
    window.location.href = buildMailto(row.email, subj, body);
  }, []);

  const markResolved = useCallback(
    async (id) => {
      try {
        setActionId(id);
        await axios.put(
          `/api/admin/contacts/${id}/resolve`,
          {},
          { headers: getAuthHeaders() }
        );
        message.success("Marked as resolved");
        await fetchContacts();
        window.dispatchEvent(new Event("ff-admin-contacts-changed"));
      } catch (error) {
        message.error(
          error?.response?.data?.message || "Could not update status"
        );
      } finally {
        setActionId(null);
      }
    },
    [fetchContacts]
  );

  const deleteQuery = useCallback(
    (row) => {
      Modal.confirm({
        title: "Delete this query?",
        content: "This removes the message from your inbox permanently.",
        okText: "Delete",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            setActionId(row.id);
            await axios.delete(`/api/admin/contacts/${row.id}`, {
              headers: getAuthHeaders(),
            });
            message.success("Query removed");
            await fetchContacts();
            window.dispatchEvent(new Event("ff-admin-contacts-changed"));
          } catch (error) {
            message.error(
              error?.response?.data?.message || "Could not delete"
            );
          } finally {
            setActionId(null);
          }
        },
      });
    },
    [fetchContacts]
  );

  const columns = useMemo(
    () => [
      {
        title: "From",
        key: "from",
        width: 200,
        render: (_, row) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {row.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
              {row.email}
            </div>
            {row.phone ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {row.phone}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: "Subject",
        dataIndex: "subject",
        key: "subject",
        width: 220,
        render: (t) => (
          <div className="max-w-[220px] whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 leading-snug">
            {t}
          </div>
        ),
      },
      {
        title: "Message",
        dataIndex: "message",
        key: "message",
        width: 420,
        render: (t) => (
          <div
            className="max-h-64 min-h-10 w-full max-w-[420px] overflow-y-auto overflow-x-hidden whitespace-pre-wrap wrap-anywhere text-sm leading-relaxed text-gray-700 dark:text-gray-200"
            tabIndex={0}
          >
            {t}
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (s) =>
          s === "pending" ? (
            <Tag color="orange">Pending</Tag>
          ) : (
            <Tag color="green">Resolved</Tag>
          ),
      },
      {
        title: "Received",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 120,
        render: (d) =>
          d ? new Date(d).toLocaleString(undefined, { dateStyle: "short" }) : "—",
      },
      {
        title: "Actions",
        key: "actions",
        width: 320,
        fixed: "right",
        render: (_, row) => (
          <Space wrap size="small">
            <Button
              size="small"
              type="primary"
              icon={<IconBrandWhatsapp className="w-4 h-4" />}
              onClick={() => openWhatsApp(row)}
              disabled={!digitsOnlyPhone(row.phone)}
            >
              WhatsApp
            </Button>
            <Button
              size="small"
              icon={<IconMail className="w-4 h-4" />}
              onClick={() => openEmail(row)}
            >
              Email
            </Button>
            {row.status === "pending" ? (
              <Button
                size="small"
                loading={actionId === row.id}
                onClick={() => markResolved(row.id)}
              >
                Resolve
              </Button>
            ) : null}
            <Button
              size="small"
              danger
              loading={actionId === row.id}
              onClick={() => deleteQuery(row)}
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ],
    [actionId, deleteQuery, markResolved, openEmail, openWhatsApp]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        <AdminSidebar activeItem="contacts" />
        <AdminContent className="pt-16 sm:pt-20 lg:pt-16">
          <div className="p-3 sm:p-4 md:p-6 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Support inbox
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  Contact form submissions. Pending items are highlighted.
                </p>
              </div>
              <Space wrap>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Filter:
                </span>
                <Select
                  value={statusFilter}
                  onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                  style={{ width: 160 }}
                >
                  <Option value="all">All</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="resolved">Resolved</Option>
                </Select>
              </Space>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Spin spinning={loading}>
                <Table
                  className="[&_.ant-table-cell]:align-top"
                  columns={columns}
                  dataSource={tableRows}
                  pagination={{
                    current: page,
                    pageSize: limit,
                    total: pagination.total,
                    showSizeChanger: false,
                    onChange: (p) => setPage(p),
                  }}
                  scroll={{ x: 1320 }}
                  tableLayout="fixed"
                  locale={{
                    emptyText: loading ? (
                      <span />
                    ) : (
                      <Empty description="No contact queries yet" />
                    ),
                  }}
                  rowClassName={(record) =>
                    record.status === "pending"
                      ? "bg-amber-50/80 dark:bg-amber-950/25"
                      : ""
                  }
                />
              </Spin>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Tip: WhatsApp needs a phone number with enough digits; email always
              uses the submitter&apos;s address.{" "}
              <Link href="/contact" className="text-blue-600 dark:text-blue-400">
                View public contact page
              </Link>
            </p>
          </div>
        </AdminContent>
      </div>
    </div>
  );
}
