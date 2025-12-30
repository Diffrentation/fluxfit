"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import WebsiteSettings from "@/components/Admin/Settings/WebsiteSettings";
import CurrencyTaxSettings from "@/components/Admin/Settings/CurrencyTaxSettings";
import ShippingRules from "@/components/Admin/Settings/ShippingRules";
import EmailSMSTemplates from "@/components/Admin/Settings/EmailSMSTemplates";
import APIKeysManagement from "@/components/Admin/Settings/APIKeysManagement";
import MaintenanceMode from "@/components/Admin/Settings/MaintenanceMode";
import { Tabs, Card, message } from "antd";
import {
  IconSettings,
  IconCurrencyRupee,
  IconTruck,
  IconMail,
  IconKey,
  IconTools,
} from "@tabler/icons-react";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("website");

  const handleSave = (section) => {
    message.success(`${section} settings saved successfully`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar activeItem="settings" />

        <div className="flex-1 ml-0 lg:ml-64 pt-20 lg:pt-16">
          <div className="p-4 md:p-6 pb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Settings & Configuration
                </h1>
                <p className="text-gray-600">
                  Manage website settings, payment, shipping, and integrations
                </p>
              </div>

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: "website",
                    label: (
                      <span className="flex items-center gap-2">
                        <IconSettings className="w-4 h-4" />
                        Website Settings
                      </span>
                    ),
                    children: <WebsiteSettings onSave={() => handleSave("Website")} />,
                  },
                  {
                    key: "currency",
                    label: (
                      <span className="flex items-center gap-2">
                        <IconCurrencyRupee className="w-4 h-4" />
                        Currency & Tax
                      </span>
                    ),
                    children: <CurrencyTaxSettings onSave={() => handleSave("Currency & Tax")} />,
                  },
                  {
                    key: "shipping",
                    label: (
                      <span className="flex items-center gap-2">
                        <IconTruck className="w-4 h-4" />
                        Shipping Rules
                      </span>
                    ),
                    children: <ShippingRules onSave={() => handleSave("Shipping")} />,
                  },
                  {
                    key: "templates",
                    label: (
                      <span className="flex items-center gap-2">
                        <IconMail className="w-4 h-4" />
                        Email / SMS Templates
                      </span>
                    ),
                    children: <EmailSMSTemplates onSave={() => handleSave("Templates")} />,
                  },
                  {
                    key: "api-keys",
                    label: (
                      <span className="flex items-center gap-2">
                        <IconKey className="w-4 h-4" />
                        API Keys
                      </span>
                    ),
                    children: <APIKeysManagement onSave={() => handleSave("API Keys")} />,
                  },
                  {
                    key: "maintenance",
                    label: (
                      <span className="flex items-center gap-2">
                        <IconTools className="w-4 h-4" />
                        Maintenance Mode
                      </span>
                    ),
                    children: <MaintenanceMode onSave={() => handleSave("Maintenance")} />,
                  },
                ]}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

