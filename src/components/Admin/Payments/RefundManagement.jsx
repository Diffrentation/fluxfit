"use client";
import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tag, Button, Modal, Form, Input, Select, message, Card, Pagination } from "antd";
import { IconCheck, IconX, IconEye } from "@tabler/icons-react";
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

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRefunds = refunds.slice(startIndex, endIndex);

  const renderRefundCard = (refund) => (
    <motion.div
      key={refund.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="h-full border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
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
            <div className="flex items-start justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Reason</span>
              <span className="text-xs text-gray-600 dark:text-gray-300 text-right max-w-[60%]">
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

          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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
    >
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table
            dataSource={refunds.map((r) => ({ ...r, key: r.id }))}
            columns={columns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} refund requests`,
            }}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>

      {/* Mobile/Tablet Grid View - xs: 1 col, sm: 2 cols */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4">
          <AnimatePresence mode="popLayout">
            {paginatedRefunds.map((refund) => renderRefundCard(refund))}
          </AnimatePresence>
        </div>

        {refunds.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, refunds.length)} of {refunds.length} refunds
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={refunds.length}
              onChange={(page, size) => {
                setCurrentPage(page);
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
        title="Reject Refund"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedRefund(null);
        }}
        footer={null}
        className="dark:bg-gray-800"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="reason"
            label="Rejection Reason"
            rules={[{ required: true, message: "Please enter rejection reason" }]}
          >
            <TextArea rows={4} placeholder="Enter reason for rejection" />
          </Form.Item>
          <Form.Item name="action" hidden initialValue="reject">
            <Input />
          </Form.Item>
          <div className="flex justify-end gap-2">
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
        style={{ maxWidth: 600 }}
        className="dark:bg-gray-800"
        centered
      >
        {selectedRefundDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Refund ID</div>
                <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  #{selectedRefundDetails.id}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Order ID</div>
                <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  #{selectedRefundDetails.orderId}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Customer</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedRefundDetails.customer}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  ₹{formatPrice(selectedRefundDetails.amount)}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedRefundDetails.reason}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                <Tag color={getStatusColor(selectedRefundDetails.status)} className="capitalize">
                  {selectedRefundDetails.status}
                </Tag>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Requested Date</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {format(new Date(selectedRefundDetails.requestedDate), "MMM dd, yyyy")}
                </div>
              </div>
              {selectedRefundDetails.processedDate && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Processed Date</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {format(new Date(selectedRefundDetails.processedDate), "MMM dd, yyyy")}
                  </div>
                </div>
              )}
              {selectedRefundDetails.rejectionReason && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rejection Reason</div>
                  <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    {selectedRefundDetails.rejectionReason}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default RefundManagement;
