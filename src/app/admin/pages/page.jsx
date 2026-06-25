"use client";
import React from "react";
import AdminContent from "@/components/Admin/AdminContent";
import PagesManager from "@/components/Admin/Pages/PagesManager";
import { motion } from "framer-motion";

export default function AdminPagesRoute() {
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Pages & Content
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 mb-6">
                Manage structured content across the website
              </p>
              
              <PagesManager />
            </motion.div>
          </div>
        </AdminContent>
      </div>
    </div>
  );
}
