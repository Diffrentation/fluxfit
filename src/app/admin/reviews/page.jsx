"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button, Input, message, Modal, Select, Space, Spin, Table } from "antd";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminContent from "@/components/Admin/AdminContent";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editStatus, setEditStatus] = useState("pending");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/reviews", {
        params: {
          scope: "admin",
          page,
          limit,
          status,
          search: search || undefined,
        },
        headers: getAuthHeaders(),
      });
      if (data?.success) {
        setReviews(data.reviews || data.data?.reviews || []);
        setPagination(data.data?.pagination || { total: 0, totalPages: 1 });
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Admin reviews fetch error:", error);
      message.error(error?.response?.data?.message || "Failed to fetch reviews");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, status]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenEdit = useCallback(async (reviewId) => {
    try {
      setActionLoadingId(reviewId);
      const { data } = await axios.get(`/api/reviews/${reviewId}`, {
        headers: getAuthHeaders(),
      });
      const review = data?.review || data?.data?.review;
      if (!review) {
        message.error("Review details not found");
        return;
      }
      setSelectedReview(review);
      setEditRating(review.rating || 5);
      setEditComment(review.comment || "");
      setEditStatus(review.status || "pending");
      setEditOpen(true);
    } catch (error) {
      console.error("Fetch review details error:", error);
      message.error(error?.response?.data?.message || "Failed to fetch review details");
    } finally {
      setActionLoadingId(null);
    }
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!selectedReview?.id) return;
    if (!editComment.trim() || editRating < 1 || editRating > 5) {
      message.error("Please provide valid rating and comment");
      return;
    }
    try {
      setActionLoadingId(selectedReview.id);
      await axios.put(
        `/api/reviews/${selectedReview.id}`,
        {
          rating: Number(editRating),
          comment: editComment.trim(),
          status: editStatus,
        },
        { headers: getAuthHeaders() }
      );
      message.success("Review updated");
      setEditOpen(false);
      setSelectedReview(null);
      await fetchReviews();
    } catch (error) {
      console.error("Update review error:", error);
      message.error(error?.response?.data?.message || "Failed to update review");
    } finally {
      setActionLoadingId(null);
    }
  }, [editComment, editRating, editStatus, fetchReviews, selectedReview?.id]);

  const handleDelete = useCallback(
    async (reviewId) => {
      Modal.confirm({
        title: "Delete review?",
        content: "This action cannot be undone.",
        okText: "Delete",
        okButtonProps: { danger: true },
        async onOk() {
          try {
            setActionLoadingId(reviewId);
            await axios.delete(`/api/reviews/${reviewId}`, {
              headers: getAuthHeaders(),
            });
            message.success("Review deleted");
            await fetchReviews();
          } catch (error) {
            console.error("Delete review error:", error);
            message.error(error?.response?.data?.message || "Failed to delete review");
          } finally {
            setActionLoadingId(null);
          }
        },
      });
    },
    [fetchReviews]
  );

  const columns = useMemo(
    () => [
      {
        title: "User",
        dataIndex: ["user", "name"],
        key: "user",
        render: (_, row) => row.user?.name || "-",
      },
      {
        title: "Product",
        dataIndex: ["product", "name"],
        key: "product",
        render: (_, row) => row.product?.name || "-",
      },
      { title: "Rating", dataIndex: "rating", key: "rating", width: 90 },
      { title: "Status", dataIndex: "status", key: "status", width: 110 },
      {
        title: "Comment",
        dataIndex: "comment",
        key: "comment",
        render: (text) => <span className="line-clamp-2">{text}</span>,
      },
      {
        title: "Helpful",
        dataIndex: ["helpful", "count"],
        key: "helpful",
        width: 100,
        render: (value) => value || 0,
      },
      {
        title: "Created",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 160,
        render: (value) => new Date(value).toLocaleDateString(),
      },
      {
        title: "Actions",
        key: "actions",
        width: 320,
        render: (_, row) => (
          <Space>
            <Select
              size="small"
              value={row.status}
              style={{ width: 120 }}
              options={[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "spam", label: "Spam" },
              ]}
              onChange={async (nextStatus) => {
                try {
                  setActionLoadingId(row.id);
                  await axios.put(
                    `/api/reviews/${row.id}`,
                    { status: nextStatus },
                    { headers: getAuthHeaders() }
                  );
                  message.success(`Review marked as ${nextStatus}`);
                  await fetchReviews();
                } catch (error) {
                  message.error(
                    error?.response?.data?.message || "Failed to update review status"
                  );
                } finally {
                  setActionLoadingId(null);
                }
              }}
              disabled={actionLoadingId === row.id}
            />
            <Button
              size="small"
              onClick={() => handleOpenEdit(row.id)}
              loading={actionLoadingId === row.id}
            >
              Edit
            </Button>
            <Button
              size="small"
              danger
              onClick={() => handleDelete(row.id)}
              loading={actionLoadingId === row.id}
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ],
    [actionLoadingId, fetchReviews, handleDelete, handleOpenEdit]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">
        <AdminSidebar activeItem="reviews" />
        <AdminContent>
          <div className="p-2 sm:p-4 md:p-6 pb-4 sm:pb-6 md:pb-8 w-full overflow-x-hidden">
            <div className="p-4 sm:p-6 space-y-4 max-w-[1600px]">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Review Management
              </h1>
              <div className="flex flex-wrap gap-3">
                <Select
                  value={status}
                  onChange={(value) => {
                    setPage(1);
                    setStatus(value);
                  }}
                  style={{ width: 180 }}
                  options={[
                    { value: "all", label: "All statuses" },
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                    { value: "spam", label: "Spam" },
                  ]}
                />
                <Input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Search review text"
                  style={{ width: 260 }}
                />
              </div>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <Spin />
                </div>
              ) : (
                <Table
                  rowKey="id"
                  dataSource={reviews}
                  columns={columns}
                  pagination={{
                    current: page,
                    pageSize: limit,
                    total: pagination.total || 0,
                    onChange: setPage,
                  }}
                />
              )}

              <Modal
                open={editOpen}
                title="Edit review"
                onCancel={() => setEditOpen(false)}
                onOk={handleUpdate}
                confirmLoading={actionLoadingId === selectedReview?.id}
              >
                <div className="space-y-3">
                  <Select
                    value={editRating}
                    onChange={setEditRating}
                    style={{ width: "100%" }}
                    options={[1, 2, 3, 4, 5].map((value) => ({
                      value,
                      label: `${value} star${value > 1 ? "s" : ""}`,
                    }))}
                  />
                  <Input.TextArea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    rows={5}
                    placeholder="Review comment"
                  />
                  <Select
                    value={editStatus}
                    onChange={setEditStatus}
                    style={{ width: "100%" }}
                    options={[
                      { value: "pending", label: "Pending" },
                      { value: "approved", label: "Approved" },
                      { value: "rejected", label: "Rejected" },
                      { value: "spam", label: "Spam" },
                    ]}
                  />
                </div>
              </Modal>
            </div>
          </div>
        </AdminContent>
      </div>
    </div>
  );
}
