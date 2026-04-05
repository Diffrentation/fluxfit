"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Card } from "antd";
import { IconBell } from "@tabler/icons-react";

export default function SupportInboxAlert() {
  const [pending, setPending] = useState(null);

  const load = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) {
      setPending(null);
      return;
    }
    try {
      const { data } = await axios.get("/api/admin/contacts/pending-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data?.success && typeof data.data?.pending === "number") {
        setPending(data.data.pending);
      }
    } catch {
      setPending(null);
    }
  }, []);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("ff-admin-contacts-changed", onChange);
    return () => window.removeEventListener("ff-admin-contacts-changed", onChange);
  }, [load]);

  if (pending === null) return null;

  return (
    <Card
      size="small"
      className="mb-4 sm:mb-6 border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30"
    >
      <div className="flex flex-wrap items-center gap-3">
        <IconBell className="w-6 h-6 text-amber-700 dark:text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
            Support inbox
          </p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            {pending === 0
              ? "No pending contact messages."
              : `${pending} pending contact message${pending === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Link
          href="/admin/contacts"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
        >
          Open inbox →
        </Link>
      </div>
    </Card>
  );
}
