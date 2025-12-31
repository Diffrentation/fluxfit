"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  Divider,
} from "antd";
import { IconDeviceFloppy, IconMail, IconMessage } from "@tabler/icons-react";

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const EmailSMSTemplates = ({ onSave }) => {
  const [emailForm] = Form.useForm();
  const [smsForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState("email");

  // Load email templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminEmailTemplates");
      if (stored) {
        const templates = JSON.parse(stored);
        emailForm.setFieldsValue(templates);
      } else {
        emailForm.setFieldsValue({
          orderConfirmationSubject: "Order Confirmation - {{order_id}}",
          orderConfirmationBody: "Dear {{customer_name}},\n\nThank you for your order! Your order #{{order_id}} has been confirmed.\n\nOrder Total: ₹{{order_total}}\n\nWe'll send you tracking information once your order ships.\n\nBest regards,\n{{company_name}}",
          orderShippedSubject: "Your Order Has Shipped - {{order_id}}",
          orderShippedBody: "Dear {{customer_name}},\n\nGreat news! Your order #{{order_id}} has been shipped.\n\nTracking Number: {{tracking_number}}\nExpected Delivery: {{delivery_date}}\n\nThank you for shopping with us!\n\n{{company_name}}",
          orderDeliveredSubject: "Order Delivered - {{order_id}}",
          orderDeliveredBody: "Dear {{customer_name}},\n\nYour order #{{order_id}} has been delivered!\n\nWe hope you love your purchase. If you have any questions, please don't hesitate to contact us.\n\nThank you for shopping with {{company_name}}!",
          passwordResetSubject: "Password Reset Request",
          passwordResetBody: "Dear {{customer_name}},\n\nYou requested to reset your password. Click the link below to reset it:\n\n{{reset_link}}\n\nIf you didn't request this, please ignore this email.\n\n{{company_name}}",
          enableEmailNotifications: true,
        });
      }
    } catch (error) {
      console.error("Error loading email templates:", error);
    }
  }, [emailForm]);

  // Load SMS templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminSMSTemplates");
      if (stored) {
        const templates = JSON.parse(stored);
        smsForm.setFieldsValue(templates);
      } else {
        smsForm.setFieldsValue({
          orderConfirmationSMS: "Hi {{customer_name}}, your order #{{order_id}} for ₹{{order_total}} has been confirmed. Thank you! - {{company_name}}",
          orderShippedSMS: "Your order #{{order_id}} has been shipped! Track: {{tracking_number}}. Expected: {{delivery_date}} - {{company_name}}",
          orderDeliveredSMS: "Your order #{{order_id}} has been delivered! We hope you love it. - {{company_name}}",
          otpSMS: "Your OTP is {{otp_code}}. Valid for 5 minutes. Do not share with anyone. - {{company_name}}",
          enableSMSNotifications: true,
        });
      }
    } catch (error) {
      console.error("Error loading SMS templates:", error);
    }
  }, [smsForm]);

  // Save email templates to localStorage whenever form changes
  useEffect(() => {
    try {
      const values = emailForm.getFieldsValue();
      if (Object.keys(values).length > 0) {
        localStorage.setItem("adminEmailTemplates", JSON.stringify(values));
      }
    } catch (error) {
      console.error("Error saving email templates:", error);
    }
  }, [emailForm]);

  // Save SMS templates to localStorage whenever form changes
  useEffect(() => {
    try {
      const values = smsForm.getFieldsValue();
      if (Object.keys(values).length > 0) {
        localStorage.setItem("adminSMSTemplates", JSON.stringify(values));
      }
    } catch (error) {
      console.error("Error saving SMS templates:", error);
    }
  }, [smsForm]);

  const handleEmailSubmit = useCallback((values) => {
    try {
      localStorage.setItem("adminEmailTemplates", JSON.stringify(values));
      message.success("Email templates saved successfully");
      onSave();
    } catch (error) {
      message.error("Failed to save email templates");
      console.error("Error saving email templates:", error);
    }
  }, [onSave]);

  const handleSMSSubmit = useCallback((values) => {
    try {
      localStorage.setItem("adminSMSTemplates", JSON.stringify(values));
      message.success("SMS templates saved successfully");
      onSave();
    } catch (error) {
      message.error("Failed to save SMS templates");
      console.error("Error saving SMS templates:", error);
    }
  }, [onSave]);

  const templateVariables = [
    { label: "Customer Name", value: "{{customer_name}}" },
    { label: "Order ID", value: "{{order_id}}" },
    { label: "Order Total", value: "{{order_total}}" },
    { label: "Tracking Number", value: "{{tracking_number}}" },
    { label: "Delivery Date", value: "{{delivery_date}}" },
    { label: "Company Name", value: "{{company_name}}" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="w-full">
        <TabPane
          tab={
            <span className="flex items-center gap-2 text-xs sm:text-sm">
              <IconMail className="w-4 h-4" />
              <span className="hidden sm:inline">Email Templates</span>
              <span className="sm:hidden">Email</span>
            </span>
          }
          key="email"
        >
          <Form form={emailForm} layout="vertical" onFinish={handleEmailSubmit}>
            <Card title="Order Confirmation Email" className="mb-3 sm:mb-4 w-full min-w-0">
              <Form.Item
                name="orderConfirmationSubject"
                label="Subject"
                rules={[{ required: true, message: "Please enter email subject" }]}
              >
                <Input placeholder="Order Confirmation - {{order_id}}" />
              </Form.Item>
              <Form.Item
                name="orderConfirmationBody"
                label="Email Body"
                rules={[{ required: true, message: "Please enter email body" }]}
              >
                <TextArea rows={8} placeholder="Enter email template..." />
              </Form.Item>
            </Card>

            <Card title="Order Shipped Email" className="mb-3 sm:mb-4 w-full min-w-0">
              <Form.Item
                name="orderShippedSubject"
                label="Subject"
                rules={[{ required: true, message: "Please enter email subject" }]}
              >
                <Input placeholder="Your Order Has Shipped - {{order_id}}" />
              </Form.Item>
              <Form.Item
                name="orderShippedBody"
                label="Email Body"
                rules={[{ required: true, message: "Please enter email body" }]}
              >
                <TextArea rows={6} className="sm:rows-8" placeholder="Enter email template..." />
              </Form.Item>
            </Card>

            <Card title="Order Delivered Email" className="mb-3 sm:mb-4 w-full min-w-0">
              <Form.Item
                name="orderDeliveredSubject"
                label="Subject"
                rules={[{ required: true, message: "Please enter email subject" }]}
              >
                <Input placeholder="Order Delivered - {{order_id}}" />
              </Form.Item>
              <Form.Item
                name="orderDeliveredBody"
                label="Email Body"
                rules={[{ required: true, message: "Please enter email body" }]}
              >
                <TextArea rows={6} className="sm:rows-8" placeholder="Enter email template..." />
              </Form.Item>
            </Card>

            <Card title="Password Reset Email" className="mb-3 sm:mb-4 w-full min-w-0">
              <Form.Item
                name="passwordResetSubject"
                label="Subject"
                rules={[{ required: true, message: "Please enter email subject" }]}
              >
                <Input placeholder="Password Reset Request" />
              </Form.Item>
              <Form.Item
                name="passwordResetBody"
                label="Email Body"
                rules={[{ required: true, message: "Please enter email body" }]}
              >
                <TextArea rows={6} className="sm:rows-8" placeholder="Enter email template..." />
              </Form.Item>
            </Card>

            <Card title="Email Settings" className="mb-3 sm:mb-4 w-full min-w-0">
              <Form.Item
                name="enableEmailNotifications"
                label="Enable Email Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Card>

            <Card title="Available Variables" className="mb-3 sm:mb-4 w-full min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templateVariables.map((variable, index) => (
                  <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs sm:text-sm">
                    <code className="text-blue-600 dark:text-blue-400">{variable.value}</code>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{variable.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                icon={<IconDeviceFloppy className="w-4 h-4" />}
                size="large"
                className="w-full sm:w-auto"
              >
                Save Email Templates
              </Button>
            </div>
          </Form>
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2 text-xs sm:text-sm">
              <IconMessage className="w-4 h-4" />
              <span className="hidden sm:inline">SMS Templates</span>
              <span className="sm:hidden">SMS</span>
            </span>
          }
          key="sms"
        >
          <Form form={smsForm} layout="vertical" onFinish={handleSMSSubmit}>
            <Card title="Order Confirmation SMS" className="mb-3 sm:mb-4 w-full min-w-0">
              <Form.Item
                name="orderConfirmationSMS"
                label="SMS Template"
                rules={[{ required: true, message: "Please enter SMS template" }]}
                help="Maximum 160 characters"
              >
                <TextArea rows={3} maxLength={160} showCount placeholder="Enter SMS template..." />
              </Form.Item>
            </Card>

            <Card title="Order Shipped SMS" className="mb-3 sm:mb-4 w-full min-w-0">
              <Form.Item
                name="orderShippedSMS"
                label="SMS Template"
                rules={[{ required: true, message: "Please enter SMS template" }]}
                help="Maximum 160 characters"
              >
                <TextArea rows={3} maxLength={160} showCount placeholder="Enter SMS template..." />
              </Form.Item>
            </Card>

            <Card title="Order Delivered SMS" className="mb-3 sm:mb-4 w-full min-w-0">
              <Form.Item
                name="orderDeliveredSMS"
                label="SMS Template"
                rules={[{ required: true, message: "Please enter SMS template" }]}
                help="Maximum 160 characters"
              >
                <TextArea rows={3} maxLength={160} showCount placeholder="Enter SMS template..." />
              </Form.Item>
            </Card>

            <Card title="OTP SMS" className="mb-3 sm:mb-4 w-full min-w-0">
              <Form.Item
                name="otpSMS"
                label="SMS Template"
                rules={[{ required: true, message: "Please enter SMS template" }]}
                help="Maximum 160 characters"
              >
                <TextArea rows={3} maxLength={160} showCount placeholder="Enter SMS template..." />
              </Form.Item>
            </Card>

            <Card title="SMS Settings" className="mb-3 sm:mb-4 w-full min-w-0">
              <Form.Item
                name="enableSMSNotifications"
                label="Enable SMS Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Card>

            <Card title="Available Variables" className="mb-3 sm:mb-4 w-full min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templateVariables.map((variable, index) => (
                  <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs sm:text-sm">
                    <code className="text-blue-600 dark:text-blue-400">{variable.value}</code>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{variable.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                icon={<IconDeviceFloppy className="w-4 h-4" />}
                size="large"
                className="w-full sm:w-auto"
              >
                Save SMS Templates
              </Button>
            </div>
          </Form>
        </TabPane>
      </Tabs>
    </motion.div>
  );
};

export default EmailSMSTemplates;

