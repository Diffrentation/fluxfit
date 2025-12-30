"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  Form,
  Switch,
  Input,
  Button,
  Alert,
  message,
  Divider,
} from "antd";
import { IconDeviceFloppy, IconAlertTriangle } from "@tabler/icons-react";

const { TextArea } = Input;

const MaintenanceMode = ({ onSave }) => {
  const [form] = Form.useForm();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const handleSubmit = (values) => {
    const settings = {
      ...values,
      isMaintenanceMode,
    };
    console.log("Maintenance Mode Settings:", settings);
    message.success("Maintenance mode settings saved successfully");
    onSave();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {isMaintenanceMode && (
        <Alert
          message="Maintenance Mode Active"
          description="Your website is currently in maintenance mode. Only administrators can access the site."
          type="warning"
          showIcon
          icon={<IconAlertTriangle className="w-5 h-5" />}
          className="mb-4"
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{
        isMaintenanceMode: false,
        maintenanceTitle: "We'll be back soon!",
        maintenanceMessage: "We're currently performing scheduled maintenance. We'll be back online shortly. Thank you for your patience.",
        allowAdminAccess: true,
        estimatedDuration: "2 hours",
      }}>
        <Card title="Maintenance Mode Settings" className="mb-4">
          <Form.Item
            name="isMaintenanceMode"
            label="Enable Maintenance Mode"
            valuePropName="checked"
          >
            <Switch
              checked={isMaintenanceMode}
              onChange={setIsMaintenanceMode}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </Form.Item>

          {isMaintenanceMode && (
            <>
              <Divider />

              <Form.Item
                name="maintenanceTitle"
                label="Maintenance Title"
                rules={[{ required: true, message: "Please enter maintenance title" }]}
              >
                <Input placeholder="We'll be back soon!" />
              </Form.Item>

              <Form.Item
                name="maintenanceMessage"
                label="Maintenance Message"
                rules={[{ required: true, message: "Please enter maintenance message" }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Enter maintenance message for users..."
                />
              </Form.Item>

              <Form.Item
                name="estimatedDuration"
                label="Estimated Duration"
                rules={[{ required: true, message: "Please enter estimated duration" }]}
              >
                <Input placeholder="2 hours" />
              </Form.Item>

              <Form.Item
                name="allowAdminAccess"
                label="Allow Admin Access"
                valuePropName="checked"
                help="Administrators can still access the admin panel during maintenance"
              >
                <Switch />
              </Form.Item>
            </>
          )}
        </Card>

        <Card title="Scheduled Maintenance" className="mb-4">
          <div className="text-gray-600 text-sm mb-4">
            Schedule maintenance windows to minimize disruption to your users.
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Scheduled maintenance feature coming soon. For now, you can manually enable/disable maintenance mode.
            </p>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            icon={<IconDeviceFloppy className="w-4 h-4" />}
            size="large"
            danger={isMaintenanceMode}
          >
            {isMaintenanceMode ? "Save & Activate Maintenance Mode" : "Save Settings"}
          </Button>
        </div>
      </Form>
    </motion.div>
  );
};

export default MaintenanceMode;

