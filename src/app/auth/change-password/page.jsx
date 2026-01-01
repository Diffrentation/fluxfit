"use client";

import React, { useState, Suspense } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match!");
    }

    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      toast.success("Password change functionality will be available soon!");
      setLoading(false);
      // setTimeout(() => router.push("/auth/login"), 1500); // Uncomment when API is ready
    }, 1000);
  };

  return (
    <>
      {/* Full Width Header */}
      <header className="w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 py-4 sm:py-6 md:py-8 lg:py-10 xl:py-12 2xl:py-14 3xl:py-16">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 3xl:px-20">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl 3xl:text-9xl font-bold text-neutral-800 dark:text-neutral-200">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                FluxFit
              </span>
            </h1>
          </div>
        </div>
      </header>

      <div
        className="
          shadow-input mx-auto mt-8 sm:mt-10 md:mt-12
          w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[70vw] xl:w-[55vw] 2xl:w-[50vw]
          max-w-5xl rounded-none bg-white p-6 md:rounded-2xl md:p-10 dark:bg-black
        "
      >
        <Toaster position="top-right" />

        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Change Your Password
        </h2>

      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Update your account password for better security.
      </p>

      <form className="mt-8" onSubmit={handleSubmit}>
        {/* NEW PASSWORD */}
        <LabelInputContainer className="mt-4">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              name="newPassword"
              type={showNew ? "text" : "password"}
              placeholder="At least 6 characters"
              required
            />
            <span
              className="absolute right-3 top-3 cursor-pointer text-gray-600 dark:text-gray-300"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>
        </LabelInputContainer>

        {/* CONFIRM PASSWORD */}
        <LabelInputContainer className="mt-4">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-type new password"
              required
            />
            <span
              className="absolute right-3 top-3 cursor-pointer text-gray-600 dark:text-gray-300"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>
        </LabelInputContainer>

        <button
          disabled={loading}
          className="group/btn mt-6 relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-700 font-medium text-white"
          type="submit"
        >
          {loading ? "Processing..." : "Change Password →"}
          <BottomGradient />
        </button>
      </form>
      </div>
    </>
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

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({ children, className }) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>
    {children}
  </div>
);
