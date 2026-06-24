"use client";

import React, { useState, Suspense } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { IconLock, IconEye, IconEyeOff, IconArrowRight, IconShieldLock } from "@tabler/icons-react";
import axios from "axios";
import AuthLayout from "@/components/auth/AuthLayout";

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = searchParams.get("userId");
    if (!userId) {
      return toast.error("User ID not found!");
    }
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match!");
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/auth/reset-password",{
        userId: userId,
        newPassword: newPassword
      })
      if (response?.data?.success) {
        toast.success(response?.data?.message);
        router.push("/auth/login");
      } else {
        toast.error(response?.data?.message);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(error?.response?.data?.message || "Reset password failed. Please try again.");
    } finally {
      setLoading(false);
    }


  };

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#f4fbf7] flex items-center justify-center shrink-0">
            <IconShieldLock className="w-5 h-5 text-[#1e9a58]" />
          </div>
          <h2 className="text-xl font-bold text-[#111827]">Change Password</h2>
          <div className="flex-1 h-px bg-gray-100 ml-4"></div>
        </div>

        <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-300">
          Update your account password for better security.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* NEW PASSWORD */}
          <div className="flex flex-col space-y-1.5 mb-5">
            <Label htmlFor="newPassword" className="text-sm font-bold text-gray-700 mb-1">
              New Password
            </Label>
            <div className="relative">
              <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
              <Input
                id="newPassword"
                name="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="At least 6 characters"
                required
                className="pl-11 pr-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base font-mono tracking-widest"
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <IconEye className="w-5 h-5" /> : <IconEyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="flex flex-col space-y-1.5 mb-8">
            <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 mb-1">
              Confirm New Password
            </Label>
            <div className="relative">
              <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-type new password"
                required
                className="pl-11 pr-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base font-mono tracking-widest"
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <IconEye className="w-5 h-5" /> : <IconEyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-[#1e9a58] hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(30,154,88,0.39)] disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
          >
            {loading ? "Processing..." : "Change Password"} <IconArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}

function ChangePasswordFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center text-gray-600">
        <p className="text-lg font-semibold">Preparing change password form…</p>
      </div>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function ChangePassword() {
  return (
    <Suspense fallback={<ChangePasswordFallback />}>
      <ChangePasswordContent />
    </Suspense>
  );
}


