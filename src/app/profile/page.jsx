"use client";

import React from "react";
import { Avatar, Card } from "antd";
import { IconUser } from "@tabler/icons-react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function ProfileContent() {
  const { user } = useAuth();
  const name = [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim();

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
        My Profile
      </h1>
      <Card className="dark:bg-neutral-900 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar
            size={96}
            src={user?.profileimage || undefined}
            icon={!user?.profileimage ? <IconUser className="h-12 w-12" /> : undefined}
          />
          <div className="space-y-2 text-neutral-800 dark:text-neutral-200">
            <p className="text-lg font-semibold">{name || user?.username || "—"}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {user?.email}
            </p>
            {user?.phone && (
              <p className="text-sm">Phone: {user.phone}</p>
            )}
            {user?.username && (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                @{user.username}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
