"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, Button, Table, Tag, Modal, Form, Input, DatePicker, InputNumber, message } from "antd";
import { IconPlus, IconEdit, IconTrash, IconClock } from "@tabler/icons-react";
import { formatPrice } from "@/lib/formatPrice";
import { format } from "date-fns";
import dayjs from "dayjs";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const FlashSaleManager = () => {
  const [flashSales, setFlashSales] = useState([
    {
      id: 1,
      name: "Summer Sale",
      discount: 30,
      startDate: "2024-06-01",
      endDate: "2024-06-30",
      status: "upcoming",
    },
    {
      id: 2,
      name: "Flash Deal",
      discount: 50,
      startDate: "2024-05-01",
      endDate: "2024-05-07",
      status: "active",
    },
  ]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [form] = Form.useForm();

  const getStatusColor = (status) => {
    const colors = {
      active: "green",
      upcoming: "blue",
      ended: "gray",
    };
    return colors[status] || "default";
  };

  const handleAdd = () => {
    setSelectedSale(null);
    form.resetFields();
    setIsFormVisible(true);
  };

  const handleEdit = (sale) => {
    setSelectedSale(sale);
    form.setFieldsValue({
      name: sale.name,
      discount: sale.discount,
      dateRange: [dayjs(sale.startDate), dayjs(sale.endDate)],
      description: sale.description,
    });
    setIsFormVisible(true);
  };

  const handleDelete = (id) => {
    setFlashSales(flashSales.filter((s) => s.id !== id));
    message.success("Flash sale deleted successfully");
  };

  const handleSave = (values) => {
    const saleData = {
      id: selectedSale?.id || Date.now(),
      name: values.name,
      discount: values.discount,
      startDate: values.dateRange[0].format("YYYY-MM-DD"),
      endDate: values.dateRange[1].format("YYYY-MM-DD"),
      description: values.description,
      status: dayjs().isBefore(values.dateRange[0]) ? "upcoming" : "active",
    };
    
    if (selectedSale) {
      setFlashSales(flashSales.map((s) => (s.id === selectedSale.id ? saleData : s)));
      message.success("Flash sale updated successfully");
    } else {
      setFlashSales([...flashSales, saleData]);
      message.success("Flash sale created successfully");
    }
    
    setIsFormVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: "Sale Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span className="font-semibold">{name}</span>,
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      render: (discount) => <Tag color="red">{discount}% OFF</Tag>,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date) => format(new Date(date), "MMM dd, yyyy"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date) => format(new Date(date), "MMM dd, yyyy"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<IconEdit className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<IconTrash className="w-4 h-4" />}
            onClick={() => handleDelete(record.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          icon={<IconPlus className="w-4 h-4" />}
          onClick={handleAdd}
          size="large"
        >
          Schedule Flash Sale
        </Button>
      </div>

      <Card className="shadow-sm">
        <Table
          dataSource={flashSales.map((s) => ({ ...s, key: s.id }))}
          columns={columns}
          pagination={false}
        />
      </Card>

      <Modal
        title={selectedSale ? "Edit Flash Sale" : "Schedule Flash Sale"}
        open={isFormVisible}
        onCancel={() => {
          setIsFormVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item
            name="name"
            label="Sale Name"
            rules={[{ required: true, message: "Please enter sale name" }]}
          >
            <Input placeholder="Enter flash sale name" />
          </Form.Item>

          <Form.Item
            name="discount"
            label="Discount Percentage"
            rules={[{ required: true, message: "Please enter discount" }]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: "100%" }}
              placeholder="0-100"
              formatter={(value) => `${value}%`}
              parser={(value) => value.replace("%", "")}
            />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Sale Period"
            rules={[{ required: true, message: "Please select sale period" }]}
          >
            <RangePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current < dayjs().startOf("day")}
            />
          </Form.Item>

          <Form.Item name="description" label="Description (Optional)">
            <TextArea rows={3} placeholder="Enter sale description" />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsFormVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {selectedSale ? "Update" : "Create"} Sale
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default FlashSaleManager;

