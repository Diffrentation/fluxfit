"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Button,
  Card,
  Empty,
  message,
  Modal,
  Pagination,
  Select,
  Spin,
  Table,
  Tag,
} from "antd";
import { IconBrandWhatsapp, IconMail } from "@tabler/icons-react";
import AdminContent from "@/components/Admin/AdminContent";

const { Option } = Select;

const CONTACT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "spam", label: "Spam" },
];

const CONTACT_STATUS_VALUES = CONTACT_STATUS_OPTIONS.map((o) => o.value);

function normalizeContactStatus(s) {
  if (s === "resolved") return "approved";
  return s;
}

function statusTag(s) {
  const v = normalizeContactStatus(s);
  switch (v) {
    case "pending":
      return <Tag color="orange">Pending</Tag>;
    case "approved":
      return <Tag color="green">Approved</Tag>;
    case "rejected":
      return <Tag color="red">Rejected</Tag>;
    case "spam":
      return <Tag color="default">Spam</Tag>;
    default:
      return <Tag>{String(s)}</Tag>;
  }
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const jsonAuthHeaders = () => ({
  ...getAuthHeaders(),
  "Content-Type": "application/json",
});

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

function formatReceived(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
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

  const updateContactStatus = useCallback(
    async (id, nextStatus) => {
      try {
        setActionId(id);
        await axios.put(
          `/api/admin/contacts/${id}`,
          { status: nextStatus },
          { headers: jsonAuthHeaders(), _skipGlobalToast: true }
        );
        message.success("Status updated");
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
              headers: jsonAuthHeaders(),
              _skipGlobalToast: true,
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

  const renderActionBlock = useCallback(
    (row, compact) => {
      const normalized = normalizeContactStatus(row.status);
      const current = CONTACT_STATUS_VALUES.includes(normalized)
        ? normalized
        : "pending";
      return (
        <div
          className={
            compact
              ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
              : "flex flex-wrap items-center gap-2"
          }
        >
          <Select
            size="small"
            value={current}
            disabled={actionId === row.id}
            className={compact ? "w-full min-w-0 sm:col-span-2" : ""}
            style={compact ? undefined : { width: 132 }}
            popupMatchSelectWidth={false}
            options={CONTACT_STATUS_OPTIONS}
            onChange={(v) => {
              const next = String(v);
              if (next !== current) updateContactStatus(row.id, next);
            }}
            aria-label="Set contact status"
          />
          <Button
            size="small"
            type="primary"
            block={compact}
            icon={<IconBrandWhatsapp className="w-4 h-4" />}
            onClick={() => openWhatsApp(row)}
            disabled={!digitsOnlyPhone(row.phone)}
          >
            WhatsApp
          </Button>
          <Button
            size="small"
            block={compact}
            icon={<IconMail className="w-4 h-4" />}
            onClick={() => openEmail(row)}
          >
            Email
          </Button>
          <Button
            size="small"
            danger
            block={compact}
            loading={actionId === row.id}
            onClick={() => deleteQuery(row)}
          >
            Delete
          </Button>
        </div>
      );
    },
    [actionId, deleteQuery, openEmail, openWhatsApp, updateContactStatus]
  );

  const columns = useMemo(
    () => [
      {
        title: "From",
        key: "from",
        width: 180,
        ellipsis: true,
        render: (_, row) => (
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
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
        width: 160,
        ellipsis: true,
        render: (t) => (
          <div className="min-w-0 max-w-[200px] whitespace-pre-wrap wrap-anywhere text-sm text-gray-800 dark:text-gray-200 leading-snug">
            {t}
          </div>
        ),
      },
      {
        title: "Message",
        dataIndex: "message",
        key: "message",
        width: 280,
        render: (t) => (
          <div
            className="max-h-52 min-h-10 w-full min-w-[200px] max-w-[min(100%,360px)] overflow-y-auto overflow-x-hidden whitespace-pre-wrap wrap-anywhere text-sm leading-relaxed text-gray-700 dark:text-gray-200"
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
        width: 100,
        render: (s) => statusTag(s),
      },
      {
        title: "Received",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 108,
        responsive: ["lg"],
        render: (d) => (
          <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {formatReceived(d)}
          </span>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 340,
        fixed: "right",
        render: (_, row) => renderActionBlock(row, false),
      },
    ],
    [renderActionBlock]
  );

  const emptyState = !loading && tableRows.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex min-w-0">
        <AdminContent className="pt-16 sm:pt-20 lg:pt-16">
          <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 p-3 sm:gap-5 sm:p-4 md:gap-6 md:p-6 pb-8">
            {/* Page header + filters: 12-col grid on large screens */}
            <header className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end lg:gap-x-6 lg:gap-y-3">
              <div className="min-w-0 lg:col-span-7 xl:col-span-8">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl md:text-3xl">
                  Support inbox
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 md:text-base">
                  Contact form submissions. Pending items are highlighted.
                </p>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-3 lg:col-span-5 xl:col-span-4 lg:justify-self-end lg:w-full lg:max-w-md">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:pt-0.5">
                  Filter
                </span>
                <Select
                  value={statusFilter}
                  onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                  className="w-full min-w-0"
                  popupMatchSelectWidth={false}
                  size="middle"
                >
                  <Option value="all">All</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="approved">Approved</Option>
                  <Option value="rejected">Rejected</Option>
                  <Option value="spam">Spam</Option>
                </Select>
              </div>
            </header>

            {/* Main content: card shells full width; inner table scrolls on md+ */}
            <section className="min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <Spin spinning={loading}>
                {/* Desktop / tablet: data table */}
                <div className="hidden min-w-0 md:block">
                  <div className="w-full min-w-0 overflow-x-auto">
                    <Table
                      className="min-w-[900px] [&_.ant-table-cell]:align-top"
                      columns={columns}
                      dataSource={tableRows}
                      pagination={{
                        current: page,
                        pageSize: limit,
                        total: pagination.total,
                        showSizeChanger: false,
                        onChange: (p) => setPage(p),
                        responsive: true,
                        showTotal: (t) => `${t} queries`,
                      }}
                      scroll={{ x: "max-content" }}
                      tableLayout="auto"
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
                  </div>
                </div>

                {/* Mobile: card grid */}
                <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                  {emptyState ? (
                    <Empty description="No contact queries yet" />
                  ) : (
                    tableRows.map((row) => (
                      <Card
                        key={row.id}
                        size="small"
                        className={
                          row.status === "pending"
                            ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
                            : "border-gray-200 dark:border-gray-600"
                        }
                        styles={{ body: { padding: 16 } }}
                      >
                        <div className="grid grid-cols-1 gap-3">
                          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-[1fr_auto] min-[400px]:items-start min-[400px]:gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {row.name}
                              </p>
                              <p className="text-xs wrap-anywhere text-gray-500 dark:text-gray-400">
                                {row.email}
                              </p>
                              {row.phone ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {row.phone}
                                </p>
                              ) : null}
                            </div>
                            <div className="justify-self-start min-[400px]:justify-self-end">
                              {statusTag(row.status)}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Subject
                            </p>
                            <p className="mt-0.5 text-sm wrap-anywhere text-gray-800 dark:text-gray-200">
                              {row.subject}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Message
                            </p>
                            <div className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap wrap-anywhere rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900/50 dark:text-gray-200">
                              {row.message}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-gray-600 dark:text-gray-300">
                              Received
                            </span>
                            <span>{formatReceived(row.createdAt)}</span>
                          </div>
                          {renderActionBlock(row, true)}
                        </div>
                      </Card>
                    ))
                  )}
                  {!emptyState ? (
                    <div className="flex justify-center pt-2">
                      <Pagination
                        current={page}
                        pageSize={limit}
                        total={pagination.total}
                        onChange={(p) => setPage(p)}
                        showSizeChanger={false}
                        showTotal={(t) => `${t} queries`}
                        responsive
                      />
                    </div>
                  ) : null}
                </div>
              </Spin>
            </section>

            <footer className="grid grid-cols-1 gap-2 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              <p>
                Tip: WhatsApp needs a phone number with enough digits; email
                uses the submitter&apos;s address.{" "}
                <Link
                  href="/contact"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View public contact page
                </Link>
              </p>
            </footer>
          </div>
        </AdminContent>
      </div>
    </div>
  );
}
