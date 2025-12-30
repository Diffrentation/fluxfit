"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table, Tag, Button, Modal, Form, Input, Select, message } from "antd";
import { IconCheck, IconX, IconEye } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";

const { TextArea } = Input;
const { Option } = Select;

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([
    {
      id: 1,
      orderId: "ORD001",
      amount: 5000,
      reason: "Product damaged",
      status: "pending",
      requestedDate: "2024-05-15",
      customer: "John Doe",
    },
    {
      id: 2,
      orderId: "ORD002",
      amount: 3000,
      reason: "Wrong item received",
      status: "approved",
      requestedDate: "2024-05-14",
      processedDate: "2024-05-16",
      customer: "Jane Smith",
    },
    {
      id: 3,
      orderId: "ORD003",
      amount: 2000,
      reason: "Not satisfied",
      status: "rejected",
      requestedDate: "2024-05-13",
      customer: "Bob Johnson",
    },
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [form] = Form.useForm();

  const getStatusColor = (status) => {
    const colors = {
      pending: "orange",
      approved: "green",
      rejected: "red",
      processed: "blue",
    };
    return colors[status] || "default";
  };

  const handleApprove = (refund) => {
    setRefunds(
      refunds.map((r) =>
        r.id === refund.id
          ? { ...r, status: "approved", processedDate: new Date().toISOString() }
          : r
      )
    );
    message.success("Refund approved successfully");
  };

  const handleReject = (refund) => {
    setSelectedRefund(refund);
    setIsModalVisible(true);
    form.setFieldsValue({ action: "reject" });
  };

  const handleSubmit = (values) => {
    if (values.action === "reject") {
      setRefunds(
        refunds.map((r) =>
          r.id === selectedRefund.id
            ? { ...r, status: "rejected", rejectionReason: values.reason }
            : r
        )
      );
      message.success("Refund rejected");
    }
    setIsModalVisible(false);
    form.resetFields();
  };

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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

      <Modal
        title="Reject Refund"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
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
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button type="primary" danger htmlType="submit">
              Reject Refund
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default RefundManagement;

