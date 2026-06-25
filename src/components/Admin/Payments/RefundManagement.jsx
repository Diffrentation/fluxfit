"use client";
import React, { useState, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tag, Button, Modal, Form, Input, Select, message, Card, Pagination } from "antd";
import { IconCheck, IconX, IconEye, IconSearch } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const { TextArea } = Input;
const { Option } = Select;

const RefundManagement = ({ refunds = [], onUpdateRefunds }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRefundDetails, setSelectedRefundDetails] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const getStatusColor = (status) => {
    const colors = {
      pending: "orange",
      approved: "green",
      rejected: "red",
      processed: "blue",
    };
    return colors[status] || "default";
  };

  const handleApprove = useCallback((refund) => {
    if (onUpdateRefunds) {
      const updatedRefunds = refunds.map((r) =>
        r.id === refund.id
          ? { ...r, status: "approved", processedDate: new Date().toISOString().split('T')[0] }
          : r
      );
      onUpdateRefunds(updatedRefunds);
      message.success("Refund approved successfully");
    }
  }, [refunds, onUpdateRefunds]);

  const handleReject = useCallback((refund) => {
    setSelectedRefund(refund);
    setIsModalVisible(true);
    form.setFieldsValue({ action: "reject" });
  }, [form]);

  const handleSubmit = useCallback((values) => {
    if (values.action === "reject" && selectedRefund && onUpdateRefunds) {
      const updatedRefunds = refunds.map((r) =>
        r.id === selectedRefund.id
          ? { ...r, status: "rejected", rejectionReason: values.reason }
          : r
      );
      onUpdateRefunds(updatedRefunds);
      message.success("Refund rejected");
    }
    setIsModalVisible(false);
    form.resetFields();
    setSelectedRefund(null);
  }, [selectedRefund, refunds, onUpdateRefunds, form]);

  const handleViewDetails = useCallback((refund) => {
    setSelectedRefundDetails(refund);
    setIsDetailsModalVisible(true);
  }, []);

  // Filter refunds
  const filteredRefunds = useMemo(() => {
    let filtered = [...refunds];

    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (refund) =>
          refund.id?.toString().toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          refund.orderId?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          refund.customer?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((refund) => refund.status === statusFilter);
    }

    return filtered;
  }, [refunds, debouncedSearchQuery, statusFilter]);

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRefunds = filteredRefunds.slice(startIndex, endIndex);

  const renderRefundCard = (refund) => (
    <motion.div
      key={refund.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="h-full border border-zinc-800 hover:shadow-md transition-shadow !bg-zinc-950 w-full min-w-0"
        bodyStyle={{ padding: "12px" }}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Refund #{refund.id}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Order: #{refund.orderId}
              </div>
            </div>
            <Tag color={getStatusColor(refund.status)} className="capitalize text-xs shrink-0">
              {refund.status}
            </Tag>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Customer</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {refund.customer}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Amount</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                ₹{formatPrice(refund.amount)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Reason</span>
              <span className="text-xs text-gray-600 dark:text-gray-300 text-right break-words min-w-0 flex-1">
                {refund.reason}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Requested</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {format(new Date(refund.requestedDate), "MMM dd, yyyy")}
              </span>
            </div>
            {refund.processedDate && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Processed</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {format(new Date(refund.processedDate), "MMM dd, yyyy")}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            {refund.status === "pending" && (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<IconCheck className="w-3 h-3" />}
                  onClick={() => handleApprove(refund)}
                  className="flex-1"
                >
                  Approve
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<IconX className="w-3 h-3" />}
                  onClick={() => handleReject(refund)}
                  className="flex-1"
                >
                  Reject
                </Button>
              </>
            )}
            <Button
              type="text"
              size="small"
              icon={<IconEye className="w-3 h-3" />}
              onClick={() => handleViewDetails(refund)}
              className="flex-1"
            >
              View
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const columns = [
    {
      title: "Refund ID",
      key: "id",
      width: 100,
      render: (_, record) => <span className="font-mono">#{record.id}</span>,
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      width: 120,
      render: (id) => <span className="font-mono">#{id}</span>,
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      width: 150,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount) => (
        <span className="font-semibold">₹{formatPrice(amount)}</span>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      width: 200,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Requested Date",
      dataIndex: "requestedDate",
      key: "requestedDate",
      width: 130,
      render: (date) => format(new Date(date), "MMM dd, yyyy"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <div className="flex gap-2">
          {record.status === "pending" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<IconCheck className="w-3 h-3" />}
                onClick={() => handleApprove(record)}
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                icon={<IconX className="w-3 h-3" />}
                onClick={() => handleReject(record)}
              >
                Reject
              </Button>
            </>
          )}
          <Button
            type="text"
            size="small"
            icon={<IconEye className="w-3 h-3" />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 !bg-zinc-950 p-2 sm:p-3 md:p-4 rounded-lg shadow-sm border border-zinc-800">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Search by refund ID, order ID, or customer"
            allowClear
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            prefix={<IconSearch className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
            size="large"
            className="w-full"
          />
        </div>
        <Select
          placeholder="All Status"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto sm:min-w-[150px]"
          size="large"
        >
          <Option value="all">All Status</Option>
          <Option value="pending">Pending</Option>
          <Option value="approved">Approved</Option>
          <Option value="rejected">Rejected</Option>
          <Option value="processed">Processed</Option>
        </Select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="!bg-zinc-950 rounded-lg shadow-sm border border-zinc-800 overflow-hidden">
          <Table
            dataSource={paginatedRefunds.map((r) => ({ ...r, key: r.id }))}
            columns={columns}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredRefunds.length,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} refund requests`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              onShowSizeChange: (current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              },
            }}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>

      {/* Mobile/Tablet Grid View - xs: 1 col, sm: 2 cols, md: 2 cols */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 w-full">
          <AnimatePresence mode="popLayout">
            {paginatedRefunds.length > 0 ? (
              paginatedRefunds.map((refund) => renderRefundCard(refund))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                No refunds found matching your filters
              </div>
            )}
          </AnimatePresence>
        </div>

        {filteredRefunds.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-zinc-800">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredRefunds.length)} of {filteredRefunds.length} refunds
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredRefunds.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              onShowSizeChange={(current, size) => {
                setCurrentPage(1);
                setPageSize(size);
              }}
              showSizeChanger
              showQuickJumper={false}
              showTotal={(total) => `Total ${total}`}
              size="small"
              className="flex justify-center sm:justify-end"
            />
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        title="Reject Refund Request"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedRefund(null);
        }}
        footer={null}
        width={750}
        className="!bg-zinc-950"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-200 text-sm h-full flex flex-col justify-center">
                <span className="font-bold block mb-1">Warning: Rejecting Request</span>
                Rejecting this refund request will mark it as rejected. The customer will be notified, and this action cannot be undone. Please specify a clear reason for the rejection.
              </div>
            </div>
            <div className="md:col-span-7">
              <Form.Item
                name="reason"
                label="Rejection Reason"
                rules={[{ required: true, message: "Please enter rejection reason" }]}
                className="mb-0"
              >
                <TextArea rows={4} placeholder="e.g., Return window expired, item damaged by customer, etc." />
              </Form.Item>
              <Form.Item name="action" hidden initialValue="reject">
                <Input />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 border-t border-zinc-800 pt-4">
            <Button onClick={() => {
              setIsModalVisible(false);
              form.resetFields();
              setSelectedRefund(null);
            }}>
              Cancel
            </Button>
            <Button type="primary" danger htmlType="submit">
              Reject Refund
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Refund Details Modal */}
      <Modal
        title={`Refund Details - #${selectedRefundDetails?.id}`}
        open={isDetailsModalVisible}
        onCancel={() => {
          setIsDetailsModalVisible(false);
          setSelectedRefundDetails(null);
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: 850 }}
        className="!bg-zinc-950"
        centered
      >
        {selectedRefundDetails && (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-zinc-800 pb-6">
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Refund ID</div>
                <div className="font-mono text-sm font-semibold text-white">
                  #{selectedRefundDetails.id}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Order ID</div>
                <div className="font-mono text-sm font-semibold text-white">
                  #{selectedRefundDetails.orderId}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Customer</div>
                <div className="text-sm font-medium text-white">
                  {selectedRefundDetails.customer}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Amount</div>
                <div className="text-base font-semibold text-emerald-400">
                  ₹{formatPrice(selectedRefundDetails.amount)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Status</div>
                <Tag color={getStatusColor(selectedRefundDetails.status)} className="capitalize m-0 font-medium">
                  {selectedRefundDetails.status}
                </Tag>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Requested Date</div>
                <div className="text-sm text-zinc-200">
                  {format(new Date(selectedRefundDetails.requestedDate), "MMM dd, yyyy")}
                </div>
              </div>
              {selectedRefundDetails.processedDate && (
                <div>
                  <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Processed Date</div>
                  <div className="text-sm text-zinc-200">
                    {format(new Date(selectedRefundDetails.processedDate), "MMM dd, yyyy")}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">Reason for Refund</div>
              <div className="text-sm text-zinc-300 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                {selectedRefundDetails.reason}
              </div>
            </div>

            {selectedRefundDetails.rejectionReason && (
              <div className="border-t border-zinc-800 pt-4">
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">Rejection Reason</div>
                <div className="text-sm text-red-400 p-4 bg-red-950/20 border border-red-900/40 rounded-xl">
                  {selectedRefundDetails.rejectionReason}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="large" onClick={() => setIsDetailsModalVisible(false)}>Close Details</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default RefundManagement;
