"use client";

import React, { Suspense, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import axios from "axios";

function OTPPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Get userId and type directly from URL
  const userId = searchParams?.get("userId");
  const type = searchParams?.get("type") || "register"; // "register" | "forgot"

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  // ✅ resend states
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  // ✅ timer countdown
  useEffect(() => {
    // start countdown on page load
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

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
      setOtp(pastedData.split(""));
      const lastInput = document.getElementById(`otp-5`);
      if (lastInput) lastInput.focus();
    }
  };

  // ✅ VERIFY OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) return toast.error("User not found. Please signup again.");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) return toast.error("Please enter complete OTP");

    const apiType =
    type === "email-verification" ? "email-verification" :
    type === "password-reset" ? "password-reset" :
    "email-verification";

    try {
      setLoading(true);

      const response = await axios.post("/api/auth/verify-otp", {
        userId,
        otp: otpValue,
        type:apiType,
      });

      if (response?.data?.success) {
        // ✅ safer: token/user can be in data object
        const token = response?.data?.data?.token || response?.data?.token;
        const user = response?.data?.data?.user || response?.data?.user;

        if (token) localStorage.setItem("token", token);
        if (user) localStorage.setItem("user", JSON.stringify(user));

        toast.success(response?.data?.message || "OTP verified successfully ✅");

        // ✅ redirect
        if(type === "password-reset") {
          router.push("/auth/change-password?userId=" + userId);
        } else {
          router.push("/auth/login");
        }
      } else {
        toast.error(response?.data?.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ RESEND OTP
  const handleResendOtp = async () => {
    if (!userId) return toast.error("User not found. Please signup again.");

    try {
      setResendLoading(true);

      const response = await axios.post("/api/auth/resend-otp", {
        userId,
        type, // ✅ if backend uses
      });

      if (response?.data?.success) {
        toast.success(response?.data?.message || "OTP resent ✅");
        setTimer(60); // ✅ restart timer after resend
      } else {
        toast.error(response?.data?.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Toaster position="top-right" />

      <div className="border p-10 rounded-2xl w-[450px] shadow-md">
        <h2 className="text-2xl font-bold mb-3 text-center">Enter OTP</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          OTP has been sent to your email. Please enter it below.
        </p>

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

          {/* ✅ Verify Button */}
          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-700 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify OTP"}
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
          </button>

          {/* ✅ Resend Section */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading || timer > 0}
              className={cn(
                "w-full h-10 rounded-md border font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
                timer > 0 ? "border-gray-300 text-gray-400" : "border-black text-black"
              )}
            >
              {resendLoading
                ? "Resending..."
                : timer > 0
                ? `Resend OTP in ${timer}s`
                : "Resend OTP"}
            </button>

            <p className="text-xs text-gray-500">
              Didn’t receive OTP? Check spam folder or resend after timer ends.
            </p>
          </div>
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

export const dynamic = "force-dynamic";

export default function OTPPage() {
  return (
    <Suspense fallback={<OTPFallback />}>
      <OTPPageContent />
    </Suspense>
  );
}
