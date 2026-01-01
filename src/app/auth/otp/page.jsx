"use client";

import React, { Suspense, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function OTPPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Get userId and type directly from URL
  const userId = searchParams?.get("userId");
  const type = searchParams?.get("type"); // "register" | "forgot"

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const handleChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      const lastInput = document.getElementById(`otp-5`);
      if (lastInput) lastInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      return toast.error("User not found. Please signup again.");
    }

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      return toast.error("Please enter a complete 6-digit OTP");
    }

    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      toast.success("OTP verification functionality will be available soon!");
      setLoading(false);
      // Redirect based on flow
      // if (type === "register") {
      //   setTimeout(() => {
      //     router.push("/");
      //   }, 1500);
      // } else {
      //   router.push(`/auth/change-password?type=forgot&userId=${userId}`);
      // }
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Toaster position="top-right" />
      <div className="border p-10 rounded-2xl w-[450px] shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Enter OTP</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-lg">OTP Code</label>
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={cn(
                    "w-12 h-12 text-lg text-center border rounded-md outline-none transition-all",
                    "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300",
                    "dark:bg-zinc-800 dark:text-white dark:border-gray-600"
                  )}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="group/btn mt-6 relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-700 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify OTP"}
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
          </button>
        </form>
      </div>
    </div>
  );
}

function OTPFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg font-semibold text-gray-600">Preparing OTP form…</p>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

export default function OTPPage() {
  return (
    <Suspense fallback={<OTPFallback />}>
      <OTPPageContent />
    </Suspense>
  );
}
