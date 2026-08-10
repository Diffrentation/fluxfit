"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Form, Switch, Input, Button, Alert, message, Divider, Spin } from "antd";
import { IconDeviceFloppy, IconAlertTriangle } from "@tabler/icons-react";
import axios from "axios";

const { TextArea } = Input;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const MaintenanceMode = ({ onSave }) => {
  const [form] = Form.useForm();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/settings");
      const maintenance = data?.data?.maintenance || {};
      setIsMaintenanceMode(!!maintenance.enabled);
      form.setFieldsValue({
        isMaintenanceMode: !!maintenance.enabled,
        maintenanceMessage:
          maintenance.message ||
          "We are currently under maintenance. Please check back later.",
      });
    } catch (e) {
      message.error(e.response?.data?.message || "Failed to load maintenance settings");
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = useCallback(
    async (values) => {
      setSaving(true);
      try {
        await axios.put(
          "/api/settings",
          {
            maintenance: {
              enabled: !!values.isMaintenanceMode,
              message: values.maintenanceMessage,
            },
          },
          { headers: authHeaders() }
        );
        message.success(
          values.isMaintenanceMode
            ? "Maintenance mode is now ON — the storefront is blocked for non-admins."
            : "Maintenance mode settings saved."
        );
        onSave();
      } catch (e) {
        message.error(e.response?.data?.message || "Failed to save settings");
      } finally {
        setSaving(false);
      }
    },
    [onSave]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    );
  }

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
                name="maintenanceMessage"
                label="Maintenance Message"
                rules={[{ required: true, message: "Please enter maintenance message" }]}
                help="Shown to visitors on the maintenance page. Admins (logged in with an admin session) can still browse the site normally."
              >
                <TextArea rows={4} placeholder="Enter maintenance message for users..." />
              </Form.Item>
            </>
          )}
        </Card>

        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            icon={<IconDeviceFloppy className="w-4 h-4" />}
            size="large"
            danger={isMaintenanceMode}
            loading={saving}
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
