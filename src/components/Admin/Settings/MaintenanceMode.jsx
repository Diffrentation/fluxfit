"use client";
import React, { useState, useEffect, useCallback } from "react";
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

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminMaintenanceSettings");
      if (stored) {
        const settings = JSON.parse(stored);
        setIsMaintenanceMode(settings.isMaintenanceMode || false);
        form.setFieldsValue(settings);
      } else {
        // Set default values
        form.setFieldsValue({
          isMaintenanceMode: false,
          maintenanceTitle: "We'll be back soon!",
          maintenanceMessage: "We're currently performing scheduled maintenance. We'll be back online shortly. Thank you for your patience.",
          allowAdminAccess: true,
          estimatedDuration: "2 hours",
        });
      }
    } catch (error) {
      console.error("Error loading maintenance settings:", error);
    }
  }, [form]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      const formValues = form.getFieldsValue();
      const settings = {
        ...formValues,
        isMaintenanceMode,
      };
      localStorage.setItem("adminMaintenanceSettings", JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving maintenance settings:", error);
    }
  }, [isMaintenanceMode, form]);

  const handleSubmit = useCallback((values) => {
    const settings = {
      ...values,
      isMaintenanceMode,
    };
    try {
      localStorage.setItem("adminMaintenanceSettings", JSON.stringify(settings));
      message.success("Maintenance mode settings saved successfully");
      onSave();
    } catch (error) {
      message.error("Failed to save settings");
      console.error("Error saving maintenance settings:", error);
    }
  }, [isMaintenanceMode, onSave]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      {isMaintenanceMode && (
        <Alert
          message="Maintenance Mode Active"
          description="Your website is currently in maintenance mode. Only administrators can access the site."
          type="warning"
          showIcon
          icon={<IconAlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
          className="mb-3 sm:mb-4"
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card title="Maintenance Mode Settings" className="mb-3 sm:mb-4 w-full min-w-0">
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

        <Card title="Scheduled Maintenance" className="mb-3 sm:mb-4 w-full min-w-0">
          <div className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4">
            Schedule maintenance windows to minimize disruption to your users.
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
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
            className="w-full sm:w-auto"
          >
            {isMaintenanceMode ? "Save & Activate Maintenance Mode" : "Save Settings"}
          </Button>
        </div>
      </Form>
    </motion.div>
  );
};

export default MaintenanceMode;

