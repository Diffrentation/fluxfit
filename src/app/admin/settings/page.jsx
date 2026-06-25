"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import AdminContent from "@/components/Admin/AdminContent";
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

  const handleSave = useCallback((section) => {
    message.success(`${section} settings saved successfully`);
  }, []);

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      <div className="flex">
        <AdminContent>
          <div className="p-2 sm:p-4 md:p-6 pb-4 sm:pb-6 md:pb-8 w-full overflow-x-hidden">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 md:mb-6"
            >
              <div className="mb-3 sm:mb-4 md:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  Settings & Configuration
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
                  Manage website settings, payment, shipping, and integrations
                </p>
              </div>

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                className="settings-tabs"
                items={[
                  {
                    key: "website",
                    label: (
                      <span className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
                        <IconSettings className="w-4 h-4" />
                        <span className="hidden sm:inline">Website Settings</span>
                        <span className="sm:hidden">Website</span>
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <WebsiteSettings onSave={() => handleSave("Website")} />
                      </div>
                    ),
                  },
                  {
                    key: "currency",
                    label: (
                      <span className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
                        <IconCurrencyRupee className="w-4 h-4" />
                        <span className="hidden sm:inline">Currency & Tax</span>
                        <span className="sm:hidden">Tax</span>
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <CurrencyTaxSettings onSave={() => handleSave("Currency & Tax")} />
                      </div>
                    ),
                  },
                  {
                    key: "shipping",
                    label: (
                      <span className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
                        <IconTruck className="w-4 h-4" />
                        <span className="hidden sm:inline">Shipping Rules</span>
                        <span className="sm:hidden">Shipping</span>
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <ShippingRules onSave={() => handleSave("Shipping")} />
                      </div>
                    ),
                  },
                  {
                    key: "templates",
                    label: (
                      <span className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
                        <IconMail className="w-4 h-4" />
                        <span className="hidden sm:inline">Email / SMS</span>
                        <span className="sm:hidden">Templates</span>
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <EmailSMSTemplates onSave={() => handleSave("Templates")} />
                      </div>
                    ),
                  },
                  {
                    key: "api-keys",
                    label: (
                      <span className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
                        <IconKey className="w-4 h-4" />
                        <span className="hidden sm:inline">API Keys</span>
                        <span className="sm:hidden">API</span>
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <APIKeysManagement onSave={() => handleSave("API Keys")} />
                      </div>
                    ),
                  },
                  {
                    key: "maintenance",
                    label: (
                      <span className="flex items-center gap-2 text-xs sm:text-sm md:text-base">
                        <IconTools className="w-4 h-4" />
                        <span className="hidden sm:inline">Maintenance</span>
                        <span className="sm:hidden">Maint.</span>
                      </span>
                    ),
                    children: (
                      <div className="mt-2 sm:mt-3 md:mt-4">
                        <MaintenanceMode onSave={() => handleSave("Maintenance")} />
                      </div>
                    ),
                  },
                ]}
              />
            </motion.div>
          </div>
        </AdminContent>
      </div>
    </div>
  );
};

export default SettingsPage;

